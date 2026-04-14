import http from '../http';

export const getCategories = () => http.get('/categories');
export const listCategories = getCategories;
export const createCategory = (payload) => http.post('/categories', payload);
export const updateCategory = (categoryId, payload) => http.put(`/categories/${categoryId}`, payload);
export const deleteCategory = (categoryId) => http.delete(`/categories/${categoryId}`);