const mongoose = require("mongoose");

let isConnected = false;

async function connectToDB() {
    if (isConnected || mongoose.connection.readyState >= 1) {
        return mongoose.connection;
    }
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is missing from environment variables!");
        throw new Error("MONGO_URI environment variable is missing.");
    }
    try {
        await mongoose.connect(process.env.MONGO_URI);
        isConnected = true;
        console.log("Connected to Database successfully.");
        return mongoose.connection;
    } catch (err) {
        console.error("Database connection error:", err);
        throw err;
    }
}

module.exports = connectToDB;
