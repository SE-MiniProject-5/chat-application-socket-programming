const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createDatabase } = require('../src/db');

describe('NR-06: First-use success', () => {
  it('provides a ready-to-use General room in a persistent database', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-nr06-'));
    const dbPath = path.join(dir, 'chat.db');
    const db = createDatabase(dbPath);
    const room = db.prepare('SELECT name FROM rooms WHERE LOWER(name) = LOWER(?)').get('General');
    assert.ok(room);
    assert.equal(room.name, 'General');
    db.close();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('does not seed rooms into isolated in-memory test databases', () => {
    const db = createDatabase(':memory:');
    const count = db.prepare('SELECT COUNT(*) AS total FROM rooms').get();
    assert.equal(count.total, 0);
    db.close();
  });

  it('contains a no-instructions three-step quick-start flow', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
    assert.match(html, /Quick start — 3 easy steps/);
    assert.match(html, /Create an account/);
    assert.match(html, /Join a room/);
    assert.match(html, /Send a message/);
    assert.match(html, /# General/);
  });

  it('automatically joins a ready room after successful registration', () => {
    const app = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
    assert.match(app, /fetchRooms\(\{ autoJoin: true \}\)/);
    assert.match(app, /options\.autoJoin/);
    assert.match(app, /preferredRoom/);
  });
});
