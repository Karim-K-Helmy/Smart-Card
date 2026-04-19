import http from '../http';

export const forgotAdminPassword = (payload) => http.post('/admin/forgot-password', payload);
export const verifyAdminForgotPasswordOtp = (payload) => http.post('/admin/forgot-password/verify-otp', payload);
export const resetAdminPassword = (payload) => http.post('/admin/reset-password', payload);

export const getDashboard = () => http.get('/admin/dashboard');
export const getResourceMonitoring = () => http.get('/admin/resource-monitoring');
export const getAdminNotificationSummary = () => http.get('/admin/notifications/summary');
export const getAdminNotificationCount = (type) => http.get(`/admin/notifications/${type}/count`);
export const markAdminNotificationAsRead = (type) => http.patch(`/admin/notifications/${type}/read`);
export const getAdminMe = () => http.get('/admin/me');
export const updateAdminMe = (payload) => http.put('/admin/me', payload, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

export const listAdmins = (params) => http.get('/admin/admins', { params });
export const createAdminUser = (payload) => http.post('/admin/admins', payload);
export const updateAdminUser = (adminId, payload) => http.put(`/admin/admins/${adminId}`, payload);
export const deleteAdminUser = (adminId) => http.delete(`/admin/admins/${adminId}`);

export const listUsers = (params) => http.get('/admin/users', { params });
export const updateUserByAdmin = (userId, payload) => http.put(`/admin/users/${userId}`, payload, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const toggleUserStatus = (userId, payload) => http.patch(`/admin/users/${userId}/status`, payload);
export const deleteUserByAdmin = (userId) => http.delete(`/admin/users/${userId}`);

export const listOrders = (params) => http.get('/admin/orders', { params });
export const listCards = (params) => http.get('/admin/cards', { params });
export const listActions = (params) => http.get('/admin/actions', { params });
export const toggleCardStatus = (cardId, payload) => http.patch(`/admin/cards/${cardId}/status`, payload);

export const listDataRequests = () => http.get('/admin/data-requests');
export const updateDataRequestStatus = (requestId, payload) => http.patch(`/admin/data-requests/${requestId}/status`, payload);
