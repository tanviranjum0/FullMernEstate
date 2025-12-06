const {
  getListing,
  deleteListing,
  updateListing,
  deleteListingImages,
  createListing,
  handleUpload,
  getuserListings,
  getListings,
} = require("../handlers/listing");
const upload = require("../multer");
const express = require("express");
const checkLogin = require("../middlewares/checkLogin");

const router = express.Router();

router.post("/create", checkLogin, createListing);
router.delete("/delete/:id", checkLogin, deleteListing);
router.delete("/delete-image/:id", checkLogin, deleteListingImages);
router.post("/update/:id", checkLogin, updateListing);
router.get("/get/:id", getListing);
router.get("/get", getListings);
router.get("/user-listings/:id", checkLogin, getuserListings);
router.post("/create-upload", checkLogin, upload.any("photos"), handleUpload);

module.exports = router;
