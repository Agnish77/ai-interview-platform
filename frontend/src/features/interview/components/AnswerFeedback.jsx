import React, { useState } from "react";
import { submitAnswer } from "../services/interview.api.js";

/**
 * AnswerFeedback
 * Shows a textarea for a given question, submits to the API,
 * and displays score bars + AI feedback.
 */
export default function AnswerFeedback({ sessionId, question, onAnswered }) {
    const [answer, setAnswer] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null); // { scores, feedback }
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!answer.trim()) {
            setError("Please write an answer before submitting.");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const data = await submitAnswer(sessionId, question.questionId, answer);
            setResult({ scores: data.scores, feedback: data.feedback });
            onAnswered?.({ questionId: question.questionId, ...data });
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to rate answer. Please try again.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const scoreColor = (val) => {
        if (val >= 8) return "#4ade80";
        if (val >= 5) return "#facc15";
        return "#f87171";
    };

    if (result) {
        return (
            <div className="answer-feedback">
                <h4 className="feedback-title">📊 AI Feedback</h4>
                <div className="score-bars">
                    {Object.entries(result.scores).map(([dim, val]) => (
                        <div key={dim} className="score-row">
                            <span className="score-label">{dim.charAt(0).toUpperCase() + dim.slice(1)}</span>
                            <div className="score-bar-bg">
                                <div
                                    className="score-bar-fill"
                                    style={{ width: `${val * 10}%`, backgroundColor: scoreColor(val) }}
                                />
                            </div>
                            <span className="score-value">{val}/10</span>
                        </div>
                    ))}
                </div>
                <p className="feedback-text">{result.feedback}</p>
                <div className="overall-score">
                    Overall: <strong>
                        {Math.round((result.scores.clarity + result.scores.accuracy + result.scores.depth) / 3 * 10) / 10}/10
                    </strong>
                </div>
            </div>
        );
    }

    return (
        <div className="answer-feedback">
            <div className="question-meta">
                <span className={`difficulty-badge ${question.difficulty?.toLowerCase()}`}>
                    {question.difficulty}
                </span>
                <span className="category-badge">{question.category}</span>
            </div>
            <p className="question-text">💬 {question.question}</p>
            {question.tip && (
                <p className="question-tip">💡 Tip: {question.tip}</p>
            )}
            <textarea
                className="answer-textarea"
                placeholder="Type your answer here…"
                value={answer}
                onChange={e => { setAnswer(e.target.value); setError(""); }}
                rows={6}
                disabled={loading}
            />
            {error && <p className="answer-error">⚠ {error}</p>}
            <button
                className="btn-primary submit-answer-btn"
                onClick={handleSubmit}
                disabled={loading}
            >
                {loading ? "Rating…" : "Submit Answer"}
            </button>
        </div>
    );
}
