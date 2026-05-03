import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { loginUser, registerUser, logoutUser, getCurrentUser } from "./auth.api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem("token") || null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // On mount, try to restore session from localStorage
    useEffect(() => {
        const restoreSession = async () => {
            const savedToken = localStorage.getItem("token");
            if (savedToken) {
                try {
                    const data = await getCurrentUser();
                    setUser(data.user);
                    setToken(savedToken);
                    setIsAuthenticated(true);
                } catch {
                    // Token invalid/expired
                    localStorage.removeItem("token");
                    setToken(null);
                    setIsAuthenticated(false);
                }
            }
            setLoading(false);
        };
        restoreSession();
    }, []);

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
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    }, []);

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
