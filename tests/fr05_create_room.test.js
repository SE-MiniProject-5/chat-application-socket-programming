const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/db');
const { createRoom, listRooms, validateRoomName } = require('../src/rooms');

describe('FR-05: Create chat room', () => {
  let db;

  beforeEach(() => {
    // In-memory isolated database for each test
    db = createDatabase(':memory:');
  });

  it('TC-FR05-01: Successfully creates a room with a valid 3-30 character name', () => {
    const result = createRoom(db, 'General Discussion');
    assert.equal(result.success, true);
    assert.equal(result.room.name, 'General Discussion');
    assert.equal(typeof result.room.id, 'number');

    // Verify row in DB
    const row = db.prepare('SELECT id, name FROM rooms WHERE name = ?').get('General Discussion');
    assert.ok(row);
    assert.equal(row.name, 'General Discussion');
  });

  it('TC-FR05-02: Rejects duplicate room creation with exact same name', () => {
    const first = createRoom(db, 'Developers');
    assert.equal(first.success, true);

    const duplicate = createRoom(db, 'Developers');
    assert.equal(duplicate.success, false);
    assert.equal(duplicate.message, 'Room name already exists');

    // Verify only one room was inserted
    const count = db.prepare('SELECT COUNT(*) AS total FROM rooms').get();
    assert.equal(count.total, 1);
  });

  it('TC-FR05-03: Rejects duplicate room name case-insensitively (e.g. general vs GENERAL)', () => {
    const first = createRoom(db, 'Project Team');
    assert.equal(first.success, true);

    // Lowercase
    const lowerAttempt = createRoom(db, 'project team');
    assert.equal(lowerAttempt.success, false);
    assert.equal(lowerAttempt.message, 'Room name already exists');

    // Uppercase
    const upperAttempt = createRoom(db, 'PROJECT TEAM');
    assert.equal(upperAttempt.success, false);
    assert.equal(upperAttempt.message, 'Room name already exists');

    // Mixed case
    const mixedAttempt = createRoom(db, 'pRoJeCt TeAm');
    assert.equal(mixedAttempt.success, false);
    assert.equal(mixedAttempt.message, 'Room name already exists');

    // Verify only one room in DB
    const count = db.prepare('SELECT COUNT(*) AS total FROM rooms').get();
    assert.equal(count.total, 1);
  });

  it('TC-FR05-04: Rejects room name shorter than 3 characters', () => {
    const shortAttempt1 = createRoom(db, 'ab');
    assert.equal(shortAttempt1.success, false);
    assert.equal(shortAttempt1.message, 'Room name must be between 3 and 30 characters');

    const shortAttempt2 = createRoom(db, 'a');
    assert.equal(shortAttempt2.success, false);
    assert.equal(shortAttempt2.message, 'Room name must be between 3 and 30 characters');

    const emptyAttempt = createRoom(db, '  ');
    assert.equal(emptyAttempt.success, false);
    assert.equal(emptyAttempt.message, 'Room name must be between 3 and 30 characters');

    const count = db.prepare('SELECT COUNT(*) AS total FROM rooms').get();
    assert.equal(count.total, 0);
  });

  it('TC-FR05-05: Rejects room name longer than 30 characters', () => {
    const longName = 'A'.repeat(31);
    const longAttempt = createRoom(db, longName);
    assert.equal(longAttempt.success, false);
    assert.equal(longAttempt.message, 'Room name must be between 3 and 30 characters');

    // Exactly 30 characters is allowed
    const maxValidName = 'A'.repeat(30);
    const validAttempt = createRoom(db, maxValidName);
    assert.equal(validAttempt.success, true);
    assert.equal(validAttempt.room.name, maxValidName);
  });

  it('TC-FR05-06: Correctly lists all created rooms (FR-06 verification)', () => {
    createRoom(db, 'Room One');
    createRoom(db, 'Room Two');
    createRoom(db, 'Room Three');

    const list = listRooms(db);
    assert.equal(list.success, true);
    assert.equal(list.rooms.length, 3);
    assert.equal(list.rooms[0].name, 'Room One');
    assert.equal(list.rooms[1].name, 'Room Two');
    assert.equal(list.rooms[2].name, 'Room Three');
  });
});
