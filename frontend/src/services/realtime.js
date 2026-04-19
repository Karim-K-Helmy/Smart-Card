import { getStoredAdminToken, getStoredUserToken } from '../context/AuthContext';

const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const buildStreamUrl = (area) => {
  const token = area === 'admin' ? getStoredAdminToken() : getStoredUserToken();
  const path = area === 'admin' ? '/admin/notifications/stream' : '/users/notifications/stream';
  const url = new URL(`${baseUrl}${path}`, window.location.origin);
  if (token) {
    url.searchParams.set('accessToken', token);
  }
  return url.toString();
};

export const createNotificationStream = (area, handlers = {}) => {
  const url = buildStreamUrl(area);
  const source = new EventSource(url, { withCredentials: false });

  source.addEventListener('notification', (event) => {
    try {
      const payload = JSON.parse(event.data || '{}');
      handlers.onNotification?.(payload);
    } catch {
      handlers.onNotification?.({ area, type: 'unknown' });
    }
  });

  source.addEventListener('connected', (event) => {
    try {
      handlers.onConnected?.(JSON.parse(event.data || '{}'));
    } catch {
      handlers.onConnected?.({});
    }
  });

  source.onerror = (error) => {
    handlers.onError?.(error);
  };

  return source;
};
