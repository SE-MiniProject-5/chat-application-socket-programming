# Chat Application using Socket Programming

A real-time chat application built with Node.js, WebSockets, and SQLite.

## Requirements

- Git
- Node.js 22 LTS (recommended) and npm
- Windows, macOS, or Linux

Check your versions:

```powershell
node --version
npm --version
```

## Get the project running on Windows

Open PowerShell in the folder where you want the project, then clone the repository:

```powershell
git clone https://github.com/SE-MiniProject-5/chat-application-socket-programming.git
cd chat-application-socket-programming
```

**Important:** Run the following commands from the repository root — the folder containing `package.json`. If PowerShell says it cannot find `package.json`, you are in the wrong directory or the repository has not been cloned there. Check with:

```powershell
Get-Location
Get-ChildItem
```

Install dependencies and run the tests:

```powershell
npm ci
npm test
```

Start the server:

```powershell
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Keep the terminal running while using the application. Press `Ctrl+C` in the terminal to stop the server.

## Demonstrate real-time chat

1. Open the application in a normal browser window and register or log in as the first user.
2. Open an Incognito/InPrivate window (or a second browser) and register or log in as a different user.
3. Join the same chat room in both sessions.
4. Send messages from each session and confirm they appear in the other session without refreshing.
5. Try the room list, message history, online users, and logout features.

Use two distinct accounts for the two-browser demonstration.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the exact dependencies from the lockfile |
| `npm test` | Run the automated test suite |
| `npm start` | Start the chat server on port 3000 |

## Configuration

- `PORT`: HTTP/WebSocket port (defaults to `3000`).
- `DB_PATH`: SQLite database file path (optional).
- For non-localhost deployments, configure `HOST`, `TLS_KEY_PATH`, and `TLS_CERT_PATH` as required by the TLS transport. Local browser demos can use `http://localhost:3000`.

The SQLite database is created locally by the application and should not be committed.

## GitHub Actions

Pull requests and pushes to `main` run the automated test suite using Node.js 22. A PR should have a passing Actions check before it is merged.

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
