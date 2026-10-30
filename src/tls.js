const fs = require('node:fs');
const http = require('node:http');
const https = require('node:https');

const LOCALHOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

function normalizeHost(host) {
  return String(host || '').trim().toLowerCase().replace(/^\[|\]$/g, '');
}

function isLocalhostHost(host) {
  return LOCALHOSTS.has(normalizeHost(host));
}

function createTransport(requestHandler, options = {}) {
  const host = options.host || process.env.HOST || '127.0.0.1';

  // SEC-REQ-08: localhost demonstrations may use HTTP; any other bind/deployment
  // target must use TLS so client traffic is HTTPS/WSS rather than HTTP/WS.
  if (isLocalhostHost(host)) {
    return {
      server: http.createServer(requestHandler),
      tlsEnabled: false,
      protocol: 'http'
    };
  }

  const keyPath = options.keyPath || process.env.TLS_KEY_PATH;
  const certPath = options.certPath || process.env.TLS_CERT_PATH;

  if (!keyPath || !certPath) {
    throw new Error(
      'TLS is required when HOST is not localhost. Set TLS_KEY_PATH and TLS_CERT_PATH.'
    );
  }

  if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
    throw new Error(
      `TLS certificate files not found. Expected key at "${keyPath}" and certificate at "${certPath}".`
    );
  }

  return {
    server: https.createServer({
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    }, requestHandler),
    tlsEnabled: true,
    protocol: 'https'
  };
}

module.exports = { createTransport, isLocalhostHost };
