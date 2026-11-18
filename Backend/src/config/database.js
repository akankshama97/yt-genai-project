const mongoose = require("mongoose");

const FALLBACK_URI_B64 = "bW9uZ29kYjovL2FrYW5rc2hhbWE5N19kYl91c2VyOk1hdXJ5YTk3MjFAYWMtbjh4ZnJ0ai1zaGFyZC0wMC0wMC52YmVla2dnLm1vbmdvZGIubmV0OjI3MDE3LGFjLW44eGZydGotc2hhcmQtMDAtMDEudmJlZWtnZy5tb25nb2RiLm5ldDoyNzAxNyxhYy1uOHhmcnRqLXNoYXJkLTAwLTAyLnZiZWVrZ2cubW9uZ29kYi5uZXQ6MjcwMTcvP3NzbD10cnVlJnJlcGxpY2FTZXQ9YXRsYXMtdDlmMHltLXNoYXJkLTAmYXV0aFNvdXJjZT1hZG1pbiZhcHBOYW1lPUNsdXN0ZXIw";
const DEFAULT_MONGO_URI = Buffer.from(FALLBACK_URI_B64, "base64").toString("utf-8");

let isConnected = false;

async function connectToDB() {
    if (isConnected || mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }
    const uri = (process.env.MONGO_URI && process.env.MONGO_URI.trim()) || DEFAULT_MONGO_URI;
    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 45000,
        });
        isConnected = true;
        console.log("Connected to Database successfully.");
        return mongoose.connection;
    } catch (err) {
        console.error("Database connection error:", err);
        throw err;
    }
}

module.exports = connectToDB;
