import { Request, Response, NextFunction } from "express";

// bugfix for express-session typescript
declare module "express-session" {
  export interface SessionData {
    user: { [key: string]: any };
    permission: string[];
    externalDoorUnlocked: boolean| undefined;
  }
}


export function isAutenticatedMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.session!.user) {
    res.redirect("/accounts/login");
    return;
  }
  next();
}

export function isAllowedToUnlockExternalDoor(
  req: Request,
  res: Response,
  next: NextFunction
) {

  if(req.session!.permission!.includes("unlock-external-door") == false){
    res.send("Non autorizzato")
    return;
  }
 
  next();

}

export function isSuperAdminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if(req.session!.permission!.includes("super-admin") == false){
    res.send("Non autorizzato")
    return;
  }
  next();
}

export function isAllowedToUnlockInternalDoor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if(req.session!.permission!.includes("unlock-internal-door") == false){
    res.send("Non autorizzato")
    return;
  }
  if(req.socket.remoteAddress && false){

  }
  console.log(req.socket.remoteAddress)
  next();
}
