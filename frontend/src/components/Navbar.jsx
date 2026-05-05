import React, { useState } from 'react';
import { NavLink } from 'react-router';
import { useTheme } from '../contexts/ThemeContext';
import './Navbar.scss';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/home', label: 'Dashboard' },
  { to: '/sessions', label: 'History' },
  { to: '/privacy', label: 'Privacy' },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar__brand" onClick={() => setMobileOpen(false)}>
        <span className="navbar__logo-icon">⚡</span>
        <span className="navbar__logo-text">InterviewAI</span>
      </NavLink>

      <button
        className="navbar__toggle"
        onClick={() => setMobileOpen(prev => !prev)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      <ul className={`navbar__links${mobileOpen ? ' navbar__links--open' : ''}`}>
        {navLinks.map(link => (
          <li key={link.to}>
            <NavLink
              to={link.to}
              end={link.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                'navbar__link' + (isActive ? ' navbar__link--active' : '')
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
        <li>
          <button
            className="navbar__theme-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
