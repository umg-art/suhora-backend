const express = require("express")
const path = require("path");
const router = require("./routes/routes");
const MySqlPool = require("./connection");
const PORT = 8001
const app = express();
const getEndpoints = require('express-list-endpoints');
const methodOverride = require("method-override");



// set the ejs view engine
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({extended : true}))
app.use(express.json());
app.use(methodOverride('_method')); // method override for form


// app.get("/",(req,res)=>{
//     res.end("hello from nodejs")
// })
app.use("/", router)


// DB connection and server connection
MySqlPool.query('SELECT 1').then(()=>{
    console.log("MySql Connected");
    // If sql connect then this line execute
    app.listen(PORT,  ()=> {
        console.table(getEndpoints(app));
        console.log(`server started at http://localhost:${PORT}`)
    })
})
.catch((err)=> console.log("error on start", err))
