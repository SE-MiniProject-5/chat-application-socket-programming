const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createSessionManager } = require('../src/sessionManager');

describe('FR-04: User logout sessions', () => {
  it('creates a unique session token for a user', () => {
    const sessions = createSessionManager();
    const first = sessions.create(1);
    const second = sessions.create(1);

    assert.notEqual(first, second);
    assert.equal(sessions.verify(first, 1), true);
    assert.equal(sessions.verify(second, 1), true);
  });

  it('does not verify a token for a different user', () => {
    const sessions = createSessionManager();
    const token = sessions.create(1);

    assert.equal(sessions.verify(token, 2), false);
    assert.equal(sessions.verify('unknown-token', 1), false);
  });

  it('invalidates a token on logout', () => {
    const sessions = createSessionManager();
    const token = sessions.create(1);

    assert.equal(sessions.invalidate(token), true);
    assert.equal(sessions.verify(token, 1), false);
    assert.equal(sessions.invalidate(token), false);
  });

  it('closes sockets attached to a session when it is invalidated', () => {
    const sessions = createSessionManager();
    const token = sessions.create(7);
    const socket = {
      readyState: 1,
      closed: false,
      close(code, reason) {
        this.closed = true;
        this.closeCode = code;
        this.closeReason = reason;
      }
    };

    assert.equal(sessions.attachSocket(token, 7, socket), true);
    assert.equal(sessions.invalidate(token), true);
    assert.equal(socket.closed, true);
    assert.equal(socket.closeCode, 1000);
    assert.equal(socket.closeReason, 'Logged out');
  });

  it('rejects attaching a socket with an invalidated token', () => {
    const sessions = createSessionManager();
    const token = sessions.create(7);
    sessions.invalidate(token);

    const socket = { readyState: 1, close() {} };
    assert.equal(sessions.attachSocket(token, 7, socket), false);
  });
});
