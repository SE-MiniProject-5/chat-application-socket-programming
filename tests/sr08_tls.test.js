const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createTransport, isLocalhostHost } = require('../src/tls');

describe('SR-08 / SEC-REQ-08: TLS beyond localhost', () => {
  it('allows HTTP only for localhost deployment targets', () => {
    assert.equal(isLocalhostHost('localhost'), true);
    assert.equal(isLocalhostHost('127.0.0.1'), true);
    assert.equal(isLocalhostHost('::1'), true);
    assert.equal(isLocalhostHost('[::1]'), true);
    assert.equal(isLocalhostHost('192.168.1.25'), false);
    assert.equal(isLocalhostHost('chat.example.com'), false);

    const local = createTransport(() => {}, { host: 'localhost' });
    assert.equal(local.tlsEnabled, false);
    assert.equal(local.protocol, 'http');
    local.server.close();
  });

  it('refuses non-localhost deployment without TLS certificate configuration', () => {
    assert.throws(
      () => createTransport(() => {}, { host: '192.168.1.25' }),
      /TLS is required.*TLS_KEY_PATH.*TLS_CERT_PATH/
    );
  });

  it('uses HTTPS/WSS configuration for non-localhost deployments', () => {
    const appSource = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
    const tlsSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'tls.js'), 'utf8');
    const serverSource = fs.readFileSync(path.join(__dirname, '..', 'src', 'server.js'), 'utf8');

    assert.match(appSource, /window\.location\.protocol === 'https:' \? 'wss:' : 'ws:'/);
    assert.match(tlsSource, /https\.createServer/);
    assert.match(tlsSource, /TLS_KEY_PATH/);
    assert.match(tlsSource, /TLS_CERT_PATH/);
    assert.match(serverSource, /createTransport\(requestHandler\)/);
    assert.match(serverSource, /SEC-REQ-08/);
  });
});
