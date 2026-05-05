import React from 'react';
import { Link } from 'react-router';
import CountUp from 'react-countup';
import { FiFileText, FiZap, FiThumbsUp } from 'react-icons/fi';
import './Landing.module.scss';

const features = [
  {
    icon: <FiFileText size={32} />,
    title: 'AI Resume Analysis',
    description: 'Upload your resume and get AI-driven insights tailored to the job.',
  },
  {
    icon: <FiZap size={32} />,
    title: 'Live Mock Interviews',
    description: 'Practice with real-time AI interview questions and instant feedback.',
  },
  {
    icon: <FiThumbsUp size={32} />,
    title: 'Personalized Feedback',
    description: 'Get detailed, actionable feedback to sharpen your interview skills.',
  },
];

const stats = [
  { end: 1200, label: 'Interviews taken' },
  { end: 3400, label: 'Questions generated' },
  { end: 5000, label: 'Users helped' },
];

const Landing = () => (
  <main className="landing">
    {/* HERO */}
    <section className="hero">
      <div className="hero__bg" />
      <div className="hero__content">
        <h1>Ace Your Next Interview with AI</h1>
        <p>Prepare, practice, and perfect your interview performance with our intelligent platform.</p>
        <Link to="/register" className="hero__cta">Get Started →</Link>
      </div>
    </section>

    {/* FEATURES */}
    <section className="features">
      <div className="features__grid">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-card__icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.description}</p>
          </div>
        ))}
      </div>
    </section>

    {/* STATS */}
    <section className="stats">
      <div className="stats__grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <CountUp end={s.end} duration={2.5} separator="," enableScrollSpy scrollSpyOnce />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </section>

    {/* FOOTER */}
    <footer className="footer">
      <div className="footer__links">
        <Link to="/privacy">Privacy Policy</Link>
        <a href="https://github.com/Agnish77/ai-interview-platform" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
      <p>© {new Date().getFullYear()} InterviewAI. All rights reserved.</p>
    </footer>
  </main>
);

export default Landing;
