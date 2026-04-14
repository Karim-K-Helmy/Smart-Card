import http from '../http';

export const getCardPlans = () => http.get('/cards/plans');
export const updateCardPlan = (planId, payload) => http.put(`/cards/plans/${planId}`, payload);
export const createCardOrder = (payload) => http.post('/cards/orders', payload);
export const checkoutCard = (payload) => http.post('/cards/checkout', payload, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const getMyOrders = () => http.get('/cards/orders/me');
export const getMyCard = () => http.get('/cards/my-card');
