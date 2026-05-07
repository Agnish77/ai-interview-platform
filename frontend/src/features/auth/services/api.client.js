import axios from "axios";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const apiClient = axios.create({
    baseURL: BASE,
    withCredentials: true,
});

// Helper to get headers with current token
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: auto-refresh on 401
let isRefreshing = false;
let pendingQueue = [];

function processQueue(error, token = null) {
    pendingQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
    pendingQueue = [];
}

apiClient.interceptors.response.use(
    res => res,
    async err => {
        const original = err.config;
        
        // If 401 and not already retrying
        if (err.response?.status === 401 && !original._retry) {
            
            // If it's the refresh call itself failing, we must logout
            if (original.url.includes("/api/auth/refresh")) {
                localStorage.removeItem("token");
                window.dispatchEvent(new CustomEvent("auth:expired"));
                return Promise.reject(err);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    pendingQueue.push({ resolve, reject });
                }).then(token => {
                    original.headers["Authorization"] = `Bearer ${token}`;
                    return apiClient(original);
                });
            }

            original._retry = true;
            isRefreshing = true;

            try {
                const { data } = await axios.post(`${BASE}/api/auth/refresh`, {}, { withCredentials: true });
                const newToken = data.token;
                localStorage.setItem("token", newToken);
                
                processQueue(null, newToken);
                original.headers["Authorization"] = `Bearer ${newToken}`;
                return apiClient(original);
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                localStorage.removeItem("token");
                window.dispatchEvent(new CustomEvent("auth:expired"));
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(err);
    }
);

export default apiClient;
