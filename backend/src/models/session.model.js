const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, default: "" },
    scores: {
        clarity: { type: Number, min: 0, max: 10, default: 0 },
        accuracy: { type: Number, min: 0, max: 10, default: 0 },
        depth: { type: Number, min: 0, max: 10, default: 0 }
    },
    feedback: { type: String, default: "" },
    submittedAt: { type: Date, default: Date.now }
});

const sessionQuestionSchema = new mongoose.Schema({
    questionId: { type: String, required: true },
    question: { type: String, required: true },
    category: String,
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
    tip: String
});

const interviewSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "users",
            required: true
        },
        strategyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "interview_strategies",
            required: true
        },
        jobDescription: { type: String, required: true },
        questions: [sessionQuestionSchema],
        answers: [answerSchema],
        status: {
            type: String,
            enum: ["active", "completed"],
            default: "active"
        },
        summary: {
            overallFeedback: String,
            strengths: [String],
            improvements: [String]
        }
    },
    { timestamps: true }
);

const InterviewSession = mongoose.model("interview_sessions", interviewSessionSchema);
module.exports = InterviewSession;
