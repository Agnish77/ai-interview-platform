import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { io } from "socket.io-client";
import { getSession, createSession } from "../services/interview.api.js";
import { useInterview } from "../interview.context.jsx";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

/**
 * MockInterview page
 * Connects via Socket.io to /mock-interview namespace.
 * Receives questions one at a time with a 2-minute countdown timer.
 */
export default function MockInterview() {
    const { sessionId: routeSessionId } = useParams();
    const navigate = useNavigate();
    const { strategy, strategyId, jobDescription, selfDescription } = useInterview();

    const [sessionId, setSessionId] = useState(routeSessionId || null);
    const [phase, setPhase] = useState("loading"); // loading | waiting | question | feedback | complete | error
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [answer, setAnswer] = useState("");
    const [feedback, setFeedback] = useState(null);
    const [timer, setTimer] = useState(120);
    const [progress, setProgress] = useState({ index: 0, total: 0 });
    const [summary, setSummary] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    const socketRef = useRef(null);
    const answerRef = useRef("");

    // Keep ref in sync with state (needed inside socket callbacks)
    useEffect(() => { answerRef.current = answer; }, [answer]);

    // ── Create or load session ─────────────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                let sid = sessionId;
                if (!sid) {
                    if (!strategyId) {
                        navigate("/home");
                        return;
                    }
                    const data = await createSession(strategyId);
                    sid = data.session._id;
                    setSessionId(sid);
                }
                connectSocket(sid);
            } catch (err) {
                setErrorMsg("Failed to start session. Please try again.");
                setPhase("error");
            }
        })();

        return () => socketRef.current?.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Socket connection ──────────────────────────────────────────────────────
    const connectSocket = useCallback((sid) => {
        const token = localStorage.getItem("token");
        const socket = io(`${SOCKET_URL}/mock-interview`, {
            auth: { token },
            transports: ["websocket"]
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join_session", { sessionId: sid });
        });

        socket.on("connect_error", (err) => {
            setErrorMsg(`Connection failed: ${err.message}`);
            setPhase("error");
        });

        socket.on("session_joined", ({ totalQuestions, answeredCount }) => {
            setProgress({ index: answeredCount, total: totalQuestions });
            setPhase("waiting");
        });

        socket.on("question", (data) => {
            setCurrentQuestion(data);
            setAnswer("");
            setFeedback(null);
            setTimer(data.timeSeconds || 120);
            setProgress({ index: data.index, total: data.total });
            setPhase("question");
        });

        socket.on("rating_started", () => {
            setPhase("feedback");
        });

        socket.on("feedback", (data) => {
            setFeedback(data);
        });

        socket.on("session_complete", (data) => {
            setSummary(data);
            setPhase("complete");
        });

        socket.on("error", ({ message }) => {
            setErrorMsg(message);
            setPhase("error");
        });
    }, []);

    const handleSubmit = useCallback(() => {
        if (!socketRef.current || !currentQuestion) return;
        socketRef.current.emit("submit_answer", {
            questionId: currentQuestion.questionId,
            answer: answerRef.current || ""
        });
        setPhase("feedback");
    }, [currentQuestion]);

    // Client-side timer
    useEffect(() => {
        let interval;
        if (phase === "question" && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [phase, timer, handleSubmit]);

    const timerPct = (timer / (currentQuestion?.timeSeconds || 120)) * 100;
    const timerColor = timer <= 30 ? "#f87171" : timer <= 60 ? "#facc15" : "#4ade80";

    // ── Render ─────────────────────────────────────────────────────────────────

    if (phase === "loading" || phase === "waiting") {
        return (
            <div className="mock-interview mock-interview--loading">
                <div className="spinner" />
                <p>{phase === "loading" ? "Setting up your session…" : "Waiting for first question…"}</p>
            </div>
        );
    }

    if (phase === "error") {
        return (
            <div className="mock-interview mock-interview--error">
                <h2>⚠ Something went wrong</h2>
                <p>{errorMsg}</p>
                <button className="btn-primary" onClick={() => navigate("/home")}>Back to Home</button>
            </div>
        );
    }

    if (phase === "complete") {
        return (
            <div className="mock-interview mock-interview--complete">
                <div className="complete-card">
                    <h2>🎉 Interview Complete!</h2>
                    <p>{summary?.message}</p>
                    <div className="summary-stats">
                        <div className="stat">
                            <span className="stat-value">{summary?.totalAnswered}</span>
                            <span className="stat-label">Questions Answered</span>
                        </div>
                        <div className="stat">
                            <span className="stat-value">{summary?.averageScore}/10</span>
                            <span className="stat-label">Average Score</span>
                        </div>
                    </div>
                    <div className="complete-actions">
                        <button className="btn-secondary" onClick={() => navigate("/sessions")}>View History</button>
                        <button className="btn-primary" onClick={() => navigate("/home")}>New Interview</button>
                    </div>

                    {summary?.summary && (
                        <div className="summary-feedback" style={{ marginTop: "24px", textAlign: "left", background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "12px", border: "1px solid #2F313D" }}>
                            <h3 style={{ marginBottom: "12px", color: "#FF006E" }}>Personalized Feedback</h3>
                            <p style={{ lineHeight: "1.6", color: "#C0C1C7", fontSize: "0.95rem", marginBottom: "20px" }}>{summary.summary.overallFeedback}</p>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
                                <div>
                                    <h4 style={{ color: "#00D68F", marginBottom: "10px" }}>Top Strengths</h4>
                                    <ul style={{ paddingLeft: "20px", color: "#C0C1C7", fontSize: "0.9rem" }}>
                                        {summary.summary.strengths?.map((s, i) => <li key={i} style={{ marginBottom: "6px" }}>{s}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 style={{ color: "#FFA500", marginBottom: "10px" }}>Areas to Improve</h4>
                                    <ul style={{ paddingLeft: "20px", color: "#C0C1C7", fontSize: "0.9rem" }}>
                                        {summary.summary.improvements?.map((s, i) => <li key={i} style={{ marginBottom: "6px" }}>{s}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="mock-interview">
            {/* Header */}
            <div className="mock-header">
                <div className="mock-progress">
                    Question {progress.index} / {progress.total}
                </div>
                <div className="mock-timer" style={{ color: timerColor }}>
                    ⏱ {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
                </div>
            </div>

            {/* Timer bar */}
            <div className="timer-bar-bg">
                <div
                    className="timer-bar-fill"
                    style={{ width: `${timerPct}%`, backgroundColor: timerColor, transition: "width 1s linear" }}
                />
            </div>

            {/* Question */}
            {currentQuestion && (
                <div className="question-card">
                    <div className="question-meta" style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                        <span className={`iv-badge iv-badge--${currentQuestion.difficulty?.toLowerCase()}`}>
                            {currentQuestion.difficulty}
                        </span>
                        {currentQuestion.category.split('|').map((cat, idx) => (
                            <span key={idx} className="iv-category-chip">{cat.trim()}</span>
                        ))}
                    </div>
                    <h3 className="question-text">{currentQuestion.question}</h3>
                    {currentQuestion.tip && (
                        <p className="question-tip">💡 {currentQuestion.tip}</p>
                    )}
                </div>
            )}

            {/* Answer or Feedback */}
            {phase === "question" && (
                <div className="answer-section">
                    <textarea
                        className="answer-textarea"
                        placeholder="Type your answer here… You have 2 minutes."
                        value={answer}
                        onChange={e => setAnswer(e.target.value)}
                        rows={8}
                    />
                    <button className="btn-primary" onClick={handleSubmit}>
                        Submit Answer →
                    </button>
                </div>
            )}

            {phase === "feedback" && (
                <div className="feedback-section">
                    {!feedback ? (
                        <div className="rating-loading">
                            <div className="spinner" />
                            <p>AI is rating your answer…</p>
                        </div>
                    ) : (
                        <div className="feedback-card">
                            <h4>📊 Your Scores</h4>
                            {Object.entries(feedback.scores || {}).map(([dim, val]) => (
                                <div key={dim} className="score-row">
                                    <span className="score-label">{dim.charAt(0).toUpperCase() + dim.slice(1)}</span>
                                    <div className="score-bar-bg">
                                        <div
                                            className="score-bar-fill"
                                            style={{
                                                width: `${val * 10}%`,
                                                backgroundColor: val >= 8 ? "#4ade80" : val >= 5 ? "#facc15" : "#f87171"
                                            }}
                                        />
                                    </div>
                                    <span className="score-value">{val}/10</span>
                                </div>
                            ))}
                            <p className="feedback-text">{feedback.feedback}</p>
                            <p className="next-hint">⏭ Next question loading in 2 seconds…</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
