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
  userLangMiddleware,
} from "../middlewares/auth";
import { LogType, LogTypeString } from "../models/Logs";
import { PermissionTypeString } from "../models/Permission";
import Router from "@koa/router";
import { hpccInternal } from "../services/hpccInternal";
const TIMEOUT_EXTERNAL_DOOR_SECONDS = 60;
const TIMEOUT_EXTERNAL_DOOR_MILLISECONDS = TIMEOUT_EXTERNAL_DOOR_SECONDS * 1000;

export const routerAccounts = new Router({
  prefix: "/accounts",
});
routerAccounts.use(userLangMiddleware);
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
  const user = await prismaConnection.user.findUnique({
    where: { username },
    include: { permission: true },
  });
  if (!user) {
    ctx.body = "Utente o password errati";
    return;
  }
  const isPasswordCorrect = verify_password(password, user.salt, user.password);
  if (!isPasswordCorrect) {
    ctx.body = "Utente o password errati"; // For privacy reasons, we don't want to tell if the username is registered or not
    return;
  }
  if (!user.enabled) {
    ctx.body = "Utente non attivo";
    return;
  }
  ctx.session!.user = user;
  ctx.session!.permission = user.permission.map(
    (permission) => permission.permissionId
  );
  /*ctx.session!.permission = [
    "super-admin",
    "unlock-internal-door",
    "unlock-external-door",
  ];*/
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
  ctx!.session = null;
  ctx.redirect("/accounts/login");
});

routerAccounts.get(
  "/administration",
  isAutenticatedMiddleware,
  isSuperAdminMiddleware,
  async (ctx) => {
    const last30LogsPromise = prismaConnection.logs.findMany({
      take: 30,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
      },
    });
    const usersPromise = prismaConnection.user.findMany({
      orderBy: {
        enabled: "desc",
      },
      include: {
        permission: true,
      },
    });
    const [last30Logs, users] = await Promise.all([
      last30LogsPromise,
      usersPromise,
    ]);
    await ctx.render("./admin", {
      logTypeString: LogTypeString,
      permissionTypeString: PermissionTypeString,
      permission: ctx.session!.permission,
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
      userForm: undefined,
      permissionForm: undefined,
      permissionSession: ctx.session!.permission,
    });
  }
);

interface PermissionForm {
  permission_admin: "on" | undefined;
  permission_internal_door: "on" | undefined;
  permission_external_door: "on" | undefined;
}

interface AdminAccountRegistration extends PermissionForm {
  username: string;
  password: string | undefined;
  email: string;
  enabled: "true" | "false";
}

routerAccounts.post(
  "/administration/user/new",
  isAutenticatedMiddleware,
  isSuperAdminMiddleware,
  async (ctx) => {
    const {
      username,
      password,
      email,
      enabled,
      permission_admin,
      permission_external_door,
      permission_internal_door,
    } = ctx.request.body as AdminAccountRegistration;
    if (!username || !password || !email || !enabled) {
      ctx.body = "Errore nei dati inseriti";
      return;
    }
    const salt = generate_salt();
    const hashed_password = hash_password(password, salt);
    const permission: string[] = [];
    if (permission_admin == "on") permission.push("super-admin");
    if (permission_external_door == "on")
      permission.push("unlock-external-door");
    if (permission_internal_door == "on")
      permission.push("unlock-internal-door");

    try {
      await prismaConnection.user.create({
        data: {
          username,
          password: hashed_password,
          salt: salt,
          email: email,
          enabled: enabled == "true",
          permission: {
            create: permission.map((el) => {
              return {
                permissionId: el,
              };
            }),
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
      userForm: user,
      permissionForm: user.permission.map(
        (permission) => permission.permissionId
      ),
      permissionSession: ctx.session!.permission,
      currentUser: ctx.session!.user!.id == user.id,
    });
  }
);

routerAccounts.post(
  "/administration/user/edit/:id",
  isAutenticatedMiddleware,
  isSuperAdminMiddleware,
  async (ctx) => {
    const {
      username,
      password,
      email,
      enabled,
      permission_admin,
      permission_external_door,
      permission_internal_door,
    } = ctx.request.body as any;
    if (!email) {
      ctx.body = "Errore nei dati inseriti";
      return;
    }
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
    const permission: string[] = [];
    if (permission_admin == "on") permission.push("super-admin");
    if (permission_external_door == "on")
      permission.push("unlock-external-door");
    if (permission_internal_door == "on")
      permission.push("unlock-internal-door");

    let temp_password = user.password;
    if (password && password.length > 5) {
      const salt = user.salt;
      temp_password = hash_password(password, salt);
    }
    await prismaConnection.user.update({
      where: {
        id: parseInt(ctx.params.id),
      },
      data: {
        username,
        password: temp_password,
        email,
        enabled: enabled == "true",
        permission: {
          deleteMany: {},
          create: permission.map((el) => {
            return {
              permissionId: el,
            };
          }),
        },
      },
    });
    await prismaConnection.logs.create({
      data: {
        type: LogType.EDIT_USER,
        userId: ctx.session!.user!.id,
      },
    });
    ctx.redirect("/accounts/administration");
  }
);

routerAccounts.get("/admin", isAutenticatedMiddleware, async (ctx) => {
  const externalDoorUnlocked = ctx.session!.externalDoorUnlocked == true;
  if (
    externalDoorUnlocked &&
    Date.now() - ctx.session!.externalDoorUnlockedSince! >
      TIMEOUT_EXTERNAL_DOOR_MILLISECONDS
  ){
    ctx.session!.externalDoorUnlocked = false;
    ctx.session!.externalDoorUnlockedSince = undefined;
  }
  const logs = await prismaConnection.logs.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    where:{
      type: {
        in: [LogType.UNLOCK_EXTERNAL_DOOR, LogType.UNLOCK_INTERNAL_DOOR],
      },
    },
    include: {
      user: true,
    },
  });
  await ctx.render("./dashboard", {
    logTypeString: LogTypeString,
    username: ctx.session!.user!.username,
    permission: ctx.session!.permission,
    internalDoorUnLocked: await hpccInternal.is_magnet_on(),
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

routerAccounts.post(
  "/administration/user/delete/:id",
  isAutenticatedMiddleware,
  isSuperAdminMiddleware,
  async (ctx) => {
    await prismaConnection.user.delete({
      where: {
        id: parseInt(ctx.params.id),
      },
    });
    await prismaConnection.logs.create({
      data: {
        type: LogType.DELETE_USER,
        userId: ctx.session!.user!.id,
      },
    });
    ctx.redirect("/accounts/administration");
  }
);
