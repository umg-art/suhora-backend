const mysql = require("mysql2/promise");

const MySqlPool = mysql.createPool({
    host:"localhost",
    user: "root",
    password: "",
    database:"suhora"
})

module.exports = MySqlPool;