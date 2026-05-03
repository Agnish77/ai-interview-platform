import axios from "axios";

const _API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_BASE = `${_API}/api/interview`;
const SESSION_BASE = `${_API}/api/sessions`;
const AUTH_BASE = `${_API}/api/auth`;

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// ── Axios interceptor: auto-refresh on 401 ─────────────────────────────────────
let isRefreshing = false;
let pendingQueue = [];

function processQueue(error, token = null) {
    pendingQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
    pendingQueue = [];
}

axios.interceptors.response.use(
    res => res,
    async err => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push({ resolve, reject });
                }).then(token => {
                    original.headers["Authorization"] = `Bearer ${token}`;
                    return axios(original);
                });
            }
            original._retry = true;
            isRefreshing = true;
            try {
                const { data } = await axios.post(`${AUTH_BASE}/refresh`, {}, { withCredentials: true });
                const newToken = data.token;
                localStorage.setItem("token", newToken);
                axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
                processQueue(null, newToken);
                original.headers["Authorization"] = `Bearer ${newToken}`;
                return axios(original);
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                localStorage.removeItem("token");
                window.location.href = "/";
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(err);
    }
);

// ── Strategy ───────────────────────────────────────────────────────────────────

export const generateStrategy = async (jobDescription, selfDescription, resumeFileOrText) => {
    let payload;
    let headers = getAuthHeaders();

    if (resumeFileOrText instanceof File) {
        payload = new FormData();
        payload.append("jobDescription", jobDescription);
        payload.append("selfDescription", selfDescription || "");
        payload.append("resumeFile", resumeFileOrText);
        headers["Content-Type"] = "multipart/form-data";
    } else {
        payload = { jobDescription, selfDescription, resumeText: resumeFileOrText || "" };
    }

    const response = await axios.post(
        `${API_BASE}/generate-strategy`,
        payload,
        { withCredentials: true, headers }
    );
    return response.data;
};

export const generateResume = async (jobDescription, selfDescription, strategyId) => {
    const response = await axios.post(
        `${API_BASE}/generate-resume`,
        { jobDescription, selfDescription, strategyId },
        {
            withCredentials: true,
            headers: getAuthHeaders(),
            responseType: "blob"
        }
    );
    return response.data;
};

export const getStrategyHistory = async () => {
    const response = await axios.get(
        `${API_BASE}/history`,
        { withCredentials: true, headers: getAuthHeaders() }
    );
    return response.data;
};

export const getStrategyById = async (id) => {
    const response = await axios.get(
        `${API_BASE}/${id}`,
        { withCredentials: true, headers: getAuthHeaders() }
    );
    return response.data;
};

// ── Sessions ───────────────────────────────────────────────────────────────────

export const createSession = async (strategyId) => {
    const response = await axios.post(
        SESSION_BASE,
        { strategyId },
        { withCredentials: true, headers: getAuthHeaders() }
    );
    return response.data;
};

export const listSessions = async () => {
    const response = await axios.get(
        SESSION_BASE,
        { withCredentials: true, headers: getAuthHeaders() }
    );
    return response.data;
};

export const getSession = async (id) => {
    const response = await axios.get(
        `${SESSION_BASE}/${id}`,
        { withCredentials: true, headers: getAuthHeaders() }
    );
    return response.data;
};

export const submitAnswer = async (sessionId, questionId, answer) => {
    const response = await axios.post(
        `${SESSION_BASE}/${sessionId}/answer`,
        { questionId, answer },
        { withCredentials: true, headers: getAuthHeaders() }
    );
    return response.data;
};

// Helper: build SSE URL with auth token embedded (EventSource can't set headers)
export const getResumeStreamUrl = (jobDescription, selfDescription, resumeText, strategyId) => {
    const token = localStorage.getItem("token");
    const params = new URLSearchParams({
        jobDescription,
        selfDescription: selfDescription || "",
        resumeText: resumeText || "",
        ...(strategyId ? { strategyId } : {}),
        token: token || ""
    });
    return `${API_BASE}/generate-resume-stream?${params.toString()}`;
};
