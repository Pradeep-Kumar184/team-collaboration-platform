import axios from "axios";

// Backend API base URL
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error.response?.data || { error: "Network error" });
  }
);

// Auth APIs
export const authAPI = {
  register: (userData) => {
    const firebaseUid = localStorage.getItem("firebaseUid");
    return api.post("/auth/register", userData, {
      headers: { "x-firebase-uid": firebaseUid || "dev-user-id" },
    });
  },
  getMe: () => api.get("/auth/login"),
};

// Project APIs
export const projectAPI = {
  getAll: () => api.get("/projects"),
  getById: (id) => api.get(`/projects/${id}`),
  create: (projectData) => api.post("/projects", projectData),
  update: (id, projectData) => api.put(`/projects/${id}`, projectData),
  delete: (id) => api.delete(`/projects/${id}`),
};

// Task APIs
export const taskAPI = {
  getAll: (queryString = '') => api.get(`/tasks${queryString ? `?${queryString}` : ''}`),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (taskData) => api.post("/tasks", taskData),
  update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  delete: (id) => api.delete(`/tasks/${id}`),
  getStats: () => api.get("/tasks/stats"),
};

// Message APIs
export const messageAPI = {
  getAll: (limit = 50) => api.get("/messages", { params: { limit } }),
  send: (messageData) => api.post("/messages", messageData),
};

// User APIs
export const userAPI = {
  getTeam: () => api.get("/users/team"),
  updateRole: (userId, role) => api.put(`/users/${userId}/role`, { role }),
  debugTeam: () => api.get("/users/debug-team"),
};

// Activity APIs
export const activityAPI = {
  getTeamActivities: (limit = 20) => api.get("/activities/team", { params: { limit } }),
  getUserActivities: (limit = 20) => api.get("/activities/user", { params: { limit } }),
};

// Invitation APIs
export const invitationAPI = {
  create: (invitationData) => api.post("/invitations", invitationData),
  getTeamInvitations: () => api.get("/invitations"),
  validate: (code) => api.get(`/invitations/validate/${code}`),
  use: (code, userEmail) => api.post("/invitations/use", { code, userEmail }),
  delete: (id) => api.delete(`/invitations/${id}`),
};

export default api;
