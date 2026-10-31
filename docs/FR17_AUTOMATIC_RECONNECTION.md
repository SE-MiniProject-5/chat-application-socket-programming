# FR-17: Automatic reconnection

## Requirement

Retry the WebSocket connection at least 5 times after an unexpected disconnect. On a successful reconnect, rejoin the room that was active before the connection dropped. If all retries fail, display:

> Connection lost. Please reload the page.

## Implementation

The browser client in `public/app.js` implements the reconnection flow:

- Uses `MAX_RECONNECT_ATTEMPTS = 5`, giving five retries after an unexpected disconnect.
- Waits 1 second between retry attempts.
- Preserves `currentRoom` while the connection is unavailable.
- Sends `join_room` for `currentRoom.id` after a successful reconnect.
- Resets the retry counter after a successful connection.
- Shows the exact required connection-lost message after all five retries fail.
- Does not retry after an intentional logout or when the server reports an expired session.
- Clears pending retry timers when the user intentionally leaves a room or logs out.

## Verification

The dedicated test file `tests/fr17_automatic_reconnection.test.js` verifies:

1. At least five reconnect attempts are configured.
2. The previous room is rejoined after reconnecting.
3. The required connection-lost message is displayed after retries are exhausted.
4. Intentional logout does not trigger automatic reconnection.
