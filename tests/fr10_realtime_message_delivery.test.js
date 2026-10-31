const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ChatManager } = require('../src/chatManager');

class MockSocket {
  constructor(readyState = 1) {
    this.readyState = readyState;
    this.received = [];
  }

  send(payload) {
    this.received.push(JSON.parse(payload));
  }
}

describe('FR-10: Real-time message delivery', () => {
  it('delivers an accepted message to every room member, including the sender', () => {
    const manager = new ChatManager();
    const sender = new MockSocket();
    const recipient = new MockSocket();

    manager.joinRoom(12, sender, { id: 1, username: 'alice' });
    manager.joinRoom(12, recipient, { id: 2, username: 'bob' });

    const result = manager.sendMessage(null, {
      roomId: 12,
      userId: 1,
      username: 'alice',
      content: 'Hello in real time'
    });

    assert.equal(result.success, true);
    assert.equal(sender.received.length, 1);
    assert.equal(recipient.received.length, 1);
    assert.deepEqual(sender.received[0], recipient.received[0]);
    assert.equal(sender.received[0].type, 'chat_message');
    assert.equal(sender.received[0].sender, 'alice');
    assert.equal(sender.received[0].content, 'Hello in real time');
  });

  it('delivers each message immediately without requiring a second request', () => {
    const manager = new ChatManager();
    const sender = new MockSocket();
    const recipient = new MockSocket();

    manager.joinRoom(3, sender, { id: 1, username: 'alice' });
    manager.joinRoom(3, recipient, { id: 2, username: 'bob' });

    manager.sendMessage(null, {
      roomId: 3,
      userId: 1,
      username: 'alice',
      content: 'First'
    });

    assert.equal(sender.received.length, 1);
    assert.equal(recipient.received.length, 1);

    manager.sendMessage(null, {
      roomId: 3,
      userId: 2,
      username: 'bob',
      content: 'Second'
    });

    assert.deepEqual(sender.received.map(message => message.content), ['First', 'Second']);
    assert.deepEqual(recipient.received.map(message => message.content), ['First', 'Second']);
  });

  it('does not deliver a room message to sockets in another room', () => {
    const manager = new ChatManager();
    const roomOneUser = new MockSocket();
    const roomTwoUser = new MockSocket();

    manager.joinRoom(1, roomOneUser, { id: 1, username: 'alice' });
    manager.joinRoom(2, roomTwoUser, { id: 2, username: 'bob' });

    manager.sendMessage(null, {
      roomId: 1,
      userId: 1,
      username: 'alice',
      content: 'Room one only'
    });

    assert.equal(roomOneUser.received.length, 1);
    assert.equal(roomTwoUser.received.length, 0);
  });

  it('skips sockets that are not in the OPEN state', () => {
    const manager = new ChatManager();
    const sender = new MockSocket();
    const connected = new MockSocket();
    const disconnected = new MockSocket(3);

    manager.joinRoom(8, sender, { id: 1, username: 'alice' });
    manager.joinRoom(8, connected, { id: 2, username: 'bob' });
    manager.joinRoom(8, disconnected, { id: 3, username: 'charlie' });

    manager.sendMessage(null, {
      roomId: 8,
      userId: 1,
      username: 'alice',
      content: 'Connected users only'
    });

    assert.equal(sender.received.length, 1);
    assert.equal(connected.received.length, 1);
    assert.equal(disconnected.received.length, 0);
  });

  it('rejects invalid messages without broadcasting them', () => {
    const manager = new ChatManager();
    const sender = new MockSocket();
    const recipient = new MockSocket();

    manager.joinRoom(5, sender, { id: 1, username: 'alice' });
    manager.joinRoom(5, recipient, { id: 2, username: 'bob' });

    const result = manager.sendMessage(null, {
      roomId: 5,
      userId: 1,
      username: 'alice',
      content: '   '
    });

    assert.equal(result.success, false);
    assert.equal(sender.received.length, 0);
    assert.equal(recipient.received.length, 0);
  });
});
