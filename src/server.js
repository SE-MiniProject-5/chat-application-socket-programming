const { createTransport } = require('./tls');
const fs = require('node:fs');
const path = require('node:path');
const { createDatabase } = require('./db');
const { registerUser, loginUser } = require('./auth');
const { createRoom, listRooms } = require('./rooms');
const { ChatManager } = require('./chatManager');
const { createSessionManager } = require('./sessionManager');

let WebSocketServer;
try {
  WebSocketServer = require('ws').WebSocketServer;
} catch (err) {
  // Optional ws fallback
}

const PORT = process.env.PORT || 3000;
const SAFE_SERVER_ERROR = 'The server could not complete your request. Please try again.';

// FR-21: Log diagnostic details on the server; never expose them to clients.
function logServerError(context, err) {
  console.error(`[${context}]`, err);
}
const db = createDatabase(process.env.DB_PATH || (process.env.NODE_ENV === 'test' ? ':memory:' : undefined));
const chatManager = new ChatManager();
// SEC-REQ-06: tokens last 24 h by default (SESSION_TTL_MS is only for tests/ops overrides).
const sessions = createSessionManager(
  process.env.SESSION_TTL_MS ? { ttlMs: Number(process.env.SESSION_TTL_MS) } : {}
);

/**
 * Resolve a session token to the canonical user record.
 * Client-supplied usernames and user IDs are deliberately ignored.
 */
function resolveSessionUser(database, sessionManager, token) {
  const userId = sessionManager.getUserId(token);
  if (!userId) return null;
  const row = database.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
  return row ? { id: row.id, username: row.username } : null;
}

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    const MAX_BODY_BYTES = 64 * 1024;
    req.on('data', chunk => {
      body += chunk.toString();
      if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png'
};

function getRequestToken(req, body = {}) {
  const authorization = req.headers.authorization;
  if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
    return authorization.slice(7).trim();
  }
  return typeof body.token === 'string' ? body.token : null;
}

function getAuthenticatedUser(token) {
  return resolveSessionUser(db, sessions, token);
}

