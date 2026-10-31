const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { validateUsername, validatePassword } = require('./validation');

const BCRYPT_COST = 10;

/**
 * Hash a password using bcrypt with the minimum cost required by SEC-REQ-01.
 * Passwords are never returned, logged, or stored in plaintext.
 */
function hashPassword(password) {
  if (typeof password !== 'string') {
    throw new TypeError('Password must be a string');
  }
  if (bcrypt.truncates(password)) {
    throw new Error('Password is too long for bcrypt');
  }
  return bcrypt.hashSync(password, BCRYPT_COST);
}

/**
 * Verify bcrypt hashes and support one-time upgrade of legacy scrypt hashes.
 */
function verifyPassword(password, stored) {
  if (typeof password !== 'string' || typeof stored !== 'string') return false;
  if (/^\$2[aby]\$/.test(stored)) {
    try {
      return bcrypt.compareSync(password, stored);
    } catch {
      return false;
    }
  }

  // Backward compatibility for accounts created before SR-01.
  const [salt, key] = stored.split(':');
  if (!salt || !key) return false;
  const expected = Buffer.from(key, 'hex');
  const actual = crypto.scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

/**
 * Validates registration input according to FR-01 and SEC-REQ-05.
 * Username: 3 to 20 chars (letters, digits, underscore only)
 * Password: 8 to 64 chars and within bcrypt's 72-byte input limit
 */
function validateRegistrationInput(username, password) {
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.valid) return usernameValidation;

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) return passwordValidation;

  if (bcrypt.truncates(password)) {
    return {
      valid: false,
      message: 'Password is too long for secure hashing'
    };
  }

  return { valid: true, cleanUsername: usernameValidation.cleanUsername };
}

function registerUser(db, username, password) {
  const validation = validateRegistrationInput(username, password);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const targetUsername = validation.cleanUsername;
  const checkStmt = db.prepare('SELECT id, username FROM users WHERE LOWER(username) = LOWER(?)');
  const existingUser = checkStmt.get(targetUsername);

  if (existingUser) {
    return { success: false, message: 'Username already taken' };
  }

  const passwordHash = hashPassword(password);
  const insertStmt = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
  const result = insertStmt.run(targetUsername, passwordHash);

  return {
    success: true,
    message: 'User registered successfully',
    user: {
      id: Number(result.lastInsertRowid),
      username: targetUsername
    }
  };
}

function loginUser(db, username, password) {
  const usernameValidation = validateUsername(username);
  const passwordValidation = validatePassword(password);
  if (!usernameValidation.valid || !passwordValidation.valid) {
    return { success: false, message: 'Invalid username or password' };
  }

  const cleanUsername = usernameValidation.cleanUsername;

  const stmt = db.prepare('SELECT id, username, password_hash FROM users WHERE LOWER(username) = LOWER(?)');
  const user = stmt.get(cleanUsername);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return { success: false, message: 'Invalid username or password' };
  }

  if (!/^\$2[aby]\$/.test(user.password_hash)) {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), user.id);
  }

  return {
    success: true,
    message: 'Login successful',
    user: {
      id: user.id,
      username: user.username
    }
  };
}

module.exports = {
  BCRYPT_COST,
  validateRegistrationInput,
  registerUser,
  loginUser,
  hashPassword,
  verifyPassword
};
