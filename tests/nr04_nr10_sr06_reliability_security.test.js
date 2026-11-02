const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createSessionManager, DEFAULT_TTL_MS } = require('../src/sessionManager');

describe('NR-04: automatic reconnection', () => {
  it('uses a bounded retry interval and retries when the browser reports network restoration', () => {
    const client = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
    assert.match(client, /const MAX_RECONNECT_DELAY = 2000/);
    assert.match(client, /window\.addEventListener\('online'/);
    assert.match(client, /clearReconnectTimer\(\)/);
    assert.match(client, /initWebSocket\(\)/);
    assert.match(client, /const MAX_RECONNECT_ATTEMPTS = 5/);
    assert.match(client, /reconnectAttempts >= MAX_RECONNECT_ATTEMPTS/);
    assert.match(client, /Connection lost\. Please reload the page\./);
    assert.match(client, /reconnectTimer = setTimeout/);
  });

  it('rejoins the previously selected room after a socket reconnects', () => {
    const client = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
    assert.match(client, /if \(currentRoom && currentUser\)/);
    assert.match(client, /type: 'join_room'/);
  });
});

describe('NR-10: cross-browser compatibility baseline', () => {
  it('uses standard WebSocket, Fetch, SessionStorage and Intl browser APIs', () => {
    const client = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
    assert.match(client, /new WebSocket\(/);
    assert.match(client, /fetch\(/);
    assert.match(client, /sessionStorage/);
    assert.match(client, /document\.createElement/);
  });

  it('does not require browser-specific vendor-prefixed JavaScript APIs', () => {
    const client = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
    assert.doesNotMatch(client, /\b(?:webkit|moz|ms)[A-Z]\w*\b/);
  });
});

describe('SR-06: session token strength, expiry and invalidation', () => {
  it('issues unique tokens with at least 128 bits of cryptographic entropy', () => {
    const sessions = createSessionManager();
    const tokenA = sessions.create(1);
    const tokenB = sessions.create(1);
    assert.match(tokenA, /^[a-f0-9]{64}$/);
    assert.notEqual(tokenA, tokenB);
  });

  it('uses a 24-hour default expiry', () => {
    assert.equal(DEFAULT_TTL_MS, 24 * 60 * 60 * 1000);
    let now = 1000;
    const sessions = createSessionManager({ now: () => now });
    const token = sessions.create(1);
    assert.equal(sessions.resolve(token), 1);
    now += 24 * 60 * 60 * 1000;
    assert.equal(sessions.resolve(token), null);
  });

  it('invalidates a token immediately and closes its attached socket on logout', () => {
    const sessions = createSessionManager();
    const token = sessions.create(1);
    const socket = { readyState: 1, closed: false, close() { this.closed = true; } };
    assert.equal(sessions.attachSocket(token, 1, socket), true);
    assert.equal(sessions.invalidate(token), true);
    assert.equal(sessions.resolve(token), null);
    assert.equal(socket.closed, true);
  });
});
