const { z } = require("zod");
const InterviewSession = require("../models/session.model");
const InterviewStrategy = require("../models/interview.model");
const { rateAnswer } = require("../services/ai.service");

const submitAnswerSchema = z.object({
    answer: z.string().min(1, "Answer cannot be empty").max(5000)
});

// ─── Create Session ───────────────────────────────────────────────────────────

/**
 * POST /api/sessions
 * Create a new mock interview session from an existing strategy.
 */
async function createSessionController(req, res) {
    try {
        const { strategyId } = req.body;
        if (!strategyId) {
            return res.status(400).json({ message: "strategyId is required" });
        }

        const strategy = await InterviewStrategy.findOne({ _id: strategyId, userId: req.user.id });
        if (!strategy) {
            return res.status(404).json({ message: "Strategy not found" });
        }

        const questions = (strategy.strategy?.practiceQuestions || []).map((q, i) => ({
            questionId: `q_${i}`,
            question: q.question,
            category: q.category,
            difficulty: q.difficulty,
            tip: q.tip
        }));

        const session = await InterviewSession.create({
            userId: req.user.id,
            strategyId,
            jobDescription: strategy.jobDescription,
            questions,
            answers: [],
            status: "active"
        });

        res.status(201).json({ message: "Session created", session });
    } catch (err) {
        console.error("Create session error:", err);
        res.status(500).json({ message: "Failed to create session" });
    }
}

// ─── List Sessions ────────────────────────────────────────────────────────────

/**
 * GET /api/sessions
 * List the current user's past interview sessions.
 */
async function listSessionsController(req, res) {
    try {
        const sessions = await InterviewSession.find({ userId: req.user.id })
            .select("strategyId jobDescription status answers createdAt updatedAt")
            .sort({ createdAt: -1 })
            .limit(20);

        const enriched = sessions.map(s => ({
            id: s._id,
            jobDescription: s.jobDescription.substring(0, 120) + (s.jobDescription.length > 120 ? "..." : ""),
            status: s.status,
            questionsTotal: s.questions?.length || 0,
            answersGiven: s.answers?.length || 0,
            avgScore: s.answers.length
                ? Math.round(
                      (s.answers.reduce(
                          (acc, a) =>
                              acc + (a.scores.clarity + a.scores.accuracy + a.scores.depth) / 3,
                          0
                      ) /
                          s.answers.length) *
                          10
                  ) / 10
                : null,
            createdAt: s.createdAt
        }));

        res.status(200).json({ sessions: enriched });
    } catch (err) {
        console.error("List sessions error:", err);
        res.status(500).json({ message: "Failed to fetch sessions" });
    }
}

// ─── Get Session ──────────────────────────────────────────────────────────────

/**
 * GET /api/sessions/:id
 * Get full detail of a specific session.
 */
async function getSessionController(req, res) {
    try {
        const session = await InterviewSession.findOne({ _id: req.params.id, userId: req.user.id });
        if (!session) return res.status(404).json({ message: "Session not found" });
        res.status(200).json({ session });
    } catch (err) {
        console.error("Get session error:", err);
        res.status(500).json({ message: "Failed to fetch session" });
    }
}

// ─── Submit Answer ────────────────────────────────────────────────────────────

/**
 * POST /api/interviews/:id/answer
 * Submit an answer to one question; AI rates it and saves result.
 */
async function submitAnswerController(req, res) {
    try {
        const { id } = req.params;
        const { questionId } = req.body;

        // Zod validation
        const parsed = submitAnswerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: parsed.error.errors[0]?.message || "Invalid request"
            });
        }
        const { answer } = parsed.data;

        const session = await InterviewSession.findOne({ _id: id, userId: req.user.id });
        if (!session) return res.status(404).json({ message: "Session not found" });

        const questionObj = session.questions.find(q => q.questionId === questionId);
        if (!questionObj) return res.status(400).json({ message: "Question not found in this session" });

        // Check if already answered
        const alreadyAnswered = session.answers.find(a => a.questionId === questionId);
        if (alreadyAnswered) {
            return res.status(409).json({ message: "This question has already been answered" });
        }

        // Rate with AI
        const rated = await rateAnswer(questionObj.question, answer, session.jobDescription);

        const answerEntry = {
            questionId,
            question: questionObj.question,
            answer,
            scores: rated.scores,
            feedback: rated.feedback,
            submittedAt: new Date()
        };

        session.answers.push(answerEntry);

        // Auto-complete when all questions answered
        if (session.answers.length >= session.questions.length) {
            session.status = "completed";
        }
        await session.save();

        res.status(200).json({
            message: "Answer submitted",
            scores: rated.scores,
            feedback: rated.feedback,
            sessionStatus: session.status
        });
    } catch (err) {
        console.error("Submit answer error:", err);
        const status = err.status;
        const msg = err.message || "";
        if (status === 429 || msg.includes("quota") || msg.includes("exhausted")) {
            return res.status(429).json({ message: "AI Service quota exceeded. Please try again later." });
        }
        res.status(500).json({ message: "Failed to rate answer" });
    }
}

module.exports = {
    createSessionController,
    listSessionsController,
    getSessionController,
    submitAnswerController
};
