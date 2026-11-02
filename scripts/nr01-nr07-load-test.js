// NR-01 / NR-07 real WebSocket load test.
// Starts an isolated server with 20 authenticated clients across 5 rooms,
// then measures end-to-end fan-out latency for each room message.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const WebSocket = require('ws');

const USERS = Math.max(20, Number(process.env.LOAD_USERS) || 20);
const ROOMS = Math.max(5, Number(process.env.LOAD_ROOMS) || 5);
const MESSAGES_PER_ROOM = Math.max(1, Number(process.env.LOAD_MESSAGES_PER_ROOM) || 20);
const SLA_MS = Math.max(1, Number(process.env.LOAD_SLA_MS) || 1000);
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-nr01-nr07-'));
process.env.DB_PATH = path.join(tempDir, 'load-test.sqlite');
process.env.NODE_ENV = 'test';

const { server, db, sessions } = require('../src/server');
const { registerUser } = require('../src/auth');
const { createRoom } = require('../src/rooms');

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)] || 0;
}

function waitForMessage(socket, predicate, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { cleanup(); reject(new Error('Timed out waiting for WebSocket event')); }, timeoutMs);
    const onMessage = (raw) => {
      let data;
      try { data = JSON.parse(raw.toString()); } catch { return; }
      if (!predicate(data)) return;
      cleanup();
      resolve(data);
    };
    const cleanup = () => { clearTimeout(timer); socket.off('message', onMessage); };
    socket.on('message', onMessage);
  });
}

async function main() {
  const users = [];
  for (let i = 0; i < USERS; i++) {
    const result = registerUser(db, `load_user_${i + 1}`, 'LoadTestPass123');
    if (!result.success) throw new Error(`Could not create load-test user ${i + 1}: ${result.message}`);
    users.push({ ...result.user, token: sessions.create(result.user.id) });
  }

  const rooms = [];
  for (let i = 0; i < ROOMS; i++) {
    const result = createRoom(db, `Load Test Room ${i + 1}`, users[0].id);
    if (!result.success) throw new Error(`Could not create load-test room ${i + 1}: ${result.message}`);
    rooms.push(result.room);
  }

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const sockets = [];
  const received = new Map();
  const latencies = [];

  try {
    for (let i = 0; i < USERS; i++) {
      const roomIndex = i % ROOMS;
      const socket = new WebSocket(`ws://127.0.0.1:${address.port}/?token=${encodeURIComponent(users[i].token)}`);
      sockets.push(socket);
      await once(socket, 'open');
      socket.on('message', (raw) => {
        let data;
        try { data = JSON.parse(raw.toString()); } catch { return; }
        if (data.type === 'chat_message') {
          const key = data.content;
          if (!received.has(key)) received.set(key, new Set());
          received.get(key).add(i);
        }
      });
      const joined = waitForMessage(socket, (data) => data.type === 'room_joined');
      socket.send(JSON.stringify({ type: 'join_room', roomId: rooms[roomIndex].id }));
      await joined;
    }

    const usersPerRoom = Array.from({ length: ROOMS }, (_, roomIndex) =>
      users.map((_, index) => index).filter((index) => index % ROOMS === roomIndex)
    );
    const expectedRecipients = usersPerRoom.map((group) => group.length);
    if (expectedRecipients.some((count) => count < 1)) throw new Error('Every test room must have at least one user');

    for (let roomIndex = 0; roomIndex < ROOMS; roomIndex++) {
      const senderIndex = usersPerRoom[roomIndex][0];
      const sender = sockets[senderIndex];
      for (let messageIndex = 0; messageIndex < MESSAGES_PER_ROOM; messageIndex++) {
        const content = `load-${roomIndex}-${messageIndex}-${Date.now()}-${Math.random()}`;
        const started = performance.now();
        const completion = (async () => {
          const deadline = started + 3000;
          while ((received.get(content)?.size || 0) < expectedRecipients[roomIndex]) {
            if (performance.now() > deadline) throw new Error(`Message was not delivered to every user in room ${roomIndex + 1}`);
            await new Promise((resolve) => setTimeout(resolve, 1));
          }
          return performance.now() - started;
        })();
        sender.send(JSON.stringify({ type: 'send_message', content }));
        const elapsed = await completion;
        latencies.push(elapsed);
      }
    }

    const withinSla = latencies.filter((ms) => ms <= SLA_MS).length;
    const percentage = (withinSla / latencies.length) * 100;
    console.log(`NR-07: ${USERS} authenticated WebSocket users across ${ROOMS} rooms on one server instance.`);
    console.log(`NR-01: ${withinSla}/${latencies.length} messages (${percentage.toFixed(1)}%) reached every room member within ${SLA_MS} ms.`);
    console.log(`Delivery latency ms: p50=${percentile(latencies, 0.50).toFixed(2)}, p95=${percentile(latencies, 0.95).toFixed(2)}, max=${Math.max(...latencies).toFixed(2)}.`);
    if (percentage < 95) throw new Error(`NR-01 failed: ${percentage.toFixed(1)}% met the ${SLA_MS} ms target; at least 95% is required.`);
    console.log('PASS: NR-01 and NR-07 load-test conditions satisfied.');
  } finally {
    for (const socket of sockets) if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) socket.close();
    await new Promise((resolve) => server.close(resolve));
    db.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error('Load test failed:', error.message);
  process.exitCode = 1;
});
