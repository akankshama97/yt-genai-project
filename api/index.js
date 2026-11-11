const path = require("path");
module.paths.push(path.resolve(__dirname, "../Backend/node_modules"));

require("dotenv").config({ path: path.resolve(__dirname, "../Backend/.env") });
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
            error: err.message
        });
    }
    return app(req, res);
};
