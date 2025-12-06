const {
  signup,
  login,
  signOut,
  checkIfAlreadyLoggedin,
} = require("../handlers/auth");

const express = require("express");
const router = express.Router();
router.get("/check-login", checkIfAlreadyLoggedin);
router.post("/signup", signup);
router.post("/login", login);
router.get("/signout", signOut);
module.exports = router;
