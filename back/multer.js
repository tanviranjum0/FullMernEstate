const multer = require("multer");
const path = require("path");
const des = path.join(__dirname, "public/my-uploads");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, des);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    let id = file.fieldname + "-" + uniqueSuffix + "_" + file.originalname;
    cb(null, id);
  },
});

const upload = multer({ storage });
module.exports = upload;
