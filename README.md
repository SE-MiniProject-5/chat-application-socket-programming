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
