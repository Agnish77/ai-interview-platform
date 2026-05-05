import React, { useState } from 'react';
import { NavLink } from 'react-router';
import { FiMenu, FiX, FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import './Navbar.module.scss';

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/home', label: 'Dashboard' },
  { to: '/sessions', label: 'History' },
  { to: '/privacy', label: 'Privacy' },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const closeMenu = () => setMobileOpen(false);

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar__brand" onClick={closeMenu}>
        <span className="logo-icon">⚡</span>
        <span className="logo-text">InterviewAI</span>
      </NavLink>

      <button
        className="navbar__mobile-toggle"
        onClick={() => setMobileOpen(prev => !prev)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      <ul className={`navbar__links${mobileOpen ? ' navbar__links--open' : ''}`}>
        {navLinks.map(link => (
          <li key={link.to} onClick={closeMenu}>
            <NavLink
              to={link.to}
              end={link.end}
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
            className="navbar__theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle dark/light mode"
          >
            {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
