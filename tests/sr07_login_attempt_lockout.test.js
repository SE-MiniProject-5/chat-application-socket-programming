const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_MAX_ATTEMPTS,
  DEFAULT_LOCKOUT_MS,
  createLoginAttemptLimiter
} = require('../src/loginAttemptLimiter');
const fs = require('node:fs');
const path = require('node:path');

describe('SR-07: Login attempt lockout', () => {
  it('uses the required threshold and lockout duration', () => {
    assert.equal(DEFAULT_MAX_ATTEMPTS, 5);
    assert.equal(DEFAULT_LOCKOUT_MS, 5 * 60 * 1000);
  });

  it('allows the first four failures and locks after the fifth', () => {
    const limiter = createLoginAttemptLimiter();
    for (let i = 0; i < 4; i++) {
      assert.equal(limiter.recordFailure('Alice').locked, false);
    }
    const status = limiter.recordFailure('Alice');
    assert.equal(status.locked, true);
    assert.equal(status.retryAfterMs, DEFAULT_LOCKOUT_MS);
  });

  it('normalizes usernames case-insensitively and trims whitespace', () => {
    const limiter = createLoginAttemptLimiter();
    for (let i = 0; i < 5; i++) limiter.recordFailure(' Alice ');
    assert.equal(limiter.getStatus('ALICE').locked, true);
  });

  it('tracks failed attempts independently for different usernames', () => {
    const limiter = createLoginAttemptLimiter();
    for (let i = 0; i < 5; i++) limiter.recordFailure('Alice');
    assert.equal(limiter.getStatus('Bob').locked, false);
  });

  it('clears the failure counter after a successful login', () => {
    const limiter = createLoginAttemptLimiter();
    for (let i = 0; i < 4; i++) limiter.recordFailure('Alice');
    limiter.recordSuccess('ALICE');
    for (let i = 0; i < 4; i++) {
      assert.equal(limiter.recordFailure('Alice').locked, false);
    }
    assert.equal(limiter.recordFailure('Alice').locked, true);
  });

  it('automatically unlocks after five minutes', () => {
    let now = 10_000;
    const limiter = createLoginAttemptLimiter({ now: () => now });
    for (let i = 0; i < 5; i++) limiter.recordFailure('Alice');
    now += DEFAULT_LOCKOUT_MS - 1;
    assert.equal(limiter.getStatus('Alice').locked, true);
    now += 1;
    assert.equal(limiter.getStatus('Alice').locked, false);
    assert.equal(limiter.recordFailure('Alice').attemptsRemaining, 4);
  });

  it('does not count an empty username toward a lockout', () => {
    const limiter = createLoginAttemptLimiter();
    for (let i = 0; i < 8; i++) limiter.recordFailure('  ');
    assert.equal(limiter.getStatus('  ').locked, false);
  });

  it('enforces lockout in the HTTP login route and sends Retry-After', () => {
    const server = fs.readFileSync(path.join(__dirname, '..', 'src', 'server.js'), 'utf8');
    assert.match(server, /loginAttemptLimiter\.getStatus\(data\.username\)/);
    assert.match(server, /loginAttemptLimiter\.recordFailure\(data\.username\)/);
    assert.match(server, /loginAttemptLimiter\.recordSuccess\(data\.username\)/);
    assert.match(server, /'Retry-After'/);
    assert.match(server, /res\.writeHead\(429/);
  });
});
