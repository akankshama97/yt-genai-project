const express = require('express');
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cookieParser());

app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}));

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is healthy", time: new Date().toISOString() });
});

// require all routes
const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");

// using routes
app.use("/api/interview", interviewRouter);
app.use("/api/auth", authRouter);

module.exports = app;
