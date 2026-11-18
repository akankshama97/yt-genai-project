import api from "../../../services/apiClient";

export async function register({ username, email, password }) {
  try {
    const response = await api.post("/api/auth/register", {
      username,
      email,
      password,
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
    const response = await api.post("/api/auth/login", {
      email,
      password,
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
    localStorage.removeItem("token");
    const response = await api.post("/api/auth/logout").catch((err) => {
      console.warn("Server logout notification skipped/failed:", err?.message);
      return { data: { message: "Logged out locally" } };
    });
    return response.data || { message: "Logged out successfully" };
  } catch (err) {
    localStorage.removeItem("token");
    console.error("Logout Error:", err);
    return { message: "Logged out locally" };
  }
}

export async function getMe() {
  try {
    const response = await api.get("/api/auth/get-me");
    return response.data;
  } catch (err) {
    if (err?.response?.status === 401) {
      localStorage.removeItem("token");
    }
    throw err;
  }
}
