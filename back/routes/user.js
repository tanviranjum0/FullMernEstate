const express = require("express");
const checkLogin = require("../middlewares/checkLogin");
const {
  deleteUser,
  getUser,
  getUserListings,
  updateUser,
} = require("../handlers/user");
const router = express.Router();

router.post("/update/:id", checkLogin, updateUser);
router.delete("/delete/:id", checkLogin, deleteUser);
router.get("/listings", checkLogin, getUserListings);
router.get("/:email", getUser);
module.exports = router;
