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

function presencePayload(manager, roomId) {
  return {
    type: 'presence',
    roomId,
    members: manager.getRoomMembers(roomId)
  };
}

describe('FR-14: Online user list', () => {
  it('lists usernames of users currently joined to a room', () => {
    const manager = new ChatManager();
    const alice = new MockSocket('Alice');
    const bob = new MockSocket('Bob');

    manager.joinRoom(1, alice, { id: 1, username: 'Alice' });
    manager.joinRoom(1, bob, { id: 2, username: 'Bob' });

    assert.deepEqual(manager.getRoomMembers(1).sort(), ['Alice', 'Bob']);
  });

  it('updates the presence list when a user joins', () => {
    const manager = new ChatManager();
    const alice = new MockSocket('Alice');
    const bob = new MockSocket('Bob');

    manager.joinRoom(1, alice, { id: 1, username: 'Alice' });
    manager.broadcastToRoom(1, presencePayload(manager, 1));

    manager.joinRoom(1, bob, { id: 2, username: 'Bob' });
    manager.broadcastToRoom(1, presencePayload(manager, 1));

    const lastAliceEvent = alice.receivedMessages.at(-1);
    const lastBobEvent = bob.receivedMessages.at(-1);

    assert.equal(lastAliceEvent.type, 'presence');
    assert.deepEqual(lastAliceEvent.members.sort(), ['Alice', 'Bob']);
    assert.equal(lastBobEvent.type, 'presence');
    assert.deepEqual(lastBobEvent.members.sort(), ['Alice', 'Bob']);
  });

  it('updates the presence list when a user leaves', () => {
    const manager = new ChatManager();
    const alice = new MockSocket('Alice');
    const bob = new MockSocket('Bob');

    manager.joinRoom(1, alice, { id: 1, username: 'Alice' });
    manager.joinRoom(1, bob, { id: 2, username: 'Bob' });
    manager.leaveRoom(bob, 1);
    manager.broadcastToRoom(1, presencePayload(manager, 1));

    assert.deepEqual(manager.getRoomMembers(1), ['Alice']);
    assert.equal(alice.receivedMessages.at(-1).type, 'presence');
    assert.deepEqual(alice.receivedMessages.at(-1).members, ['Alice']);
    assert.equal(bob.receivedMessages.length, 0);
  });

  it('updates the presence list when a user disconnects', () => {
    const manager = new ChatManager();
    const alice = new MockSocket('Alice');
    const bob = new MockSocket('Bob');

    manager.joinRoom(1, alice, { id: 1, username: 'Alice' });
    manager.joinRoom(1, bob, { id: 2, username: 'Bob' });

    // Mirrors the server disconnect sequence: remove online state,
    // remove room membership, then broadcast the updated presence list.
    manager.removeOnlineUser(bob);
    manager.leaveRoom(bob, 1);
    manager.broadcastToRoom(1, presencePayload(manager, 1));

    assert.deepEqual(manager.getRoomMembers(1), ['Alice']);
    assert.deepEqual(manager.getOnlineUsers(), ['Alice']);
    assert.deepEqual(alice.receivedMessages.at(-1), {
      type: 'presence',
      roomId: 1,
      members: ['Alice']
    });
  });

  it('does not include users from another room', () => {
    const manager = new ChatManager();
    const alice = new MockSocket('Alice');
    const bob = new MockSocket('Bob');
    const charlie = new MockSocket('Charlie');

    manager.joinRoom(1, alice, { id: 1, username: 'Alice' });
    manager.joinRoom(1, bob, { id: 2, username: 'Bob' });
    manager.joinRoom(2, charlie, { id: 3, username: 'Charlie' });

    assert.deepEqual(manager.getRoomMembers(1).sort(), ['Alice', 'Bob']);
    assert.deepEqual(manager.getRoomMembers(2), ['Charlie']);
  });

  it('does not duplicate a username when the same user has multiple connections', () => {
    const manager = new ChatManager();
    const firstConnection = new MockSocket('Alice-1');
    const secondConnection = new MockSocket('Alice-2');

    manager.joinRoom(1, firstConnection, { id: 1, username: 'Alice' });
    manager.joinRoom(1, secondConnection, { id: 1, username: 'Alice' });

    assert.deepEqual(manager.getRoomMembers(1), ['Alice']);
  });
});
