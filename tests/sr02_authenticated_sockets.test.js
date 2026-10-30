// SR-02 / SEC-REQ-02: refuse every socket connection without a valid, unexpired session token,
// and process no chat event from an unauthenticated connection.
process.env.DB_PATH = ':memory:';
process.env.SESSION_TTL_MS = '1500'; // short-lived tokens so expiry can be exercised

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const WebSocket = require('ws');
const { server, db, sessions } = require('../src/server');
const { registerUser } = require('../src/auth');
const { createRoom } = require('../src/rooms');
const { createSessionManager } = require('../src/sessionManager');

let port;
let alice;
let bob;
let roomId;

const url = (token) =>
  `ws://127.0.0.1:${port}/` + (token === undefined ? '' : `?token=${encodeURIComponent(token)}`);

// Resolves with how the handshake ended: { opened, status?, ws? }
function connect(token) {
  return new Promise((resolve) => {
    const ws = new WebSocket(url(token));
    // Buffer every incoming message so back-to-back frames (room_joined + presence) are never missed.
    ws.inbox = [];
    ws.waiters = [];
    ws.on('message', (d) => {
      const m = JSON.parse(d.toString());
      const w = ws.waiters.shift();
      if (w) w(m); else ws.inbox.push(m);
    });
    ws.on('open', () => resolve({ opened: true, ws }));
    ws.on('unexpected-response', (_req, res) => resolve({ opened: false, status: res.statusCode }));
    ws.on('error', () => {});
  });
}

const nextMessage = (ws, ms = 1000) =>
  new Promise((resolve, reject) => {
    if (ws.inbox.length) return resolve(ws.inbox.shift());
    const t = setTimeout(() => reject(new Error('timeout waiting for message')), ms);
    ws.waiters.push((m) => { clearTimeout(t); resolve(m); });
  });

const closed = (ws) => new Promise((resolve) => ws.once('close', (code, reason) => resolve({ code, reason: reason.toString() })));

describe('SR-02: Authenticated socket connections only', () => {
  before(async () => {
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    port = server.address().port;
    alice = registerUser(db, 'Alice', 'Password123').user;
    bob = registerUser(db, 'Bob', 'Password123').user;
    roomId = createRoom(db, 'Secure Room').room.id;
  });

  after(() => new Promise((r) => { server.closeAllConnections?.(); server.close(r); }));

  it('TC-SR02-01: refuses a connection with no token (401)', async () => {
    const r = await connect(undefined);
    assert.equal(r.opened, false);
    assert.equal(r.status, 401);
  });

  it('TC-SR02-02: refuses an empty, garbage or unknown token', async () => {
    for (const t of ['', 'not-a-token', 'a'.repeat(64)]) {
      const r = await connect(t);
      assert.equal(r.opened, false, `token "${t}" must be refused`);
      assert.equal(r.status, 401);
    }
  });

  it('TC-SR02-03: refuses a token that was invalidated by logout', async () => {
    const token = sessions.create(alice.id);
    sessions.invalidate(token);
    const r = await connect(token);
    assert.equal(r.opened, false);
    assert.equal(r.status, 401);
  });

  it('TC-SR02-04: refuses an expired token', async () => {
    const token = sessions.create(alice.id);
    await new Promise((r) => setTimeout(r, 1600));
    const r = await connect(token);
    assert.equal(r.opened, false);
    assert.equal(r.status, 401);
  });

  it('TC-SR02-05: refuses a token whose user no longer exists', async () => {
    const token = sessions.create(99999);
    const r = await connect(token);
    assert.equal(r.opened, false);
    assert.equal(r.status, 401);
  });

  it('TC-SR02-06: accepts a valid, unexpired token and lets the user chat', async () => {
    const token = sessions.create(alice.id);
    const { opened, ws } = await connect(token);
    assert.equal(opened, true);

    ws.send(JSON.stringify({ type: 'join_room', roomId }));
    const joined = await nextMessage(ws);
    assert.equal(joined.type, 'room_joined');
    await nextMessage(ws); // presence

    ws.send(JSON.stringify({ type: 'send_message', content: 'hello' }));
    const msg = await nextMessage(ws);
    assert.equal(msg.type, 'chat_message');
    assert.equal(msg.sender, 'Alice');
    ws.close();
  });

  it('TC-SR02-07: identity comes from the token - a spoofed user in the payload is ignored', async () => {
    const token = sessions.create(alice.id);
    const { ws } = await connect(token);

    ws.send(JSON.stringify({ type: 'join_room', roomId, user: { id: bob.id, username: 'Bob' } }));
    await nextMessage(ws); // room_joined
    await nextMessage(ws); // presence
    ws.send(JSON.stringify({ type: 'send_message', content: 'who am i' }));
    const msg = await nextMessage(ws);
    assert.equal(msg.sender, 'Alice');
    assert.equal(msg.userId, alice.id);
    ws.close();
  });

  it('TC-SR02-08: a session that expires mid-connection is closed and its chat events are not processed', async () => {
    const before = db.prepare('SELECT COUNT(*) AS n FROM messages').get().n;
    const token = sessions.create(bob.id);
    const { ws } = await connect(token);
    ws.send(JSON.stringify({ type: 'join_room', roomId }));
    await nextMessage(ws);
    await nextMessage(ws);

    const closing = closed(ws);
    await new Promise((r) => setTimeout(r, 1600)); // token now expired
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'send_message', content: 'should be dropped' }));
    }
    const { code } = await closing;
    assert.equal(code, 1008);
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM messages').get().n, before);
  });

  it('TC-SR02-09: logging out closes the open socket and the token cannot reconnect', async () => {
    const token = sessions.create(alice.id);
    const { ws } = await connect(token);
    const closing = closed(ws);
    sessions.invalidate(token);
    const { code } = await closing;
    assert.equal(code, 1000);
    const r = await connect(token);
    assert.equal(r.opened, false);
  });
});

describe('SR-02: session manager expiry (SEC-REQ-06)', () => {
  it('a token is valid before 24 h and refused at/after 24 h', () => {
    let t = 1_000_000;
    const s = createSessionManager({ now: () => t });
    const token = s.create(1);
    t += 24 * 60 * 60 * 1000 - 1;
    assert.equal(s.resolve(token), 1);
    t += 1;
    assert.equal(s.resolve(token), null);
    assert.equal(s.verify(token, 1), false);
  });

  it('expiry closes attached sockets with 1008', () => {
    let t = 0;
    const s = createSessionManager({ ttlMs: 100, now: () => t });
    const token = s.create(5);
    const sock = { readyState: 1, close(c, r) { this.code = c; this.reason = r; } };
    assert.equal(s.attachSocket(token, 5, sock), true);
    t = 100;
    assert.equal(s.pruneExpired(), 1);
    assert.equal(sock.code, 1008);
  });

  it('tokens are 256-bit random hex values', () => {
    const s = createSessionManager();
    const a = s.create(1);
    assert.match(a, /^[0-9a-f]{64}$/);
    assert.notEqual(a, s.create(1));
  });

  it('non-string / empty tokens never resolve', () => {
    const s = createSessionManager();
    for (const bad of [undefined, null, '', 123, {}]) assert.equal(s.resolve(bad), null);
  });
});
