# Sprint 2 verification: NR-04, NR-10 and SR-06

## NR-04 — Reconnection time

The browser retries WebSocket connections automatically with a delay capped at two seconds. When the browser emits its `online` event, the client cancels any pending backoff timer and retries immediately. On successful reconnection, the client rejoins the previously selected room.

Acceptance test:
1. Log in and join a room in a supported browser.
2. Disable the network adapter or disconnect Wi-Fi for less than 30 seconds.
3. Restore the network.
4. Confirm the status returns to Connected within 10 seconds, without reloading or clicking reconnect.
5. Confirm the previously selected room is rejoined and messages work.

Record the outage/restoration and reconnection timestamps as evidence. A source-level test does not prove the 10-second runtime target.

## NR-10 — Browser support

Required target matrix (Windows 10/11, viewport width at least 1024 CSS pixels):

| Browser | Required verification |
| --- | --- |
| Current Google Chrome | Login, room list, room join/leave, real-time chat, history, private messages, logout |
| Current Mozilla Firefox | Same functional smoke test |
| Current Microsoft Edge | Same functional smoke test |

Use the same server and test accounts for each browser. Verify that the layout remains usable at 1024 px or wider and capture the browser version and test date. The automated Node.js regression tests check use of standard browser APIs; they are not a substitute for running the application in all three browsers.

## SR-06 — Session token strength, expiry and invalidation

- Tokens are generated using `crypto.randomBytes(32)` (256 bits).
- Default lifetime is 24 hours.
- Expired tokens are rejected and removed.
- Logout invalidates the token and closes sockets attached to that session.

Automated tests cover token size/uniqueness, default expiry and immediate logout invalidation.
