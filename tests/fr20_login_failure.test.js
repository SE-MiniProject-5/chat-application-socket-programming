const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/db');
const { registerUser, loginUser } = require('../src/auth');

describe('FR-20: Login failure message', () => {
  let db;

  beforeEach(() => {
    db = createDatabase(':memory:');
    // Register a valid user for testing
    registerUser(db, 'amartya_07', 'SecretPassword123');
  });

  it('TC-FR20-01: Rejects login with non-existent username with "Invalid username or password"', () => {
    const result = loginUser(db, 'unknown_user', 'SomePassword123');
    assert.equal(result.success, false);
    // FR-20 exact required message
    assert.equal(result.message, 'Invalid username or password');
  });

  it('TC-FR20-02: Rejects login with existing username but wrong password with "Invalid username or password"', () => {
    const result = loginUser(db, 'amartya_07', 'WrongPassword999');
    assert.equal(result.success, false);
    // FR-20 exact required message
    assert.equal(result.message, 'Invalid username or password');
  });

  it('TC-FR20-03: Does not reveal which of the two (username or password) was wrong', () => {
    const wrongUserResult = loginUser(db, 'non_existent_user', 'SecretPassword123');
    const wrongPassResult = loginUser(db, 'amartya_07', 'wrong_pass');

    // Both error messages must be identical to satisfy FR-20
    assert.equal(wrongUserResult.message, 'Invalid username or password');
    assert.equal(wrongPassResult.message, 'Invalid username or password');
    assert.equal(wrongUserResult.message, wrongPassResult.message);
  });

  it('TC-FR20-04: Rejects empty or whitespace credentials with "Invalid username or password"', () => {
    const emptyUser = loginUser(db, '', 'SecretPassword123');
    assert.equal(emptyUser.success, false);
    assert.equal(emptyUser.message, 'Invalid username or password');

    const emptyPass = loginUser(db, 'amartya_07', '');
    assert.equal(emptyPass.success, false);
    assert.equal(emptyPass.message, 'Invalid username or password');

    const whitespaceUser = loginUser(db, '   ', 'SecretPassword123');
    assert.equal(whitespaceUser.success, false);
    assert.equal(whitespaceUser.message, 'Invalid username or password');
  });

  it('TC-FR20-05: Successfully authenticates valid credentials', () => {
    const result = loginUser(db, 'amartya_07', 'SecretPassword123');
    assert.equal(result.success, true);
    assert.equal(result.user.username, 'amartya_07');
    assert.equal(result.message, 'Login successful');
  });

  it('TC-FR20-06: Successfully authenticates case-insensitive username with correct password', () => {
    const result = loginUser(db, 'AMARTYA_07', 'SecretPassword123');
    assert.equal(result.success, true);
    assert.equal(result.user.username, 'amartya_07');
  });
});
