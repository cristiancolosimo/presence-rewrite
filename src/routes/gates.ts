import {Router} from 'express';
import { isAllowedToUnlockExternalDoor, isAllowedToUnlockInternalDoor, isAutenticatedMiddleware } from '../middlewares/auth';

export const routerGates = Router();

routerGates.get('/internal', (req, res) => {

});
routerGates.get("/external", (req, res) => {

});

routerGates.get("/internal/unlock",isAutenticatedMiddleware,isAllowedToUnlockInternalDoor, (req, res) => {
    console.log("Internal door is unlocked")
    res.redirect("/accounts/admin");
});
routerGates.get("/external/unlock",isAutenticatedMiddleware,isAllowedToUnlockExternalDoor, (req, res) => {
    req.session!.externalDoorUnlocked = true;
    console.log("external door is in unlock mode");
    res.redirect("/accounts/admin");
});