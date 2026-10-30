const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/db');
const { ChatManager } = require('../src/chatManager');

describe('FR-13: Message history on room join', () => {
  it('returns stored messages in chronological order', () => {
    const db = createDatabase(':memory:');
    const room = db.prepare('INSERT INTO rooms (name) VALUES (?)').run('history_room');
    const roomId = Number(room.lastInsertRowid);

    for (let i = 1; i <= 3; i++) {
      db.prepare(
        'INSERT INTO messages (room_id, username, content) VALUES (?, ?, ?)'
      ).run(roomId, 'alice', 'Message ' + i);
    }

    const history = new ChatManager().getStoredMessages(db, roomId);

    assert.deepEqual(history.map(message => message.content), [
      'Message 1',
      'Message 2',
      'Message 3'
    ]);
    db.close();
  });

  it('returns only the 50 most recent messages when more than 50 exist', () => {
    const db = createDatabase(':memory:');
    const room = db.prepare('INSERT INTO rooms (name) VALUES (?)').run('history_room');
    const roomId = Number(room.lastInsertRowid);

    for (let i = 1; i <= 60; i++) {
      db.prepare(
        'INSERT INTO messages (room_id, username, content) VALUES (?, ?, ?)'
      ).run(roomId, 'alice', 'Message ' + i);
    }

    const history = new ChatManager().getStoredMessages(db, roomId);

    assert.equal(history.length, 50);
    assert.equal(history[0].content, 'Message 11');
    assert.equal(history[49].content, 'Message 60');
    db.close();
  });

  it('does not include messages from another room', () => {
    const db = createDatabase(':memory:');
    const firstRoom = Number(db.prepare('INSERT INTO rooms (name) VALUES (?)').run('first_room').lastInsertRowid);
    const secondRoom = Number(db.prepare('INSERT INTO rooms (name) VALUES (?)').run('second_room').lastInsertRowid);

    db.prepare('INSERT INTO messages (room_id, username, content) VALUES (?, ?, ?)').run(firstRoom, 'alice', 'First room message');
    db.prepare('INSERT INTO messages (room_id, username, content) VALUES (?, ?, ?)').run(secondRoom, 'bob', 'Second room message');

    const history = new ChatManager().getStoredMessages(db, firstRoom);

    assert.equal(history.length, 1);
    assert.equal(history[0].content, 'First room message');
    db.close();
  });

  it('returns an empty list when the room has no messages', () => {
    const db = createDatabase(':memory:');
    const roomId = Number(db.prepare('INSERT INTO rooms (name) VALUES (?)').run('empty_room').lastInsertRowid);

    assert.deepEqual(new ChatManager().getStoredMessages(db, roomId), []);
    db.close();
  });

  it('caps a caller-supplied history limit at 50', () => {
    const db = createDatabase(':memory:');
    const roomId = Number(db.prepare('INSERT INTO rooms (name) VALUES (?)').run('limited_room').lastInsertRowid);

    for (let i = 1; i <= 55; i++) {
      db.prepare('INSERT INTO messages (room_id, username, content) VALUES (?, ?, ?)').run(roomId, 'alice', 'Message ' + i);
    }

    const history = new ChatManager().getStoredMessages(db, roomId, 100);
    assert.equal(history.length, 50);
    assert.equal(history[0].content, 'Message 6');
    assert.equal(history[49].content, 'Message 55');
    db.close();
  });
});
