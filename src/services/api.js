/**
 * Backend API Service
 * Centralized API calls to the Express backend
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to get auth token
const getToken = () => localStorage.getItem('auth_token');

// Generic fetch wrapper
const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  };

  // Add auth token if available
  const token = getToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

// Auth endpoints
export const authAPI = {
  register: (email, fullName, phone) =>
    apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, fullName, phone })
    }),

  login: (email) =>
    apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  logout: () =>
    apiFetch('/auth/logout', { method: 'POST' })
};

// Helper profile endpoints
export const helperAPI = {
  getProfile: () => apiFetch('/helpers/profile'),
  updateProfile: (updates) =>
    apiFetch('/helpers/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),
  getByUsername: (username) => apiFetch(`/helpers/${username}`)
};

// Mission endpoints
export const missionAPI = {
  // Create a new mission (from triage) - public
  create: (missionData) =>
    apiFetch('/missions', {
      method: 'POST',
      body: JSON.stringify(missionData)
    }),

  // Get missions assigned to current helper (auth required)
  getMyMissions: () => apiFetch('/missions'),

  // Get single mission
  get: (id) => apiFetch(`/missions/${id}`),

  // Update mission status / assign
  updateStatus: (id, status) =>
    apiFetch(`/missions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
};

export default {
  auth: authAPI,
  helper: helperAPI,
  mission: missionAPI
};
