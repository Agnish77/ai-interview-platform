import React from 'react';
import { Link } from 'react-router';
import Navbar from '../components/Navbar';
import './Landing.scss';


const features = [
  {
    title: 'AI Resume Analysis',
    description: 'Upload your resume and get AI-driven insights tailored to the job.',
    emoji: '📄',
  },
  {
    title: 'Live Mock Interviews',
    description: 'Practice with real-time AI interview questions and instant feedback.',
    emoji: '⚡',
  },
  {
    title: 'Personalized Feedback',
    description: 'Get detailed, actionable feedback to sharpen your interview skills.',
    emoji: '👍',
  },
];

const stats = [
  { value: '1,200+', label: 'Interviews taken' },
  { value: '3,400+', label: 'Questions generated' },
  { value: '5,000+', label: 'Users helped' },
];

const Landing = () => (
  <main className="landing">
    <Navbar />
    {/* HERO */}

    <section className="hero">
      <div className="hero__bg" />
      <div className="hero__content">
        <span className="hero__badge">✨ AI-Powered Interview Prep</span>
        <h1>Ace Your Next Interview <span className="hero__gradient">with AI</span></h1>
        <p>Prepare, practice, and perfect your interview performance with our intelligent platform.</p>
        <div className="hero__ctas">
          <Link to="/register" className="hero__cta hero__cta--primary">Get Started Free →</Link>
          <Link to="/login" className="hero__cta hero__cta--secondary">Sign In</Link>
        </div>
      </div>
    </section>

    {/* FEATURES */}
    <section className="features">
      <div className="features__header">
        <h2>Everything you need to land your dream job</h2>
        <p>Three powerful tools. One platform.</p>
      </div>
      <div className="features__grid">
        {features.map((f, i) => (
          <div key={i} className="feature-card">
            <div className="feature-card__icon">{f.emoji}</div>
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
            <span className="stat-card__value">{s.value}</span>
            <span className="stat-card__label">{s.label}</span>
          </div>
        ))}
      </div>
    </section>

    {/* FOOTER */}
    <footer className="footer">
      <div className="footer__brand">
        <span className="footer__logo">⚡ InterviewAI</span>
        <p>Your AI-powered interview coach.</p>
      </div>
      <div className="footer__links">
        <Link to="/privacy">Privacy Policy</Link>
        <a href="https://github.com/Agnish77/ai-interview-platform" target="_blank" rel="noopener noreferrer">GitHub</a>
        <Link to="/register">Sign Up</Link>
      </div>
      <p className="footer__copy">© {new Date().getFullYear()} InterviewAI. All rights reserved.</p>
    </footer>
  </main>
);

export default Landing;
