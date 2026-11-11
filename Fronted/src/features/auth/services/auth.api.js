import axios from "axios";

const getBaseUrl = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    if (import.meta.env.DEV) {
        return "http://localhost:3000";
    }
    return "";
};

const api = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export async function register({ username, email, password }) {
    try {
        const response = await api.post('/api/auth/register', {
            username,
            email,
            password
        });
        if (response.data?.token) {
            localStorage.setItem("token", response.data.token);
        }
        return response.data;
    } catch (err) {
        console.error("Register Error:", err);
        throw err;
    }
}

export async function login({ email, password }) {
    try {
        const response = await api.post('/api/auth/login', {
            email,
            password
        });
        if (response.data?.token) {
            localStorage.setItem("token", response.data.token);
        }
        return response.data;
    } catch (err) {
        console.error("Login Error:", err);
        throw err;
    }
}

export async function logout() {
    try {
        const response = await api.post('/api/auth/logout');
        localStorage.removeItem("token");
        return response.data;
    } catch (err) {
        localStorage.removeItem("token");
        console.error("Logout Error:", err);
        throw err;
    }
}

export async function getMe() {
    try {
        const response = await api.get('/api/auth/get-me');
        return response.data;
    } catch (err) {
        if (err?.response?.status === 401) {
            localStorage.removeItem("token");
        }
        console.error("GetMe Error:", err);
        throw err;
    }
}
