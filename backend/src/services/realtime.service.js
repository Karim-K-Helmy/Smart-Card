const adminClients = new Map();
const userClients = new Map();

const ensureBucket = (store, key) => {
  const normalized = String(key || '');
  if (!store.has(normalized)) {
    store.set(normalized, new Set());
  }
  return store.get(normalized);
};

const writeSseEvent = (res, event, data) => {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};

const registerClient = (store, key, res) => {
  const bucket = ensureBucket(store, key);
  bucket.add(res);

  writeSseEvent(res, 'connected', { success: true, ts: new Date().toISOString() });

  const heartbeat = setInterval(() => {
    try {
      writeSseEvent(res, 'ping', { ts: new Date().toISOString() });
    } catch {
      clearInterval(heartbeat);
    }
  }, 25000);

  const cleanup = () => {
    clearInterval(heartbeat);
    bucket.delete(res);
    if (!bucket.size) {
      store.delete(String(key || ''));
    }
  };

  res.on('close', cleanup);
  res.on('finish', cleanup);

  return cleanup;
};

const broadcastToStore = (store, key, event, data) => {
  const bucket = store.get(String(key || ''));
  if (!bucket?.size) return 0;

  let delivered = 0;
  for (const res of bucket) {
    try {
      writeSseEvent(res, event, data);
      delivered += 1;
    } catch {
      bucket.delete(res);
    }
  }

  if (!bucket.size) {
    store.delete(String(key || ''));
  }

  return delivered;
};

const initSse = (res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }
  res.write(': connected\n\n');
};

const subscribeAdmin = (adminId, res) => {
  initSse(res);
  return registerClient(adminClients, adminId, res);
};

const subscribeUser = (userId, res) => {
  initSse(res);
  return registerClient(userClients, userId, res);
};

const emitAdminNotification = (type, payload = {}) => broadcastToStore(adminClients, 'global', 'notification', {
  area: 'admin',
  type,
  ts: new Date().toISOString(),
  ...payload,
});

const emitUserNotification = (userId, type, payload = {}) => broadcastToStore(userClients, userId, 'notification', {
  area: 'user',
  type,
  ts: new Date().toISOString(),
  ...payload,
});

module.exports = {
  subscribeAdmin,
  subscribeUser,
  emitAdminNotification,
  emitUserNotification,
};
