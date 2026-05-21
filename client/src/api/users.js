import api from './axiosConfig';

export function fetchProfile() {
  return api.get('/users/profile').then((r) => r.data);
}

export function updateProfile(body) {
  return api.put('/users/profile', body).then((r) => r.data);
}

export function fetchNearbyWorkers(params) {
  return api.get('/users/nearby', { params }).then((r) => r.data);
}
