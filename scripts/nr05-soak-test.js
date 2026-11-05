#!/usr/bin/env node
// NR-05: 20 authenticated WebSocket users for a configurable soak duration.
// Defaults to the acceptance target: 2 hours. Use DURATION_MINUTES for a shorter smoke run.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');

const userCount = Math.max(20, Number(process.env.USERS || 20));
const durationMs = Math.max(1, Number(process.env.DURATION_MINUTES || 120)) * 60 * 1000;
const messageIntervalMs = Math.max(1000, Number(process.env.MESSAGE_INTERVAL_MS || 10000));
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-nr05-'));
process.env.DB_PATH = path.join(tempDir, 'soak.sqlite');

const { server, db, sessions } = require('../src/server');
const { registerUser } = require('../src/auth');
const { createRoom } = require('../src/rooms');
const WebSocket = require('ws');

const clients = [];
let timer;
let sent = 0;
let received = 0;
let failures = 0;
let stopping = false;

function delay(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function connect(url) {
  const ws = new WebSocket(url);
  await Promise.race([
    once(ws, 'open'),
    once(ws, 'error').then(([error]) => Promise.reject(error))
  ]);
  return ws;
}

function closeAll() {
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
  }
}

async function main() {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const room = createRoom(db, 'NR05 Soak Room').room;
  const url = `ws://127.0.0.1:${port}/`;

  for (let i = 0; i < userCount; i++) {
    const result = registerUser(db, `soak_user_${i}`, 'SoakPassword123');
    if (!result.success) throw new Error(result.message);
    const token = sessions.create(result.user.id);
    const ws = await connect(`${url}?token=${encodeURIComponent(token)}`);
    ws.on('message', () => { received++; });
    ws.on('error', () => { failures++; });
    ws.on('close', () => { if (!stopping) failures++; });
    ws.send(JSON.stringify({ type: 'join_room', roomId: room.id }));
    clients.push(ws);
  }

  console.log(`NR-05 soak started: ${userCount} users, ${Math.round(durationMs / 60000)} minutes`);
  const started = Date.now();
  timer = setInterval(() => {
    const sender = clients[sent % clients.length];
    if (sender.readyState !== WebSocket.OPEN) {
      failures++;
    } else {
      sender.send(JSON.stringify({ type: 'send_message', content: `soak-${++sent}` }));
    }
    const elapsedMinutes = Math.round((Date.now() - started) / 60000);
    const memoryMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
    console.log(`elapsed=${elapsedMinutes}m sent=${sent} receivedEvents=${received} failures=${failures} rss=${memoryMb}MB`);
  }, messageIntervalMs);

  await delay(durationMs);
  clearInterval(timer);
  stopping = true;
  closeAll();
  await delay(250);
  console.log(JSON.stringify({
    target: '20 concurrent users for 120 minutes',
    users: userCount,
    durationMinutes: Number(((Date.now() - started) / 60000).toFixed(2)),
    sentMessages: sent,
    receivedEvents: received,
    connectionFailures: failures,
    passed: userCount >= 20 && Date.now() - started >= durationMs && failures === 0
  }, null, 2));
  if (userCount < 20 || failures > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => {
  clearInterval(timer);
  stopping = true;
  closeAll();
  if (server.listening) server.close();
  try { db.close(); } catch {}
  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
});
