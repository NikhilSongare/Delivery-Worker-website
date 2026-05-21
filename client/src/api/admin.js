import api from './axiosConfig';

export function fetchAdminDashboard() {
  return api.get('/admin/dashboard').then((r) => r.data);
}

export function fetchAdminUsers(params) {
  return api.get('/admin/users', { params }).then((r) => r.data);
}

export function patchAdminUser(id, body) {
  return api.patch(`/admin/users/${id}`, body).then((r) => r.data);
}

export function fetchAdminJobs(params) {
  return api.get('/admin/jobs', { params }).then((r) => r.data);
}

export function cancelAdminJob(id) {
  return api.patch(`/admin/jobs/${id}/cancel`).then((r) => r.data);
}

export function fetchAdminPayments() {
  return api.get('/admin/payments').then((r) => r.data);
}
