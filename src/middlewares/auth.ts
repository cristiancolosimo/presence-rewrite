import { Context, Next } from 'koa';

export async function isAutenticatedMiddleware(ctx: Context, next: Next) {
  if (!ctx.session?.user) {
    ctx.redirect("/accounts/login");
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
