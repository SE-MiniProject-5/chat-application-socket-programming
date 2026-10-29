/**
 * Room management service implementing FR-05:
 * "The system shall allow a User to create a chat room with a name of 3 to 30 characters,
 *  and shall reject a name that already exists with the message 'Room name already exists'."
 */

/**
 * Validates room name length (3 to 30 characters)
 */
function validateRoomName(name) {
  if (typeof name !== 'string') {
    return { valid: false, message: 'Room name must be a valid string' };
  }

  const cleanName = name.trim();

  if (cleanName.length < 3 || cleanName.length > 30) {
    return {
      valid: false,
      message: 'Room name must be between 3 and 30 characters'
    };
  }

  return { valid: true, cleanName };
}

/**
 * Creates a new chat room.
 * Implements FR-05 requirement:
 * Rejects duplicate room name (case-insensitive) with exact message "Room name already exists"
 *
 * @param {object} db - DatabaseSync instance
 * @param {string} roomName - Name of the room
 * @param {number|null} createdBy - User ID of creator (optional)
 * @returns {object} { success: boolean, message?: string, room?: object }
 */
function createRoom(db, roomName, createdBy = null) {
  // 1. Validate length (3-30 characters)
  const validation = validateRoomName(roomName);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  const cleanName = validation.cleanName;

  // 2. FR-05: Check if room name already exists (case-insensitive)
  const checkStmt = db.prepare('SELECT id, name FROM rooms WHERE LOWER(name) = LOWER(?)');
  const existingRoom = checkStmt.get(cleanName);

  if (existingRoom) {
    return {
      success: false,
      message: 'Room name already exists' // Exact required string from FR-05
    };
  }

  // 3. Insert room
  const insertStmt = db.prepare('INSERT INTO rooms (name, created_by) VALUES (?, ?)');
  const result = insertStmt.run(cleanName, createdBy);

  return {
    success: true,
    message: 'Room created successfully',
    room: {
      id: Number(result.lastInsertRowid),
      name: cleanName,
      created_by: createdBy
    }
  };
}

/**
 * Lists all existing chat rooms (FR-06)
 */
function listRooms(db) {
  const stmt = db.prepare('SELECT id, name, created_by, created_at FROM rooms ORDER BY id ASC');
  const rooms = stmt.all();
  return { success: true, rooms };
}

module.exports = {
  validateRoomName,
  createRoom,
  listRooms
};
