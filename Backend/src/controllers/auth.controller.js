const userModel = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const tokenBlacklistModel = require("../models/blacklist");
const connectToDB = require("../config/database");

const JWT_SECRET = process.env.JWT_SECRET || "ZJ7NJFYn7HAevMsjCqjdFxgP_interviewprep_2026";

/**
 * @name registerUserController
 * @description Register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Please provide username, email and password",
      });
    }

    const trimmedUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Ensure database is connected
    await connectToDB().catch((e) => {
      console.warn("DB reconnection notice in register:", e.message);
    });

    const isUserAlreadyExists = await userModel.findOne({
      $or: [{ username: trimmedUsername }, { email: cleanEmail }],
    });

    if (isUserAlreadyExists) {
      return res.status(400).json({
        message: "Account already exists with this email address or username",
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await userModel.create({
      username: trimmedUsername,
      email: cleanEmail,
      password: hash,
    });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const isProduction =
      process.env.NODE_ENV === "production" ||
      req.secure ||
      req.headers["x-forwarded-proto"] === "https";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    };
    res.cookie("token", token, cookieOptions);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username || user.email.split("@")[0],
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Register controller error:", err);

    // Handle MongoDB duplicate key error (code 11000)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "email or username";
      return res.status(400).json({
        message: `An account already exists with this ${field}. Please sign in instead.`,
      });
    }

    // Handle validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({
        message: messages || "Validation error",
      });
    }

    return res.status(500).json({
      message: "Registration failed. Please try again.",
      error: err.message,
    });
  }
}

/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Ensure database is connected
    await connectToDB().catch((e) => {
      console.warn("DB reconnection notice in login:", e.message);
    });

    const user =
      (await userModel.findOne({ email: cleanEmail })) ||
      (await userModel.findOne({ email: email.trim() }));

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { id: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    const isProduction =
      process.env.NODE_ENV === "production" ||
      req.secure ||
      req.headers["x-forwarded-proto"] === "https";

    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000,
    };
    res.cookie("token", token, cookieOptions);

    return res.status(200).json({
      message: "User loggedIn successfully.",
      token,
      user: {
        id: user._id,
        username: user.username || user.email.split("@")[0],
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Login controller error:", err);
    return res.status(500).json({
      message: "Login failed. Please try again.",
      error: err.message,
    });
  }
}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access Public
 */
async function logoutUserController(req, res) {
  try {
    const token =
      req.cookies?.token ||
      req.headers?.authorization?.split(" ")[1] ||
      req.body?.token;
    if (token) {
      await tokenBlacklistModel.create({ token }).catch(() => {});
    }
    const isProduction =
      process.env.NODE_ENV === "production" ||
      req.secure ||
      req.headers["x-forwarded-proto"] === "https";
    res.clearCookie("token", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
    });
    return res.status(200).json({
      message: "User logged out successfully",
    });
  } catch (err) {
    return res.status(200).json({
      message: "User logged out successfully",
    });
  }
}

/**
 * @name getMeController
 * @description get the current logged in user details
 * @access Private
 */
async function getMeController(req, res) {
  try {
    await connectToDB().catch(() => {});
    const user = await userModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    return res.status(200).json({
      message: "User details fetched successfully",
      user: {
        id: user._id,
        username: user.username || user.email.split("@")[0],
        email: user.email,
      },
    });
  } catch (err) {
    return res.status(500).json({
      message: "Unable to fetch user details",
      error: err.message,
    });
  }
}

module.exports = {
  registerUserController,
  loginUserController,
  logoutUserController,
  getMeController,
};
