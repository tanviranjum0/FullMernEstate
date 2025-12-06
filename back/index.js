const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const authRouter = require("./routes/auth");
const userRouter = require("./routes/user");
const listingRouter = require("./routes/listing");
const path = require("path");

const app = express();

dotenv.config();
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
  cors({
    credentials: true,
    origin: [
      "http://localhost:5173",
      "https://rt-estate.vercel.app",
      "http://localhost:3010",
    ],
  })
);

mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log("Connected to MongoDB!");
  })
  .catch((err) => {
    console.log(err);
  });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.get("/favicon.ico", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "favicon.ico"));
});

app.all("/favicon.ico", (req, res) => res.status(204));
app.use("/api/user", userRouter);
app.use("/api/auth", authRouter);
app.use("/api/listing", listingRouter);

app.use(express.static(path.join(__dirname, "../front/dist")));

app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "../front", "dist", "index.html"));
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Credentials", true);
  next();
});

app.listen(
  process.env.PORT || 4000,
  "0.0.0.0",
  console.log(`Server started at port ${process.env.PORT}`)
);
