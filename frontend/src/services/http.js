import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const http = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
  },
});

http.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem('linestart-auth') || 'null');
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

export default http;