const requestHandler = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestProtocol = req.socket.encrypted ? 'https' : 'http';
  const url = new URL(req.url, `${requestProtocol}://${req.headers.host}`);

  // API Endpoints
  if (url.pathname === '/api/register' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      const result = registerUser(db, data.username, data.password);
      if (result.success) result.token = sessions.create(result.user.id);

      res.writeHead(result.success ? 201 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      logServerError('API request failed', err);
      res.end(JSON.stringify({ success: false, message: SAFE_SERVER_ERROR }));
    }
    return;
  }

  if (url.pathname === '/api/login' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      const result = loginUser(db, data.username, data.password);
      if (result.success) result.token = sessions.create(result.user.id);

      res.writeHead(result.success ? 200 : 401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      // FR-20: Always display generic message on login failure
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Invalid username or password' }));
    }
    return;
  }

  // FR-04: Invalidate the server-side session and close its WebSocket connections.
  if (url.pathname === '/api/logout' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      const invalidated = sessions.invalidate(data.token);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, invalidated }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Invalid logout request' }));
    }
    return;
  }

  // FR-05: Create chat room
  if (url.pathname === '/api/rooms' && req.method === 'POST') {
    try {
      const data = await parseJsonBody(req);
      const user = getAuthenticatedUser(getRequestToken(req, data));
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Authentication required' }));
        return;
      }
      const result = createRoom(db, data.name, user.id);

      res.writeHead(result.success ? 201 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: SAFE_SERVER_ERROR }));
    }
    return;
  }

  // FR-06: List chat rooms
  if (url.pathname === '/api/rooms' && req.method === 'GET') {
    try {
      const result = listRooms(db);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: SAFE_SERVER_ERROR }));
    }
    return;
  }

  // FR-11: Room messages & members REST endpoints
  const roomMessagesMatch = url.pathname.match(/^\/api\/rooms\/(\d+)\/messages$/);
  if (roomMessagesMatch) {
    const roomId = Number(roomMessagesMatch[1]);
    if (req.method === 'GET') {
      const messages = chatManager.getStoredMessages(db, roomId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, messages }));
      return;
    } else if (req.method === 'POST') {
      try {
        const data = await parseJsonBody(req);
        const user = getAuthenticatedUser(getRequestToken(req, data));
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Authentication required' }));
          return;
        }

        // SEC-REQ-04: HTTP fallback is allowed only for a user currently in the room.
        const members = chatManager.getRoomMembers(roomId);
        if (!members.some(name => name.toLowerCase() === user.username.toLowerCase())) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Join the room before sending messages' }));
          return;
        }

        // SEC-REQ-03: sender identity comes from the authenticated session.
        const result = chatManager.sendMessage(db, {
          roomId,
          userId: user.id,
          username: user.username,
          content: data.content
        });
        res.writeHead(result.success ? 201 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: SAFE_SERVER_ERROR }));
      }
      return;
    }
  }

  const roomMembersMatch = url.pathname.match(/^\/api\/rooms\/(\d+)\/members$/);
  if (roomMembersMatch && req.method === 'GET') {
    const roomId = Number(roomMembersMatch[1]);
    const members = chatManager.getRoomMembers(roomId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, members }));
    return;
  }

  // FR-23: Private messaging REST endpoints
  if (url.pathname === '/api/messages/private') {
    if (req.method === 'POST') {
      try {
        const data = await parseJsonBody(req);
        const user = getAuthenticatedUser(getRequestToken(req, data));
        if (!user) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Authentication required' }));
          return;
        }

        // SEC-REQ-03: never trust sender identity supplied by the client.
        const result = chatManager.sendPrivateMessage(db, {
          senderSocket: null,
          sender: user,
          recipientUsername: data.recipientUsername,
          content: data.content
        });
        res.writeHead(result.success ? 201 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: SAFE_SERVER_ERROR }));
      }
      return;
    } else if (req.method === 'GET') {
      const token = getRequestToken(req);
      const user = getAuthenticatedUser(token);
      const userA = url.searchParams.get('userA');
      const userB = url.searchParams.get('userB');
      if (!user || !userA || !userB) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Authentication required' }));
        return;
      }
      // Only the authenticated user may retrieve a conversation they participate in.
      const normalized = user.username.toLowerCase();
      if (userA.toLowerCase() !== normalized && userB.toLowerCase() !== normalized) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Not authorized to view this conversation' }));
        return;
      }
      const history = chatManager.getPrivateHistory(db, userA, userB);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, messages: history }));
      return;
    }
  }

  if (url.pathname === '/api/users/online' && req.method === 'GET') {
    const online = chatManager.getOnlineUsers();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, onlineUsers: online }));
    return;
  }

  // Serve static files from public/
  let filePath = path.join(__dirname, '..', 'public', url.pathname === '/' ? 'index.html' : url.pathname);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'text/plain';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        logServerError('Static file read failed', err);
        res.end(SAFE_SERVER_ERROR);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
};

// SEC-REQ-08: localhost may use HTTP; non-localhost deployments are HTTPS-only.
const { server: transportServer, tlsEnabled } = createTransport(requestHandler);
const server = transportServer;

