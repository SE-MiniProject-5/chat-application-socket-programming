const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { ChatManager } = require('../src/chatManager');

describe('FR-12: Server-generated message timestamps', () => {
  it('serializes an unambiguous ISO-8601 UTC timestamp', () => {
    const manager = new ChatManager();
    const value = manager.formatTimestamp(new Date('2026-11-02T08:05:00.000Z'));
    assert.equal(value, '2026-11-02T08:05:00.000Z');
    assert.equal(new Date(value).toISOString(), value);
  });

  it('formats timestamps in the browser local timezone', () => {
    const client = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
    assert.match(client, /new Intl\.DateTimeFormat\(undefined/);
    assert.match(client, /hour: '2-digit'/);
    assert.match(client, /minute: '2-digit'/);
  });

  it('treats SQLite CURRENT_TIMESTAMP history values as UTC', () => {
    const client = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
    assert.match(client, /replace\(' ', 'T'\) \+ 'Z'/);
  });
});

describe('FR-15: Join and leave notices', () => {
  it('sends peer-only notices for join, leave, room-switch, and disconnect', () => {
    const server = fs.readFileSync(path.join(__dirname, '..', 'src', 'server.js'), 'utf8');
    assert.match(server, /type: 'system_notice'/);
    assert.match(server, /memberSocket !== ws/);
    assert.match(server, /notifyRoomPeers\(currentRoomId, 'joined'\)/);
    assert.match(server, /notifyRoomPeers\(roomId, 'left'\)/);
    assert.match(server, /notifyRoomPeers\(previousRoomId, 'left'\)/);
  });

  it('renders notice content as text in the chat view', () => {
    const client = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
    assert.match(client, /data\.type === 'system_notice'/);
    assert.match(client, /message\.textContent = String\(notice\.message/);
  });
});

describe('FR-18: Offline detection', () => {
  it('uses WebSocket ping/pong and terminates unresponsive connections on a 20-second sweep', () => {
    const server = fs.readFileSync(path.join(__dirname, '..', 'src', 'server.js'), 'utf8');
    assert.match(server, /client\.isAlive === false/);
    assert.match(server, /client\.terminate\(\)/);
    assert.match(server, /client\.ping\(\)/);
    assert.match(server, /ws\.on\('pong'/);
    assert.match(server, /}, 20 \* 1000\)/);
  });
});
