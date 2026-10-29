const crypto = require('node:crypto');

/**
 * Hash password with random salt
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password against stored hash
 */
function verifyPassword(password, stored) {
  const [salt, key] = stored.split(':');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(hash, 'hex'));
}

/**
 * Validates registration input according to FR-01:
 * Username: 3 to 20 chars (letters, digits, and underscore only)
 * Password: 8 to 64 chars
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

  return { valid: true, cleanUsername };
}

/**
 * Registers a new user.
 * Implements FR-02:
 * "The system shall reject a registration whose username already exists,
 *  compared without regard to letter case, and shall display the message 'Username already taken'."
 *
 * @param {object} db - DatabaseSync instance
 * @param {string} username - Submitted username
 * @param {string} password - Submitted password
 * @returns {object} { success: boolean, message?: string, user?: object }
 */
function registerUser(db, username, password) {
  // 1. Basic validation (FR-01)
  const validation = validateRegistrationInput(username, password);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const targetUsername = validation.cleanUsername;

  // 2. FR-02: Check for existing username (case-insensitive)
  // SQLite's COLLATE NOCASE or LOWER() ensures case-insensitivity
  const checkStmt = db.prepare('SELECT id, username FROM users WHERE LOWER(username) = LOWER(?)');
  const existingUser = checkStmt.get(targetUsername);

  if (existingUser) {
    return {
      success: false,
      message: 'Username already taken' // Exact required string from FR-02
    };
  }

  // 3. Hash password and insert user (SR-01)
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

/**
 * Authenticate a user with username and password (FR-03)
 */
function loginUser(db, username, password) {
  if (!username || !password) {
    return { success: false, message: 'Username and password are required' };
  }

  const stmt = db.prepare('SELECT id, username, password_hash FROM users WHERE LOWER(username) = LOWER(?)');
  const user = stmt.get(username.trim());

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
  validateRegistrationInput,
  registerUser,
  loginUser,
  hashPassword,
  verifyPassword
};
