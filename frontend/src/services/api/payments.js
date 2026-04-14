import http from '../http';

export const listPaymentMethods = () => http.get('/payments/methods');
export const listAdminPaymentMethods = () => http.get('/payments/methods/admin/all');
export const createPaymentMethod = (payload) => http.post('/payments/methods', payload);
export const updatePaymentMethod = (methodId, payload) => http.put(`/payments/methods/${methodId}`, payload);
export const deletePaymentMethod = (methodId) => http.delete(`/payments/methods/${methodId}`);
export const submitReceipt = (payload) => http.post('/payments/receipts', payload, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const listMyReceipts = () => http.get('/payments/receipts/me');
export const listAdminReceipts = (params) => http.get('/payments/receipts/admin/all', { params });
export const reviewReceipt = (receiptId, payload) => http.patch(`/payments/receipts/${receiptId}/review`, payload);
