const jwt = require("jsonwebtoken");
const InterviewSession = require("../models/session.model");
const { rateAnswer, generateSessionSummary } = require("../services/ai.service");

const QUESTION_TIMER_SECONDS = 120; // 2 minutes per question

/**
 * Verify the JWT token sent during socket handshake.
 */
function verifySocketToken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

/**
 * Register all mock-interview Socket.io event handlers.
 * @param {import("socket.io").Server} io
 */
function registerInterviewSocket(io) {
    // Namespace: /mock-interview
    const ns = io.of("/mock-interview");

    ns.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        const user = verifySocketToken(token);
        if (!user) return next(new Error("Authentication failed"));
        socket.user = user;
        next();
    });

    ns.on("connection", (socket) => {
        console.log(`[Socket] User ${socket.user.username} connected`);

        // ── join_session ────────────────────────────────────────────────
        socket.on("join_session", async ({ sessionId }) => {
            try {
                const session = await InterviewSession.findOne({
                    _id: sessionId,
                    userId: socket.user.id,
                    status: "active"
                });
                if (!session) {
                    return socket.emit("error", { message: "Session not found or already completed." });
                }

                socket.join(sessionId);
                socket.data.sessionId = sessionId;
                socket.data.session = session;

                // Find the next unanswered question
                const nextQuestion = getNextQuestion(session);
                if (!nextQuestion) {
                    await completeSession(session, ns, sessionId);
                    return;
                }

                socket.emit("session_joined", {
                    sessionId,
                    totalQuestions: session.questions.length,
                    answeredCount: session.answers.length
                });

                sendQuestion(socket, ns, sessionId, nextQuestion, session);

            } catch (err) {
                console.error("[Socket] join_session error:", err);
                socket.emit("error", { message: "Failed to join session." });
            }
        });

        socket.on("submit_answer", async ({ questionId, answer }) => {
            try {

                const session = await InterviewSession.findById(socket.data.sessionId);
                if (!session || session.status === "completed") return;

                // Check not already answered
                if (session.answers.find(a => a.questionId === questionId)) {
                    return socket.emit("error", { message: "Already answered." });
                }

                const questionObj = session.questions.find(q => q.questionId === questionId);
                if (!questionObj) return;

                // Rate with AI (fire & emit concurrently)
                socket.emit("rating_started", { questionId });

                let scores = { clarity: 0, accuracy: 0, depth: 0 };
                let feedback = "No feedback available.";

                try {
                    const rated = await rateAnswer(questionObj.question, answer || "", session.jobDescription);
                    scores = rated.scores;
                    feedback = rated.feedback;
                } catch (aiErr) {
                    console.error("[Socket] AI rating error:", aiErr.message);
                    feedback = "AI rating unavailable. Please try again.";
                }

                const answerEntry = {
                    questionId,
                    question: questionObj.question,
                    answer: answer || "",
                    scores,
                    feedback,
                    submittedAt: new Date()
                };

                session.answers.push(answerEntry);

                socket.emit("feedback", { questionId, scores, feedback });

                const nextQuestion = getNextQuestion(session);
                if (!nextQuestion) {
                    session.status = "completed";
                    
                    let aiSummary = {
                        overallFeedback: "Great job completing the interview!",
                        strengths: ["Completed the full interview", "Answered all questions"],
                        improvements: ["Keep practicing specific technical details"]
                    };

                    try {
                        aiSummary = await generateSessionSummary(session.answers, session.jobDescription);
                    } catch (sumErr) {
                        console.error("[Socket] AI Summary error:", sumErr.message);
                    }

                    session.summary = aiSummary;
                    await session.save();

                    ns.to(socket.data.sessionId).emit("session_complete", {
                        message: "Interview complete! Well done.",
                        totalAnswered: session.answers.length,
                        averageScore: calcAverageScore(session.answers),
                        summary: aiSummary
                    });
                } else {
                    await session.save();
                    setTimeout(() => {
                        sendQuestion(socket, ns, socket.data.sessionId, nextQuestion, session);
                    }, 2000); // 2s pause after feedback before next question
                }

            } catch (err) {
                console.error("[Socket] submit_answer error:", err);
                socket.emit("error", { message: "Failed to submit answer." });
            }
        });

        // ── disconnect ──────────────────────────────────────────────────
        socket.on("disconnect", () => {
            console.log(`[Socket] User ${socket.user.username} disconnected`);
        });
    });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getNextQuestion(session) {
    const answeredIds = new Set(session.answers.map(a => a.questionId));
    return session.questions.find(q => !answeredIds.has(q.questionId)) || null;
}

function sendQuestion(socket, ns, sessionId, question, session) {
    const answeredCount = session.answers.length;
    ns.to(sessionId).emit("question", {
        questionId: question.questionId,
        question: question.question,
        category: question.category,
        difficulty: question.difficulty,
        tip: question.tip,
        index: answeredCount + 1,
        total: session.questions.length,
        timeSeconds: QUESTION_TIMER_SECONDS
    });
}



async function completeSession(session, ns, sessionId) {
    session.status = "completed";
    await session.save();
    ns.to(sessionId).emit("session_complete", {
        message: "All questions answered!",
        totalAnswered: session.answers.length,
        averageScore: calcAverageScore(session.answers)
    });
}

function calcAverageScore(answers) {
    if (!answers.length) return 0;
    const total = answers.reduce((acc, a) => {
        const avg = (a.scores.clarity + a.scores.accuracy + a.scores.depth) / 3;
        return acc + avg;
    }, 0);
    return Math.round((total / answers.length) * 10) / 10;
}

module.exports = registerInterviewSocket;
