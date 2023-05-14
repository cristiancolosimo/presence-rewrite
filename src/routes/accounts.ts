import { Router } from "express";
import { prismaConnection } from "../db";
import {
  generate_salt,
  hash_password,
  verify_password,
} from "../utils/password";
import express from "express";
import { timeSince } from "../utils/timeago";
import { isAutenticatedMiddleware } from "../middlewares/auth";
import { LogTypeString } from "../models/Logs";

const TIMEOUT_EXTERNAL_DOOR_SECONDS = 60;
const TIMEOUT_EXTERNAL_DOOR_MILLISECONDS = TIMEOUT_EXTERNAL_DOOR_SECONDS * 1000;
export const routerAccounts = Router();
// bugfix for express-session typescript
declare module "express-session" {
  export interface SessionData {
    user: { [key: string]: any };
    permission: string[];
    externalDoorUnlocked: boolean | undefined;
    externalDoorUnlockedSince: number | undefined;
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
  if (!user.enabled) {
    res.send("Utente non attivo");
    return;
  }
  req.session!.user = user;
  req.session!.permission = [
    "super-admin",
    "unlock-internal-door",
    "unlock-external-door",
  ];
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

  try {
    await prismaConnection.user.create({
      data: {
        username,
        password: hashed_password,
        salt: salt,
        email: username,
        enabled: true,
      },
    });
  } catch (e) {
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

routerAccounts.get("/admin", isAutenticatedMiddleware, async (req, res) => {
  const externalDoorUnlocked = req.session!.externalDoorUnlocked == true;
  if (
    externalDoorUnlocked &&
    Date.now() - req.session!.externalDoorUnlockedSince! >
      TIMEOUT_EXTERNAL_DOOR_MILLISECONDS
  )
    req.session!.externalDoorUnlocked = false;
  const logs = await prismaConnection.logs.findMany({
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
    },
  });
  res.render("./dashboard", {
    logTypeString: LogTypeString,
    username: req.session!.user!.username,
    permission: req.session!.permission,
    externalDoorUnlocked: externalDoorUnlocked,
    externalDoorUnlockedSince:
      Date.now() - (req.session!.externalDoorUnlockedSince || Date.now()),
    lastestEnters: logs.map((enter) => {
      return {
        event: enter.type,
        username: enter.user?.username || "unknown",
        timeSince: timeSince(enter.createdAt),
      };
    }),
  });
});
