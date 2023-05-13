import {Router} from 'express';
import { isAllowedToUnlockExternalDoor, isAllowedToUnlockInternalDoor, isAutenticatedMiddleware } from '../middlewares/auth';
import { prismaConnection } from '../db';
import { LogType} from '../models/Logs';
export const routerGates = Router();

export const routerAccounts = Router();
// bugfix for express-session typescript
declare module "express-session" {
  export interface SessionData {
    user: { [key: string]: any };
    permission: string[];
    externalDoorUnlocked: boolean| undefined;
  }
}

routerGates.get('/internal', (req, res) => {

});
routerGates.get("/external", (req, res) => {

});

routerGates.get("/internal/unlock",isAutenticatedMiddleware,isAllowedToUnlockInternalDoor, async (req, res) => {
    console.log("Internal door is unlocked")
    await prismaConnection.logs.create({
        data:{
            type:LogType.UNLOCK_INTERNAL_DOOR,
            userId:req.session!.user!.id,
        }
    });
    res.redirect("/accounts/admin");
});
routerGates.get("/external/unlock",isAutenticatedMiddleware,isAllowedToUnlockExternalDoor, async (req, res) => {
    req.session!.externalDoorUnlocked = true;
    await prismaConnection.logs.create({
        data:{
            type:LogType.UNLOCK_EXTERNAL_DOOR,
            userId:req.session!.user!.id,
        }
    });
    
    console.log("external door is in unlock mode");
    res.redirect("/accounts/admin");
});