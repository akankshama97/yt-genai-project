const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
const app = require("./src/app");
const connectToDB = require("./src/config/database");

const PORT = process.env.PORT || 3000;

connectToDB()
    .then(() => {
        console.log("Connected to DB successfully.");
    })
    .catch((err) => {
        console.error("Db connection error:", err);
    });

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});