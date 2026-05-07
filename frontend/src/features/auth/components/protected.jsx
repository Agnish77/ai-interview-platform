import React from "react";
import { Link } from "react-router";
import { useAuth } from "../services/auth.context.js";
import "../auth.form.scss";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-loading">
                <div className="spinner" />
                <p>Loading...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <main className="auth-page">
                <div className="auth-glow auth-glow--left" />
                <div className="auth-glow auth-glow--right" />
                
                <div className="auth-card" style={{ textAlign: "center" }}>
                    <div className="auth-card__logo">
                        <span className="logo-icon">🔒</span>
                        <span className="logo-text">Restricted Access</span>
                    </div>
                    
                    <div className="auth-card__header">
                        <h1>Login required</h1>
                        <p>Please log in or create an account to access the dashboard and history features.</p>
                    </div>

                    <div className="auth-form">
                        <Link to="/login" className="auth-btn auth-btn--primary" style={{ textDecoration: "none" }}>
                            Sign In
                        </Link>
                        <Link to="/register" className="auth-btn" style={{ border: "1.5px solid var(--color-border)", textDecoration: "none", color: "var(--color-text-main)" }}>
                            Create Account
                        </Link>
                    </div>

                    <p className="auth-card__footer">
                        <Link to="/" className="auth-link">← Back to Home</Link>
                    </p>
                </div>
            </main>
        );
    }

    return children;
};

export default ProtectedRoute;
