import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { loginUser, registerUser, logoutUser, getCurrentUser } from "./auth.api.js";
import apiClient from "./api.client.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("token") || null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Helper: fully clear auth state
    const clearAuth = useCallback(() => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    // Listen for session expiry event dispatched by the shared api.client interceptor
    useEffect(() => {
        const handleExpired = () => {
            clearAuth();
            // Redirect to login page
            window.location.href = "/login";
        };
        window.addEventListener("auth:expired", handleExpired);
        return () => window.removeEventListener("auth:expired", handleExpired);
    }, [clearAuth]);

    // On mount: restore session from localStorage token
    useEffect(() => {
        const restoreSession = async () => {
            const savedToken = localStorage.getItem("token");
            if (!savedToken) {
                setLoading(false);
                return;
            }
            try {
                // Try fetching current user (token is attached by apiClient interceptor)
                const data = await getCurrentUser();
                setUser(data.user);
                setToken(savedToken);
                setIsAuthenticated(true);
            } catch {
                // /me failed — attempt a silent token refresh before giving up
                try {
                    const { data } = await apiClient.post("/api/auth/refresh", {});
                    const newToken = data.token;
                    localStorage.setItem("token", newToken);
                    setToken(newToken);
                    const userData = await getCurrentUser();
                    setUser(userData.user);
                    setIsAuthenticated(true);
                } catch {
                    // Refresh also failed — clear everything
                    clearAuth();
                }
            } finally {
                setLoading(false);
            }
        };
        restoreSession();
    }, [clearAuth]);

    const login = useCallback(async (email, password) => {
        setError(null);
        try {
            const data = await loginUser(email, password);
            localStorage.setItem("token", data.token);
            setToken(data.token);
            setUser(data.user);
            setIsAuthenticated(true);
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || "Login failed. Please try again.";
            setError(msg);
            return { success: false, message: msg };
        }
    }, []);

    const register = useCallback(async (username, email, password) => {
        setError(null);
        try {
            const data = await registerUser(username, email, password);
            localStorage.setItem("token", data.token);
            setToken(data.token);
            setUser(data.user);
            setIsAuthenticated(true);
            return { success: true };
        } catch (err) {
            const msg = err.response?.data?.message || "Registration failed. Please try again.";
            setError(msg);
            return { success: false, message: msg };
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await logoutUser();
        } catch { /* ignore */ }
        clearAuth();
    }, [clearAuth]);

    const clearError = useCallback(() => setError(null), []);

    const value = { user, token, isAuthenticated, loading, error, login, register, logout, clearError };

    return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
};

export default AuthContext;
