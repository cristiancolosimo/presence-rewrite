import { Context, Next } from 'koa';
import { PAGE_LOGIN } from '../utils/abolute_url_redirect';

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
  if (ctx.socket.remoteAddress && false) {
    // Add your logic here
  }
  console.log(ctx.socket.remoteAddress);
  await next();
}
