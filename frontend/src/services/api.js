import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  signup: (username, email, password, displayName) =>
    api.post('/auth/signup', { username, email, password, displayName }),
  getReminderSettings: () => api.get('/auth/settings/reminders'),
  updateReminderSettings: (settings) =>
    api.put('/auth/settings/reminders', settings),
  updateDisplayName: (displayName) =>
    api.put('/auth/profile/display-name', { displayName }),
  deleteAccount: () => api.delete('/auth/account')
};

// Family API
export const familyAPI = {
  create: (name) => api.post('/family/create', { name }),
  join: (inviteCode) => api.post(`/family/join/${inviteCode}`),
  getMy: () => api.get('/family/my'),
  leave: () => api.post('/family/leave'),
  updateName: (name) => api.put('/family/name', { name })
};

// Habit API
export const habitAPI = {
  getAll: () => api.get('/habits'),
  create: (name, description, color, habitType, selectedDays, weeklyTarget) =>
    api.post('/habits', { name, description, color, habitType, selectedDays, weeklyTarget }),
  update: (id, name, description, color, habitType, selectedDays, weeklyTarget) =>
    api.put(`/habits/${id}`, { name, description, color, habitType, selectedDays, weeklyTarget }),
  delete: (id) => api.delete(`/habits/${id}`),
  reorder: (id, direction) => api.put(`/habits/${id}/reorder`, null, { params: { direction } }),
  reorderBatch: (updates) => api.put('/habits/reorder-batch', updates)
};

// Habit Log API
export const habitLogAPI = {
  log: (habitId, logDate, completed, note) =>
    api.post('/logs', { habitId, logDate, completed, note }),
  getFamilyLogs: (date) => api.get(`/logs/family/${date}`),
  getFamilyLogsRange: (startDate, endDate) =>
    api.get('/logs/family/range', { params: { startDate, endDate } }),
  getMyLogs: (date) => api.get(`/logs/my/${date}`),
  getMonthlyStats: (year, month) =>
    api.get('/logs/monthly', { params: { year, month } })
};

// Push Notification API
export const pushAPI = {
  getVapidPublicKey: () => api.get('/push/vapid-public-key'),
  subscribe: (subscription) => api.post('/push/subscribe', subscription),
  unsubscribe: (endpoint) => api.post('/push/unsubscribe', { endpoint })
};

// Default export with all API functions
const apiClient = {
  ...api,
  deleteAccount: () => authAPI.deleteAccount()
};

export default apiClient;
