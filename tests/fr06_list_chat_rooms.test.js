const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createDatabase } = require('../src/db');
const { createRoom, listRooms } = require('../src/rooms');

describe('FR-06: List chat rooms', () => {
  let db;
  beforeEach(() => { db = createDatabase(':memory:'); });

  it('returns an empty list when no rooms exist', () => {
    assert.deepEqual(listRooms(db), { success: true, rooms: [] });
  });

  it('returns every existing room in stable creation order with its details', () => {
    createRoom(db, 'General');
    createRoom(db, 'Study Group');
    createRoom(db, 'Gaming');

    const result = listRooms(db);
    assert.equal(result.success, true);
    assert.deepEqual(result.rooms.map(room => room.name), ['General', 'Study Group', 'Gaming']);
    assert.ok(result.rooms.every(room => Number.isInteger(room.id)));
  });
});
