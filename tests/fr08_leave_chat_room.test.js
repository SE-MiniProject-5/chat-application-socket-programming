const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ChatManager } = require('../src/chatManager');

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

describe('FR-08: Leave chat room', () => {
  it('allows a user to leave the current room', () => {
    const manager = new ChatManager();
    const alice = new MockSocket('Alice');

    manager.joinRoom(1, alice, { id: 1, username: 'Alice' });
    assert.deepEqual(manager.getRoomMembers(1), ['Alice']);

    manager.leaveRoom(alice, 1);

    assert.deepEqual(manager.getRoomMembers(1), []);
    assert.equal(manager.rooms.has('1'), false);
  });

  it('does not deliver later room messages to a user after leaving', () => {
    const manager = new ChatManager();
    const alice = new MockSocket('Alice');
    const bob = new MockSocket('Bob');

    manager.joinRoom(1, alice, { id: 1, username: 'Alice' });
    manager.joinRoom(1, bob, { id: 2, username: 'Bob' });

    manager.leaveRoom(alice, 1);

    manager.sendMessage(null, {
      roomId: 1,
      userId: 2,
      username: 'Bob',
      content: 'Alice should not receive this'
    });

    assert.equal(alice.receivedMessages.length, 0);
    assert.equal(bob.receivedMessages.length, 1);
    assert.equal(bob.receivedMessages[0].content, 'Alice should not receive this');
  });

  it('keeps remaining room members connected after another user leaves', () => {
    const manager = new ChatManager();
    const alice = new MockSocket('Alice');
    const bob = new MockSocket('Bob');
    const charlie = new MockSocket('Charlie');

    manager.joinRoom(1, alice, { id: 1, username: 'Alice' });
    manager.joinRoom(1, bob, { id: 2, username: 'Bob' });
    manager.joinRoom(1, charlie, { id: 3, username: 'Charlie' });

    manager.leaveRoom(bob, 1);

    assert.deepEqual(manager.getRoomMembers(1).sort(), ['Alice', 'Charlie']);

    manager.sendMessage(null, {
      roomId: 1,
      userId: 1,
      username: 'Alice',
      content: 'Remaining members only'
    });

    assert.equal(alice.receivedMessages.length, 1);
    assert.equal(charlie.receivedMessages.length, 1);
    assert.equal(bob.receivedMessages.length, 0);
  });

  it('does not remove a user from their online-user registry when they leave a room', () => {
    const manager = new ChatManager();
    const alice = new MockSocket('Alice');

    manager.joinRoom(1, alice, { id: 1, username: 'Alice' });
    manager.leaveRoom(alice, 1);

    assert.deepEqual(manager.getRoomMembers(1), []);
    assert.deepEqual(manager.getOnlineUsers(), ['Alice']);
  });

  it('supports leaving without affecting membership in another room for other users', () => {
    const manager = new ChatManager();
    const alice = new MockSocket('Alice');
    const bob = new MockSocket('Bob');

    manager.joinRoom(1, alice, { id: 1, username: 'Alice' });
    manager.joinRoom(1, bob, { id: 2, username: 'Bob' });
    manager.leaveRoom(alice, 1);

    assert.deepEqual(manager.getRoomMembers(1), ['Bob']);

    manager.sendMessage(null, {
      roomId: 1,
      userId: 2,
      username: 'Bob',
      content: 'Bob is still in the room'
    });

    assert.equal(alice.receivedMessages.length, 0);
    assert.equal(bob.receivedMessages.length, 1);
  });
});
