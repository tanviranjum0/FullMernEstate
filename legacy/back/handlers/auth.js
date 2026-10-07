const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const checkIfAlreadyLoggedin = (req, res) => {
  if (!req.signedCookies.access_token)
    return res.status(204).json("Couldn't verify User");
  jwt.verify(
    req.signedCookies.access_token,
    process.env.JWT_SECRET,
    (err, user) => {
      if (err) {
        res.status(204).json("Couldn't verify User");
      } else {
        res.status(200).json({
          data: "Successful",
          user,
        });
      }
    }
  );
};

const signup = async (req, res) => {
  const { username, password, email, avatar } = await req.body;
  const existUser = await User.findOne({ email });

  if (existUser) {
    res.status(200).json("This email is already exist...");
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await User.create({
      username,
      password: hashedPassword,
      email,
      avatar,
    });

    res.status(200).json(user);
  } catch {
    res.status(400).json("User Creating Problem");
  }
};
const login = async (req, res) => {
  const { password, email } = await req.body;
  const validUser = await User.findOne({ email });

  if (!validUser) return res.json("No user found ..");
  const validPassword = await bcrypt.compare(password, validUser.password);

  if (!validPassword) return res.json("Wrong Credentials");
  try {
    userObject = {
      name: validUser.username,
      email,
      id: validUser._id,
    };

    const token = jwt.sign(userObject, process.env.JWT_SECRET);
    res
      .cookie("access_token", token, {
        httpOnly: true,
        signed: true,
        secure: true,
        sameSite: "none",
      })
      .status(201)
      .json({
        token,
        userObject,
        avatar: validUser.avatar,
        status: "Login successfully!",
      });
  } catch {
    res.status(400).json("Login Problem");
  }
};

const signOut = (req, res) => {
  res.clearCookie("access_token").status(200).json("User has been logged out!");
};

module.exports = { signup, checkIfAlreadyLoggedin, login, signOut };
