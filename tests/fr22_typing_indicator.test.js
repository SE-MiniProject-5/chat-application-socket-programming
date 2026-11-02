const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { ChatManager } = require('../src/chatManager');
const fs = require('node:fs');
const path = require('node:path');

describe('FR-22: Typing indicator', () => {
  it('broadcasts typing status to other room members, excluding the sender', () => {
    const manager = new ChatManager();
    const received = [];
    const sender = { readyState: 1, send() { received.push('sender'); } };
    const other = { readyState: 1, send(payload) { received.push(JSON.parse(payload)); } };
    manager.joinRoom(1, sender, { id: 1, username: 'Alice' });
    manager.joinRoom(1, other, { id: 2, username: 'Bob' });
    const report = manager.broadcastTyping(1, sender, 'Alice', true);
    assert.equal(report.delivered, 1);
    assert.deepEqual(received, [{ type: 'typing', roomId: 1, username: 'Alice', isTyping: true }]);
  });

  it('does not broadcast to sockets outside the room', () => {
    const manager = new ChatManager();
    let received = 0;
    const sender = { readyState: 1, send() {} };
    const outsider = { readyState: 1, send() { received++; } };
    manager.joinRoom(1, sender, { id: 1, username: 'Alice' });
    manager.registerOnlineUser(outsider, { id: 3, username: 'Carol' });
    manager.broadcastTyping(1, sender, 'Alice', true);
    assert.equal(received, 0);
  });

  it('handles empty rooms without throwing', () => {
    const manager = new ChatManager();
    assert.equal(manager.broadcastTyping(999, {}, 'Alice', true).delivered, 0);
  });

  it('wires client input, server timeout, and accessible indicator', () => {
    const root = path.join(__dirname, '..');
    const app = fs.readFileSync(path.join(root, 'public/app.js'), 'utf8');
    const server = fs.readFileSync(path.join(root, 'src/server.js'), 'utf8');
    const html = fs.readFileSync(path.join(root, 'public/index.html'), 'utf8');
    assert.match(app, /function handleMessageInput\(/);
    assert.match(app, /messageInput\.addEventListener\('input', handleMessageInput\)/);
    assert.match(app, /type: 'typing'/);
    assert.match(server, /setTimeout\(stopTyping, 3000\)/);
    assert.match(html, /id="typing-indicator"[^>]*aria-live="polite"/);
  });
});
