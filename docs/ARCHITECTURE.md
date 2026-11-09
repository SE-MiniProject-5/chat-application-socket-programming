# Application architecture and setup

## Module map

The application uses small CommonJS modules for its core responsibilities:

| Responsibility | Module | Boundary |
| --- | --- | --- |
| Browser UI and interaction | `public/index.html`, `public/style.css`, `public/app.js` | DOM rendering, form handling, browser session storage |
| Authentication | `src/auth.js`, `src/sessionManager.js` | Registration, password verification, session creation/expiry/invalidation |
| Data access and schema | `src/db.js` | SQLite connection and schema initialization |
| Room operations | `src/rooms.js` | Room validation, creation and listing |
| Socket/chat operations | `src/chatManager.js`, WebSocket section of `src/server.js` | Membership, presence, message persistence and delivery |
| Transport and validation | `src/tls.js`, `src/validation.js` | HTTP/HTTPS setup and shared input validation |
| HTTP composition | `src/server.js` | Routes requests to the modules above and serves static assets |

Keep business rules in their owning service module rather than duplicating them in route handlers. The server is the composition root: it wires HTTP routes, authentication, persistence and WebSocket events together.

## Install and run (under 15 minutes)

Requirements: Git and Node.js 22 LTS with npm.

```sh
git clone https://github.com/SE-MiniProject-5/chat-application-socket-programming.git
cd chat-application-socket-programming
npm ci
npm test
npm start
```

Open http://localhost:3000. The first start creates the SQLite database and a General room. No separate database installation is required.

## Performance and endurance checks

Run the login-to-room-list benchmark against the machine hosting the server:

```powershell
$env:BENCH_USERNAME = "existing_test_user"
$env:BENCH_PASSWORD = "test_password"
npm run benchmark:login -- --url http://192.168.1.10:3000
```

The benchmark reports p50/p95/max for the complete login plus room-list request sequence and exits non-zero when p95 exceeds 2 seconds. Run it from another device on the target LAN for acceptance evidence; loopback results are only a local smoke test.

Run the 20-user endurance test (default: 2 hours):

```powershell
npm run test:soak
```

For a short development smoke run, set `DURATION_MINUTES=1`. A short run does not prove the two-hour acceptance target. For the acceptance run, capture the final JSON summary and periodic memory/connection output.

## Notes

- Keep `chat.db` and generated soak databases out of version control.
- The benchmark requires a pre-created test account; do not use a real user's password.
- The soak test creates isolated temporary data and removes it on exit.


## Source module inventory for NFR-08

A static inventory of `src/` on the current main branch contains nine JavaScript files:

| Module | Responsibility |
|---|---|
| `auth.js` | Registration and password authentication |
| `chatManager.js` | Chat membership, presence and message handling |
| `db.js` | SQLite schema and database access |
| `loginAttemptLimiter.js` | Login-attempt throttling/lockout |
| `rooms.js` | Room creation and listing |
| `server.js` | HTTP/WebSocket application composition |
| `sessionManager.js` | Session token creation, expiry and invalidation |
| `tls.js` | HTTP/TLS server configuration |
| `validation.js` | Shared input validation |

This source inventory exceeds the SRS minimum of four modules. It is a repository-level inventory, not a substitute for independent reviewer sign-off. The clean-install/start procedure still needs to be timed against the 15-minute target before NFR-08 can be marked fully accepted.
