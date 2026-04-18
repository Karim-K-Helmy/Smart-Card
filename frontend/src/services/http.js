import axios from 'axios';
import { getStoredAdminToken, getStoredUserToken } from '../context/AuthContext';

const baseURL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const http = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
  },
});

const hasAdminPathSegment = (value = '') => /(^|\/)admin(\/|$)/.test(String(value || ''));

const isAdminRequest = (config = {}) => {
  const url = String(config?.url || '');
  const base = String(config?.baseURL || '');
  const combined = `${base}${url}`;

  return hasAdminPathSegment(url) || hasAdminPathSegment(combined);
};

http.interceptors.request.use((config) => {
  const token = isAdminRequest(config) ? getStoredAdminToken() : getStoredUserToken();

  config.headers = config.headers || {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

export default http;
