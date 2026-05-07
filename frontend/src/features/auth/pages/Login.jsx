import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../services/auth.context.js";
import "../auth.form.scss";

const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

const Login = () => {
    const navigate = useNavigate();
    const { login, isAuthenticated } = useAuth();

    // Navigate as soon as auth state confirms login
    useEffect(() => {
        if (isAuthenticated) navigate("/home");
    }, [isAuthenticated, navigate]);

    const [form, setForm] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        // Clear field error on change
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
        if (serverError) setServerError("");
    };

    const validate = () => {
        const newErrors = {};
        if (!form.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!validateEmail(form.email)) {
            newErrors.email = "Please enter a valid email address";
        }
        if (!form.password) {
            newErrors.password = "Password is required";
        } else if (form.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setLoading(true);
        const result = await login(form.email, form.password);
        setLoading(false);
        if (!result.success) {
            setServerError(result.message || "Network Error: Please make sure the server is running.");
        }
        // Navigation handled by useEffect above
    };

    return (
        <main className="auth-page">
            <div className="auth-glow auth-glow--left" />
            <div className="auth-glow auth-glow--right" />

            <div className="auth-card">
                <div className="auth-card__logo">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">InterviewAI</span>
                </div>

                <div className="auth-card__header">
                    <h1>Welcome back</h1>
                    <p>Sign in to continue your interview prep</p>
                </div>

                {serverError && (
                    <div className="auth-alert auth-alert--error">
                        <span>⚠</span> {serverError}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className={`auth-field ${errors.email ? "auth-field--error" : ""}`}>
                        <label htmlFor="login-email">Email address</label>
                        <div className="auth-field__input-wrap">
                            <span className="auth-field__icon">✉</span>
                            <input
                                id="login-email"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                autoComplete="email"
                            />
                        </div>
                        {errors.email && <p className="auth-field__error">{errors.email}</p>}
                    </div>

                    <div className={`auth-field ${errors.password ? "auth-field--error" : ""}`}>
                        <label htmlFor="login-password">Password</label>
                        <div className="auth-field__input-wrap">
                            <span className="auth-field__icon">🔒</span>
                            <input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter your password"
                                value={form.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                            />
                            <button 
                                type="button" 
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "👁️" : "🙈"}
                            </button>
                        </div>
                        {errors.password && <p className="auth-field__error">{errors.password}</p>}
                    </div>

                    <button
                        type="submit"
                        className="auth-btn auth-btn--primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <><span className="btn-spinner" /> Signing in...</>
                        ) : (
                            <><span>→</span> Sign In</>
                        )}
                    </button>
                </form>

                <p className="auth-card__footer">
                    Don't have an account?{" "}
                    <Link to="/register" className="auth-link">Create one free</Link>
                </p>
            </div>
        </main>
    );
};

export default Login;