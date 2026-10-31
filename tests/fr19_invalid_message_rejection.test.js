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

describe('FR-19: Invalid message rejection', () => {
  let db, manager, roomId, user, sender, recipient;
  beforeEach(() => {
    db = createDatabase(':memory:');
    manager = new ChatManager();
    roomId = createRoom(db, 'General').room.id;
    user = registerUser(db, 'fr19_sender', 'Password123').user;
    sender = new MockSocket();
    recipient = new MockSocket();
    manager.joinRoom(roomId, sender, user);
    manager.joinRoom(roomId, recipient, { id: 2, username: 'recipient' });
  });

  it('rejects an empty message without persistence or room delivery', () => {
    const result = manager.sendMessage(db, {
      roomId, userId: user.id, username: user.username, content: ''
    });
    assert.equal(result.success, false);
    assert.equal(sender.messages.length, 0);
    assert.equal(recipient.messages.length, 0);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM messages').get().count, 0);
  });

  it('rejects whitespace-only content without persistence or room delivery', () => {
    const result = manager.sendMessage(db, {
      roomId, userId: user.id, username: user.username, content: '   \n\t  '
    });
    assert.equal(result.success, false);
    assert.match(result.message, /empty|between/i);
    assert.equal(sender.messages.length, 0);
    assert.equal(recipient.messages.length, 0);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM messages').get().count, 0);
  });

  it('rejects messages longer than 500 characters without delivery', () => {
    const result = manager.sendMessage(db, {
      roomId, userId: user.id, username: user.username, content: 'x'.repeat(501)
    });
    assert.equal(result.success, false);
    assert.equal(sender.messages.length, 0);
    assert.equal(recipient.messages.length, 0);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM messages').get().count, 0);
  });

  it('accepts messages at the 1-character and 500-character limits', () => {
    const one = manager.sendMessage(db, {
      roomId, userId: user.id, username: user.username, content: 'x'
    });
    const fiveHundred = manager.sendMessage(db, {
      roomId, userId: user.id, username: user.username, content: 'y'.repeat(500)
    });
    assert.equal(one.success, true);
    assert.equal(fiveHundred.success, true);
    assert.equal(sender.messages.length, 2);
    assert.equal(recipient.messages.length, 2);
    assert.equal(db.prepare('SELECT COUNT(*) AS count FROM messages').get().count, 2);
  });
});
