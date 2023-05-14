import { Router } from "express";
import { prismaConnection } from "../db";
import {
  generate_salt,
  hash_password,
  verify_password,
} from "../utils/password";
import { timeSince } from "../utils/timeago";
import { isAutenticatedMiddleware, isSuperAdminMiddleware } from "../middlewares/auth";
import { LogType, LogTypeString } from "../models/Logs";
import { PermissionTypeString } from "../models/Permission";

const TIMEOUT_EXTERNAL_DOOR_SECONDS = 60;
const TIMEOUT_EXTERNAL_DOOR_MILLISECONDS = TIMEOUT_EXTERNAL_DOOR_SECONDS * 1000;
export const routerAccounts = Router();
// bugfix for express-session typescript
declare module "express-session" {
  export interface SessionData {
    user: { [key: string]: any };
    permission: string[];
    externalDoorUnlocked: boolean | undefined;
    externalDoorUnlockedSince: number | undefined;
  }
}

routerAccounts.get("/login", (req, res) => {
  res.render("./login");
});

routerAccounts.get("/register", (req, res) => {
  res.render("./register");
});
routerAccounts.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.send("Errore nei dati inseriti");
    return;
  }
  const user = await prismaConnection.user.findUnique({ where: { username } });
  if (!user) {
    res.send("Utente non trovato");
    return;
  }
  const isPasswordCorrect = verify_password(password, user.salt, user.password);
  if (!isPasswordCorrect) {
    res.send("Password errata");
    return;
  }
  if (!user.enabled) {
    res.send("Utente non attivo");
    return;
  }
  req.session!.user = user;
  req.session!.permission = [
    "super-admin",
    "unlock-internal-door",
    "unlock-external-door",
  ];
  res.redirect("/accounts/admin");
});
routerAccounts.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.send("Errore nei dati inseriti");
    return;
  }
  const salt = generate_salt();
  const hashed_password = hash_password(password, salt);

  try {
    await prismaConnection.user.create({
      data: {
        username,
        password: hashed_password,
        salt: salt,
        email: username,
        enabled: true,
      },
    });
  } catch (e) {
    res.send("Utente già registrato");
    return;
  }
  await prismaConnection.logs.create({
    data: {
      type: LogType.REGISTER,
      userId: username,
    },
  });
  res.redirect("/accounts/login");
});
routerAccounts.get("/logout", (req, res) => {
  req.session!.destroy(() => {
    res.redirect("/accounts/login");
  });
});

routerAccounts.get(
  "/administration",
  isAutenticatedMiddleware,
  isSuperAdminMiddleware,
  async (req, res) => {
    const last30Logs = await prismaConnection.logs.findMany({
      take: 30,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
      },
    });
    const users = await prismaConnection.user.findMany({
      orderBy: {
        enabled: "desc",
      },
      include:{
        permission: true
      }
    });
    console.log(users.map((user) => user.permission));
    res.render("./admin", {
      logTypeString: LogTypeString,
      permissionTypeString: PermissionTypeString,
      platformUsers: {
        totalUsers:users,
        activeUsers: users.filter((user) => user.enabled),
        inactiveUsers: users.filter((user) => !user.enabled),
      },
      lastLogs: last30Logs.map((enter) => {
        return {
          event: enter.type,
          username: enter.user?.username || "unknown",
          timeSince: timeSince(enter.createdAt),
        }})
    });
  }
);

routerAccounts.get("/administration/user/new", isAutenticatedMiddleware, isSuperAdminMiddleware, async (req, res) => {
  res.render("./add_edit_account", {
    user: undefined,
    permission: undefined,
  });
});

routerAccounts.post("/administration/user/new", isAutenticatedMiddleware, isSuperAdminMiddleware, async (req, res) => {
  const { username, password, email, enabled } = req.body;
  if (!username || !password || !email  || !enabled) {
    res.send("Errore nei dati inseriti");
    return;
  }
  const salt = generate_salt();
  const hashed_password = hash_password(password, salt);
  try {
    await prismaConnection.user.create({
      data: {
        username,
        password: hashed_password,
        salt: salt,
        email: email,
        enabled: enabled == "true",
        permission: {
          create: [
            {
              permissionId: "unlock-internal-door",
            }
          ]}
      },
    });
  } catch (e) {
    res.send("Utente già registrato");
    return;
  }
  await prismaConnection.logs.create({
    data: {
      type: LogType.REGISTER,
      userId: username,
    },
  });
  res.redirect("/accounts/administration");
});


routerAccounts.get("/administration/user/edit/:id", isAutenticatedMiddleware, isSuperAdminMiddleware, async (req, res) => {
  const user = await prismaConnection.user.findUnique({
    where: {
      id: parseInt(req.params.id),
    },
    include: {
      permission: true,
    },
  });
  if (!user) {
    res.send("Utente non trovato");
    return;
  }
  res.render("./add_edit_account", {
    user: user,
    permission: req.session!.permission,
    currentUser: req.session!.user!.id == user.id,
  });
});

routerAccounts.get("/admin", isAutenticatedMiddleware, async (req, res) => {
  const externalDoorUnlocked = req.session!.externalDoorUnlocked == true;
  if (
    externalDoorUnlocked &&
    Date.now() - req.session!.externalDoorUnlockedSince! >
      TIMEOUT_EXTERNAL_DOOR_MILLISECONDS
  )
    req.session!.externalDoorUnlocked = false;
  const logs = await prismaConnection.logs.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
    },
  });
  res.render("./dashboard", {
    logTypeString: LogTypeString,
    username: req.session!.user!.username,
    permission: req.session!.permission,
    externalDoorUnlocked: externalDoorUnlocked,
    externalDoorUnlockedSince:
      Date.now() - (req.session!.externalDoorUnlockedSince || Date.now()),
    lastestEnters: logs.map((enter) => {
      return {
        event: enter.type,
        username: enter.user?.username || "unknown",
        timeSince: timeSince(enter.createdAt),
      };
    }),
  });
});
