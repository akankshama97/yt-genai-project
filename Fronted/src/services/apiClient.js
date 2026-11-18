import axios from "axios";

// Determine the base URL based on environment
const determineBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() && envUrl.trim() !== "/") {
    return envUrl.trim().replace(/\/$/, "");
  }

  // In production (Vercel): use relative path so Vercel's /api proxy/serverless handles it with zero CORS issues
  // In development: use relative path so Vite's /api proxy forwards to http://localhost:3000
  return "";
};

let activeBaseUrl = determineBaseUrl();

export const api = axios.create({
  baseURL: activeBaseUrl,
  withCredentials: true,
  timeout: 45000,
  headers: {
    Accept: "application/json",
  },
});

// Attach auth token to all outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (activeBaseUrl) {
    config.baseURL = activeBaseUrl;
  }
  return config;
});

// Auto-retry interceptor on transient network failure
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry once on transient network errors (with 1s backoff)
    if (!error.response && originalRequest && !originalRequest._retryCount) {
      originalRequest._retryCount = 1;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

// Proactive warm-up & connection checker
export const ensureBackendConnected = async () => {
  try {
    const checkUrl = (activeBaseUrl || "") + "/api/health";
    const res = await axios.get(checkUrl, { timeout: 8000 }).catch(() => null);
    if (res && res.data) {
      console.log("Backend connected successfully at:", activeBaseUrl || "relative (/api)");
      return true;
    }
  } catch {
    // Silent warm up
  }
  return false;
};

export default api;
