const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ChatManager } = require('../src/chatManager');

describe('FR-07: Join chat room', () => {
  it('allows a user to join a room', () => {
    const manager = new ChatManager();
    const socket = {};
    const members = manager.joinRoom(1, socket, { id: 1, username: 'alice' });

    assert.deepEqual(members, ['alice']);
    assert.deepEqual(manager.getRoomMembers(1), ['alice']);
  });

  it('allows multiple users to join the same room', () => {
    const manager = new ChatManager();
    const alice = {};
    const bob = {};

    manager.joinRoom(1, alice, { id: 1, username: 'alice' });
    const members = manager.joinRoom(1, bob, { id: 2, username: 'bob' });

    assert.deepEqual(members.sort(), ['alice', 'bob']);
  });

  it('moves a connection out of its previous room before joining another', () => {
    const manager = new ChatManager();
    const socket = {};

    manager.joinRoom(1, socket, { id: 1, username: 'alice' });
    manager.joinRoom(2, socket, { id: 1, username: 'alice' });

    assert.deepEqual(manager.getRoomMembers(1), []);
    assert.deepEqual(manager.getRoomMembers(2), ['alice']);
    assert.equal(manager.rooms.has('1'), false);
    assert.equal(manager.rooms.get('2').size, 1);
  });

  it('does not duplicate membership when the same connection rejoins its current room', () => {
    const manager = new ChatManager();
    const socket = {};

    manager.joinRoom(1, socket, { id: 1, username: 'alice' });
    manager.joinRoom(1, socket, { id: 1, username: 'alice' });

    assert.deepEqual(manager.getRoomMembers(1), ['alice']);
    assert.equal(manager.rooms.get('1').size, 1);
  });

  it('keeps other users in the old room when one connection moves away', () => {
    const manager = new ChatManager();
    const alice = {};
    const bob = {};

    manager.joinRoom(1, alice, { id: 1, username: 'alice' });
    manager.joinRoom(1, bob, { id: 2, username: 'bob' });
    manager.joinRoom(2, alice, { id: 1, username: 'alice' });

    assert.deepEqual(manager.getRoomMembers(1), ['bob']);
    assert.deepEqual(manager.getRoomMembers(2), ['alice']);
  });

  it('rejects joining without a socket or authenticated username', () => {
    const manager = new ChatManager();

    assert.throws(() => manager.joinRoom(1, null, { id: 1, username: 'alice' }));
    assert.throws(() => manager.joinRoom(1, {}, null));
    assert.throws(() => manager.joinRoom(1, {}, { id: 1 }));
  });
});
