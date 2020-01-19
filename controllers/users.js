const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const config = require("../properties");
const userService = require("../services/userService");

// Register
router.post("/register", (req, res, next) => {
  let newUser = {
    role: req.body.role,
    email: req.body.email,
    name: req.body.name,
    password: req.body.password
  };

  userService.addUser(newUser, (err, user) => {
    if (err) {
      res.json({ success: false, msg: err.code });
    } else {
      res.json({ success: true, msg: "User registered" });
    }
  });
});

// Authenticate
router.post("/authenticate", (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  console.log("********** authenticate ***********");

  // Get by username

  userService.getUserByEmail(email, (err, data) => {
    console.log("err: " + err);
    console.log("data: " + data);

    userService.comparePassword(password, data[0].password, (err, isMatch) => {
      if (err) throw err;
      if (isMatch) {
        const token = jwt.sign({ data: data[0] }, config.secret, {
          expiresIn: 604800 // 1 week
        });
        res.json({
          success: true,
          token: "JWT " + token,
          user: {
            id: data[0].id,
            name: data[0].name,
            username: data[0].username,
            email: data[0].email
          }
        });
      } else {
        return res.json({ success: false, msg: "Wrong password" });
      }
    });
  });
});

// Profile : Protected Route
router.get(
  "/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    res.json({ user: req.user });
  }
);

// Protected
router.post("/change-password", (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }

    if (err) {
      return next(err);
    } else {
      userService.changePassword(
        user[0].email,
        req.body.newPassword,
        (err, result) => {
          if (err) {
            res.json({ err: err });
          } else if (result) {
            res.json({ result: result });
          }
        }
      );
    }
  })(req, res, next);
});

// Public
router.post("/forgot-password", (req, res) => {
  const email = req.body.email;
  userService.getUserByEmail(email, (err, data) => {
    if (err) {
      res.json({ msg: err });
    } else {
      if (data.length === 0) {
        // console.log(data);
        // console.log(data.length);
        res.json({ msg: "No user found" });
      } else {
        // console.log(data);
        // console.log(data.length);
        userService.generatePasswordResetLink(email, (err, link) => {
          if (err) {
            res.json({ msg: err });
          } else {
            userService.sendResetEmail(email, link, (err, data) => {
              if (err) {
                console.log(err);
                res.json({ msg: err });
              } else {
                res.json({ msg: "sent an email" });
              }
            });
          }
        });
      }
    }
  });
});

// Public
router.post("/token-signin/:token", (req, res) => {
  console.log(req.params.token);
  userService.checkPasswordResetToken(req.params.token, (err, message) => {
    if (err) {
      console.log(err);
      res.json({ msg: err });
    } else if (message) {
      if (!message.ok) {
        res.json({ msg: message.msg });
      } else {
        console.log(message.msg);
        // Generate a JWT Token here
        userService.getUserByEmail(message.email, (err, data) => {
          console.log("err: " + err);
          console.log("data: " + data);

          const token = jwt.sign({ data: data[0] }, config.secret, {
            expiresIn: 604800 // 1 week
          });

          // Change Password here
          userService.changePassword(
            message.email,
            req.body.password,
            (err, data) => {
              if (err) {
                res.json({
                  msg: err
                });
              } else {
                res.json({
                  msg: "success"
                });
              }
            }
          );
        });
      }
    }
  });
  // res.json({ msg: req.params.token });
});

module.exports = router;
