const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/db');
const { registerUser, loginUser, hashPassword, verifyPassword } = require('../src/auth');

describe('SR-01: bcrypt password storage', () => {
  let db;
  beforeEach(() => { db = createDatabase(':memory:'); });

  it('stores a salted bcrypt hash with cost factor 10', () => {
    const result = registerUser(db, 'bcrypt_user', 'Password123');
    assert.equal(result.success, true);
    const row = db.prepare('SELECT password_hash FROM users WHERE username = ?').get('bcrypt_user');
    assert.match(row.password_hash, /^\$2[aby]\$10\$/);
    assert.notEqual(row.password_hash, 'Password123');
    assert.equal(verifyPassword('Password123', row.password_hash), true);
    assert.equal(verifyPassword('wrong-password', row.password_hash), false);
  });

  it('uses a unique salt for identical passwords', () => {
    assert.notEqual(hashPassword('Password123'), hashPassword('Password123'));
  });

  it('upgrades a legacy scrypt hash to bcrypt after a successful login', () => {
    const salt = 'legacy-salt-for-test';
    const crypto = require('node:crypto');
    const legacy = salt + ':' + crypto.scryptSync('Password123', salt, 64).toString('hex');
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('legacy_user', legacy);

    const result = loginUser(db, 'legacy_user', 'Password123');
    assert.equal(result.success, true);
    const upgraded = db.prepare('SELECT password_hash FROM users WHERE username = ?').get('legacy_user');
    assert.match(upgraded.password_hash, /^\$2[aby]\$10\$/);
  });

  it('never returns the password or password hash from registration', () => {
    const result = registerUser(db, 'safe_user', 'Password123');
    assert.equal(Object.hasOwn(result, 'password'), false);
    assert.equal(Object.hasOwn(result, 'password_hash'), false);
    assert.equal(Object.hasOwn(result.user, 'password_hash'), false);
  });
});
