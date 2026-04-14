import http from '../http';

export const sendMessage = (payload) => http.post('/messages', payload);
export const listMessages = (params) => http.get('/messages/admin/all', { params });
export const updateMessageStatus = (messageId, payload) => http.patch(`/messages/admin/${messageId}/status`, payload);
export const replyToMessage = (messageId, payload) => http.post(`/messages/admin/${messageId}/reply`, payload);
