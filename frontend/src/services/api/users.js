import http from '../http';

export const getMyProfile = () => http.get('/users/profile');
export const getMyNotifications = () => http.get('/users/notifications');
export const getMyNotificationCount = (type) => http.get(`/users/notifications/${type}/count`);
export const markMyNotificationAsRead = (type) => http.patch(`/users/notifications/${type}/read`);
export const updateProfile = (payload) => http.put('/users/profile', payload, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const changePassword = (payload) => http.patch('/users/change-password', payload);
export const getMyProducts = () => http.get('/users/products');
export const createProduct = (payload) => http.post('/users/products', payload, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const updateProduct = (productId, payload) => http.put(`/users/products/${productId}`, payload, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const deleteProduct = (productId) => http.delete(`/users/products/${productId}`);
export const getPublicProfile = (slug) => http.get(`/users/public/${slug}`);
