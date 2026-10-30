const crypto = require('node:crypto');

function createSessionManager() {
  const sessions = new Map();

  function create(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { userId, sockets: new Set() });
    return token;
  }

  function verify(token, userId) {
    if (typeof token !== 'string') return false;
    const session = sessions.get(token);
    return Boolean(session && session.userId === userId);
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

  function invalidate(token) {
    const session = sessions.get(token);
    if (!session) return false;

    // Remove the token before closing sockets so it cannot be reused.
    sessions.delete(token);
    for (const socket of session.sockets) {
      if (socket.readyState === 1 || socket.readyState === undefined) {
        socket.close(1000, 'Logged out');
      }
    }
    session.sockets.clear();
    return true;
  }

  return { create, verify, attachSocket, detachSocket, invalidate };
}

module.exports = { createSessionManager };
