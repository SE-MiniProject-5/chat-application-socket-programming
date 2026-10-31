const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/db');
const { registerUser } = require('../src/auth');
const { createSessionManager } = require('../src/sessionManager');
const { resolveSessionUser } = require('../src/server');

describe('SR-03: Server-assigned sender identity', () => {
  it('resolves the canonical username and user ID from a valid session token', () => {
    const db = createDatabase(':memory:');
    const registered = registerUser(db, 'trusted_user', 'Password123');
    const sessions = createSessionManager();
    const token = sessions.create(registered.user.id);

    const authenticatedUser = resolveSessionUser(db, sessions, token);
    assert.deepEqual(authenticatedUser, {
      id: registered.user.id,
      username: 'trusted_user'
    });
  });

  it('does not accept an invalid or missing session token', () => {
    const db = createDatabase(':memory:');
    const sessions = createSessionManager();
    assert.equal(resolveSessionUser(db, sessions, 'forged-token'), null);
    assert.equal(resolveSessionUser(db, sessions, null), null);
  });

  it('does not use a client-provided username or user ID to resolve identity', () => {
    const db = createDatabase(':memory:');
    const registered = registerUser(db, 'actual_user', 'Password123');
    const sessions = createSessionManager();
    const token = sessions.create(registered.user.id);

    // The identity resolver accepts only the server-issued token; payload
    // fields such as username/userId are never part of its input.
    const payload = { token, username: 'admin', userId: 9999 };
    const authenticatedUser = resolveSessionUser(db, sessions, payload.token);

    assert.equal(authenticatedUser.username, 'actual_user');
    assert.equal(authenticatedUser.id, registered.user.id);
  });

  it('rejects a token after its session has been invalidated', () => {
    const db = createDatabase(':memory:');
    const registered = registerUser(db, 'expired_user', 'Password123');
    const sessions = createSessionManager();
    const token = sessions.create(registered.user.id);

    assert.equal(sessions.invalidate(token), true);
    assert.equal(resolveSessionUser(db, sessions, token), null);
  });
});
