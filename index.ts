import { routerGates } from "./src/routes/gates";
import { routerAccounts } from "./src/routes/accounts";
import Koa from "koa";
import Router from "@koa/router";
import session from "koa-session";
import bodyParser from "koa-bodyparser";
import render from "koa-ejs";
import path from "path";
import { hpccInternal } from "./src/services/hpccInternal";
const app = new Koa();

const secret = (Math.random() * 10000000).toString(); //TODO, if you want to scale orizzontaly the server, you need to use a shared secret and migrate the database from sqlite to shared istance as mysql or postgresql
app.keys = [secret];
const baseRouter = new Router();
const port = process.env.PORT;
if (!port) {
  console.error("Port not defined");
  process.exit(1);
}
if (!process.env.PEPPER) {
  console.error("Pepper not defined");
  process.exit(1);
}
if (!process.env.ROUNDS) {
  console.error("Rounds not defined");
  process.exit(1);
}
render(app, {
  root: path.join(__dirname, "views"),
  layout: false,
  viewExt: "ejs",
  cache: false,
  debug: false,
});

app.use(session(app));
app.use(bodyParser());

baseRouter.get("/", async (ctx) => {
  await ctx.render("./home", {internalDoorUnLocked: await hpccInternal.is_magnet_on()});
});
baseRouter.get("/admin", (ctx) => {
  ctx.redirect("/accounts/admin");
});

app
  .use(baseRouter.routes())
  .use(baseRouter.allowedMethods())
  .use(routerAccounts.routes())
  .use(routerAccounts.allowedMethods())
  .use(routerGates.routes())
  .use(routerGates.allowedMethods());

const start = async () => {
  await hpccInternal.setup();
  app.listen(port);
  console.log(`The server is listening on port: ${port}`);
};
start();
