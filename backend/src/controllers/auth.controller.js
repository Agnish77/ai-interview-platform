const userModel = require("../models/user.model");
const BlacklistModel = require("../models/blacklist.model");
const RefreshTokenModel = require("../models/refresh-token.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ─── Token helpers ────────────────────────────────────────────────────────────

function signAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
}

function signRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh", {
        expiresIn: "7d"
    });
}

function setRefreshCookie(res, token) {
    res.cookie("refreshToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
}

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * @name registerUserController
 * @description Register a new user
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (username.length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters" });
        }
        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return res.status(400).json({ message: "Please enter a valid email address" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        // Check if user already exists
        const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return res.status(400).json({ message: "An account with this email already exists" });
            }
            return res.status(400).json({ message: "Username is already taken" });
        }

        // Hash password
        const hash = await bcrypt.hash(password, 12);

        // Create user
        const user = await userModel.create({ username, email, password: hash });

        const tokenPayload = { id: user._id, username: user.username };
        const accessToken = signAccessToken(tokenPayload);
        const refreshToken = signRefreshToken(tokenPayload);

        // Persist refresh token
        await RefreshTokenModel.create({ token: refreshToken, userId: user._id });

        setRefreshCookie(res, refreshToken);

        // Also set legacy cookie for backward compat
        res.cookie("token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000
        });

        res.status(201).json({
            message: "Account created successfully",
            token: accessToken,
            user: { id: user._id, username: user.username, email: user.email }
        });

    } catch (err) {
        console.error("Register error:", err);
        res.status(500).json({ message: "Server error during registration" });
    }
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * @name loginUserController
 * @description Login a user, issue access + refresh tokens
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await userModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const tokenPayload = { id: user._id, username: user.username };
        const accessToken = signAccessToken(tokenPayload);
        const refreshToken = signRefreshToken(tokenPayload);

        // Remove old refresh tokens for this user (single-session policy)
        await RefreshTokenModel.deleteMany({ userId: user._id });
        await RefreshTokenModel.create({ token: refreshToken, userId: user._id });

        setRefreshCookie(res, refreshToken);

        // Also set legacy cookie for backward compat
        res.cookie("token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000
        });

        res.status(200).json({
            message: "Login successful",
            token: accessToken,
            user: { id: user._id, username: user.username, email: user.email }
        });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Server error during login" });
    }
}

// ─── Refresh ──────────────────────────────────────────────────────────────────

/**
 * @name refreshTokenController
 * @description Rotate refresh token → issue new access + refresh tokens
 * @access Public (needs valid refreshToken cookie)
 */
async function refreshTokenController(req, res) {
    try {
        const incoming = req.cookies?.refreshToken;
        if (!incoming) {
            return res.status(401).json({ message: "No refresh token" });
        }

        // Verify signature
        let decoded;
        try {
            decoded = jwt.verify(
                incoming,
                process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh"
            );
        } catch {
            return res.status(401).json({ message: "Invalid or expired refresh token. Please login again." });
        }

        // Check it exists in DB (rotation: invalidates on use)
        const stored = await RefreshTokenModel.findOneAndDelete({ token: incoming });
        if (!stored) {
            // Token reuse detected — wipe all tokens for this user
            await RefreshTokenModel.deleteMany({ userId: decoded.id });
            return res.status(401).json({ message: "Refresh token reuse detected. Please login again." });
        }

        const tokenPayload = { id: decoded.id, username: decoded.username };
        const newAccessToken = signAccessToken(tokenPayload);
        const newRefreshToken = signRefreshToken(tokenPayload);

        await RefreshTokenModel.create({ token: newRefreshToken, userId: decoded.id });

        setRefreshCookie(res, newRefreshToken);
        res.cookie("token", newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 15 * 60 * 1000
        });

        res.status(200).json({ token: newAccessToken });

    } catch (err) {
        console.error("Refresh error:", err);
        res.status(500).json({ message: "Server error during token refresh" });
    }
}

// ─── Logout ───────────────────────────────────────────────────────────────────

/**
 * @name logoutUserController
 * @description Logout user — blacklist access token + delete refresh token
 * @access Private
 */
async function logoutUserController(req, res) {
    try {
        const accessToken = req.cookies?.token || req.headers?.authorization?.split(" ")[1];
        if (accessToken) {
            await BlacklistModel.create({ token: accessToken }).catch(() => {}); // ignore dup errors
        }

        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) {
            await RefreshTokenModel.deleteOne({ token: refreshToken });
        }

        res.clearCookie("token");
        res.clearCookie("refreshToken");
        res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
        console.error("Logout error:", err);
        res.status(500).json({ message: "Server error during logout" });
    }
}

// ─── Me ───────────────────────────────────────────────────────────────────────

/**
 * @name getMeController
 * @description Get current logged-in user info
 * @access Private
 */
async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ user });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
}

module.exports = {
    registerUserController,
    loginUserController,
    refreshTokenController,
    logoutUserController,
    getMeController
};
