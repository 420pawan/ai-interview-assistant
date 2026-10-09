const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

const allowedOrigins = new Set([
    "http://localhost:5173",
    "https://ai-interview-assistant-alpha-six.vercel.app",
    "https://ai-interview-assistant-pawan11.vercel.app"
]);

function isAllowedOrigin(origin) {
    if (!origin || allowedOrigins.has(origin)) {
        return true;
    }

    return false;
}

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin(origin, callback) {
        if (isAllowedOrigin(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true
}));

/* require all the routes here */
const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");


/* using all the routes here */
app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);

app.use((error, req, res, next) => {
    if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Resume PDF must be 3MB or smaller." })
    }

    if (error.name === "MulterError") {
        return res.status(400).json({ message: "Unable to process the uploaded resume." })
    }

    console.error(`Unhandled request error: ${error.message}`)
    return res.status(500).json({ message: "Unable to process the request. Please try again." })
})


module.exports = app;
