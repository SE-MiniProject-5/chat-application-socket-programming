const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LOCKOUT_MS = 5 * 60 * 1000;

/**
 * Track consecutive failed login attempts by normalized username.
 * The injected clock makes expiry behavior deterministic in tests.
 */
function createLoginAttemptLimiter(options = {}) {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const lockoutMs = options.lockoutMs ?? DEFAULT_LOCKOUT_MS;
  const now = options.now ?? Date.now;
  const attempts = new Map();

  function normalize(username) {
    return typeof username === 'string' ? username.trim().toLowerCase() : '';
  }

  function getStatus(username) {
    const key = normalize(username);
    if (!key) return { locked: false, attemptsRemaining: maxAttempts };
    const entry = attempts.get(key);
    if (!entry) return { locked: false, attemptsRemaining: maxAttempts };

    if (entry.lockedUntil && now() >= entry.lockedUntil) {
      attempts.delete(key);
      return { locked: false, attemptsRemaining: maxAttempts };
    }

    if (entry.lockedUntil) {
      return {
        locked: true,
        retryAfterMs: Math.max(0, entry.lockedUntil - now()),
        attemptsRemaining: 0
      };
    }

    return {
      locked: false,
      attemptsRemaining: Math.max(0, maxAttempts - entry.failures)
    };
  }

  function recordFailure(username) {
    const key = normalize(username);
    if (!key) return getStatus(username);
    const status = getStatus(key);
    if (status.locked) return status;

    const entry = attempts.get(key) || { failures: 0, lockedUntil: 0 };
    entry.failures += 1;
    if (entry.failures >= maxAttempts) {
      entry.lockedUntil = now() + lockoutMs;
    }
    attempts.set(key, entry);
    return getStatus(key);
  }

  function recordSuccess(username) {
    const key = normalize(username);
    if (key) attempts.delete(key);
  }

  return { getStatus, recordFailure, recordSuccess };
}

module.exports = {
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_LOCKOUT_MS,
  createLoginAttemptLimiter
};
