const http = require('node:http');
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
const db = createDatabase(process.env.DB_PATH || undefined);
const chatManager = new ChatManager();
// SEC-REQ-06: tokens last 24 h by default (SESSION_TTL_MS is only for tests/ops overrides).
const sessions = createSessionManager(
  process.env.SESSION_TTL_MS ? { ttlMs: Number(process.env.SESSION_TTL_MS) } : {}
);

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
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

const server = http.createServer(async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

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
      res.end(JSON.stringify({ success: false, message: err.message }));
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
      const result = createRoom(db, data.name, data.created_by || null);

      res.writeHead(result.success ? 201 : 400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: err.message }));
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
      res.end(JSON.stringify({ success: false, message: err.message }));
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
        const result = chatManager.sendMessage(db, {
          roomId,
          userId: data.userId || null,
          username: data.username,
          content: data.content
        });
        res.writeHead(result.success ? 201 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
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
        const result = chatManager.sendPrivateMessage(db, {
          senderSocket: null,
          sender: { id: data.senderId || null, username: data.senderUsername },
          recipientUsername: data.recipientUsername,
          content: data.content
        });
        res.writeHead(result.success ? 201 : 400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
      return;
    } else if (req.method === 'GET') {
      const userA = url.searchParams.get('userA');
      const userB = url.searchParams.get('userB');
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
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

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

          // FR-07: Leave the previous room before joining another one.
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

          // Notify everyone in the room about online members.
          chatManager.broadcastToRoom(currentRoomId, {
            type: 'presence',
            roomId: currentRoomId,
            members
          });
        } else if (data.type === 'send_message') {
          if (!currentRoomId) {
            ws.send(JSON.stringify({ type: 'error', message: 'You must join a room first' }));
            return;
          }

          chatManager.sendMessage(db, {
            roomId: currentRoomId,
            userId: currentUser.id,
            username: currentUser.username,
            content: data.content
          });
        } else if (data.type === 'send_private_message') {
          // FR-23: Private one-to-one messaging
          const res = chatManager.sendPrivateMessage(db, {
            senderSocket: ws,
            sender: currentUser,
            recipientUsername: data.recipient,
            content: data.content
          });

          if (!res.success) {
            ws.send(JSON.stringify({ type: 'error', message: res.message }));
          }
        } else if (data.type === 'leave_room') {
          if (currentRoomId) {
            chatManager.leaveRoom(ws, currentRoomId);
            const members = chatManager.getRoomMembers(currentRoomId);
            chatManager.broadcastToRoom(currentRoomId, {
              type: 'presence',
              roomId: currentRoomId,
              members
            });
            currentRoomId = null;
          }
        }
      } catch (err) {
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
      }
    });

    ws.on('close', () => {
      sessions.detachSocket(ws);
      chatManager.removeOnlineUser(ws);
      if (currentRoomId) {
        chatManager.leaveRoom(ws, currentRoomId);
        const members = chatManager.getRoomMembers(currentRoomId);
        chatManager.broadcastToRoom(currentRoomId, {
          type: 'presence',
          roomId: currentRoomId,
          members
        });
      }
    });
  });
}

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
  });
}

module.exports = { server, db, chatManager, sessions };
