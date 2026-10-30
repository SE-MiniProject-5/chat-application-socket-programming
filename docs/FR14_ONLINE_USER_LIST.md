# FR-14: Online User List

## Requirement

Display usernames of users online in the joined room and update the list on every join, leave, or disconnect.

## Implementation

### Server

- `ChatManager.getRoomMembers(roomId)` returns the unique usernames currently joined to the requested room.
- After a successful `join_room`, the server broadcasts a `presence` event to every member of the room.
- After `leave_room`, the server removes the socket from the room and broadcasts the updated member list to the remaining members.
- On WebSocket disconnect, the server removes the socket from the online registry and its room, then broadcasts the updated member list to the remaining members.
- Room membership is isolated: users in another room are never included in the room's presence list.

### Client

The client handles `presence` and `room_joined` WebSocket events and updates `#online-users` using `textContent`:

`Online (N): Alice, Bob, Charlie`

The list is therefore refreshed without reloading the page whenever room membership changes.

## Tests

`tests/fr14_online_user_list.test.js` verifies:

1. Usernames are displayed for the joined room.
2. The list updates when a user joins.
3. The list updates when a user leaves.
4. The list updates after a disconnect.
5. Users from other rooms are excluded.
6. Duplicate usernames are not displayed twice.
