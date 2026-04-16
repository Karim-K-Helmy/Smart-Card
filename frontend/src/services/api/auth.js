import http from '../http';

export const registerUser = (payload) => http.post('/users/register', payload);
export const verifyUserRegistrationOtp = (payload) => http.post('/users/register/verify-otp', payload);
export const resendUserRegistrationOtp = (payload) => http.post('/users/register/resend-otp', payload);

export const forgotPassword = (payload) => http.post('/users/forgot-password', payload);
export const verifyForgotPasswordOtp = (payload) => http.post('/users/forgot-password/verify-otp', payload);
export const resetPassword = (payload) => http.post('/users/reset-password', payload);
export const checkUserPhone = (payload) => http.post('/users/check-phone', payload);
export const createUserDataRequest = (payload) => http.post('/users/data-requests', payload);

export const loginUser = (payload) => http.post('/users/login', payload);

export const loginAdmin = (payload) => http.post('/admin/login', payload);
export const forgotAdminPassword = (payload) => http.post('/admin/forgot-password', payload);
export const verifyAdminForgotPasswordOtp = (payload) => http.post('/admin/forgot-password/verify-otp', payload);
export const resetAdminPassword = (payload) => http.post('/admin/reset-password', payload);
