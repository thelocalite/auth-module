const bcrypt = require("bcryptjs");
// const nodemailer = require("nodemailer");
const executiveHost = require("../properties").executiveHost;
const crypto = require("crypto");
// var transporter = nodemailer.createTransport(mailer);
const mailer = require("./mailer");

// TODO: MySQL Connection
const database = require("../MySQL");

module.exports.getUserById = function(id, callback) {
  sql = `select * from auth where id = "${id}";`;
  console.log(sql);
  database.query(sql, (err, result) => {
    console.log(result);
    callback(err, result);
  });
};

module.exports.getUserByEmail = function(email, callback) {
  sql = `select * from auth where email = "${email}";`;
  // console.log(sql);
  database.query(sql, (err, result) => {
    // console.log(result);
    callback(err, result);
  });
};

// Change password
module.exports.changePassword = function(email, newPassword, callback) {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newPassword, salt, (err, hash) => {
      if (err) throw err;
      sql = `update auth set password = "${hash}" where email = "${email}";`;
      // console.log(sql);
      database.query(sql, (err, result) => {
        // console.log(result);
        callback(err, result);
      });
    });
  });
};

module.exports.addUser = function(newUser, callback) {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if (err) throw err;
      newUser.password = hash;
      // Save User
      sql = `insert into auth (role, name, email, password) values("${newUser.role}", "${newUser.name}", "${newUser.email}", "${newUser.password}");`;
      console.log(sql);
      database.query(sql, (err, result) => {
        if (err) {
          // console.log("Error at Insert" + err);
          callback(err, null);
        } else {
          // console.log("Successfully Inserted: " + result);
          callback(null, result);
        }
      });
    });
  });
};

module.exports.comparePassword = function(candidatePassword, hash, callback) {
  bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
    if (err) throw err;
    callback(null, isMatch);
  });
};

module.exports.generatePasswordResetLink = function(email, callback) {
  let resetPasswordToken = crypto.randomBytes(20).toString("hex");
  let resetPasswordExpires = Date.now() + 3600000;
  // console.log(typeof resetPasswordToken);
  let link = executiveHost + "/" + "forgot-password" + "/" + resetPasswordToken;

  sql = `update auth set reset_password_token = "${resetPasswordToken}",  reset_password_token_expiry = ${resetPasswordExpires} where email = "${email}";`;
  // console.log(sql);

  // console.log(sql);
  database.query(sql, (err, result) => {
    // console.log(result);
    callback(err, link);
  });
  console.log(resetPasswordToken);
  console.log(typeof resetPasswordExpires);
  console.log(resetPasswordExpires);
};

module.exports.sendResetEmail = function(email, link, callback) {
  // send mail with defined transport object
  mailer.sendEmail(email, link, (err, data) => {
    callback(err, data);
  });
};

module.exports.checkPasswordResetToken = function(token, callback) {
  sql = `select * from auth where reset_password_token = "${token}";`;
  // console.log(sql);
  database.query(sql, (err, result) => {
    // console.log(result);
    console.log(result);
    if (result.length == 0) {
      callback(null, { ok: false, msg: "Bad Token" });
    }

    if (result.length != 0) {
      console.log("Expiry: " + result[0].reset_password_token_expiry);

      console.log("Now: " + Date.now());
      if (parseInt(result[0].reset_password_token_expiry) < Date.now()) {
        callback(null, { ok: false, msg: "Expired Token" });
      } else {
        callback(null, { ok: true, msg: "Good Token", email: result[0].email });
      }
    }
  });
};
