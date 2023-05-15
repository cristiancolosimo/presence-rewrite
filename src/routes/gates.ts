import {
  isAllowedToUnlockExternalDoor,
  isAllowedToUnlockInternalDoor,
  isAutenticatedMiddleware,
} from "../middlewares/auth";
import { prismaConnection } from "../db";
import { LogType } from "../models/Logs";
import Router from "@koa/router";
import { hpccInternal } from "../services/hpccInternal";

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
    await hpccInternal.send_unlock_pulse();
    await prismaConnection.logs.create({
      data: {
        type: LogType.UNLOCK_INTERNAL_DOOR,
        userId: ctx.session!.user!.id,
      },
    });
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
    await prismaConnection.logs.create({
      data: {
        type: LogType.UNLOCK_EXTERNAL_DOOR,
        userId: ctx.session!.user!.id,
      },
    });
    ctx.redirect("/accounts/admin");
  }
);
