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
const db = createDatabase();
const chatManager = new ChatManager();
const sessions = createSessionManager();

/**
 * Resolve a session token to the canonical user record.
 * Client-supplied usernames and user IDs are deliberately ignored.
 */
function resolveSessionUser(database, sessionManager, token) {
  const userId = sessionManager.getUserId(token);
  if (!userId) return null;
  return database.prepare('SELECT id, username FROM users WHERE id = ?').get(userId) || null;
}

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
        const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || data.token;
        const authenticatedUser = resolveSessionUser(db, sessions, token);
        if (!authenticatedUser) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Authentication required' }));
          return;
        }
        const result = chatManager.sendMessage(db, {
          roomId,
          userId: authenticatedUser.id,
          username: authenticatedUser.username,
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
        const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '') || data.token;
        const authenticatedUser = resolveSessionUser(db, sessions, token);
        if (!authenticatedUser) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Authentication required' }));
          return;
        }
        const result = chatManager.sendPrivateMessage(db, {
          senderSocket: null,
          sender: authenticatedUser,
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
if (WebSocketServer) {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    let currentRoomId = null;
    let currentUser = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'auth') {
          const authenticatedUser = resolveSessionUser(db, sessions, data.token);
          if (!authenticatedUser || !sessions.attachSocket(data.token, authenticatedUser.id, ws)) {
            ws.send(JSON.stringify({ type: 'error', message: 'Session expired. Please log in again.' }));
            ws.close(1008, 'Invalid session');
            return;
          }
          currentUser = authenticatedUser;
          chatManager.registerOnlineUser(ws, currentUser);
          ws.send(JSON.stringify({ type: 'auth_success', user: currentUser }));
        } else if (data.type === 'join_room') {
          const authenticatedUser = resolveSessionUser(db, sessions, data.token);
          if (!authenticatedUser || !sessions.attachSocket(data.token, authenticatedUser.id, ws)) {
            ws.send(JSON.stringify({ type: 'error', message: 'Session expired. Please log in again.' }));
            ws.close(1008, 'Invalid session');
            return;
          }

          const requestedRoomId = Number(data.roomId);
          if (!Number.isInteger(requestedRoomId) || requestedRoomId <= 0) {
            ws.send(JSON.stringify({ type: 'error', message: 'A valid room and logged-in user are required to join' }));
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
          currentUser = authenticatedUser;
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
          if (!currentRoomId || !currentUser) {
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
          if (!currentUser) {
            ws.send(JSON.stringify({ type: 'error', message: 'Must be logged in to send private messages' }));
            return;
          }

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

module.exports = { server, db, chatManager, sessions, resolveSessionUser };
