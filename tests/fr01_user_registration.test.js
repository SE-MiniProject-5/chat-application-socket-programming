const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

const { createDatabase } = require('../src/db');
const { validateRegistrationInput, registerUser } = require('../src/auth');

describe('FR-01: User registration validation', () => {
  let db;

  beforeEach(() => {
    db = createDatabase(':memory:');
  });

  it('accepts a valid username and password', () => {
    const result = validateRegistrationInput('anagha_01', 'Password123');
    assert.equal(result.valid, true);
    assert.equal(result.cleanUsername, 'anagha_01');
  });

  it('accepts username lengths at both boundaries (3 and 20)', () => {
    assert.equal(validateRegistrationInput('abc', 'Password123').valid, true);
    assert.equal(validateRegistrationInput('a'.repeat(20), 'Password123').valid, true);
  });

  it('rejects usernames shorter than 3 or longer than 20 characters', () => {
    assert.equal(validateRegistrationInput('ab', 'Password123').valid, false);
    assert.equal(validateRegistrationInput('a'.repeat(21), 'Password123').valid, false);
  });

  it('accepts only letters, digits, and underscores in usernames', () => {
    for (const username of ['user-name', 'user.name', 'user@123', 'user name']) {
      assert.equal(
        validateRegistrationInput(username, 'Password123').valid,
        false,
        'Expected username "' + username + '" to be rejected'
      );
    }

    for (const username of ['Alice', 'alice123', 'alice_123']) {
      assert.equal(validateRegistrationInput(username, 'Password123').valid, true);
    }
  });

  it('accepts password lengths at both boundaries (8 and 64)', () => {
    assert.equal(validateRegistrationInput('valid_user', 'a'.repeat(8)).valid, true);
    assert.equal(validateRegistrationInput('valid_user', 'a'.repeat(64)).valid, true);
  });

  it('rejects passwords shorter than 8 or longer than 64 characters', () => {
    assert.equal(validateRegistrationInput('valid_user', 'a'.repeat(7)).valid, false);
    assert.equal(validateRegistrationInput('valid_user', 'a'.repeat(65)).valid, false);
  });

  it('rejects non-string username or password values', () => {
    assert.equal(validateRegistrationInput(123, 'Password123').valid, false);
    assert.equal(validateRegistrationInput('valid_user', null).valid, false);
  });

  it('registers a valid user and stores a password hash instead of the plain password', () => {
    const result = registerUser(db, 'anagha_01', 'Password123');

    assert.equal(result.success, true);
    assert.equal(result.user.username, 'anagha_01');

    const stored = db.prepare(
      'SELECT username, password_hash FROM users WHERE username = ?'
    ).get('anagha_01');

    assert.ok(stored);
    assert.notEqual(stored.password_hash, 'Password123');
  });

  it('does not insert a user when registration input is invalid', () => {
    const result = registerUser(db, 'ab', 'short');

    assert.equal(result.success, false);
    const count = db.prepare('SELECT COUNT(*) AS total FROM users').get();
    assert.equal(count.total, 0);
  });
});
