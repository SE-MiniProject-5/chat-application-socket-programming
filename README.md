# Chat Application using Socket Programming

A real-time chat application built with Node.js, WebSockets, and SQLite.

## Requirements

- Git
- Node.js 22 LTS and npm
- Windows, macOS, or Linux

Check your versions:

```powershell
node --version
npm --version
```

## Install and start (under 15 minutes)

Run these commands from the repository root (the folder containing `package.json`):

```powershell
git clone https://github.com/SE-MiniProject-5/chat-application-socket-programming.git
cd chat-application-socket-programming
npm ci
npm test
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Keep the terminal running while using the application; press `Ctrl+C` to stop it. No separate database installation is required.

If PowerShell reports that it cannot find `package.json`, check `Get-Location` and `Get-ChildItem`; commands must run from the cloned repository root.

## Demonstrate real-time chat

1. Register or log in as the first user in a normal browser window.
2. Open an Incognito/InPrivate window (or a second browser) and use a different account.
3. Join the same chat room in both sessions.
4. Send messages from each session and confirm they appear without refreshing.
5. Try room listing, message history, online users and logout.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install exact dependencies from the lockfile |
| `npm test` | Run the automated regression suite |
| `npm start` | Start the server on port 3000 |
| `npm run benchmark:login` | Measure login + room-list response time |
| `npm run test:soak` | Run the 20-user endurance test (2 hours by default) |

## Configuration

- `PORT`: HTTP/WebSocket port (defaults to `3000`).
- `DB_PATH`: SQLite database file path (optional).
- For non-localhost deployments, configure `HOST`, `TLS_KEY_PATH` and `TLS_CERT_PATH` for TLS. Local demos can use HTTP on localhost.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the module map, setup guide, performance benchmark and endurance-test instructions.

## GitHub Actions

Pull requests and pushes to `main` run the automated test suite using Node.js 22. A PR should have a passing Actions check before merge.

The SQLite database is created locally and should not be committed. See `.gitignore` for generated files.
## Project documentation

See the `docs/` directory for the submitted project documentation and sprint artefacts.

## Non-functional requirement load test (NR-01 / NR-07)

The repository includes a real WebSocket load-test harness that starts an isolated local server, authenticates at least 20 WebSocket clients, distributes them across at least 5 rooms, and measures how long each room message takes to reach every connected member.

Run it from the repository root after installing dependencies:

```powershell
npm run test:load
```

The test reports the percentage of messages delivered to every member within the 1,000 ms target and p50/p95/maximum observed latency. It exits with a failure if fewer than 95% meet the target or if a recipient does not receive a message. The test uses a temporary SQLite database and removes it after the run.

Optional environment variables can increase the load:

- `LOAD_USERS` (minimum 20; default 20)
- `LOAD_ROOMS` (minimum 5; default 5)
- `LOAD_MESSAGES_PER_ROOM` (default 20)
- `LOAD_SLA_MS` (default 1000)

Run this load test on the target LAN/server environment for acceptance evidence. A local loopback run is a repeatable engineering check, but does not by itself prove the LAN performance target.
