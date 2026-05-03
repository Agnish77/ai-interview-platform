const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const authRouter = require("./routes/auth.routes");
const interviewRouter = require("./routes/interview.routes");
const sessionRouter = require("./routes/session.routes");

const app = express();

// Middleware
const allowedOrigins = [
    process.env.FRONTEND_URL,
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175"
].filter(Boolean).map(url => url.replace(/\/+$/, "")); // remove trailing slashes

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        // Strip trailing slash from incoming origin for comparison
        const cleanOrigin = origin.replace(/\/+$/, "");
        if (allowedOrigins.includes(cleanOrigin)) {
            callback(null, true);
        } else {
            console.error(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(", ")}`);
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/sessions", sessionRouter);
app.use("/api/interviews", sessionRouter); // Also mount at /api/interviews/:id/answer per spec

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal server error", error: err.message });
});

module.exports = app;
