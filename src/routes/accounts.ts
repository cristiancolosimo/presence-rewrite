import { prismaConnection } from "../db";
import { hash_password } from "../utils/password";
import { timeSince } from "../utils/timeago";
import {
  isAutenticatedMiddleware,
  isSuperAdminMiddleware,
  userLangMiddleware,
} from "../middlewares/auth";
import { LogType, LogTypeString } from "../models/Logs";
import Router from "@koa/router";
import { hpccInternal } from "../services/hpccInternal";
import { get_logs, save_logs } from "../utils/logs";
import { Logs, User } from "@prisma/client";
import { PAGE_LOGIN, PAGE_ADMINISTRATION } from "../utils/abolute_url_redirect";
import {
  get_administration_page_controller,
  get_login_page_controller,
  new_user_post_controller,
  permission_parsers,
} from "../controllers/accounts";
import { isIpAllowed } from "../utils/isIpAllowed";
export const TIMEOUT_EXTERNAL_DOOR_SECONDS =
  +process.env.EXTERNAL_DOOR_TIMEOUT!;
export const TIMEOUT_EXTERNAL_DOOR_MILLISECONDS =
  TIMEOUT_EXTERNAL_DOOR_SECONDS * 1000;

export const permissionMapCreate = (permission: string) => {
  return {
    permissionId: permission,
  };
};
export type LogMapEnter = Logs & {
  user: User | null;
};

export const routerAccounts = new Router({
  prefix: "/accounts",
});
routerAccounts.use(userLangMiddleware);
routerAccounts.get("/login", async (ctx) => {
  await ctx.render("./login");
});

routerAccounts.post("/login", get_login_page_controller);
routerAccounts.get("/logout", (ctx) => {
  ctx!.session = null;
  ctx.redirect(PAGE_LOGIN);
});

routerAccounts.get(
  "/administration",
  isAutenticatedMiddleware,
  isSuperAdminMiddleware,
  get_administration_page_controller
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

routerAccounts.post(
  "/administration/user/new",
  isAutenticatedMiddleware,
  isSuperAdminMiddleware,
  new_user_post_controller
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
    const permission = permission_parsers({
      permission_admin,
      permission_external_door,
      permission_internal_door,
    });

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
          create: permission.map(permissionMapCreate),
        },
      },
    });
    await save_logs(LogType.EDIT_USER, ctx.session!.user!.id);
    ctx.redirect(PAGE_ADMINISTRATION);
  }
);

routerAccounts.get("/admin", isAutenticatedMiddleware, async (ctx) => {
  const externalDoorUnlocked = ctx.session!.externalDoorUnlocked == true;
  if (
    externalDoorUnlocked &&
    Date.now() - ctx.session!.externalDoorUnlockedSince! >
      TIMEOUT_EXTERNAL_DOOR_MILLISECONDS
  ) {
    ctx.session!.externalDoorUnlocked = false;
    ctx.session!.externalDoorUnlockedSince = undefined;
  }
  const logs = await get_logs({
    numbers_elements: 10,
    type: [LogType.UNLOCK_EXTERNAL_DOOR, LogType.UNLOCK_INTERNAL_DOOR],
  });

  await ctx.render("./dashboard", {
    logTypeString: LogTypeString,
    username: ctx.session!.user!.username,
    permission: ctx.session!.permission,
    internalDoorUnLocked: await hpccInternal.is_magnet_on(),
    externalDoorUnlocked: externalDoorUnlocked,
    isSafeNetwork: isIpAllowed(ctx.socket.remoteAddress!),
    externalDoorUnlockedSince:
      Date.now() - (ctx.session!.externalDoorUnlockedSince || Date.now()),
    externalDoorTimeout: process.env.EXTERNAL_DOOR_TIMEOUT!,
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
    await save_logs(LogType.DELETE_USER, ctx.session!.user!.id);
    ctx.redirect(PAGE_ADMINISTRATION);
  }
);
