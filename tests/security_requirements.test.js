const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/db');
const { registerUser, loginUser, hashPassword, verifyPassword } = require('../src/auth');
const { createSessionManager } = require('../src/sessionManager');
const { createRoom } = require('../src/rooms');

function waitForMessage(socket, predicate = () => true, timeoutMs = 2000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Timed out waiting for WebSocket message'));
    }, timeoutMs);

    const onMessage = (raw) => {
      let data;
      try { data = JSON.parse(raw.toString()); } catch { return; }
      if (!predicate(data)) return;
      cleanup();
      resolve(data);
    };

    const cleanup = () => {
      clearTimeout(timer);
      socket.off('message', onMessage);
    };

    socket.on('message', onMessage);
  });
}

describe('NR-09 / SEC-REQ-01: bcrypt password protection', () => {
  it('stores a salted bcrypt hash with cost factor 10 and verifies without plaintext storage', () => {
    const password = 'Password123!';
    const hash = hashPassword(password);

    assert.match(hash, /^\$2[aby]\$10\$/);
    assert.notEqual(hash, password);
    assert.equal(hash.length, 60);
    assert.equal(verifyPassword(password, hash), true);
    assert.equal(verifyPassword('WrongPassword!', hash), false);
  });
});

describe('NR-09 / SEC-REQ-06: session token security', () => {
  it('creates a 256-bit token, expires it after 24 hours, and invalidates it on logout', () => {
    let now = 1_000_000;
    const sessions = createSessionManager({ now: () => now });
    const token = sessions.create(42);

    assert.match(token, /^[a-f0-9]{64}$/);
    assert.equal(sessions.verify(token, 42), true);
    assert.equal(sessions.verify(token, 43), false);

    now += 24 * 60 * 60 * 1000 - 1;
    assert.equal(sessions.verify(token, 42), true);

    now += 1;
    assert.equal(sessions.verify(token, 42), false);

    const second = sessions.create(42);
    assert.equal(sessions.verify(second, 42), true);
    assert.equal(sessions.invalidate(second), true);
    assert.equal(sessions.verify(second, 42), false);
  });
});

