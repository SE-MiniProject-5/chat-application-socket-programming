const crypto = require('node:crypto');

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function createSessionManager(options = {}) {
  const sessions = new Map();
  const ttlMs = options.ttlMs ?? SESSION_TTL_MS;
  const now = options.now ?? (() => Date.now());

  function create(userId) {
    const token = crypto.randomBytes(32).toString('hex'); // 256 bits
    sessions.set(token, {
      userId,
      createdAt: now(),
      expiresAt: now() + ttlMs,
      sockets: new Set()
    });
    return token;
  }

  function getSession(token) {
    if (typeof token !== 'string' || token.length === 0) return null;
    const session = sessions.get(token);
    if (!session) return null;

    if (session.expiresAt <= now()) {
      sessions.delete(token);
      for (const socket of session.sockets) {
        try {
          if (socket.readyState === 1 || socket.readyState === undefined) {
            socket.close(1008, 'Session expired');
          }
        } catch {}
      }
      session.sockets.clear();
      return null;
    }

    return session;
  }

  function verify(token, userId) {
    const session = getSession(token);
    return Boolean(session && session.userId === userId);
  }

  function getUserId(token) {
    const session = getSession(token);
    return session ? session.userId : null;
  }

  function attachSocket(token, userId, socket) {
    if (!verify(token, userId)) return false;
    const session = getSession(token);
    session.sockets.add(socket);
    socket.sessionToken = token;
    return true;
  }

  function detachSocket(socket) {
    if (!socket || !socket.sessionToken) return;
    const session = sessions.get(socket.sessionToken);
    if (session) session.sockets.delete(socket);
    socket.sessionToken = null;
  }

  function isSocketAuthenticated(socket) {
    return Boolean(socket && getSession(socket.sessionToken));
  }

  function invalidate(token) {
    const session = sessions.get(token);
    if (!session) return false;

    sessions.delete(token);
    for (const socket of session.sockets) {
      try {
        if (socket.readyState === 1 || socket.readyState === undefined) {
          socket.close(1000, 'Logged out');
        }
      } catch {}
    }
    session.sockets.clear();
    return true;
  }

  return {
    create,
    verify,
    getUserId,
    getSession,
    attachSocket,
    detachSocket,
    isSocketAuthenticated,
    invalidate,
    SESSION_TTL_MS: ttlMs
  };
}

module.exports = { createSessionManager, SESSION_TTL_MS };
