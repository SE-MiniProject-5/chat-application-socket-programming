const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/db');
const { ChatManager } = require('../src/chatManager');
const { createRoom } = require('../src/rooms');
const { registerUser } = require('../src/auth');

// Mock WebSocket client for testing broadcast events
class MockSocket {
  constructor(name) {
    this.name = name;
    this.readyState = 1; // OPEN
    this.receivedMessages = [];
  }

  send(data) {
    this.receivedMessages.push(JSON.parse(data));
  }
}

describe('FR-11: Multi-user rooms with sender name', () => {
  let db;
  let chatManager;
  let roomId;
  let userAlice, userBob, userCharlie, userDan;

  beforeEach(() => {
    db = createDatabase(':memory:');
    chatManager = new ChatManager();
    const room = createRoom(db, 'Study Group');
    roomId = room.room.id;

    userAlice = registerUser(db, 'Alice', 'Password123').user;
    userBob = registerUser(db, 'Bob', 'Password123').user;
    userCharlie = registerUser(db, 'Charlie', 'Password123').user;
    userDan = registerUser(db, 'Dan', 'Password123').user;
  });

  it('TC-FR11-01: Allows two or more users to be members of the same room at the same time', () => {
    const socketAlice = new MockSocket('Alice');
    const socketBob = new MockSocket('Bob');
    const socketCharlie = new MockSocket('Charlie');

    chatManager.joinRoom(roomId, socketAlice, { id: 1, username: 'Alice' });
    chatManager.joinRoom(roomId, socketBob, { id: 2, username: 'Bob' });
    chatManager.joinRoom(roomId, socketCharlie, { id: 3, username: 'Charlie' });

    const members = chatManager.getRoomMembers(roomId);
    assert.equal(members.length, 3);
    assert.deepEqual(members.sort(), ['Alice', 'Bob', 'Charlie']);
  });

  it('TC-FR11-02: Every sent message includes the sender\'s username', () => {
    const socketAlice = new MockSocket('Alice');
    chatManager.joinRoom(roomId, socketAlice, { id: 1, username: 'Alice' });

    const res = chatManager.sendMessage(db, {
      roomId,
      userId: 1,
      username: 'Alice',
      content: 'Hello everyone!'
    });

    assert.equal(res.success, true);
    // FR-11 requirement: sender's username must be displayed/included with every message
    assert.equal(res.data.sender, 'Alice');
    assert.equal(res.data.content, 'Hello everyone!');
    assert.ok(res.data.timestamp);
  });

  it('TC-FR11-03: Multiple members receive messages with correct sender attribution', () => {
    const socketAlice = new MockSocket('Alice');
    const socketBob = new MockSocket('Bob');

    chatManager.joinRoom(roomId, socketAlice, { id: 1, username: 'Alice' });
    chatManager.joinRoom(roomId, socketBob, { id: 2, username: 'Bob' });

    // Alice sends a message
    chatManager.sendMessage(db, {
      roomId,
      userId: 1,
      username: 'Alice',
      content: 'Hi Bob!'
    });

    // Bob sends a reply
    chatManager.sendMessage(db, {
      roomId,
      userId: 2,
      username: 'Bob',
      content: 'Hey Alice, how are you?'
    });

    // Verify Alice received both messages with correct senders
    assert.equal(socketAlice.receivedMessages.length, 2);
    assert.equal(socketAlice.receivedMessages[0].sender, 'Alice');
    assert.equal(socketAlice.receivedMessages[0].content, 'Hi Bob!');
    assert.equal(socketAlice.receivedMessages[1].sender, 'Bob');
    assert.equal(socketAlice.receivedMessages[1].content, 'Hey Alice, how are you?');

    // Verify Bob received both messages with correct senders
    assert.equal(socketBob.receivedMessages.length, 2);
    assert.equal(socketBob.receivedMessages[0].sender, 'Alice');
    assert.equal(socketBob.receivedMessages[1].sender, 'Bob');
  });

  it('TC-FR11-04: Messages are isolated to room members only', () => {
    const otherRoom = createRoom(db, 'Gaming Room');
    const otherRoomId = otherRoom.room.id;

    const socketAlice = new MockSocket('Alice');
    const socketBob = new MockSocket('Bob');
    const socketDan = new MockSocket('Dan'); // In other room

    chatManager.joinRoom(roomId, socketAlice, { id: 1, username: 'Alice' });
    chatManager.joinRoom(roomId, socketBob, { id: 2, username: 'Bob' });
    chatManager.joinRoom(otherRoomId, socketDan, { id: 4, username: 'Dan' });

    // Send to first room
    chatManager.sendMessage(db, {
      roomId,
      userId: 1,
      username: 'Alice',
      content: 'Room 1 message'
    });

    assert.equal(socketAlice.receivedMessages.length, 1);
    assert.equal(socketBob.receivedMessages.length, 1);
    // Dan should NOT receive message from Room 1
    assert.equal(socketDan.receivedMessages.length, 0);
  });

  it('TC-FR11-05: Messages are stored in database with username and room id', () => {
    chatManager.sendMessage(db, {
      roomId,
      userId: 1,
      username: 'Alice',
      content: 'Database persistence check'
    });

    const stored = chatManager.getStoredMessages(db, roomId);
    assert.equal(stored.length, 1);
    assert.equal(stored[0].sender, 'Alice');
    assert.equal(stored[0].content, 'Database persistence check');
    assert.equal(stored[0].roomId, roomId);
  });
});
