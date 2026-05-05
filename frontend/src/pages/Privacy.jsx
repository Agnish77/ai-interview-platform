import React from 'react';
import { Link } from 'react-router';

const Privacy = () => (
  <main style={{ minHeight: '100vh', background: 'var(--color-bg-main)', color: 'var(--color-text-main)', fontFamily: 'var(--font-sans)', padding: '80px 24px', maxWidth: '800px', margin: '0 auto' }}>
    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '24px' }}>Privacy Policy</h1>
    <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px', lineHeight: 1.7 }}>
      Last updated: {new Date().toLocaleDateString()}
    </p>
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px' }}>1. Information We Collect</h2>
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
        We collect information you provide directly, such as your name, email address, and resume content, solely to power the AI interview experience.
      </p>
    </section>
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px' }}>2. How We Use Your Information</h2>
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
        Your data is used to generate interview questions, analyse your responses, and provide personalised feedback. We do not sell your data to third parties.
      </p>
    </section>
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px' }}>3. Data Security</h2>
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
        We use industry-standard encryption and security practices to protect your data. Passwords are hashed and never stored in plain text.
      </p>
    </section>
    <section style={{ marginBottom: '32px' }}>
      <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '12px' }}>4. Contact</h2>
      <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
        For privacy questions, please reach out via our <a href="https://github.com" style={{ color: 'var(--color-accent-pink)' }}>GitHub page</a>.
      </p>
    </section>
    <Link to="/" style={{ color: 'var(--color-accent-pink)', textDecoration: 'none', fontWeight: 600 }}>← Back to Home</Link>
  </main>
);

export default Privacy;
