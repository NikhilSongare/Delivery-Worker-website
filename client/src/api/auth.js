import api, { setToken } from './axiosConfig';

export async function signup(payload) {
  const { data } = await api.post('/auth/signup', payload);
  if (data.success && data.data?.token) {
    setToken(data.data.token);
  }
  return data;
}

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  if (data.success && data.data?.token) {
    setToken(data.data.token);
  }
  return data;
}

export async function fetchMe() {
  const { data } = await api.get('/auth/me');
  return data;
}

export function logoutLocal() {
  setToken(null);
}
