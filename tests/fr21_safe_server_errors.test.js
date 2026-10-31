const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { SAFE_SERVER_ERROR } = require('../src/server');

describe('FR-21: Safe server error messages', () => {
  it('provides a generic message without internal implementation details', () => {
    assert.equal(SAFE_SERVER_ERROR, 'The server could not complete your request. Please try again.');
    assert.doesNotMatch(SAFE_SERVER_ERROR, /stack|exception|sqlite|database|internal|error code/i);
  });

  it('does not expose exception messages or filesystem error codes to clients', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'server.js'), 'utf8');
    assert.doesNotMatch(source, /message:\s*err\.message/);
    assert.doesNotMatch(source, /Server Error:\s*\$\{err\.code\}/);
    assert.match(source, /logServerError\('WebSocket message handling failed', err\)/);
    assert.match(source, /res\.end\(SAFE_SERVER_ERROR\)/);
  });

  it('logs diagnostic details on the server side', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'server.js'), 'utf8');
    assert.match(source, /console\.error/);
    assert.match(source, /logServerError\('API request failed', err\)/);
  });
});
