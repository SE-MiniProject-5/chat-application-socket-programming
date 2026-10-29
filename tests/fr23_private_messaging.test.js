const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/db');
const { ChatManager } = require('../src/chatManager');
const { registerUser } = require('../src/auth');

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

describe('FR-23: Private one-to-one message (optional)', () => {
  let db;
  let chatManager;
  let socketAlice, socketBob, socketCharlie;
  let userAlice, userBob, userCharlie;

  beforeEach(() => {
    db = createDatabase(':memory:');
    chatManager = new ChatManager();

    userAlice = registerUser(db, 'Alice', 'Password123').user;
    userBob = registerUser(db, 'Bob', 'Password123').user;
    userCharlie = registerUser(db, 'Charlie', 'Password123').user;

    socketAlice = new MockSocket('Alice');
    socketBob = new MockSocket('Bob');
    socketCharlie = new MockSocket('Charlie');

    chatManager.registerOnlineUser(socketAlice, userAlice);
    chatManager.registerOnlineUser(socketBob, userBob);
    chatManager.registerOnlineUser(socketCharlie, userCharlie);
  });

  it('TC-FR23-01: Successfully delivers a private message between two online users', () => {
    const res = chatManager.sendPrivateMessage(db, {
      senderSocket: socketAlice,
      sender: userAlice,
      recipientUsername: 'Bob',
      content: 'Hey Bob, this is private!'
    });

    assert.equal(res.success, true);
    assert.equal(res.data.sender, 'Alice');
    assert.equal(res.data.recipient, 'Bob');
    assert.equal(res.data.content, 'Hey Bob, this is private!');
    assert.equal(res.data.isPrivate, true);

    // Verify Bob received the message
    assert.equal(socketBob.receivedMessages.length, 1);
    assert.equal(socketBob.receivedMessages[0].type, 'private_message');
    assert.equal(socketBob.receivedMessages[0].content, 'Hey Bob, this is private!');
    assert.equal(socketBob.receivedMessages[0].sender, 'Alice');

    // Verify Alice (sender) also received confirmation copy
    assert.equal(socketAlice.receivedMessages.length, 1);
    assert.equal(socketAlice.receivedMessages[0].content, 'Hey Bob, this is private!');
  });

  it('TC-FR23-02: Private message is NOT delivered to third party (Charlie)', () => {
    chatManager.sendPrivateMessage(db, {
      senderSocket: socketAlice,
      sender: userAlice,
      recipientUsername: 'Bob',
      content: 'Confidential conversation'
    });

    // Alice and Bob have the message
    assert.equal(socketAlice.receivedMessages.length, 1);
    assert.equal(socketBob.receivedMessages.length, 1);

    // Charlie must NOT receive the private message
    assert.equal(socketCharlie.receivedMessages.length, 0);
  });

  it('TC-FR23-03: Fails when recipient is not currently online', () => {
    const res = chatManager.sendPrivateMessage(db, {
      senderSocket: socketAlice,
      sender: userAlice,
      recipientUsername: 'OfflineUser',
      content: 'Are you there?'
    });

    assert.equal(res.success, false);
    assert.match(res.message, /not currently online/i);
    assert.equal(socketAlice.receivedMessages.length, 0);
  });

  it('TC-FR23-04: Recipient username lookup is case-insensitive', () => {
    const res = chatManager.sendPrivateMessage(db, {
      senderSocket: socketAlice,
      sender: userAlice,
      recipientUsername: 'bOb', // Mixed case for Bob
      content: 'Case insensitive DM test'
    });

    assert.equal(res.success, true);
    assert.equal(socketBob.receivedMessages.length, 1);
    assert.equal(socketBob.receivedMessages[0].content, 'Case insensitive DM test');
  });

  it('TC-FR23-05: Rejects empty content or content exceeding 500 characters', () => {
    const emptyRes = chatManager.sendPrivateMessage(db, {
      senderSocket: socketAlice,
      sender: userAlice,
      recipientUsername: 'Bob',
      content: '   '
    });
    assert.equal(emptyRes.success, false);

    const longContent = 'X'.repeat(501);
    const longRes = chatManager.sendPrivateMessage(db, {
      senderSocket: socketAlice,
      sender: userAlice,
      recipientUsername: 'Bob',
      content: longContent
    });
    assert.equal(longRes.success, false);
  });

  it('TC-FR23-06: Disallows sending a private message to oneself', () => {
    const res = chatManager.sendPrivateMessage(db, {
      senderSocket: socketAlice,
      sender: userAlice,
      recipientUsername: 'Alice',
      content: 'Talking to myself'
    });

    assert.equal(res.success, false);
    assert.equal(res.message, 'Cannot send private message to yourself');
  });

  it('TC-FR23-07: Persists private message in database and retrievable only for participants', () => {
    chatManager.sendPrivateMessage(db, {
      senderSocket: socketAlice,
      sender: userAlice,
      recipientUsername: 'Bob',
      content: 'Stored private message'
    });

    const historyAliceBob = chatManager.getPrivateHistory(db, 'Alice', 'Bob');
    assert.equal(historyAliceBob.length, 1);
    assert.equal(historyAliceBob[0].content, 'Stored private message');
    assert.equal(historyAliceBob[0].sender, 'Alice');

    // Charlie checking history between Charlie and Alice sees 0
    const historyCharlieAlice = chatManager.getPrivateHistory(db, 'Charlie', 'Alice');
    assert.equal(historyCharlieAlice.length, 0);
  });
});
