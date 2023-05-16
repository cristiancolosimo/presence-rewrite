import { Context, Next } from 'koa';
import { PAGE_LOGIN } from '../utils/abolute_url_redirect';
import { isIpAllowed } from '../utils/isIpAllowed';

export async function userLangMiddleware(ctx: Context, next: Next) {
  // get lang from accept-language header
  ctx.state.lang = ctx.session?.lang || ctx.acceptsLanguages("it", "en") || "en";
  await next();
}

export async function isAutenticatedMiddleware(ctx: Context, next: Next) {
  if (!ctx.session?.user) {
    ctx.redirect(PAGE_LOGIN);
    return;
  }
  await next();
}

export async function isAllowedToUnlockExternalDoor(ctx: Context, next: Next) {
  if (!ctx.session?.permission?.includes("unlock-external-door")) {
    ctx.body = "Non autorizzato";
    return;
  }
  await next();
}

export async function isSuperAdminMiddleware(ctx: Context, next: Next) {
  if (!ctx.session?.permission?.includes("super-admin")) {
    ctx.body = "Non autorizzato";
    return;
  }
  await next();
}

export async function isAllowedToUnlockInternalDoor(ctx: Context, next: Next) {
  if (!ctx.session?.permission?.includes("unlock-internal-door")) {
    ctx.body = "Non autorizzato";
    return;
  }
  console.log("log ip",ctx.socket.remoteAddress);
  
  if (ctx.socket.remoteAddress === undefined || !isIpAllowed(ctx.socket.remoteAddress)) {
    ctx.body = "Non autorizzato";
    return;
    // Add your logic here
  }
  await next();
}
