const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function loadClient() {
  const elements = {
    'connection-status': {
      textContent: '',
      className: '',
      attributes: {},
      setAttribute(name, value) { this.attributes[name] = value; }
    },
    'message-form': {
      button: {
        disabled: false,
        attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; }
      }
    }
  };
  const context = {
    console,
    sessionStorage: { getItem() { return null; }, setItem() {}, removeItem() {} },
    document: {
      getElementById(id) { return elements[id] || null; },
      querySelector(selector) {
        return selector === '#message-form button[type="submit"]'
          ? elements['message-form'].button : null;
      }
    },
    window: { location: { protocol: 'http:', host: 'localhost' } },
    WebSocket: { OPEN: 1, CONNECTING: 0 },
    setTimeout,
    clearTimeout,
    fetch: async () => ({ ok: true, json: async () => ({}) })
  };
  vm.createContext(context);
  const source = fs.readFileSync(path.join(__dirname, '../public/app.js'), 'utf8');
  vm.runInContext(source, context);
  return { context, elements };
}

describe('FR-16: Connection state indicator', () => {
  it('shows Connected and enables Send only while connected', () => {
    const { context, elements } = loadClient();
    context.updateConnectionState('Connected');

    assert.equal(elements['connection-status'].textContent, 'Connected');
    assert.equal(elements['connection-status'].className, 'connection-status connected');
    assert.equal(elements['message-form'].button.disabled, false);
    assert.equal(elements['message-form'].button.attributes['aria-disabled'], 'false');
  });

  it('shows Reconnecting and disables Send', () => {
    const { context, elements } = loadClient();
    context.updateConnectionState('Reconnecting');

    assert.equal(elements['connection-status'].textContent, 'Reconnecting');
    assert.equal(elements['connection-status'].className, 'connection-status reconnecting');
    assert.equal(elements['message-form'].button.disabled, true);
  });

  it('shows Disconnected and disables Send', () => {
    const { context, elements } = loadClient();
    context.updateConnectionState('Disconnected');

    assert.equal(elements['connection-status'].textContent, 'Disconnected');
    assert.equal(elements['connection-status'].className, 'connection-status disconnected');
    assert.equal(elements['message-form'].button.disabled, true);
  });

  it('does not send a room message while the socket is unavailable', async () => {
    const { context, elements } = loadClient();
    let prevented = false;
    context.currentRoom = { id: 1 };
    context.socket = null;
    elements['message-form'] = elements['message-form'] || {};
    context.document.getElementById = id => id === 'message-input'
      ? { value: 'hello' } : id === 'alert-box'
        ? { textContent: '', className: '' } : null;

    await context.handleSendMessage({ preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(context.document.getElementById('alert-box').textContent,
      'You are disconnected. Reconnect before sending messages.');
  });
});
