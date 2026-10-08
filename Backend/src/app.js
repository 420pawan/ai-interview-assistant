const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

const allowedOrigins = new Set([
    "http://localhost:5173",
    "https://ai-interview-assistant-pawan11.vercel.app"
]);

function isAllowedOrigin(origin) {
    if (!origin || allowedOrigins.has(origin)) {
        return true;
    }

    try {
        const url = new URL(origin);
        return url.protocol === "https:" && url.hostname.endsWith(".vercel.app");
    } catch {
        return false;
    }
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



module.exports = app;
