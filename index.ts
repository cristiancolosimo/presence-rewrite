import { Application, Router  ,Context } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { routerGates } from "./src/routes/gates.ts";
import { routerAccounts } from "./src/routes/accounts.ts";
import { hpccInternal } from "./src/services/hpccInternal.ts";
import { Session } from "https://deno.land/x/oak_sessions@v4.1.4/mod.ts";
import { viewEngine, etaEngine, oakAdapter } from "https://deno.land/x/view_engine@v10.5.1c/mod.ts"
type AppState = {
  session: Session
}

const app = new Application<AppState>()

const secret = (Math.random() * 10000000).toString(); //TODO, if you want to scale orizzontaly the server, you need to use a shared secret and migrate the database from sqlite to shared istance as mysql or postgresql
app.keys = [secret];
const baseRouter = new Router<AppState>();


const port = Deno.env.get("PORT");
if (!port) {
  console.error("Port not defined");
  Deno.exit(1);
}
if (!Deno.env.get("PEPPER")) {
  console.error("Pepper not defined");
  Deno.exit(1);
}
if (!Deno.env.get("ROUNDS")) {
  console.error("Rounds not defined");
  Deno.exit(1);
}
if (!Deno.env.get("EXTERNAL_DOOR_TIMEOUT")) {
  console.error("External Door timeout defined");
  Deno.exit(1);
}

if (!Deno.env.get("HOMEPAGE_RELOAD_TIME")) {
  console.error("Homepage reload time not defined");
  Deno.exit(1);
}
if(!Deno.env.get("ALLOWED_NETWORK_FOR_INTERNAL_DOOR")){
  console.error("Allowed network for internal door not defined");
  Deno.exit(1);
}

app.use(viewEngine(oakAdapter, etaEngine, {
  viewRoot: "./views",
}));

app.use(Session.initMiddleware());

baseRouter.get("/", async (ctx:Context) => {
  ctx.response.render("./home.ejs", {
    internalDoorUnLocked: await hpccInternal.is_magnet_on(),
    homepage_reload_time: Deno.env.get("HOMEPAGE_RELOAD_TIME")!,
  });
});
baseRouter.get("/admin", (ctx) => {
  ctx.response.redirect("/accounts/admin");
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
  await app.listen(port);
  console.log(`The server is listening on port: ${port}`);
};
start();
