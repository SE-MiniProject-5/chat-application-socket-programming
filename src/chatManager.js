/**
 * ChatManager implementing:
 * - FR-11: "The system shall allow two or more Users to be members of the same room at the same time,
 *   and shall display the sender's username with every message."
 * - FR-23: "The system shall allow a User to send a private text message to one other online User,
 *   visible only to the sender and that recipient."
 */

class ChatManager {
  constructor() {
    // Map of roomId -> Map<clientSocket, { userId, username }>
    this.rooms = new Map();
    // Map of clientSocket -> { userId, username }
    this.onlineUsers = new Map();
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
   * Registers a socket as an online user (FR-23)
   */
  registerOnlineUser(clientSocket, user) {
    if (!user || !user.username) return;
    this.onlineUsers.set(clientSocket, {
      userId: user.id || null,
      username: user.username
    });
  }

  /**
   * Removes a socket from online users
   */
  removeOnlineUser(clientSocket) {
    this.onlineUsers.delete(clientSocket);
  }

  /**
   * Gets list of distinct online usernames
   */
  getOnlineUsers() {
    const usernames = [];
    for (const info of this.onlineUsers.values()) {
      usernames.push(info.username);
    }
    return [...new Set(usernames)];
  }

  /**
   * Finds all active sockets for a specific username (case-insensitive)
   */
  getSocketsByUsername(username) {
    if (!username) return [];
    const target = username.trim().toLowerCase();
    const sockets = [];
    for (const [socket, info] of this.onlineUsers.entries()) {
      if (info.username.toLowerCase() === target) {
        sockets.push(socket);
      }
    }
    return sockets;
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

    this.registerOnlineUser(clientSocket, user);
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
      this.removeOnlineUser(clientSocket);
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

    let messageId = null;
    if (db) {
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

    const messagePayload = {
      id: messageId,
      roomId: Number(roomId),
      sender: username,
      userId: userId || null,
      content: trimmedContent,
      timestamp: timestamp
    };

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
   * Sends a private one-to-one message (FR-23)
   * "visible only to the sender and that recipient"
   *
   * @param {object} db - DatabaseSync instance
   * @param {object} params - { senderSocket, sender, recipientUsername, content }
   * @returns {object} { success: boolean, message?: string, data?: object }
   */
  sendPrivateMessage(db, { senderSocket, sender, recipientUsername, content }) {
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

    if (!recipientUsername || typeof recipientUsername !== 'string') {
      return { success: false, message: 'Recipient username is required' };
    }

    const cleanRecipient = recipientUsername.trim();
    if (sender && sender.username.toLowerCase() === cleanRecipient.toLowerCase()) {
      return { success: false, message: 'Cannot send private message to yourself' };
    }

    // FR-23: Verify recipient is online
    const recipientSockets = this.getSocketsByUsername(cleanRecipient);
    if (recipientSockets.length === 0) {
      return {
        success: false,
        message: `User "${cleanRecipient}" is not currently online`
      };
    }

    const timestamp = this.formatTimestamp();

    // Persist to private_messages table
    let messageId = null;
    if (db) {
      let senderId = null;
      let recipientId = null;

      if (sender && sender.id) {
        const u = db.prepare('SELECT id FROM users WHERE id = ?').get(sender.id);
        if (u) senderId = u.id;
      }

      const recRow = db.prepare('SELECT id, username FROM users WHERE LOWER(username) = LOWER(?)').get(cleanRecipient);
      if (recRow) {
        recipientId = recRow.id;
      }

      const stmt = db.prepare(
        'INSERT INTO private_messages (sender_id, sender_username, recipient_id, recipient_username, content) VALUES (?, ?, ?, ?, ?)'
      );
      const res = stmt.run(senderId, sender.username, recipientId, cleanRecipient, trimmedContent);
      messageId = Number(res.lastInsertRowid);
    }

    const payload = {
      id: messageId,
      sender: sender.username,
      recipient: cleanRecipient,
      content: trimmedContent,
      timestamp: timestamp,
      isPrivate: true
    };

    const outMessage = JSON.stringify({
      type: 'private_message',
      ...payload
    });

    // Deliver ONLY to recipient sockets
    for (const rSocket of recipientSockets) {
      try {
        if (typeof rSocket.send === 'function' && rSocket.readyState === 1) {
          rSocket.send(outMessage);
        }
      } catch (err) {
        // Socket error handling
      }
    }

    // Deliver also to sender socket (so sender sees what they sent)
    if (senderSocket && typeof senderSocket.send === 'function' && senderSocket.readyState === 1) {
      try {
        senderSocket.send(outMessage);
      } catch (err) {
        // Socket error handling
      }
    }

    return {
      success: true,
      data: payload
    };
  }

  /**
   * Retrieves private message conversation between two users
   */
  getPrivateHistory(db, usernameA, usernameB, limit = 50) {
    if (!db || !usernameA || !usernameB) return [];
    const stmt = db.prepare(`
      SELECT id, sender_username AS sender, recipient_username AS recipient, content, created_at AS timestamp, 1 AS isPrivate
      FROM private_messages
      WHERE (LOWER(sender_username) = LOWER(?) AND LOWER(recipient_username) = LOWER(?))
         OR (LOWER(sender_username) = LOWER(?) AND LOWER(recipient_username) = LOWER(?))
      ORDER BY id ASC
      LIMIT ?
    `);
    return stmt.all(usernameA, usernameB, usernameB, usernameA, limit);
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
        if (typeof socket.send === 'function' && socket.readyState === 1) {
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
