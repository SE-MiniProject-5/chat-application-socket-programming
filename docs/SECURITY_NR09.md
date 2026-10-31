# NR-09 — Security Compliance (SRS Section 7.2)

Implemented all **Must-priority** security requirements in SRS Section 7.2: **SEC-REQ-01 through SEC-REQ-06**.

| Requirement | Implementation |
|---|---|
| SEC-REQ-01 | Passwords use `bcryptjs` with cost factor **10**. Plaintext passwords are never stored or returned. |
| SEC-REQ-02 | WebSocket handshakes require a valid, unexpired session token. Unauthenticated upgrade requests are rejected with HTTP 401. Chat events are rejected after session expiry/logout. |
| SEC-REQ-03 | Sender identity is taken from the authenticated session/database user. Client-supplied `userId`, `username`, and `user` fields are ignored for message attribution. |
| SEC-REQ-04 | A socket can send to a room only after joining it. Room broadcasts iterate only over the room's member sockets. HTTP fallback also requires current room membership. |
| SEC-REQ-05 | Server validates input types and message length. The frontend escapes user text and uses `textContent` for plain-text rendering. |
| SEC-REQ-06 | Session tokens are 256-bit random values, expire after **24 hours**, and are immediately invalidated on logout. |

## Verification

Added `tests/security_requirements.test.js` covering:

- bcrypt hash format/cost and password verification
- 256-bit token generation
- 24-hour expiry
- logout invalidation
- rejection of unauthenticated WebSocket connections
- sender spoofing protection
- room isolation
- message length validation and plain-text rendering checks

Run:

```bash
npm install
npm test
```

`bcryptjs` is a pure-JavaScript bcrypt implementation and has been added as a project dependency so the project can run without a native bcrypt build toolchain.
