// Require MySQL module
var mysql = require("mysql");

// require database URL from properties file
var dbURL = require("./properties").database;
var dbUser = require("./properties").dbUser;
var dbPassword = require("./properties").dbPassword;
var dbPort = require("./properties").dbPort;
var dbDatabase = require("./properties").dbDatabase;

// Connection
module.exports = mysql.createConnection({
  host: dbURL,
  user: dbUser,
  password: dbPassword,
  port: dbPort,
  database: dbDatabase
});
