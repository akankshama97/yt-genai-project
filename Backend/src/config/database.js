const mongoose = require("mongoose");

async function connectToDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to Database");
    } catch (err) {
        console.error("Database connection error:", err);
        throw err;
    }
}
module.exports = connectToDB;