const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/db');
const { registerUser, loginUser } = require('../src/auth');

describe('FR-03: User login', () => {
  let db;
  beforeEach(() => {
    db = createDatabase(':memory:');
    registerUser(db, 'login_user', 'Password123');
  });

  it('authenticates a user with valid credentials and returns their identity', () => {
    const result = loginUser(db, 'login_user', 'Password123');
    assert.equal(result.success, true);
    assert.deepEqual(result.user, { id: 1, username: 'login_user' });
  });

  it('accepts username matching without regard to letter case', () => {
    const result = loginUser(db, 'LOGIN_USER', 'Password123');
    assert.equal(result.success, true);
    assert.equal(result.user.username, 'login_user');
  });

  it('rejects an incorrect password', () => {
    const result = loginUser(db, 'login_user', 'WrongPassword');
    assert.equal(result.success, false);
  });

  it('rejects an unknown username', () => {
    const result = loginUser(db, 'unknown_user', 'Password123');
    assert.equal(result.success, false);
  });
});
