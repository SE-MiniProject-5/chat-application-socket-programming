const bcrypt = require('bcryptjs');

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

/** Verify a plaintext password against a bcrypt hash. */
function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || typeof storedHash !== 'string') return false;
  try {
    return bcrypt.compareSync(password, storedHash);
  } catch {
    return false;
  }
}

/**
 * Validates registration input according to FR-01 and SEC-REQ-05.
 * Username: 3 to 20 chars (letters, digits, underscore only)
 * Password: 8 to 64 chars and within bcrypt's 72-byte input limit
 */
function validateRegistrationInput(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') {
    return { valid: false, message: 'Invalid input types' };
  }

  const cleanUsername = username.trim();
  const usernameRegex = /^[A-Za-z0-9_]{3,20}$/;

  if (!usernameRegex.test(cleanUsername)) {
    return {
      valid: false,
      message: 'Username must be 3-20 characters long and contain only letters, numbers, and underscores'
    };
  }

  if (password.length < 8 || password.length > 64) {
    return {
      valid: false,
      message: 'Password must be between 8 and 64 characters long'
    };
  }

  if (bcrypt.truncates(password)) {
    return {
      valid: false,
      message: 'Password is too long for secure hashing'
    };
  }

  return { valid: true, cleanUsername };
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
  if (typeof username !== 'string' || typeof password !== 'string') {
    return { success: false, message: 'Invalid username or password' };
  }

  const cleanUsername = username.trim();
  if (cleanUsername.length === 0 || password.length === 0) {
    return { success: false, message: 'Invalid username or password' };
  }

  const stmt = db.prepare('SELECT id, username, password_hash FROM users WHERE LOWER(username) = LOWER(?)');
  const user = stmt.get(cleanUsername);

  if (!user || !verifyPassword(password, user.password_hash)) {
    return { success: false, message: 'Invalid username or password' };
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
