const express = require('express');
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express();
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true
}));
//require all thw routes here
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")
//using all the routes here
app.use("/api/interview", interviewRouter)
//using all the routes here
app.use("/api/auth", authRouter)


module.exports = app;