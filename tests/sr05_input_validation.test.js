const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createDatabase } = require('../src/db');
const { registerUser, loginUser } = require('../src/auth');
const { createRoom } = require('../src/rooms');
const { ChatManager } = require('../src/chatManager');
const { validateUsername, validatePassword, validateRoomName, validateMessageText } = require('../src/validation');

describe('SR-05 / SEC-REQ-05: input validation', () => {
  it('validates username type, format and length', () => {
    assert.equal(validateUsername(123).valid, false);
    assert.equal(validateUsername('ab').valid, false);
    assert.equal(validateUsername('valid_user').valid, true);
    assert.equal(validateUsername('bad user').valid, false);
    assert.equal(validateUsername('x'.repeat(21)).valid, false);
  });

  it('validates password type and length', () => {
    assert.equal(validatePassword(null).valid, false);
    assert.equal(validatePassword('short').valid, false);
    assert.equal(validatePassword('Password123!').valid, true);
    assert.equal(validatePassword('x'.repeat(65)).valid, false);
  });

  it('validates room names', () => {
    assert.equal(validateRoomName(123).valid, false);
    assert.equal(validateRoomName('ab').valid, false);
    assert.equal(validateRoomName('Study Room').valid, true);
    assert.equal(validateRoomName('x'.repeat(31)).valid, false);
  });

  it('validates message text', () => {
    assert.equal(validateMessageText(undefined).valid, false);
    assert.equal(validateMessageText('').valid, false);
    assert.equal(validateMessageText('Hello').valid, true);
    assert.equal(validateMessageText('x'.repeat(501)).valid, false);
  });

  it('rejects invalid registration and login fields at the service boundary', () => {
    const db = createDatabase(':memory:');
    assert.equal(registerUser(db, 'ab', 'Password123!').success, false);
    assert.equal(registerUser(db, 'ValidUser', 'short').success, false);
    assert.equal(registerUser(db, 'ValidUser', 'Password123!').success, true);
    assert.equal(loginUser(db, 'bad user', 'Password123!').success, false);
    assert.equal(loginUser(db, 'ValidUser', 'short').success, false);
  });

  it('rejects invalid room and message input on the server-side services', () => {
    const db = createDatabase(':memory:');
    const user = registerUser(db, 'RoomOwner', 'Password123!').user;
    assert.equal(createRoom(db, 'ab', user.id).success, false);
    const room = createRoom(db, 'Secure Room', user.id).room;

    const chat = new ChatManager();
    assert.equal(chat.sendMessage(db, {
      roomId: room.id,
      userId: user.id,
      username: user.username,
      content: '<script>alert(1)</script>'
    }).success, true);

    assert.equal(chat.sendMessage(db, {
      roomId: room.id,
      userId: user.id,
      username: user.username,
      content: 'x'.repeat(501)
    }).success, false);
  });

  it('renders user-controlled text with textContent instead of HTML injection', () => {
    const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'app.js'), 'utf8');
    assert.match(source, /text\.textContent\s*=\s*String\(msg\.content/);
    assert.match(source, /sender\.textContent\s*=\s*String\(msg\.sender/);
    assert.doesNotMatch(source, /item\.innerHTML/);
    assert.doesNotMatch(source, /escapeHtml\(/);
  });
});
