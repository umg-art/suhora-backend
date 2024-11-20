const express = require("express")
const path = require("path");
const router = require("./routes/routes");
const MySqlPool = require("./connection");
const app = express();
const getEndpoints = require('express-list-endpoints');
const methodOverride = require("method-override");
const session = require('express-session');
const flash = require('connect-flash');
require('dotenv').config();


// set the ejs view engine
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.set("views", path.join(__dirname, "views"))

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended : false}))
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  }));
  app.use(flash());


// app.get("/",(req,res)=>{
//     res.end("hello from nodejs")
// })
app.use("/", router)


// DB connection and server connection
MySqlPool.query('SELECT 1').then(()=>{
    console.log("MySql Connected");
    // If sql connect then this line execute
    app.listen(process.env.PORT,  ()=> {
        console.table(getEndpoints(app));
        console.log(`server started at http://localhost:${process.env.PORT}`)
    })
})
.catch((err)=> console.log("error on start", err))
