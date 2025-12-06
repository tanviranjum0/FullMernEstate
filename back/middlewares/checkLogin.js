const jwt = require("jsonwebtoken");
const checkLogin = async (req, res, next) => {
  let token;
  if (req.signedCookies.access_token) {
    token = req.signedCookies.access_token;
  } else if (req.headers.authorization) {
    token = req.headers.authorization;
  }

  if (!token) return res.json("error logging in");

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.json("Couldn't verify User");

    req.user = user;
  });
  next();
};
module.exports = checkLogin;
