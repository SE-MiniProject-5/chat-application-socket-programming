const crypto = require('node:crypto');

// SEC-REQ-06: a session token expires 24 hours after it is issued.
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Session manager implementing:
 * - SR-02 / SEC-REQ-02: only a valid, unexpired token authenticates a socket.
 * - SEC-REQ-06: 256-bit random tokens, 24 h expiry, invalidated immediately on logout.
 *
 * @param {object} [options]
 * @param {number} [options.ttlMs] token lifetime (default 24 h)
 * @param {() => number} [options.now] clock, injectable for tests
 */
function createSessionManager({ ttlMs = DEFAULT_TTL_MS, now = Date.now } = {}) {
  const sessions = new Map();

  function create(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { userId, sockets: new Set(), expiresAt: now() + ttlMs });
    return token;
  }

  /** Returns the live session for a token, or null. Expired sessions are removed and their sockets closed. */
  function getSession(token) {
    if (typeof token !== 'string' || token.length === 0) return null;
    const session = sessions.get(token);
    if (!session) return null;
    if (now() >= session.expiresAt) {
      expire(token);
      return null;
    }
    return session;
  }

  /** Returns the userId bound to a valid, unexpired token, otherwise null. */
  function resolve(token) {
    const session = getSession(token);
    return session ? session.userId : null;
  }

  function verify(token, userId) {
    const session = getSession(token);
    return Boolean(session && session.userId === userId);
  }

  // Resolve identity from the opaque server-issued token, never from client data.
  function getUserId(token) {
    if (typeof token !== 'string') return null;
    return resolve(token);
  }

  function attachSocket(token, userId, socket) {
    if (!verify(token, userId)) return false;
    const session = sessions.get(token);
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

  function closeSockets(session, code, reason) {
    for (const socket of session.sockets) {
      if (socket.readyState === 1 || socket.readyState === undefined) {
        socket.close(code, reason);
      }
    }
    session.sockets.clear();
  }

  function invalidate(token) {
    const session = sessions.get(token);
    if (!session) return false;

    // Remove the token before closing sockets so it cannot be reused.
    sessions.delete(token);
    closeSockets(session, 1000, 'Logged out');
    return true;
  }

  // Expiry: drop the token and close its sockets with 1008 (policy violation).
  function expire(token) {
    const session = sessions.get(token);
    if (!session) return false;
    sessions.delete(token);
    closeSockets(session, 1008, 'Session expired');
    return true;
  }

  /** Removes every expired session (and closes their sockets). Returns how many were removed. */
  function pruneExpired() {
    let removed = 0;
    for (const [token, session] of [...sessions.entries()]) {
      if (now() >= session.expiresAt && expire(token)) removed++;
    }
    return removed;
  }

  return { create, verify, resolve, getUserId, attachSocket, detachSocket, invalidate, pruneExpired };
}

module.exports = { createSessionManager, DEFAULT_TTL_MS };
