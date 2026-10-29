const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/db');
const { registerUser } = require('../src/auth');

describe('FR-02: Duplicate username rejection', () => {
  let db;

  beforeEach(() => {
    // In-memory isolated database for each test
    db = createDatabase(':memory:');
  });

  it('TC-FR02-01: Successfully registers a user when the username is unique', () => {
    const result = registerUser(db, 'amartya_07', 'StrongPassword123');
    assert.equal(result.success, true);
    assert.equal(result.user.username, 'amartya_07');
    assert.equal(typeof result.user.id, 'number');

    // Verify row exists in DB
    const row = db.prepare('SELECT id, username FROM users WHERE username = ?').get('amartya_07');
    assert.ok(row);
    assert.equal(row.username, 'amartya_07');
  });

  it('TC-FR02-02: Rejects duplicate registration with exact same username', () => {
    // First registration
    const first = registerUser(db, 'john_doe', 'Password1234');
    assert.equal(first.success, true);

    // Attempt duplicate registration
    const second = registerUser(db, 'john_doe', 'AnotherPassword999');
    assert.equal(second.success, false);
    assert.equal(second.message, 'Username already taken');

    // Verify only 1 row exists
    const count = db.prepare('SELECT COUNT(*) AS total FROM users').get();
    assert.equal(count.total, 1);
  });

  it('TC-FR02-03: Rejects duplicate registration case-insensitively (uppercase vs lowercase)', () => {
    // Register 'AliceSmith'
    const first = registerUser(db, 'AliceSmith', 'Password1234');
    assert.equal(first.success, true);

    // Try all lowercase 'alicesmith'
    const lowerAttempt = registerUser(db, 'alicesmith', 'Password5678');
    assert.equal(lowerAttempt.success, false);
    assert.equal(lowerAttempt.message, 'Username already taken');

    // Try all uppercase 'ALICESMITH'
    const upperAttempt = registerUser(db, 'ALICESMITH', 'Password5678');
    assert.equal(upperAttempt.success, false);
    assert.equal(upperAttempt.message, 'Username already taken');

    // Try mixed case 'aLiCeSmItH'
    const mixedAttempt = registerUser(db, 'aLiCeSmItH', 'Password5678');
    assert.equal(mixedAttempt.success, false);
    assert.equal(mixedAttempt.message, 'Username already taken');

    // Verify only 1 row exists
    const count = db.prepare('SELECT COUNT(*) AS total FROM users').get();
    assert.equal(count.total, 1);
  });

  it('TC-FR02-04: Allows registering a different username', () => {
    const user1 = registerUser(db, 'user_one', 'Password1234');
    const user2 = registerUser(db, 'user_two', 'Password1234');

    assert.equal(user1.success, true);
    assert.equal(user2.success, true);

    const count = db.prepare('SELECT COUNT(*) AS total FROM users').get();
    assert.equal(count.total, 2);
  });
});
