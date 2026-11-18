import axios from "axios";

const FALLBACK_RENDER_URL = "https://yt-genai-project.onrender.com";

// Determine the base URL based on environment
const determineBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() && envUrl.trim() !== "/") {
    return envUrl.trim().replace(/\/$/, "");
  }

  // In production (Vercel): use relative path so Vercel's /api proxy handles it with zero CORS issues
  // In development: use relative path so Vite's /api proxy forwards to http://localhost:3000
  return "";
};

let activeBaseUrl = determineBaseUrl();

export const api = axios.create({
  baseURL: activeBaseUrl,
  withCredentials: true,
  timeout: 60000, // 60s to accommodate Render cold start
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

// Auto-failover and retry interceptor on network failure
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If it's a network error (no response) and we haven't retried with fallback URL yet
    if (!error.response && originalRequest && !originalRequest._retryWithFallback) {
      originalRequest._retryWithFallback = true;

      console.warn(
        "Primary endpoint connection failed. Auto-connecting to live backup backend...",
        error.message
      );

      activeBaseUrl = FALLBACK_RENDER_URL;
      originalRequest.baseURL = activeBaseUrl;

      try {
        return await axios(originalRequest);
      } catch (fallbackError) {
        console.error("Fallback connection also failed:", fallbackError);
        return Promise.reject(fallbackError);
      }
    }

    return Promise.reject(error);
  }
);

// Proactive warm-up & connection checker
export const ensureBackendConnected = async () => {
  try {
    const checkUrl = (activeBaseUrl || "") + "/api/health";
    const res = await axios.get(checkUrl, { timeout: 6000 }).catch(() => null);
    if (res && res.data) {
      console.log("Backend connected successfully at:", activeBaseUrl || "relative (/api)");
      return true;
    }
  } catch {
    // If primary failed, ping live server
  }

  try {
    console.log("Pinging live backend to warm up server...");
    const res = await axios.get(`${FALLBACK_RENDER_URL}/api/health`, { timeout: 12000 });
    if (res && res.data) {
      activeBaseUrl = FALLBACK_RENDER_URL;
      console.log("Live backend connected and active:", activeBaseUrl);
      return true;
    }
  } catch {
    // Server may be spinning up
  }
  return false;
};

export default api;
