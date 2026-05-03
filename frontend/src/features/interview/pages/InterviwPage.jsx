import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useInterview } from "../interview.context.jsx";
import { useAuth } from "../../auth/services/auth.context.js";
import StreamingResume from "../components/StreamingResume.jsx";
import "../../../style/interview.scss";

const difficultyColors = { Easy: "easy", Medium: "medium", Hard: "hard" };
const importanceColors = { High: "high", Medium: "medium", Low: "low" };

const ScoreRing = ({ score }) => {
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const strokeDash = (score / 100) * circumference;
    const color = score >= 75 ? "#00D68F" : score >= 50 ? "#4FC3F7" : "#FF006E";

    return (
        <div className="score-ring">
            <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r={radius} fill="none" stroke="#2F313D" strokeWidth="7" />
                <circle
                    cx="45" cy="45" r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth="7"
                    strokeDasharray={`${strokeDash} ${circumference}`}
                    strokeLinecap="round"
                    transform="rotate(-90 45 45)"
                    style={{ transition: "stroke-dasharray 1s ease" }}
                />
            </svg>
            <div className="score-ring__label">
                <span className="score-ring__number" style={{ color }}>{score}</span>
                <span className="score-ring__sub">/ 100</span>
            </div>
        </div>
    );
};

const InterviewPage = () => {
    const navigate = useNavigate();
    const { strategy, strategyId, loading, resumeLoading, error, downloadResume, clearStrategy, jobDescription, selfDescription, resumeText } = useInterview();
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("focus");
    const [resumeSuccess, setResumeSuccess] = useState(false);
    const [showStreaming, setShowStreaming] = useState(false);

    const handleDownloadResume = async () => {
        setResumeSuccess(false);
        const result = await downloadResume();
        if (result.success) setResumeSuccess(true);
    };

    const handleBack = () => {
        clearStrategy();
        navigate("/home");
    };

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    if (loading) {
        return (
            <div className="iv-loading-screen">
                <div className="iv-loading-screen__inner">
                    <div className="iv-spinner" />
                    <h2>Analyzing your profile<span className="iv-dots">...</span></h2>
                    <p>Our AI is crafting a personalized interview strategy for you</p>
                    <div className="iv-loading-steps">
                        <div className="iv-loading-step iv-loading-step--active">📋 Reading job requirements</div>
                        <div className="iv-loading-step">🧠 Identifying key skills</div>
                        <div className="iv-loading-step">✨ Generating strategy</div>
                    </div>
                </div>
            </div>
        );
    }

    if (!strategy) {
        return (
            <div className="iv-empty-screen">
                <div className="iv-empty-screen__inner">
                    <span className="iv-empty-icon">🎯</span>
                    <h2>No Strategy Yet</h2>
                    <p>Generate your personalized interview strategy from the home page first.</p>
                    <button className="iv-btn iv-btn--primary" onClick={() => navigate("/home")}>
                        ← Go to Home
                    </button>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: "focus", label: "🎯 Focus Areas", count: strategy.focusAreas?.length },
        { id: "questions", label: "💬 Practice Questions", count: strategy.practiceQuestions?.length },
        { id: "tips", label: "💡 Tips", count: strategy.generalTips?.length },
    ];

    return (
        <div className="iv-page">
            {/* Navbar */}
            <nav className="iv-nav">
                <div className="iv-nav__brand">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">InterviewAI</span>
                </div>
                <div className="iv-nav__actions">
                    <span className="iv-nav__user">👤 {user?.username}</span>
                    <button className="iv-btn iv-btn--ghost" onClick={handleBack}>← Back</button>
                    <button className="iv-btn iv-btn--outline" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <div className="iv-container">
                {/* Hero Header */}
                <header className="iv-hero">
                    <div className="iv-hero__left">
                        <div className="iv-hero__badge">AI Strategy Ready</div>
                        <h1>
                            {strategy.jobTitle || "Your Role"}{" "}
                            {strategy.company && strategy.company !== "Unknown" && (
                                <span className="iv-hero__company">@ {strategy.company}</span>
                            )}
                        </h1>
                        <p className="iv-hero__summary">{strategy.summary}</p>
                        <div className="iv-hero__meta">
                            <div className="iv-meta-chip">
                                <span>⏱</span> Prep Time: {strategy.timeline || "2–3 weeks"}
                            </div>
                            <div className="iv-meta-chip">
                                <span>📌</span> {strategy.focusAreas?.length || 0} Focus Areas
                            </div>
                            <div className="iv-meta-chip">
                                <span>💬</span> {strategy.practiceQuestions?.length || 0} Questions
                            </div>
                        </div>
                    </div>
                    <div className="iv-hero__right">
                        <div className="iv-score-card">
                            <p className="iv-score-card__label">Fit Score</p>
                            <ScoreRing score={strategy.overallScore || 0} />
                            <p className="iv-score-card__hint">Profile match for this role</p>
                        </div>
                    </div>
                </header>

                {/* Action Buttons */}
                <div className="iv-action-bar">
                    <button
                        className="iv-btn iv-btn--resume"
                        onClick={handleDownloadResume}
                        disabled={resumeLoading}
                    >
                        {resumeLoading ? (
                            <><span className="iv-btn-spinner" /> Generating Resume...</>
                        ) : (
                            <><span>📄</span> Generate AI Resume PDF</>
                        )}
                    </button>
                    <button
                        className="iv-btn iv-btn--stream"
                        onClick={() => setShowStreaming(true)}
                    >
                        ✨ Stream Resume Live
                    </button>
                    <button
                        className="iv-btn iv-btn--mock"
                        onClick={() => navigate("/mock-interview")}
                    >
                        🎤 Start Mock Interview
                    </button>
                    <button
                        className="iv-btn iv-btn--ghost"
                        onClick={() => navigate("/sessions")}
                    >
                        📋 My Sessions
                    </button>
                    {resumeSuccess && (
                        <div className="iv-success-chip">✅ Resume downloaded!</div>
                    )}
                    {error && (
                        <div className="iv-error-chip">⚠ {error}</div>
                    )}
                </div>

                {/* Streaming Resume Modal */}
                {showStreaming && (
                    <StreamingResume
                        jobDescription={jobDescription}
                        selfDescription={selfDescription}
                        resumeText={resumeText}
                        strategyId={strategyId}
                        onClose={() => setShowStreaming(false)}
                    />
                )}

                {/* Tabs */}
                <div className="iv-tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            className={`iv-tab ${activeTab === tab.id ? "iv-tab--active" : ""}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            {tab.label}
                            <span className="iv-tab__count">{tab.count}</span>
                        </button>
                    ))}
                </div>

                {/* Tab: Focus Areas */}
                {activeTab === "focus" && (
                    <div className="iv-grid iv-grid--3">
                        {strategy.focusAreas?.map((area, i) => (
                            <div className="iv-card iv-card--focus" key={i}>
                                <div className="iv-card__top">
                                    <span className={`iv-badge iv-badge--${importanceColors[area.importance]}`}>
                                        {area.importance} Priority
                                    </span>
                                    <span className="iv-card__time">{area.timeToSpend}</span>
                                </div>
                                <h3 className="iv-card__title">{area.topic}</h3>
                                <p className="iv-card__desc">{area.description}</p>
                                <div className="iv-card__number">#{i + 1}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab: Practice Questions */}
                {activeTab === "questions" && (
                    <div className="iv-questions-list">
                        {strategy.practiceQuestions?.map((q, i) => (
                            <div className="iv-question-card" key={i}>
                                <div className="iv-question-card__header">
                                    <span className="iv-question-card__num">Q{i + 1}</span>
                                    <span className={`iv-badge iv-badge--${difficultyColors[q.difficulty]}`}>
                                        {q.difficulty}
                                    </span>
                                    {q.category.split('|').map((cat, idx) => (
                                        <span key={idx} className="iv-category-chip">{cat.trim()}</span>
                                    ))}
                                </div>
                                <p className="iv-question-card__question">{q.question}</p>
                                <div className="iv-question-card__tip">
                                    <span className="iv-tip-icon">💡</span>
                                    <p>{q.tip}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Tab: Tips */}
                {activeTab === "tips" && (
                    <div className="iv-tips-grid">
                        {strategy.generalTips?.map((tip, i) => (
                            <div className="iv-tip-card" key={i}>
                                <div className="iv-tip-card__icon">
                                    {["🚀", "🎯", "📚", "🤝", "⏰", "💪"][i % 6]}
                                </div>
                                <p>{tip}</p>
                                <div className="iv-tip-card__number">{String(i + 1).padStart(2, "0")}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <footer className="iv-footer">
                <p>InterviewAI • AI Powered Strategy Generation • {new Date().getFullYear()}</p>
                <div className="iv-footer__links">
                    <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("WILL COME SOON"); }}>Privacy Policy</a>
                    <a href="#terms" onClick={(e) => { e.preventDefault(); alert("WILL COME SOON"); }}>Terms of Service</a>
                    <a href="#help" onClick={(e) => { e.preventDefault(); alert("WILL COME SOON"); }}>Help Center</a>
                </div>
            </footer>
        </div>
    );
};

export default InterviewPage;
