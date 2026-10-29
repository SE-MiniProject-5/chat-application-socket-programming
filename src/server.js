const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createDatabase } = require('./db');
const { registerUser, loginUser } = require('./auth');
const { createRoom, listRooms } = require('./rooms');
const { ChatManager } = require('./chatManager');

let WebSocketServer;
try {
  WebSocketServer = require('ws').WebSocketServer;
} catch (err) {
  // Optional ws fallback
}

const PORT = process.env.PORT || 3000;
const db = createDatabase();
const chatManager = new ChatManager();

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

      res.writeHead(result.success ? 200 : 401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } catch (err) {
      // FR-20: Always display generic message on login failure
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'Invalid username or password' }));
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

        if (data.type === 'join_room') {
          currentRoomId = data.roomId;
          currentUser = data.user;
          const members = chatManager.joinRoom(currentRoomId, ws, currentUser);
          const history = chatManager.getStoredMessages(db, currentRoomId);

          ws.send(JSON.stringify({
            type: 'room_joined',
            roomId: currentRoomId,
            members,
            history
          }));

          // Notify everyone in the room about online members
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

module.exports = { server, db, chatManager };
