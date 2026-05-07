import apiClient from "../../auth/services/api.client.js";

const API_BASE = "/api/interview";
const SESSION_BASE = "/api/sessions";

// ── Strategy ───────────────────────────────────────────────────────────────────

export const generateStrategy = async (jobDescription, selfDescription, resumeFile) => {
    const formData = new FormData();
    formData.append("jobDescription", jobDescription);
    if (selfDescription) formData.append("selfDescription", selfDescription);
    if (resumeFile) formData.append("resumeFile", resumeFile);

    const response = await apiClient.post(
        `${API_BASE}/generate-strategy`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
};

export const downloadResume = async (strategyId, jobDescription, selfDescription, resumeText) => {
    const response = await apiClient.post(
        `${API_BASE}/generate-resume`,
        { strategyId, jobDescription, selfDescription, resumeText },
        { responseType: "blob" }
    );
    return response.data;
};

export const listStrategies = async () => {
    const response = await apiClient.get(`${API_BASE}/history`);
    return response.data;
};

export const getStrategy = async (id) => {
    const response = await apiClient.get(`${API_BASE}/${id}`);
    return response.data;
};

// ── Sessions ───────────────────────────────────────────────────────────────────

export const createSession = async (strategyId) => {
    const response = await apiClient.post(SESSION_BASE, { strategyId });
    return response.data;
};

export const listSessions = async () => {
    const response = await apiClient.get(SESSION_BASE);
    return response.data;
};

export const getSession = async (id) => {
    const response = await apiClient.get(`${SESSION_BASE}/${id}`);
    return response.data;
};

export const submitAnswer = async (sessionId, questionId, answer) => {
    const response = await apiClient.post(
        `${SESSION_BASE}/${sessionId}/answer`,
        { questionId, answer }
    );
    return response.data;
};

// Helper: build SSE URL with auth token embedded (EventSource can't set headers)
export const getResumeStreamUrl = (jobDescription, selfDescription, resumeText, strategyId) => {
    const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const token = localStorage.getItem("token");
    const params = new URLSearchParams({
        jobDescription,
        selfDescription: selfDescription || "",
        resumeText: resumeText || "",
        ...(strategyId ? { strategyId } : {}),
        token: token || ""
    });
    return `${BASE}${API_BASE}/generate-resume-stream?${params.toString()}`;
};
