import axios from 'axios';

const TOKEN_KEY = 'dw_token';

export function getApiBase() {
  const env = import.meta.env.REACT_APP_API_URL || import.meta.env.VITE_API_URL;
  if (env) return String(env).replace(/\/$/, '');
  if (import.meta.env.DEV) return 'http://localhost:5000';
  return '';
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) {
    config.headers.Authorization = `Bearer ${t}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.message ||
      err.message ||
      'Something went wrong';
    err.userMessage = msg;
    return Promise.reject(err);
  }
);

export default api;