// WebSocket Server for Real-Time Multi-User Chat (FR-10, FR-11)
// SR-02 / SEC-REQ-02: every socket connection must carry a valid, unexpired session token
// (?token=...). Connections without one are refused during the HTTP upgrade (401), so they never
// become sockets, and no chat event is processed from a connection whose session is no longer valid.
if (WebSocketServer) {
  const wss = new WebSocketServer({ noServer: true });

  // Drop expired sessions (and close their sockets) even when the client is idle.
  setInterval(() => sessions.pruneExpired(), 60 * 1000).unref();

  function refuseUpgrade(socket, status, text) {
    socket.write(`HTTP/1.1 ${status} ${text}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
    socket.destroy();
  }

  server.on('upgrade', (req, socket, head) => {
    let token = null;
    try {
      token = new URL(req.url, 'http://localhost').searchParams.get('token');
    } catch (err) {
      return refuseUpgrade(socket, 400, 'Bad Request');
    }

    const userId = sessions.resolve(token);
    const user = userId === null
      ? null
      : db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId);
    if (!user) return refuseUpgrade(socket, 401, 'Unauthorized');

    wss.handleUpgrade(req, socket, head, (ws) => {
      // The identity is bound to the token here; nothing the client sends can change it.
      ws.user = { id: user.id, username: user.username };
      sessions.attachSocket(token, user.id, ws);
      wss.emit('connection', ws, req);
    });
  });

  wss.on('connection', (ws) => {
    let currentRoomId = null;
    const currentUser = ws.user;
    chatManager.registerOnlineUser(ws, currentUser);

    ws.on('message', (message) => {
      try {
        // SR-02: re-check the session on every event; an expired/invalidated token ends the connection.
        if (sessions.resolve(ws.sessionToken) === null) {
          ws.send(JSON.stringify({ type: 'error', message: 'Session expired. Please log in again.' }));
          ws.close(1008, 'Invalid session');
          return;
        }

        const data = JSON.parse(message.toString());

        if (!data || typeof data !== 'object' || typeof data.type !== 'string') {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
          return;
        }

        if (data.type === 'auth') {
          ws.send(JSON.stringify({ type: 'auth_success', user: currentUser }));
        } else if (data.type === 'join_room') {
          const requestedRoomId = Number(data.roomId);
          if (!Number.isInteger(requestedRoomId) || requestedRoomId <= 0) {
            ws.send(JSON.stringify({ type: 'error', message: 'A valid room is required to join' }));
            return;
          }

          const room = db.prepare('SELECT id FROM rooms WHERE id = ?').get(requestedRoomId);
          if (!room) {
            ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
            return;
          }

          // SEC-REQ-03: identity is always taken from the authenticated session.
          if (currentRoomId !== null && String(currentRoomId) !== String(requestedRoomId)) {
            const previousRoomId = currentRoomId;
            chatManager.leaveRoom(ws, previousRoomId);
            const previousMembers = chatManager.getRoomMembers(previousRoomId);
            chatManager.broadcastToRoom(previousRoomId, {
              type: 'presence',
              roomId: previousRoomId,
              members: previousMembers
            });
          }

          currentRoomId = requestedRoomId;
          chatManager.registerOnlineUser(ws, currentUser);
          const members = chatManager.joinRoom(currentRoomId, ws, currentUser);
          const history = chatManager.getStoredMessages(db, currentRoomId);

          ws.send(JSON.stringify({
            type: 'room_joined',
            roomId: currentRoomId,
            members,
            history
          }));

          chatManager.broadcastToRoom(currentRoomId, {
            type: 'presence',
            roomId: currentRoomId,
            members
          });
        } else if (data.type === 'send_message') {
          if (!currentRoomId || !currentUser || !chatManager.isSocketInRoom(currentRoomId, ws)) {
            ws.send(JSON.stringify({ type: 'error', message: 'You must join the target room before sending messages' }));
            return;
          }

          const result = chatManager.sendMessage(db, {
            roomId: currentRoomId,
            userId: currentUser.id,
            username: currentUser.username,
            content: data.content
          });

          // FR-19: Invalid messages are rejected and the error is sent only to
          // the originating socket. No room broadcast occurs on failure.
          if (!result.success) {
            ws.send(JSON.stringify({ type: 'error', message: result.message }));
          }
        } else if (data.type === 'send_private_message') {
          if (typeof data.recipient !== 'string' || typeof data.content !== 'string') {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid private message fields' }));
            return;
          }

          const result = chatManager.sendPrivateMessage(db, {
            senderSocket: ws,
            sender: currentUser,
            recipientUsername: data.recipient,
            content: data.content
          });

          if (!result.success) {
            ws.send(JSON.stringify({ type: 'error', message: result.message }));
          }
        } else if (data.type === 'leave_room') {
          if (currentRoomId !== null) {
            const roomId = currentRoomId;
            chatManager.leaveRoom(ws, roomId);
            const members = chatManager.getRoomMembers(roomId);
            chatManager.broadcastToRoom(roomId, {
              type: 'presence',
              roomId,
              members
            });
            currentRoomId = null;
            // Keep the socket registered as online after leaving a room.
            chatManager.registerOnlineUser(ws, currentUser);
          }
        } else {
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown chat event' }));
        }
      } catch (err) {
        logServerError('WebSocket message handling failed', err);
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'error', message: 'The server could not process that action. Please try again.' }));
        }
      }
    });

    ws.on('close', () => {
      sessions.detachSocket(ws);
      chatManager.removeOnlineUser(ws);
      if (currentRoomId !== null) {
        const roomId = currentRoomId;
        chatManager.leaveRoom(ws, roomId);
        const members = chatManager.getRoomMembers(roomId);
        chatManager.broadcastToRoom(roomId, {
          type: 'presence',
          roomId,
          members
        });
      }
    });
  });
}

if (require.main === module) {
  server.listen(PORT, () => {
    const protocol = tlsEnabled ? 'https' : 'http';
    const host = process.env.HOST || '127.0.0.1';
    console.log(`Server running at ${protocol}://${host}:${PORT}/`);
  });
}

module.exports = { server, db, chatManager, sessions, resolveSessionUser, SAFE_SERVER_ERROR };
