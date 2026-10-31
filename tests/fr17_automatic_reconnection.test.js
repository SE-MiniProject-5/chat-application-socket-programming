const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const appSource = fs.readFileSync(
  path.join(__dirname, '..', 'public', 'app.js'),
  'utf8'
);

test('FR-17 retries a dropped WebSocket connection at least five times', () => {
  assert.match(appSource, /const MAX_RECONNECT_ATTEMPTS = 5/);
  assert.match(appSource, /reconnectAttempts >= MAX_RECONNECT_ATTEMPTS/);
  assert.match(appSource, /reconnectAttempts \+= 1/);
  assert.match(appSource, /scheduleReconnect\(\)/);
});

test('FR-17 rejoins the previous room after a successful reconnect', () => {
  assert.match(appSource, /if \(currentRoom && currentUser\)/);
  assert.match(appSource, /type: 'join_room'/);
  assert.match(appSource, /roomId: currentRoom\.id/);
});

test('FR-17 shows the required connection-lost message after retries are exhausted', () => {
  assert.match(appSource, /Connection lost\. Please reload the page\./);
});

test('FR-17 does not reconnect after intentional logout', () => {
  assert.match(appSource, /intentionalDisconnect = true/);
  assert.match(appSource, /if \(!intentionalDisconnect && sessionToken\)/);
});
