import api from './axiosConfig';

export function createPaymentIntent(jobId) {
  return api.post('/payments/create-intent', { jobId }).then((r) => r.data);
}

export function fetchPaymentHistory() {
  return api.get('/payments/history').then((r) => r.data);
}
