import { Router } from "express";
import { prismaConnection } from "../db";
import {
  generate_salt,
  hash_password,
  verify_password,
} from "../utils/password";
import express from "express";
import {timeSince} from "../utils/timeago";
import { isAutenticatedMiddleware } from "../middlewares/auth";

export const routerAccounts = Router();
// bugfix for express-session typescript
declare module "express-session" {
  export interface SessionData {
    user: { [key: string]: any };
    permission: string[];
    externalDoorUnlocked: boolean| undefined;
  }
}


routerAccounts.get("/login", (req, res) => {
  res.render("./login");
});

routerAccounts.get("/register", (req, res) => {
  res.render("./register");
});
routerAccounts.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.send("Errore nei dati inseriti");
    return;
  }
  const user = await prismaConnection.user.findUnique({ where: { username } });
  if (!user) {
    res.send("Utente non trovato");
    return;
  }
  const isPasswordCorrect = verify_password(password, user.salt, user.password);
  if (!isPasswordCorrect) {
    res.send("Password errata");
    return;
  }
  if(!user.enabled){
    res.send("Utente non attivo");
    return;
  }
  req.session!.user = user;
  req.session!.permission = ["super-admin","unlock-internal-door","unlock-external-door"];
  res.redirect("/accounts/admin");
});
routerAccounts.post("/register", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.send("Errore nei dati inseriti");
    return;
  }
  const salt = generate_salt();
  const hashed_password = hash_password(password, salt);
  
  try{
    await prismaConnection.user.create({
    data: {
      username,
      password: hashed_password,
      salt: salt,
      email:username,
      enabled: true,
    },
  });}
  catch(e){
    res.send("Utente già registrato");
    return;
  }
  res.redirect("/accounts/login");
});
routerAccounts.get("/logout", (req, res) => {
  req.session!.destroy(() => {
    res.redirect("/accounts/login");
  });
});

routerAccounts.get("/admin", isAutenticatedMiddleware, (req, res) => {
  
  const externalDoorUnlocked = req.session!.externalDoorUnlocked == true;
  req.session!.externalDoorUnlocked= false;
  res.render("./admin", {
    username: req.session!.user!.username,
    permission: req.session!.permission,
    externalDoorUnlocked: externalDoorUnlocked,
    lastestEnters: [
      {
        id: 1,
        username: "test",
        date: new Date(new Date() as any - 60 * 20),
      },
      {
        id: 2,
        username: "ciao",
        date: new Date(new Date() as any- 1000000),
      },
      {
        id: 2,
        username: "ciao",
        date: new Date(new Date()as any - 500000),
      },
      {
        id: 3,
        username: "test",
        date: new Date(new Date() as any - 300000),
      },
    ].map((enter) => {
      return {
        ...enter,
        timeSince: timeSince(enter.date),
      };
    }),
  });
});
