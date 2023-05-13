import express from 'express';
import {routerGates} from './src/routes/gates';
import session from 'express-session';
import bodyParser from 'body-parser';
import multer from 'multer';
import { routerAccounts } from './src/routes/accounts';
import compression from 'compression';
const app = express()

const port = process.env.PORT;
if(!port){
    console.error("Port not defined");
    process.exit(1);
}
if(!process.env.PEPPER){
    console.error("Pepper not defined");
    process.exit(1);
}
if(!process.env.ROUNDS){
    console.error("Rounds not defined");
    process.exit(1);
}


const sessionConfig = {
    secret: (Math.random()*10000000).toString(),
    resave: false,
    saveUninitialized: false,
    cookie: {
        sameSite: true,
    }
}
app.use(compression())
app.set('view engine', 'ejs');
app.disable('x-powered-by');
app.use(session(sessionConfig));

app.use(bodyParser.json());  //enable json body parser
app.use(bodyParser.urlencoded({ extended: true })); //enable urlencoded body parser
app.use(multer().any()); // enable multipart/form-data parser

app.get('/', (req, res) => {
    res.render('./home');
});
app.get("/admin",(req,res)=>{
    res.redirect("/accounts/admin");
})
app.use('/accounts', routerAccounts);
app.use('/gates', routerGates);
app.listen(port, () => {
    console.log(`The server is listening on port: ${port}`)
});