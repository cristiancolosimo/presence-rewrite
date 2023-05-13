import { Request, Response, NextFunction } from "express";
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
