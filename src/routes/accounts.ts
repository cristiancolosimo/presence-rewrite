import { prismaConnection } from "../db";
import {
  generate_salt,
  hash_password,
  verify_password,
} from "../utils/password";
import { timeSince } from "../utils/timeago";
import {
  isAutenticatedMiddleware,
  isSuperAdminMiddleware,
} from "../middlewares/auth";
import { LogType, LogTypeString } from "../models/Logs";
import { PermissionTypeString } from "../models/Permission";
import Router from "@koa/router";

const TIMEOUT_EXTERNAL_DOOR_SECONDS = 60;
const TIMEOUT_EXTERNAL_DOOR_MILLISECONDS = TIMEOUT_EXTERNAL_DOOR_SECONDS * 1000;

export const routerAccounts = new Router({
  prefix: "/accounts",
});

routerAccounts.get("/login", async (ctx) => {
  await ctx.render("./login");
});

routerAccounts.get("/register", async (ctx) => {
  await ctx.render("./register");
});
routerAccounts.post("/login", async (ctx) => {
  const { username, password } = ctx.request.body as any;
  if (!username || !password) {
    ctx.body = "Errore nei dati inseriti";
    return;
  }
  const user = await prismaConnection.user.findUnique({ where: { username } });
  if (!user) {
    ctx.body = "Utente non trovato";
    return;
  }
  const isPasswordCorrect = verify_password(password, user.salt, user.password);
  if (!isPasswordCorrect) {
    ctx.body = "Password errata";
    return;
  }
  if (!user.enabled) {
    ctx.body = "Utente non attivo";
    return;
  }
  ctx.session!.user = user;
  ctx.session!.permission = [
    "super-admin",
    "unlock-internal-door",
    "unlock-external-door",
  ];
  ctx.redirect("/accounts/admin");
});
routerAccounts.post("/register", async (ctx) => {
  const { username, password } = ctx.request.body as any;
  if (!username || !password) {
    ctx.body = "Errore nei dati inseriti";
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
    ctx.body = "Utente già registrato";
    return;
  }
  await prismaConnection.logs.create({
    data: {
      type: LogType.REGISTER,
      userId: ctx.session!.user!.id,
    },
  });
  ctx.redirect("/accounts/login");
});
routerAccounts.get("/logout", (ctx) => {
  ctx.session!.destroy(() => {
    ctx.redirect("/accounts/login");
  });
});

routerAccounts.get(
  "/administration",
  isAutenticatedMiddleware,
  isSuperAdminMiddleware,
  async (ctx) => {
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
      include: {
        permission: true,
      },
    });
    console.log(users.map((user) => user.permission));
    await ctx.render("./admin", {
      logTypeString: LogTypeString,
      permissionTypeString: PermissionTypeString,
      platformUsers: {
        totalUsers: users,
        activeUsers: users.filter((user) => user.enabled),
        inactiveUsers: users.filter((user) => !user.enabled),
      },
      lastLogs: last30Logs.map((enter) => {
        return {
          event: enter.type,
          username: enter.user?.username || "unknown",
          timeSince: timeSince(enter.createdAt),
        };
      }),
    });
  }
);

routerAccounts.get(
  "/administration/user/new",
  isAutenticatedMiddleware,
  isSuperAdminMiddleware,
  async (ctx) => {
    await ctx.render("./add_edit_account", {
      user: undefined,
      permission: undefined,
    });
  }
);

routerAccounts.post(
  "/administration/user/new",
  isAutenticatedMiddleware,
  isSuperAdminMiddleware,
  async (ctx) => {
    const { username, password, email, enabled } = ctx.request.body as any;
    if (!username || !password || !email || !enabled) {
      ctx.body = "Errore nei dati inseriti";
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
              },
            ],
          },
        },
      });
    } catch (e) {
      ctx.body = "Utente già registrato";
      return;
    }
    await prismaConnection.logs.create({
      data: {
        type: LogType.REGISTER,
        userId: ctx.session!.user!.id,
      },
    });
    ctx.redirect("/accounts/administration");
  }
);

routerAccounts.get(
  "/administration/user/edit/:id",
  isAutenticatedMiddleware,
  isSuperAdminMiddleware,
  async (ctx) => {
    const user = await prismaConnection.user.findUnique({
      where: {
        id: parseInt(ctx.params.id),
      },
      include: {
        permission: true,
      },
    });
    if (!user) {
      ctx.body = "Utente non trovato";
      return;
    }
    await ctx.render("./add_edit_account", {
      user: user,
      permission: ctx.session!.permission,
      currentUser: ctx.session!.user!.id == user.id,
    });
  }
);

routerAccounts.get("/admin", isAutenticatedMiddleware, async (ctx) => {
  const externalDoorUnlocked = ctx.session!.externalDoorUnlocked == true;
  if (
    externalDoorUnlocked &&
    Date.now() - ctx.session!.externalDoorUnlockedSince! >
      TIMEOUT_EXTERNAL_DOOR_MILLISECONDS
  )
    ctx.session!.externalDoorUnlocked = false;
  const logs = await prismaConnection.logs.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
    },
  });
  await ctx.render("./dashboard", {
    logTypeString: LogTypeString,
    username: ctx.session!.user!.username,
    permission: ctx.session!.permission,
    externalDoorUnlocked: externalDoorUnlocked,
    externalDoorUnlockedSince:
      Date.now() - (ctx.session!.externalDoorUnlockedSince || Date.now()),
    lastestEnters: logs.map((enter) => {
      return {
        event: enter.type,
        username: enter.user?.username || "unknown",
        timeSince: timeSince(enter.createdAt),
      };
    }),
  });
});
