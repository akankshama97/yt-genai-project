const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist.js");

const JWT_SECRET = process.env.JWT_SECRET || "ZJ7NJFYn7HAevMsjCqjdFxgP_interviewprep_2026";

async function authUser(req, res, next) {
  try {
    const token =
      req.cookies?.token || req.headers?.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        message: "Token not provided.",
      });
    }
    const isTokenBlacklisted = await tokenBlacklistModel
      .findOne({ token })
      .catch(() => null);
    if (isTokenBlacklisted) {
      return res.status(401).json({
        message: "Token is invalid.",
      });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      message: "Invalid token.",
      error: err.message,
    });
  }
}

module.exports = { authUser };
