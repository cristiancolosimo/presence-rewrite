import {
  isAllowedToUnlockExternalDoor,
  isAllowedToUnlockInternalDoor,
  isAutenticatedMiddleware,
} from "../middlewares/auth";
import { LogType } from "../models/Logs";
import Router from "@koa/router";
import { hpccInternal } from "../services/hpccInternal";
import { save_logs } from "../utils/logs";

export const routerGates = new Router({
  prefix: "/gates",
});

routerGates.get("/internal", async (ctx) => {});
routerGates.get("/external", async (ctx) => {});

routerGates.get(
  "/internal/unlock",
  isAutenticatedMiddleware,
  isAllowedToUnlockInternalDoor,
  async (ctx) => {
    try{
    await hpccInternal.send_unlock_pulse();
    }catch(e){
      console.log("Send unlock pulse",e);
    }
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
