const { Router } = require("express");
const multer = require("multer");
const interviewController = require("../controllers/interview.controller");
const authMiddleware = require("../middlewares/auth.middlewares");

const interviewRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

// All interview routes require authentication
interviewRouter.use(authMiddleware);

/**
 * @route POST /api/interview/generate-strategy
 * @description Generate AI interview strategy
 * @access Private
 */
interviewRouter.post("/generate-strategy", upload.single("resumeFile"), interviewController.generateStrategyController);

/**
 * @route POST /api/interview/generate-resume
 * @description Generate AI resume as downloadable file
 * @access Private
 */
interviewRouter.post("/generate-resume", interviewController.generateResumePdfController);

/**
 * @route GET /api/interview/generate-resume-stream
 * @description Stream AI resume via SSE
 * @access Private
 */
interviewRouter.get("/generate-resume-stream", interviewController.generateResumeStreamController);

/**
 * @route GET /api/interview/history
 * @description Get user's past strategies
 * @access Private
 */
interviewRouter.get("/history", interviewController.getStrategyHistoryController);

/**
 * @route GET /api/interview/:id
 * @description Get a specific strategy by ID
 * @access Private
 */
interviewRouter.get("/:id", interviewController.getStrategyByIdController);

module.exports = interviewRouter;
