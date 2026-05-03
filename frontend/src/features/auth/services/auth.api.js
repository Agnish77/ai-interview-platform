import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/api/auth`;

// Attach token to every request if present
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const loginUser = async (email, password) => {
    const response = await axios.post(
        `${API_BASE}/login`,
        { email, password },
        { withCredentials: true }
    );
    return response.data;
};

export const registerUser = async (username, email, password) => {
    const response = await axios.post(
        `${API_BASE}/register`,
        { username, email, password },
        { withCredentials: true }
    );
    return response.data;
};

export const logoutUser = async () => {
    const response = await axios.post(
        `${API_BASE}/logout`,
        {},
        { withCredentials: true, headers: getAuthHeaders() }
    );
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await axios.get(
        `${API_BASE}/me`,
        { withCredentials: true, headers: getAuthHeaders() }
    );
    return response.data;
};
