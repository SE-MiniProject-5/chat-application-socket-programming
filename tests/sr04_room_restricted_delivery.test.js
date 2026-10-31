const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ChatManager } = require('../src/chatManager');

class MockSocket {
  constructor() { this.readyState = 1; this.messages = []; }
  send(message) { this.messages.push(JSON.parse(message)); }
}

describe('SR-04: Room-restricted message delivery', () => {
  it('recognizes membership only in the room the socket joined', () => {
    const manager = new ChatManager();
    const alice = new MockSocket();
    manager.joinRoom(1, alice, { id: 1, username: 'Alice' });

    assert.equal(manager.isSocketInRoom(1, alice), true);
    assert.equal(manager.isSocketInRoom(2, alice), false);
  });

  it('removes membership when the socket leaves the room', () => {
    const manager = new ChatManager();
    const alice = new MockSocket();
    manager.joinRoom(1, alice, { id: 1, username: 'Alice' });

    manager.leaveRoom(alice, 1);
    assert.equal(manager.isSocketInRoom(1, alice), false);
  });

  it('does not deliver room broadcasts to sockets outside the target room', () => {
    const manager = new ChatManager();
    const alice = new MockSocket();
    const bob = new MockSocket();
    manager.joinRoom(1, alice, { id: 1, username: 'Alice' });
    manager.joinRoom(2, bob, { id: 2, username: 'Bob' });

    manager.broadcastToRoom(1, { type: 'chat_message', content: 'room one only' });
    assert.equal(alice.messages.length, 1);
    assert.equal(bob.messages.length, 0);
  });

  it('does not consider an unjoined socket a member of any room', () => {
    const manager = new ChatManager();
    assert.equal(manager.isSocketInRoom(1, new MockSocket()), false);
  });
});
