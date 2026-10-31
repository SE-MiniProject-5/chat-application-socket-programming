const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/db');
const { createRoom } = require('../src/rooms');
const { registerUser } = require('../src/auth');
const { ChatManager } = require('../src/chatManager');

class MockSocket {
  constructor() { this.readyState = 1; this.messages = []; }
  send(raw) { this.messages.push(JSON.parse(raw)); }
}

describe('FR-09: Send message', () => {
  let db, manager, roomId, user, socket;
  beforeEach(() => {
    db = createDatabase(':memory:');
    manager = new ChatManager();
    roomId = createRoom(db, 'General').room.id;
    user = registerUser(db, 'sender_user', 'Password123').user;
    socket = new MockSocket();
    manager.joinRoom(roomId, socket, user);
  });

  it('sends and persists a valid text message to the joined room', () => {
    const result = manager.sendMessage(db, {
      roomId, userId: user.id, username: user.username, content: 'Hello room'
    });
    assert.equal(result.success, true);
    assert.equal(result.data.content, 'Hello room');
    assert.equal(socket.messages.length, 1);
    assert.equal(socket.messages[0].type, 'chat_message');
    assert.equal(socket.messages[0].sender, 'sender_user');
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM messages').get().count, 1);
  });

  it('accepts messages at the 1-character and 500-character boundaries', () => {
    assert.equal(manager.sendMessage(db, {
      roomId, userId: user.id, username: user.username, content: 'x'
    }).success, true);
    assert.equal(manager.sendMessage(db, {
      roomId, userId: user.id, username: user.username, content: 'x'.repeat(500)
    }).success, true);
  });

  it('rejects empty, whitespace-only, and over-500-character messages', () => {
    for (const content of ['', '   ', 'x'.repeat(501)]) {
      const result = manager.sendMessage(db, {
        roomId, userId: user.id, username: user.username, content
      });
      assert.equal(result.success, false);
    }
    assert.equal(socket.messages.length, 0);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM messages').get().count, 0);
  });

  it('does not broadcast a rejected message', () => {
    const result = manager.sendMessage(db, {
      roomId, userId: user.id, username: user.username, content: '   '
    });
    assert.equal(result.success, false);
    assert.equal(socket.messages.length, 0);
  });
});
