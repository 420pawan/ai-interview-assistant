const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())
app.use(cookieParser())
const allowedOrigins = [
    "http://localhost:5173",
    "https://ai-interview-assistant-pawan11.vercel.app",
    "https://ai-interview-assistant-iadp181on-pawan11.vercel.app"
];
const cors = require("cors");

app.use(cors({
    origin: function (origin, callback) {
        if (
            !origin ||
            origin === "http://localhost:5173" ||
            origin.endsWith(".vercel.app")
        ) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
}));

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)



module.exports = app