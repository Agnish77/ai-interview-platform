const jwt = require("jsonwebtoken");
const BlacklistModel = require("../models/blacklist.model");

const authMiddleware = async (req, res, next) => {
    try {
        // Support token in query string for SSE endpoints (EventSource can't set headers)
        const token = req.cookies?.token
            || req.headers?.authorization?.split(" ")[1]
            || req.query?.token;

        if (!token) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }

        // Check if token is blacklisted (logged out)
        const isBlacklisted = await BlacklistModel.findOne({ token });
        if (isBlacklisted) {
            return res.status(401).json({ message: "Token has been invalidated. Please login again." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token expired. Please login again." });
        }
        return res.status(401).json({ message: "Invalid token." });
    }
};

module.exports = authMiddleware;
