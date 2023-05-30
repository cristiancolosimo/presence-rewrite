import { Application, Router, Context } from "https://deno.land/x/oak/mod.ts";
import { prismaConnection } from "../db.ts";
import { PAGE_ADMINISTRATION, PAGE_DASHBOARD } from "../utils/abolute_url_redirect.ts";
import { generate_salt, hash_password, verify_password } from "../utils/password.ts";
import { LogType, LogTypeString } from "../models/Logs.ts";
import { PermissionTypeString } from "../models/Permission.ts";
import { get_logs, save_logs } from "../utils/logs.ts";
import { timeSince } from "../utils/timeago.ts";
import {  LogMapEnter, permissionMapCreate } from "../routes/accounts.ts";

export const get_login_page_controller = async (ctx: Context) => {
  const { username, password } = ctx.request.body as any;
  if (!username || !password) {
    ctx.response.body = "Errore nei dati inseriti";
    return;
  }
  const user = await prismaConnection.user.findUnique({
    where: { username },
    include: { permission: true },
  });
  if (!user) {
    ctx.response.body = "Utente o password errati";
    return;
  }
  const isPasswordCorrect = verify_password(password, user.salt, user.password);
  if (!isPasswordCorrect) {
    ctx.response.body = "Utente o password errati"; // For privacy reasons, we don't want to tell if the username is registered or not
    return;
  }
  if (!user.enabled) {
    ctx.response.body = "Utente non attivo";
    return;
  }
  ctx.session!.user = user;
  ctx.session!.permission = user.permission.map(
    (permission) => permission.permissionId
  );

  ctx.response.redirect(PAGE_DASHBOARD);
};

export const get_administration_page_controller = async (ctx: Context) => {
  const last30LogsPromise = get_logs({
    numbers_elements: 30,
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
  const logsMap = (enter: LogMapEnter) => {
    return {
      event: enter.type,
      username: enter.user?.username || "unknown",
      timeSince: timeSince(enter.createdAt),
    };
  };
  await ctx.render("./admin", {
    logTypeString: LogTypeString,
    permissionTypeString: PermissionTypeString,
    permission: ctx.session!.permission,
    platformUsers: {
      totalUsers: users,
      activeUsers: users.filter((user) => user.enabled),
      inactiveUsers: users.filter((user) => !user.enabled),
    },
    lastLogs: last30Logs.map(logsMap),
  });
};

export interface AdminAccountRegistration extends PermissionForm {
  username: string;
  password: string | undefined;
  email: string;
  enabled: "true" | "false";
}


export interface PermissionForm {
  permission_admin: "on" | undefined;
  permission_internal_door: "on" | undefined;
  permission_external_door: "on" | undefined;
}

export const permission_parsers = (permissionsForm: PermissionForm) => {
  const permissions: string[] = [];
  if (permissionsForm.permission_admin == "on") permissions.push("super-admin");
  if (permissionsForm.permission_external_door == "on")
    permissions.push("unlock-external-door");
  if (permissionsForm.permission_internal_door == "on")
    permissions.push("unlock-internal-door");
  return permissions;
};

export const new_user_post_controller = async (ctx: Context) => {
  
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
    ctx.response.body = "Errore nei dati inseriti";
    return;
  }
  const salt = generate_salt();
  const hashed_password = hash_password(password, salt);
  const permission = permission_parsers({
    permission_admin,
    permission_external_door,
    permission_internal_door,
  });
  try {
    await prismaConnection.user.create({
      data: {
        username,
        password: hashed_password,
        salt: salt,
        email: email,
        enabled: enabled == "true",
        permission: {
          create: permission.map(permissionMapCreate),
        },
      },
    });
  } catch (_) {
    ctx.response.body = "Utente già registrato";
    return;
  }
  await save_logs(LogType.REGISTER, ctx.session!.user!.id);
  ctx.response.redirect(PAGE_ADMINISTRATION);
}