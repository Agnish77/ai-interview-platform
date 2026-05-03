const { Router } = require("express");
const authMiddleware = require("../middlewares/auth.middlewares");
const {
    createSessionController,
    listSessionsController,
    getSessionController,
    submitAnswerController
} = require("../controllers/session.controller");

const sessionRouter = Router();

// All session routes require authentication
sessionRouter.use(authMiddleware);

/**
 * @route POST /api/sessions
 * @description Create a new mock interview session from a strategy
 * @access Private
 */
sessionRouter.post("/", createSessionController);

/**
 * @route GET /api/sessions
 * @description List current user's past sessions
 * @access Private
 */
sessionRouter.get("/", listSessionsController);

/**
 * @route GET /api/sessions/:id
 * @description Get a specific session with all answers
 * @access Private
 */
sessionRouter.get("/:id", getSessionController);

/**
 * @route POST /api/interviews/:id/answer
 * @description Submit + AI-rate one answer within a session
 * @access Private
 */
sessionRouter.post("/:id/answer", submitAnswerController);

module.exports = sessionRouter;
