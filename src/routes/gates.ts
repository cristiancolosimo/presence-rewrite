import {
  isAllowedToUnlockExternalDoor,
  isAllowedToUnlockInternalDoor,
  isAutenticatedMiddleware,
} from "../middlewares/auth.ts";
import { LogType } from "../models/Logs.ts";

import { Application, Router, Context,Next } from "https://deno.land/x/oak/mod.ts";

import { hpccInternal } from "../services/hpccInternal.ts";
import { save_logs } from "../utils/logs.ts";

export const routerGates = new Router({
  prefix: "/gates",
});

routerGates.get("/internal", async (_) => {});
routerGates.get("/external", async (_) => {});

routerGates.get(
  "/internal/unlock",
  isAutenticatedMiddleware,
  isAllowedToUnlockInternalDoor,
  async (ctx) => {
    await hpccInternal.send_unlock_pulse();
    await save_logs(LogType.UNLOCK_INTERNAL_DOOR, ctx.session!.user!.id);
    ctx.redirect("/accounts/admin");
  }
);
routerGates.get(
  "/external/unlock",
  isAutenticatedMiddleware,
  isAllowedToUnlockExternalDoor,
  async (ctx) => {
    ctx.session!.externalDoorUnlocked = true;
    ctx.session!.externalDoorUnlockedSince = Date.now();
    await save_logs(LogType.UNLOCK_EXTERNAL_DOOR, ctx.session!.user!.id);
    ctx.redirect("/accounts/admin");
  }
);