describe('NR-09 / SEC-REQ-02 to SEC-REQ-05: authenticated WebSocket security', () => {
  let server;
  let db;
  let port;
  let WebSocket;
  let alice;
  let bob;
  let charlie;
  let aliceToken;
  let bobToken;
  let charlieToken;
  let room1;
  let room2;

  before(async () => {
    process.env.NODE_ENV = 'test';
    ({ server, db } = require('../src/server'));
    WebSocket = require('ws');

    // Use an isolated in-memory database for the test server.
    db.exec('DELETE FROM private_messages; DELETE FROM messages; DELETE FROM rooms; DELETE FROM users;');
    const a = registerUser(db, 'AliceSec', 'Password123!').user;
    const b = registerUser(db, 'BobSec', 'Password123!').user;
    const c = registerUser(db, 'CharlieSec', 'Password123!').user;
    alice = a; bob = b; charlie = c;

    aliceToken = require('../src/server').sessions.create(alice.id);
    bobToken = require('../src/server').sessions.create(bob.id);
    charlieToken = require('../src/server').sessions.create(charlie.id);

    room1 = createRoom(db, 'Security Room', alice.id).room;
    room2 = createRoom(db, 'Other Room', charlie.id).room;

    await new Promise(resolve => server.listen(0, resolve));
    port = server.address().port;
  });

  after(async () => {
    try { server.close(); } catch {}
  });

  it('rejects a WebSocket handshake without a valid session token', async () => {
    await new Promise((resolve) => {
      const socket = new WebSocket(`ws://127.0.0.1:${port}`);
      socket.once('error', () => resolve());
      socket.once('open', () => {
        socket.close();
        assert.fail('Unauthenticated WebSocket unexpectedly opened');
      });
    });
  });

  it('binds sender identity to the authenticated session, ignoring spoofed payload identity', async () => {
    const aliceSocket = new WebSocket(`ws://127.0.0.1:${port}?token=${aliceToken}`);
    const bobSocket = new WebSocket(`ws://127.0.0.1:${port}?token=${bobToken}`);
    await Promise.all([
      new Promise(r => aliceSocket.once('open', r)),
      new Promise(r => bobSocket.once('open', r))
    ]);

    aliceSocket.send(JSON.stringify({ type: 'join_room', roomId: room1.id, user: { id: bob.id, username: 'BobSec' } }));
    bobSocket.send(JSON.stringify({ type: 'join_room', roomId: room1.id }));
    await Promise.all([
      waitForMessage(aliceSocket, m => m.type === 'room_joined'),
      waitForMessage(bobSocket, m => m.type === 'room_joined')
    ]);

    aliceSocket.send(JSON.stringify({
      type: 'send_message',
      roomId: room1.id,
      userId: bob.id,
      username: 'BobSec',
      content: 'identity test'
    }));

    const received = await waitForMessage(bobSocket, m => m.type === 'chat_message' && m.content === 'identity test');
    assert.equal(received.sender, 'AliceSec');

    const stored = db.prepare('SELECT username FROM messages WHERE content = ?').get('identity test');
    assert.equal(stored.username, 'AliceSec');

    aliceSocket.close();
    bobSocket.close();
  });

  it('delivers room messages only to sockets that joined the target room', async () => {
    const aliceSocket = new WebSocket(`ws://127.0.0.1:${port}?token=${aliceToken}`);
    const bobSocket = new WebSocket(`ws://127.0.0.1:${port}?token=${bobToken}`);
    const charlieSocket = new WebSocket(`ws://127.0.0.1:${port}?token=${charlieToken}`);
    await Promise.all([
      new Promise(r => aliceSocket.once('open', r)),
      new Promise(r => bobSocket.once('open', r)),
      new Promise(r => charlieSocket.once('open', r))
    ]);

    aliceSocket.send(JSON.stringify({ type: 'join_room', roomId: room1.id }));
    bobSocket.send(JSON.stringify({ type: 'join_room', roomId: room1.id }));
    charlieSocket.send(JSON.stringify({ type: 'join_room', roomId: room2.id }));
    await Promise.all([
      waitForMessage(aliceSocket, m => m.type === 'room_joined'),
      waitForMessage(bobSocket, m => m.type === 'room_joined'),
      waitForMessage(charlieSocket, m => m.type === 'room_joined')
    ]);

    let charlieReceived = false;
    charlieSocket.on('message', raw => {
      try {
        const m = JSON.parse(raw.toString());
        if (m.type === 'chat_message' && m.content === 'room isolation') charlieReceived = true;
      } catch {}
    });

    aliceSocket.send(JSON.stringify({ type: 'send_message', roomId: room1.id, content: 'room isolation' }));
    const bobMessage = await waitForMessage(bobSocket, m => m.type === 'chat_message' && m.content === 'room isolation');
    assert.equal(bobMessage.sender, 'AliceSec');
    await new Promise(r => setTimeout(r, 100));
    assert.equal(charlieReceived, false);

    aliceSocket.close();
    bobSocket.close();
    charlieSocket.close();
  });

  it('rejects invalid message input and the client renders text as plain text', async () => {
    const aliceSocket = new WebSocket(`ws://127.0.0.1:${port}?token=${aliceToken}`);
    await new Promise(r => aliceSocket.once('open', r));
    aliceSocket.send(JSON.stringify({ type: 'join_room', roomId: room1.id }));
    await waitForMessage(aliceSocket, m => m.type === 'room_joined');

    aliceSocket.send(JSON.stringify({ type: 'send_message', content: 'x'.repeat(501) }));
    const error = await waitForMessage(aliceSocket, m => m.type === 'error');
    assert.match(error.message, /1 and 500/);

    const appSource = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'public', 'app.js'), 'utf8');
    // SR-05: user text is rendered with textContent, never interpolated into innerHTML.
    assert.match(appSource, /textContent/);
    assert.doesNotMatch(appSource, /innerHTML\s*=\s*`[^`]*\$\{msg\./);

    aliceSocket.close();
  });
});
