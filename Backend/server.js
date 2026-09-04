import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import cookieParser from "cookie-parser";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const app = require("./src/app");
const connectToDB = require("./src/config/database");
const { resume, selfDescription, jobDescription } = require("./src/services/temp");
const { generateInterviewReport } = require("./src/services/ai.service");

app.use(cookieParser());
connectToDB()
   .then(() => {
    console.log("Connected to DB successfully.");
   })
   .catch((err) => {
    console.log("Db connection error:", err);
   });

generateInterviewReport({ resume, selfDescription, jobDescription })
    .then((interviewReport) => {
        console.log(interviewReport);
    })
    .catch(console.error);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});