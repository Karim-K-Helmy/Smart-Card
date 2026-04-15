import http from '../http';

export const registerUser = (payload) => http.post('/users/register', payload);

export const forgotPassword = (payload) => http.post('/users/forgot-password', payload);
export const resetPassword = (payload) => http.post('/users/reset-password', payload);

export const loginUser = (payload) => http.post('/users/login', payload);

export const loginAdmin = (payload) => http.post('/admin/login', payload);
export const forgotAdminPassword = () => http.post('/admin/forgot-password', {});
export const resetAdminPassword = (payload) => http.post('/admin/reset-password', payload);
