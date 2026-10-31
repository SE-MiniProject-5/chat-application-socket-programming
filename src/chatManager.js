/**
 * ChatManager implementing:
 * - FR-11: "The system shall allow two or more Users to be members of the same room at the same time,
 *   and shall display the sender's username with every message."
 * - FR-23: "The system shall allow a User to send a private text message to one other online User,
 *   visible only to the sender and that recipient."
 * - NR-03 (NFR-03): "While sender and recipients stay connected, the system shall deliver 100% of
 *   accepted messages, in the order the server received them, with no duplicates."
 */

const { validateUsername, validateMessageText } = require('./validation');

class ChatManager {
  constructor() {
    // Map of roomId -> Map<clientSocket, { userId, username }>
    this.rooms = new Map();
    // Map of clientSocket -> { userId, username }
    this.onlineUsers = new Map();
    // NR-03: per-room monotonic sequence (server receipt order) used when no DB id is available
    this.roomSeq = new Map();
  }

  /**
   * NR-03: Next sequence number for a room. Node runs this synchronously, so the order in
   * which sendMessage() is entered IS the order the server received the messages.
   */
  nextRoomSeq(roomId) {
    const rId = String(roomId);
    const next = (this.roomSeq.get(rId) || 0) + 1;
    this.roomSeq.set(rId, next);
    return next;
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
    if (!clientSocket || !user || !user.username) {
      throw new Error('A connected socket and authenticated user are required');
    }

    const rId = String(roomId);

    // FR-07: A socket can belong to at most one room at a time.
    // Remove any previous membership before adding the new one.
    this.leaveRoom(clientSocket);

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
   * SR-04: Confirm that a specific socket is a member of the requested room.
   */
  isSocketInRoom(roomId, clientSocket) {
    const members = this.rooms.get(String(roomId));
    return Boolean(members && members.has(clientSocket));
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
    const messageValidation = validateMessageText(content);
    if (!messageValidation.valid) {
      return { success: false, message: messageValidation.message };
    }

    if (typeof username !== 'string' || !username.trim()) {
      return { success: false, message: 'Sender username is required' };
    }

    const trimmedContent = messageValidation.cleanContent;

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

    // NR-03: `seq` is the server-receipt order; clients use it (with `id`) to order and de-duplicate.
    const seq = messageId !== null ? messageId : this.nextRoomSeq(roomId);

    const messagePayload = {
      id: messageId,
      seq,
      roomId: Number(roomId),
      sender: username,
      userId: userId || null,
      content: trimmedContent,
      timestamp: timestamp
    };

    const delivery = this.broadcastToRoom(roomId, {
      type: 'chat_message',
      ...messagePayload
    });

    return {
      success: true,
      data: messagePayload,
      delivery
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
    const messageValidation = validateMessageText(content);
    if (!messageValidation.valid) {
      return { success: false, message: messageValidation.message };
    }

    const recipientValidation = validateUsername(recipientUsername);
    if (!recipientValidation.valid) {
      return { success: false, message: recipientValidation.message };
    }

    const trimmedContent = messageValidation.cleanContent;
    const cleanRecipient = recipientValidation.cleanUsername;
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
      seq: messageId,
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

    // NR-03: build one de-duplicated target set so no socket can receive the message twice
    // (recipient sockets first, then the sender's own socket so the sender sees what they sent).
    const targets = new Set(recipientSockets);
    if (senderSocket) targets.add(senderSocket);

    const delivery = this.sendToSockets(targets, outMessage);

    return {
      success: true,
      data: payload,
      delivery
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
   * FR-14: Broadcast the current usernames in a room to every active member.
   * Keeping this in ChatManager ensures join/leave/disconnect presence updates
   * always use the same payload shape.
   */
  broadcastPresence(roomId) {
    const members = this.getRoomMembers(roomId);
    this.broadcastToRoom(roomId, {
      type: 'presence',
      roomId: Number(roomId),
      members
    });
    return members;
  }

  /**
   * NR-03: Sends one serialized payload to each socket in an iterable exactly once.
   * Returns a delivery report: { attempted, delivered, failed }.
   * Only OPEN sockets count as "connected"; a socket that throws on send is counted as failed.
   */
  sendToSockets(sockets, data) {
    const report = { attempted: 0, delivered: 0, failed: 0 };
    for (const socket of new Set(sockets)) {
      if (!socket || typeof socket.send !== 'function' || socket.readyState !== 1) continue;
      report.attempted++;
      try {
        socket.send(data);
        report.delivered++;
      } catch (err) {
        report.failed++;
      }
    }
    return report;
  }

  /**
   * Broadcasts a JSON message to all active sockets in the room (each member socket exactly once,
   * in the order calls are made - NR-03). Returns the delivery report.
   */
  broadcastToRoom(roomId, payload) {
    const rId = String(roomId);
    if (!this.rooms.has(rId)) return { attempted: 0, delivered: 0, failed: 0 };

    return this.sendToSockets(this.rooms.get(rId).keys(), JSON.stringify(payload));
  }

  /**
   * Retrieves stored messages for a room (FR-13)
   */
  getStoredMessages(db, roomId, limit = 50) {
    if (!db) return [];

    const safeLimit = Number.isInteger(Number(limit)) && Number(limit) > 0
      ? Math.min(Number(limit), 50)
      : 50;

    // Select the newest messages first, then reverse them so the UI receives
    // the selected history in chronological order (oldest to newest).
    const stmt = db.prepare(
      'SELECT id, room_id AS roomId, username AS sender, user_id AS userId, content, created_at AS createdAt FROM messages WHERE room_id = ? ORDER BY id DESC LIMIT ?'
    );

    return stmt.all(Number(roomId), safeLimit).reverse();
  }
}

module.exports = { ChatManager };
