import React, { useRef } from 'react';
import '../style/home.scss';
import { useInterviewPlan } from '../hooks/useInterviewPlan';
import { useAuth } from '../../auth/services/auth.context.js';
import { useNavigate } from 'react-router';

const Home = () => {
    const { state, actions } = useInterviewPlan();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const onDragOver = (e) => e.preventDefault();

    const handleLogout = async () => {
        await logout();
        navigate("/");
    };

    return (
        <div className="interview-home-container">
            {/* Top Navigation Bar */}
            <nav className="home-nav">
                <div className="home-nav__brand">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">InterviewAI</span>
                </div>
                <div className="home-nav__actions">
                    <span className="home-nav__user">👤 {user?.username}</span>
                    <button className="home-nav__logout-btn" onClick={handleLogout}>Logout</button>
                </div>
            </nav>

            <header className="interview-header">
                <h1>Create Your Custom <span className="highlight">Interview Plan</span></h1>
                <p>Let our AI analyze the job requirements and your unique profile to build a winning strategy.</p>
            </header>

            <main className="interview-content">
                {/* Left Column: Job Description */}
                <section className="card job-description-section">
                    <div className="card-header">
                        <div className="header-title">
                            <span className="icon">🎯</span> Target Job Description
                        </div>
                        <span className="required-badge">Required</span>
                    </div>
                    <div className="card-body">
                        <textarea
                            placeholder={"Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'"}
                            value={state.jobDescription}
                            onChange={actions.handleJobDescriptionChange}
                            maxLength={5000}
                        />
                        <div className="char-count">
                            {state.jobDescription.length} / 5000 chars
                        </div>
                    </div>
                </section>

                {/* Right Column: Profile */}
                <section className="card profile-section">
                    <div className="card-header">
                        <div className="header-title">
                            <span className="icon">👤</span> Your Profile
                        </div>
                    </div>
                    <div className="card-body">
                        {/* Upload Resume */}
                        <div className="upload-resume">
                            <label>Upload Resume <span className="recommended">(Recommended)</span></label>
                            <div
                                className="drop-zone"
                                onDragOver={onDragOver}
                                onDrop={actions.handleFileDrop}
                                onClick={() => fileInputRef.current.click()}
                            >
                                <span className="upload-icon">☁️</span>
                                <p className="upload-text">Click to upload or drag &amp; drop</p>
                                <p className="upload-hint">PDF or DOCX (Max 5MB)</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={actions.handleFileSelect}
                                    accept=".pdf,.docx"
                                />
                                {state.resumeFile && (
                                    <div className="file-name-preview">
                                        ✅ {state.resumeFile.name}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="divider"><span>or</span></div>

                        {/* Quick Self-Description */}
                        <div className="self-description">
                            <label>Quick Self-Description</label>
                            <textarea
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                                value={state.selfDescription}
                                onChange={actions.handleSelfDescriptionChange}
                            />
                        </div>

                        <div className="info-box">
                            <span className="info-icon">ℹ️</span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Error Message */}
            {state.localError && (
                <div className="home-error-alert">
                    <span>⚠</span> {state.localError}
                </div>
            )}

            <footer className="interview-action-footer">
                <div className="estimation">
                    AI Powered Strategy Generation • Approx. 30s
                </div>
                <button
                    className="generate-btn"
                    onClick={actions.handleGenerateStrategy}
                    disabled={state.loading}
                >
                    {state.loading ? (
                        <><span className="btn-spinner-home" /> Generating...</>
                    ) : (
                        <><span className="btn-icon">✨</span> Generate My Interview Strategy</>
                    )}
                </button>
            </footer>

            <div className="site-links">
                <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("WILL COME SOON"); }}>Privacy Policy</a>
                <a href="#terms" onClick={(e) => { e.preventDefault(); alert("WILL COME SOON"); }}>Terms of Service</a>
                <a href="#help" onClick={(e) => { e.preventDefault(); alert("WILL COME SOON"); }}>Help Center</a>
            </div>
        </div>
    );
};

export default Home;
