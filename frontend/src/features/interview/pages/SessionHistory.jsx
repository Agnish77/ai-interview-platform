import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { listSessions, getSession } from "../services/interview.api.js";

export default function SessionHistory() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [sessions, setSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                if (id) {
                    const data = await getSession(id);
                    setSelectedSession(data.session);
                } else {
                    const data = await listSessions();
                    setSessions(data.sessions || []);
                    setSelectedSession(null);
                }
            } catch (err) {
                setError(id ? "Failed to load session details." : "Failed to load session history.");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const statusColor = (s) => s === "completed" ? "#4ade80" : "#facc15";
    const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric"
    });

    if (loading) {
        return (
            <div className="session-history session-history--loading">
                <div className="spinner" />
                <p>Loading your sessions…</p>
            </div>
        );
    }

    if (id && selectedSession) {
        const s = selectedSession;
        return (
            <div className="session-history">
                <div className="session-history-header">
                    <button className="btn-back" onClick={() => navigate("/sessions")}>← Back to History</button>
                    <h1>Session Details</h1>
                </div>
                
                <div style={{ background: "var(--card-bg, #1A1C23)", padding: "24px", borderRadius: "12px", border: "1px solid var(--border-color, #2F313D)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                        <span style={{ color: statusColor(s.status) }}>● {s.status}</span>
                        <span style={{ color: "#8E91A1" }}>{formatDate(s.createdAt)}</span>
                    </div>

                    <h3 style={{ marginBottom: "10px" }}>Job Role Focus</h3>
                    <p style={{ color: "#C0C1C7", marginBottom: "24px", fontSize: "0.95rem" }}>{s.jobDescription}</p>

                    {s.summary ? (
                        <div className="summary-feedback" style={{ marginTop: "24px", textAlign: "left", background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "12px", border: "1px solid #2F313D" }}>
                            <h3 style={{ marginBottom: "12px", color: "#FF006E" }}>Personalized Feedback</h3>
                            <p style={{ lineHeight: "1.6", color: "#C0C1C7", fontSize: "0.95rem", marginBottom: "20px" }}>{s.summary.overallFeedback}</p>
                            
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
                                <div>
                                    <h4 style={{ color: "#00D68F", marginBottom: "10px" }}>Top Strengths</h4>
                                    <ul style={{ paddingLeft: "20px", color: "#C0C1C7", fontSize: "0.9rem" }}>
                                        {s.summary.strengths?.map((str, i) => <li key={i} style={{ marginBottom: "6px" }}>{str}</li>)}
                                    </ul>
                                </div>
                                <div>
                                    <h4 style={{ color: "#FFA500", marginBottom: "10px" }}>Areas to Improve</h4>
                                    <ul style={{ paddingLeft: "20px", color: "#C0C1C7", fontSize: "0.9rem" }}>
                                        {s.summary.improvements?.map((imp, i) => <li key={i} style={{ marginBottom: "6px" }}>{imp}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                            No AI summary available for this session.
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="session-history">
            <div className="session-history-header">
                <button className="btn-back" onClick={() => navigate("/interview")}>← Back</button>
                <h1>Interview History</h1>
            </div>

            {error && <div className="error-banner">⚠ {error}</div>}

            {sessions.length === 0 && !error ? (
                <div className="empty-state">
                    <p>🎯 No sessions yet.</p>
                    <p>Start a mock interview from the home page to see your history here.</p>
                    <button className="btn-primary" onClick={() => navigate("/home")}>Get Started</button>
                </div>
            ) : (
                <div className="sessions-grid">
                    {sessions.map((s) => (
                        <div
                            key={s.id}
                            className="session-card"
                            onClick={() => navigate(`/sessions/${s.id}`)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={e => e.key === "Enter" && navigate(`/sessions/${s.id}`)}
                        >
                            <div className="session-card-header">
                                <span
                                    className="session-status"
                                    style={{ color: statusColor(s.status) }}
                                >
                                    ● {s.status}
                                </span>
                                <span className="session-date">{formatDate(s.createdAt)}</span>
                            </div>
                            <p className="session-jd">{s.jobDescription}</p>
                            <div className="session-tags" style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                                {s.jobTitle && <span className="iv-category-chip">{s.jobTitle}</span>}
                                {s.company && s.company !== "Unknown" && <span className="iv-category-chip">{s.company}</span>}
                            </div>
                            <div className="session-stats">
                                <div className="stat-item">
                                    <span className="stat-num">{s.answersGiven}</span>
                                    <span className="stat-lbl">/ {s.questionsTotal} answered</span>
                                </div>
                                {s.avgScore !== null && (
                                    <div className="stat-item">
                                        <span className="stat-num">{s.avgScore}</span>
                                        <span className="stat-lbl">avg score</span>
                                    </div>
                                )}
                            </div>
                            <div className="progress-bar-bg">
                                <div
                                    className="progress-bar-fill"
                                    style={{
                                        width: `${s.questionsTotal ? (s.answersGiven / s.questionsTotal) * 100 : 0}%`
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
