const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const authMiddleware = require("../middlewares/auth.middlewares");

const authRouter = Router();

/**
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
 */
authRouter.post("/register", authController.registerUserController);

/**
 * @route POST /api/auth/login
 * @description Login a user
 * @access Public
 */
authRouter.post("/login", authController.loginUserController);

/**
 * @route POST /api/auth/refresh
 * @description Rotate refresh token → new access token
 * @access Public (refreshToken cookie required)
 */
authRouter.post("/refresh", authController.refreshTokenController);

/**
 * @route POST /api/auth/logout
 * @description Logout a user (blacklist access token + delete refresh token)
 * @access Private
 */
authRouter.post("/logout", authMiddleware, authController.logoutUserController);

/**
 * @route GET /api/auth/me
 * @description Get current user profile
 * @access Private
 */
authRouter.get("/me", authMiddleware, authController.getMeController);

module.exports = authRouter;
