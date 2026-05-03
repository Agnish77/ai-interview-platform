const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
    question: String,
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"] },
    category: String,
    tip: String
});

const focusAreaSchema = new mongoose.Schema({
    topic: String,
    importance: { type: String, enum: ["High", "Medium", "Low"] },
    description: String,
    timeToSpend: String
});

const interviewStrategySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    jobDescription: {
        type: String,
        required: true
    },
    selfDescription: String,
    resumeText: String,
    strategy: {
        jobTitle: String,
        company: String,
        overallScore: Number,
        focusAreas: [focusAreaSchema],
        practiceQuestions: [questionSchema],
        generalTips: [String],
        timeline: String,
        summary: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const InterviewStrategy = mongoose.model("interview_strategies", interviewStrategySchema);
module.exports = InterviewStrategy;
