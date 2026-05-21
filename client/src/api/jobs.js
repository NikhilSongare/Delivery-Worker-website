import api from './axiosConfig';

export function estimateJob(body) {
  return api.post('/jobs/estimate', body).then((r) => r.data);
}

export function listJobs(params) {
  return api.get('/jobs', { params }).then((r) => r.data);
}

export function createJob(body) {
  return api.post('/jobs', body).then((r) => r.data);
}

export function getJob(id) {
  return api.get(`/jobs/${id}`).then((r) => r.data);
}

export function acceptJob(id) {
  return api.patch(`/jobs/${id}/accept`).then((r) => r.data);
}

export function updateJobStatus(id, status) {
  return api.patch(`/jobs/${id}/status`, { status }).then((r) => r.data);
}

export function cancelJob(id) {
  return api.delete(`/jobs/${id}`).then((r) => r.data);
}
