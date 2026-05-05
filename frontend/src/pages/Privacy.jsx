import React from 'react';
import { Link } from 'react-router';
import Navbar from '../components/Navbar';

const Privacy = () => (
  <>
    <Navbar />
    <main style={{
      minHeight: '100vh',
      background: '#1A1F36',
      color: '#E5E8EB',
      fontFamily: "'Inter', system-ui, sans-serif",
      padding: '80px 24px',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '24px', color: '#fff' }}>Privacy Policy</h1>
        <p style={{ color: '#8F9098', marginBottom: '40px', fontSize: '0.9rem' }}>
          Last updated: {new Date().toLocaleDateString()}
        </p>

        {[
          {
            title: '1. Information We Collect',
            body: 'We collect information you provide directly, such as your name, email address, and resume content, solely to power the AI interview experience.',
          },
          {
            title: '2. How We Use Your Information',
            body: 'Your data is used to generate interview questions, analyse your responses, and provide personalised feedback. We do not sell your data to third parties.',
          },
          {
            title: '3. Data Security',
            body: 'We use industry-standard encryption and security practices to protect your data. Passwords are hashed and never stored in plain text.',
          },
          {
            title: '4. Contact',
            body: 'For privacy questions, please reach out via our GitHub page.',
          },
        ].map((section, i) => (
          <section key={i} style={{ marginBottom: '36px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
              {section.title}
            </h2>
            <p style={{ color: '#C0C1C7', lineHeight: 1.75 }}>{section.body}</p>
          </section>
        ))}

        <Link
          to="/"
          style={{
            color: '#FF006E',
            textDecoration: 'none',
            fontWeight: 600,
            display: 'inline-block',
            marginTop: '24px',
          }}
        >
          ← Back to Home
        </Link>
      </div>
    </main>
  </>
);

export default Privacy;
