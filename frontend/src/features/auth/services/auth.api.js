import apiClient from "./api.client.js";

const API_BASE = "/api/auth";

export const loginUser = async (email, password) => {
    const response = await apiClient.post(
        `${API_BASE}/login`,
        { email, password }
    );
    return response.data;
};

export const registerUser = async (username, email, password) => {
    const response = await apiClient.post(
        `${API_BASE}/register`,
        { username, email, password }
    );
    return response.data;
};

export const logoutUser = async () => {
    const response = await apiClient.post(
        `${API_BASE}/logout`,
        {}
    );
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await apiClient.get(
        `${API_BASE}/me`
    );
    return response.data;
};
