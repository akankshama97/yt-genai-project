const express = require('express');
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());

// Robust CORS handling for all origins, credentials, and preflight requests
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    } else {
        res.setHeader("Access-Control-Allow-Origin", "*");
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Cookie, X-Requested-With, Accept");
    
    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

app.use(cors({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie", "X-Requested-With", "Accept"]
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
