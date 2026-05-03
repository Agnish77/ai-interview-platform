require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectToDB = require("./src/config/database");
const registerInterviewSocket = require("./src/socket/interview.socket");

const PORT = process.env.PORT || 3000;

// Create HTTP server (needed for Socket.io)
const httpServer = http.createServer(app);

// Attach Socket.io with CORS matching the app
const io = new Server(httpServer, {
    cors: {
        origin: [
            process.env.FRONTEND_URL,
            "http://localhost",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175"
        ].filter(Boolean),
        credentials: true,
        methods: ["GET", "POST"]
    }
});

// Register socket handlers
registerInterviewSocket(io);

// Start
connectToDB();
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
