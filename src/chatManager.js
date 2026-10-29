/**
 * ChatManager implementing FR-11:
 * "The system shall allow two or more Users to be members of the same room at the same time,
 *  and shall display the sender's username with every message."
 */

class ChatManager {
  constructor() {
    // Map of roomId -> Map<clientSocket, { userId, username }>
    this.rooms = new Map();
  }

  /**
   * Format timestamp as HH:MM per FR-12
   */
  formatTimestamp(date = new Date()) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Adds a user to a room.
   * Allows two or more users to join the same room simultaneously.
   */
  joinRoom(roomId, clientSocket, user) {
    const rId = String(roomId);
    if (!this.rooms.has(rId)) {
      this.rooms.set(rId, new Map());
    }

    const roomMembers = this.rooms.get(rId);
    roomMembers.set(clientSocket, {
      userId: user.id || null,
      username: user.username
    });

    return this.getRoomMembers(rId);
  }

  /**
   * Removes a user/socket from a room or all rooms
   */
  leaveRoom(clientSocket, roomId = null) {
    if (roomId) {
      const rId = String(roomId);
      if (this.rooms.has(rId)) {
        this.rooms.get(rId).delete(clientSocket);
        if (this.rooms.get(rId).size === 0) {
          this.rooms.delete(rId);
        }
      }
    } else {
      // Remove from all rooms
      for (const [rId, members] of this.rooms.entries()) {
        members.delete(clientSocket);
        if (members.size === 0) {
          this.rooms.delete(rId);
        }
      }
    }
  }

  /**
   * Gets the list of online usernames in a room
   */
  getRoomMembers(roomId) {
    const rId = String(roomId);
    if (!this.rooms.has(rId)) {
      return [];
    }

    const members = [];
    for (const member of this.rooms.get(rId).values()) {
      members.push(member.username);
    }
    return [...new Set(members)];
  }

  /**
   * Sends a message into a room and records sender username (FR-11)
   *
   * @param {object} db - DatabaseSync instance
   * @param {object} params - { roomId, userId, username, content }
   * @returns {object} { success: boolean, message?: string, data?: object }
   */
  sendMessage(db, { roomId, userId, username, content }) {
    if (!content || typeof content !== 'string') {
      return { success: false, message: 'Message content cannot be empty' };
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length < 1 || trimmedContent.length > 500) {
      return {
        success: false,
        message: 'Message must be between 1 and 500 characters'
      };
    }

    if (!username) {
      return { success: false, message: 'Sender username is required' };
    }

    const timestamp = this.formatTimestamp();

    // Persist to database if db provided
    let messageId = null;
    if (db) {
      // Check if user_id exists in users table to satisfy foreign key constraint
      let validUserId = null;
      if (userId) {
        const u = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
        if (u) validUserId = u.id;
      }

      const insertStmt = db.prepare(
        'INSERT INTO messages (room_id, user_id, username, content) VALUES (?, ?, ?, ?)'
      );
      const result = insertStmt.run(Number(roomId), validUserId, username, trimmedContent);
      messageId = Number(result.lastInsertRowid);
    }

    // FR-11: message payload includes the sender's username
    const messagePayload = {
      id: messageId,
      roomId: Number(roomId),
      sender: username, // Crucial FR-11 requirement
      userId: userId || null,
      content: trimmedContent,
      timestamp: timestamp
    };

    // Broadcast to all sockets in this room
    this.broadcastToRoom(roomId, {
      type: 'chat_message',
      ...messagePayload
    });

    return {
      success: true,
      data: messagePayload
    };
  }

  /**
   * Broadcasts a JSON message to all active sockets in the room
   */
  broadcastToRoom(roomId, payload) {
    const rId = String(roomId);
    if (!this.rooms.has(rId)) return;

    const data = JSON.stringify(payload);
    for (const socket of this.rooms.get(rId).keys()) {
      try {
        if (typeof socket.send === 'function' && socket.readyState === 1) { // 1 = OPEN
          socket.send(data);
        }
      } catch (err) {
        // Socket error handling
      }
    }
  }

  /**
   * Retrieves stored messages for a room (FR-13)
   */
  getStoredMessages(db, roomId, limit = 50) {
    if (!db) return [];
    const stmt = db.prepare(
      'SELECT id, room_id AS roomId, username AS sender, user_id AS userId, content, created_at AS createdAt FROM messages WHERE room_id = ? ORDER BY id ASC LIMIT ?'
    );
    return stmt.all(Number(roomId), limit);
  }
}

module.exports = { ChatManager };
