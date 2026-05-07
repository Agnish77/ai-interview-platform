import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../services/auth.context.js";
import "../auth.form.scss";

const validateEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

const Register = () => {
    const navigate = useNavigate();
    const { register, isAuthenticated } = useAuth();

    // Navigate as soon as auth state confirms registration
    useEffect(() => {
        if (isAuthenticated) navigate("/home");
    }, [isAuthenticated, navigate]);

    const [form, setForm] = useState({ username: "", email: "", password: "", confirmPassword: "" });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLinkClick = (e) => {
        e.preventDefault();
        alert("WILL COME SOON");
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
        if (serverError) setServerError("");
    };

    const validate = () => {
        const newErrors = {};
        if (!form.username.trim()) {
            newErrors.username = "Username is required";
        } else if (form.username.trim().length < 3) {
            newErrors.username = "Username must be at least 3 characters";
        } else if (/\s/.test(form.username)) {
            newErrors.username = "Username cannot contain spaces";
        }
        if (!form.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!validateEmail(form.email)) {
            newErrors.email = "Please enter a valid email address";
        }
        if (!form.password) {
            newErrors.password = "Password is required";
        } else if (form.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(form.password)) {
            newErrors.password = "Password must include uppercase, lowercase, number, and special character";
        }
        if (!form.confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (form.password !== form.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
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
        const result = await register(form.username, form.email, form.password);
        setLoading(false);
        if (!result.success) {
            setServerError(result.message || "Network Error: Please make sure the server is running.");
        }
        // Navigation handled by useEffect above
    };

    const getPasswordStrength = () => {
        const p = form.password;
        if (!p) return null;
        
        const hasUpper = /[A-Z]/.test(p);
        const hasLower = /[a-z]/.test(p);
        const hasNum = /[0-9]/.test(p);
        const hasSpecial = /[^A-Za-z0-9]/.test(p);
        const criteriaMet = [hasUpper, hasLower, hasNum, hasSpecial].filter(Boolean).length;

        if (p.length < 8) return { label: "Too short", cls: "weak" };
        if (criteriaMet < 2) return { label: "Weak", cls: "weak" };
        if (criteriaMet === 2 || criteriaMet === 3) return { label: "Fair", cls: "fair" };
        if (criteriaMet === 4 && p.length >= 8) return { label: "Strong", cls: "strong" };
        return { label: "Good", cls: "good" };
    };

    const strength = getPasswordStrength();

    return (
        <main className="auth-page">
            <div className="auth-glow auth-glow--left" />
            <div className="auth-glow auth-glow--right" />

            <div className="auth-card auth-card--wide">
                <div className="auth-card__logo">
                    <span className="logo-icon">⚡</span>
                    <span className="logo-text">InterviewAI</span>
                </div>

                <div className="auth-card__header">
                    <h1>Create your account</h1>
                    <p>Start your AI-powered interview preparation journey</p>
                </div>

                {serverError && (
                    <div className="auth-alert auth-alert--error">
                        <span>⚠</span> {serverError}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit} noValidate>
                    <div className={`auth-field ${errors.username ? "auth-field--error" : ""}`}>
                        <label htmlFor="reg-username">Username</label>
                        <div className="auth-field__input-wrap">
                            <span className="auth-field__icon">👤</span>
                            <input
                                id="reg-username"
                                type="text"
                                name="username"
                                placeholder="Choose a username"
                                value={form.username}
                                onChange={handleChange}
                                autoComplete="username"
                            />
                        </div>
                        {errors.username && <p className="auth-field__error">{errors.username}</p>}
                    </div>

                    <div className={`auth-field ${errors.email ? "auth-field--error" : ""}`}>
                        <label htmlFor="reg-email">Email address</label>
                        <div className="auth-field__input-wrap">
                            <span className="auth-field__icon">✉</span>
                            <input
                                id="reg-email"
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
                        <label htmlFor="reg-password">Password</label>
                        <div className="auth-field__input-wrap">
                            <span className="auth-field__icon">🔒</span>
                            <input
                                id="reg-password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Min. 8 characters"
                                value={form.password}
                                onChange={handleChange}
                                autoComplete="new-password"
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
                        {strength && (
                            <div className={`password-strength password-strength--${strength.cls}`}>
                                <div className="password-strength__bar" />
                                <span>{strength.label}</span>
                            </div>
                        )}
                        {errors.password && <p className="auth-field__error">{errors.password}</p>}
                    </div>

                    <div className={`auth-field ${errors.confirmPassword ? "auth-field--error" : ""}`}>
                        <label htmlFor="reg-confirm">Confirm Password</label>
                        <div className="auth-field__input-wrap">
                            <span className="auth-field__icon">🔒</span>
                            <input
                                id="reg-confirm"
                                type={showPassword ? "text" : "password"}
                                name="confirmPassword"
                                placeholder="Re-enter your password"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                autoComplete="new-password"
                            />
                        </div>
                        {errors.confirmPassword && <p className="auth-field__error">{errors.confirmPassword}</p>}
                    </div>

                    <button
                        type="submit"
                        className="auth-btn auth-btn--primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <><span className="btn-spinner" /> Creating account...</>
                        ) : (
                            <><span>✨</span> Create Account</>
                        )}
                    </button>
                </form>

                <p className="auth-card__footer">
                    Already have an account?{" "}
                    <Link to="/" className="auth-link">Sign in</Link>
                </p>
            </div>
        </main>
    );
};

export default Register;