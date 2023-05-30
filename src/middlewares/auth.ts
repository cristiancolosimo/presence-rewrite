import { Application, Router, Context,Next } from "https://deno.land/x/oak/mod.ts";
import { PAGE_LOGIN } from '../utils/abolute_url_redirect.ts';
import { isIpAllowed } from '../utils/isIpAllowed.ts';

export async function userLangMiddleware(ctx: Context, next: Next) {
  // get lang from accept-language header
  ctx.state.lang = ctx.session?.lang || ctx.request.acceptsLanguages("it", "en") || "en";
  await next();
}

export async function isAutenticatedMiddleware(ctx: Context, next: Next) {
  if (!ctx.session?.user) {
    ctx.response.redirect(PAGE_LOGIN);
    return;
  }
  await next();
}

export async function isAllowedToUnlockExternalDoor(ctx: Context, next: Next) {
  if (!ctx.session?.permission?.includes("unlock-external-door")) {
    ctx.response.body = "Non autorizzato";
    return;
  }
  await next();
}

export async function isSuperAdminMiddleware(ctx: Context, next: Next) {
  if (!ctx.session?.permission?.includes("super-admin")) {
    ctx.response.body = "Non autorizzato";
    return;
  }
  await next();
}

export async function isAllowedToUnlockInternalDoor(ctx: Context, next: Next) {
  if (!ctx.session?.permission?.includes("unlock-internal-door")) {
    ctx.response.body = "Non autorizzato";
    return;
  }
  console.log("log ip",ctx.socket.remoteAddress);
  
  if (ctx.socket.remoteAddress === undefined || !isIpAllowed(ctx.socket.remoteAddress)) {
    ctx.response.body = "Non autorizzato";
    return;
    // Add your logic here
  }
  await next();
}
