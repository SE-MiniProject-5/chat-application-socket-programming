# FR-08: Leave Chat Room

## Requirement

> The system shall allow a User to leave the current chat room. After leaving, the User shall receive no further messages from that room.

## Implementation

The chat application implements FR-08 through the WebSocket room membership manager.

### Client

The **Leave** button calls `leaveCurrentRoom()` in `public/app.js`. When a WebSocket connection is open, the client sends:

```json
{
  "type": "leave_room",
  "roomId": 1
}
```

The client then clears its current room and returns to the room list.

### Server

`src/server.js` handles the `leave_room` event by:

1. Identifying the room associated with the authenticated WebSocket connection.
2. Removing that socket from the room's member list.
3. Broadcasting an updated presence list to the remaining members.
4. Clearing the connection's current room state.
5. Keeping the user registered as online so they can still receive private messages or join another room.

### Message isolation

`ChatManager.broadcastToRoom()` iterates only over sockets currently stored in the target room. Once a socket leaves, it is removed from that room's map, so subsequent messages are not delivered to it.

## Test Coverage

`tests/fr08_leave_chat_room.test.js` verifies:

- A user can leave a room.
- A user receives no later messages from a room after leaving.
- Remaining users continue receiving room messages.
- Leaving a room does not incorrectly mark the user offline.
- Leaving one user's membership does not remove other users from the room.
