const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/db');
const { ChatManager } = require('../src/chatManager');
const { createRoom } = require('../src/rooms');
const { registerUser } = require('../src/auth');

// Mock WebSocket client: records every payload it is sent
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

const roomMessages = (sock) => sock.receivedMessages.filter((m) => m.type === 'chat_message');

describe('NR-03: Delivery completeness and order (100%, in server order, no duplicates)', () => {
  let db;
  let chatManager;
  let roomId;
  let users;
  let sockets;

  beforeEach(() => {
    db = createDatabase(':memory:');
    chatManager = new ChatManager();
    roomId = createRoom(db, 'Load Room').room.id;

    users = ['Alice', 'Bob', 'Charlie', 'Dan'].map(
      (name) => registerUser(db, name, 'Password123').user
    );
    sockets = users.map((u) => new MockSocket(u.username));
    users.forEach((u, i) => chatManager.joinRoom(roomId, sockets[i], u));
  });

  it('TC-NR03-01: 100 numbered messages reach every recipient exactly once', () => {
    for (let i = 1; i <= 100; i++) {
      chatManager.sendMessage(db, {
        roomId,
        userId: users[0].id,
        username: 'Alice',
        content: `msg-${i}`
      });
    }

    for (const sock of sockets) {
      const got = roomMessages(sock).map((m) => m.content);
      assert.equal(got.length, 100, `${sock.name} should receive all 100`);
      assert.equal(new Set(got).size, 100, `${sock.name} should receive no duplicates`);
    }
  });

  it('TC-NR03-02: every recipient sees messages in the order the server received them (interleaved senders)', () => {
    const expected = [];
    for (let i = 1; i <= 100; i++) {
      const u = users[i % users.length];
      chatManager.sendMessage(db, { roomId, userId: u.id, username: u.username, content: `msg-${i}` });
      expected.push(`msg-${i}`);
    }

    for (const sock of sockets) {
      assert.deepEqual(roomMessages(sock).map((m) => m.content), expected, `${sock.name} order`);
    }
  });

  it('TC-NR03-03: delivered seq numbers are strictly increasing and match stored order', () => {
    for (let i = 1; i <= 20; i++) {
      chatManager.sendMessage(db, { roomId, userId: users[1].id, username: 'Bob', content: `m${i}` });
    }
    const seqs = roomMessages(sockets[0]).map((m) => m.seq);
    for (let i = 1; i < seqs.length; i++) assert.ok(seqs[i] > seqs[i - 1]);

    const stored = chatManager.getStoredMessages(db, roomId).map((m) => m.content);
    assert.deepEqual(roomMessages(sockets[0]).map((m) => m.content), stored);
  });

  it('TC-NR03-04: seq is assigned in order even without a database', () => {
    const cm = new ChatManager();
    const s = new MockSocket('x');
    cm.joinRoom(7, s, { id: 1, username: 'Alice' });
    for (let i = 1; i <= 10; i++) cm.sendMessage(null, { roomId: 7, userId: 1, username: 'Alice', content: `n${i}` });
    assert.deepEqual(roomMessages(s).map((m) => m.seq), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('TC-NR03-05: a socket re-joining the same room is registered once and gets each message once', () => {
    chatManager.joinRoom(roomId, sockets[1], users[1]); // Bob joins again
    chatManager.joinRoom(roomId, sockets[1], users[1]);
    chatManager.sendMessage(db, { roomId, userId: users[0].id, username: 'Alice', content: 'once' });
    assert.equal(roomMessages(sockets[1]).length, 1);
  });

  it('TC-NR03-06: delivery report shows every connected member was reached', () => {
    const res = chatManager.sendMessage(db, { roomId, userId: users[0].id, username: 'Alice', content: 'report' });
    assert.deepEqual(res.delivery, { attempted: 4, delivered: 4, failed: 0 });
  });

  it('TC-NR03-07: a failing socket does not stop delivery to the others, and is reported', () => {
    sockets[1].send = () => { throw new Error('broken pipe'); };
    const res = chatManager.sendMessage(db, { roomId, userId: users[0].id, username: 'Alice', content: 'resilient' });
    assert.equal(res.delivery.failed, 1);
    assert.equal(res.delivery.delivered, 3);
    assert.equal(roomMessages(sockets[2]).length, 1);
    assert.equal(roomMessages(sockets[3]).length, 1);
  });

  it('TC-NR03-08: a disconnected (closed) member is not counted; connected members still get everything', () => {
    sockets[3].readyState = 3; // CLOSED
    for (let i = 1; i <= 10; i++) {
      chatManager.sendMessage(db, { roomId, userId: users[0].id, username: 'Alice', content: `c${i}` });
    }
    assert.equal(roomMessages(sockets[2]).length, 10);
    assert.equal(roomMessages(sockets[3]).length, 0);
  });

  it('TC-NR03-09: private messages arrive once, in order, to sender and recipient', () => {
    chatManager.registerOnlineUser(sockets[0], users[0]);
    chatManager.registerOnlineUser(sockets[1], users[1]);
    for (let i = 1; i <= 50; i++) {
      chatManager.sendPrivateMessage(db, {
        senderSocket: sockets[0],
        sender: users[0],
        recipientUsername: 'Bob',
        content: `pm-${i}`
      });
    }
    const pm = (s) => s.receivedMessages.filter((m) => m.type === 'private_message').map((m) => m.content);
    const expected = Array.from({ length: 50 }, (_, i) => `pm-${i + 1}`);
    assert.deepEqual(pm(sockets[1]), expected);
    assert.deepEqual(pm(sockets[0]), expected);
  });

  it('TC-NR03-10: private message is not duplicated when the recipient has several tabs open', () => {
    const bobTab2 = new MockSocket('Bob-2');
    chatManager.registerOnlineUser(sockets[0], users[0]);
    chatManager.registerOnlineUser(sockets[1], users[1]);
    chatManager.registerOnlineUser(bobTab2, users[1]);
    chatManager.sendPrivateMessage(db, {
      senderSocket: sockets[0], sender: users[0], recipientUsername: 'Bob', content: 'hi'
    });
    assert.equal(sockets[1].receivedMessages.length, 1);
    assert.equal(bobTab2.receivedMessages.length, 1);
    assert.equal(sockets[0].receivedMessages.length, 1);
  });

  it('TC-NR03-11: rejected (invalid) messages are not delivered or stored', () => {
    const res = chatManager.sendMessage(db, { roomId, userId: users[0].id, username: 'Alice', content: '   ' });
    assert.equal(res.success, false);
    assert.equal(sockets.reduce((n, s) => n + s.receivedMessages.length, 0), 0);
    assert.equal(chatManager.getStoredMessages(db, roomId).length, 0);
  });
});
