const path = require("path");
module.paths.push(path.resolve(__dirname, "../Backend/node_modules"));
module.paths.push(path.resolve(__dirname, "../node_modules"));

require("dotenv").config({ path: path.resolve(__dirname, "../Backend/.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const app = require("../Backend/src/app");
const connectToDB = require("../Backend/src/config/database");

let dbPromise = null;

const ensureDb = () => {
  if (!dbPromise) {
    dbPromise = connectToDB().catch((err) => {
      dbPromise = null;
      console.error("MongoDB connection error in api/index:", err);
      throw err;
    });
  }
  return dbPromise;
};

module.exports = async (req, res) => {
  try {
    await ensureDb();
  } catch (err) {
    return res.status(500).json({
      message: "Database connection failed",
      error: err.message,
    });
  }

  // Determine the actual path requested by client
  let intendedUrl =
    req.headers["x-matched-path"] ||
    req.headers["x-forwarded-uri"] ||
    req.url ||
    "/";

  // Strip query params if they were added during internal rewrite
  const cleanPath = intendedUrl.split("?")[0];

  if (!cleanPath.startsWith("/api")) {
    intendedUrl = "/api" + (cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath);
  } else {
    intendedUrl = cleanPath;
  }

  // Preserve query string if present
  if (req.url && req.url.includes("?")) {
    const qs = req.url.split("?")[1];
    intendedUrl += "?" + qs;
  }

  req.url = intendedUrl;

  return app(req, res);
};
