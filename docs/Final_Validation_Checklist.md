# Final Validation and Evidence Checklist
## Chat Application using Socket Programming and WebSockets

**Document ID:** FVC-001 | **Version:** 1.0 | **Prepared:** 9 November 2026  
**Purpose:** Close the remaining test-evidence and final-submission tasks without inventing execution results.

## 1. Current evidence status

| Area | Current evidence | Remaining action |
|---|---|---|
| Automated regression | 181 passed, 0 failed; 33 test files; exit code 0 | Raw output and metadata are committed under `docs/test-evidence/` |
| Source coverage | 74.88% statements/lines, 90.16% functions, 83.92% branches for `src/` | Output and summary are committed; resolve c8 version metadata mismatch (metadata says 1.0.0, lockfile pins 12.0.0) |
| NFR-01 / NFR-07 | Localhost load run: 20 users, 5 rooms, 100/100 messages within 1 s | Raw output is committed; run/confirm on target LAN if LAN acceptance is required |
| NFR-02 | Localhost benchmark: 10 iterations, p95 398.95 ms | Raw output is committed; run/confirm from a client on target LAN if required |
| NFR-05 | PASS for harness checks: 20 users, 120 minutes, 719 sent, 14,800 aggregate received events, 0 connection failures, exit 0 | Final JSON and exit code committed; periodic terminal lines not supplied. Harness is one local room and does not assert per-recipient delivery or memory threshold |
| NFR-06 | Automated checks verify quick-start UI and default room | Conduct the five-person first-use study |
| NFR-08 | Architecture/module map and setup instructions exist | Reviewer confirms module count and times a clean setup |
| NFR-10 | Automated test checks standard browser APIs and absence of vendor-prefixed APIs | Test in actual Chrome, Firefox and Edge versions |
| SYS-01–SYS-14 | Manual protocol prepared; no manual results supplied | Execute and record each applicable scenario |
| SEC-REQ-06 | Automated assertions cover 256-bit unique tokens, 24-hour expiry and immediate invalidation | No further claim needed; preserve passing test evidence |
| FR-21 | Automated checks verify generic error text and server-side logging patterns | Perform controlled fault injection in an isolated test environment |
| Final demo / deviations | Template prepared in `Final_Demo_and_Deviations_Report.md` | Record the demo and complete deviations against submitted SRS/SAD/Test Plan |

## 2. Safe evidence handling

- Run commands from the repository root (the directory containing `package.json`).
- Record the commit SHA, date/time, OS, Node.js version, npm version and browser versions.
- Use dedicated test accounts only. Do not place passwords, bearer tokens, cookies, session IDs or private data in screenshots, logs or commits.
- Keep raw output unedited. Add a short explanation in the report rather than editing the evidence file.
- Use `PASS`, `FAIL`, `BLOCKED` or `NOT RUN`. A planned test is not a pass.
- Keep generated databases, credentials and coverage artifacts that contain environment-specific data out of Git unless they are explicitly safe and required.

## 3. NFR-05 — two-hour endurance run

The script defaults to 20 authenticated users and 120 minutes. It starts an isolated local server and temporary SQLite database, connects the clients, sends periodic messages, and logs elapsed time, sent count, received-event count, connection failures and process RSS. The project member has now supplied the final two-hour summary: 20 users, 120 minutes, 719 sent messages, 14,800 received events, zero connection failures, `passed: true`, exit code 0.

From PowerShell at the repository root:

```powershell
New-Item -ItemType Directory -Force docs\test-evidence | Out-Null
npm run test:soak 2>&1 | Tee-Object docs\test-evidence\nfr05-soak-output.txt
$LASTEXITCODE
```

Let it finish naturally. Do not close the terminal, stop the process, or shorten `DURATION_MINUTES` for the acceptance run. The completed run met the harness checks: 120 minutes, 20 users, zero connection failures, `passed: true`, exit code 0. Its final JSON and exit code are recorded in `docs/test-evidence/nfr05-soak-output.txt`.

**Harness limitation to preserve in the report:** the current soak script uses one local room and a loopback server. It records aggregate received WebSocket events and RSS snapshots, but does not assert per-recipient message completeness/order or define a memory-growth threshold. Therefore, describe exactly what this harness measured; do not claim it proves multi-room delivery correctness or LAN endurance.

## 4. NFR-06 — five-person first-use study

Use five people who have not previously used the application. Give each participant the same starting condition and task: open the application, create an account, join a room and send a message. Start timing when the application is first shown. Do not coach participants during the timed attempt; record any assistance separately.

| Participant | First-time user? | Completed task? | Time (seconds) | Needed help? | Observations |
|---|---|---|---:|---|---|
| P1 | To record | To record | — | — | — |
| P2 | To record | To record | — | — | — |
| P3 | To record | To record | — | — | — |
| P4 | To record | To record | — | — | — |
| P5 | To record | To record | — | — | — |

Acceptance threshold: at least 4 of 5 participants complete the task within 180 seconds. Record the actual count and times. Do not substitute the automated source/UI assertions for this human study.

## 5. NFR-08 — modularity review and clean setup timing

A reviewer other than the person who wrote the code should inspect the module boundaries and record at least four distinct modules with clear responsibilities. The current architecture map identifies authentication/session, database, rooms, chat/WebSocket, transport/validation, HTTP composition and browser UI responsibilities.

For setup timing, use a clean checkout or a fresh working directory, with Node.js/npm already installed. Start the timer immediately before following the README clone/install/test/start procedure; stop when the application is ready at the local URL. Record actual elapsed time and any intervention.

| Reviewer | Modules reviewed (file/module names) | Count | Clean setup time | Result against 15 min | Notes |
|---|---|---:|---:|---|---|
| To record | — | — | — | NOT RUN | — |

Do not mark this accepted solely because the README states “under 15 minutes”.

## 6. NFR-10 — browser compatibility

Record exact browser names and version numbers from each browser's About page. In each browser, perform the same minimum smoke workflow: load the app, register or log in with a test account, join a room, send and receive a message using a second session, and log out. Record console errors and visible layout/interaction failures.

| Browser | Exact version | App loads | Login | Room + messaging | Logout | Evidence path | Result |
|---|---|---|---|---|---|---|---|
| Google Chrome | To record | — | — | — | — | — | NOT RUN |
| Mozilla Firefox | To record | — | — | — | — | — | NOT RUN |
| Microsoft Edge | To record | — | — | — | — | — | NOT RUN |

The automated NR-10 test is a source-level compatibility baseline, not proof of execution in these three browsers.

## 7. Manual system scenarios SYS-01 through SYS-14

Execute each scenario using the procedures in `System_Validation_Report.md`. Capture a screenshot or safe log for each result. For multi-user scenarios use two independent browser sessions and separate test accounts.

- SYS-01: register a new account.
- SYS-02: attempt to register the same username again.
- SYS-03: log in with valid credentials, then try invalid credentials.
- SYS-04: create, list, join and leave a room.
- SYS-05: send messages between two clients in the same room.
- SYS-06: verify sender identity and displayed timestamp.
- SYS-07: interrupt network connectivity, restore it and record reconnect timing and UI state.
- SYS-08: observe online-user changes and join/leave notices.
- SYS-09: observe typing indicator behaviour (optional feature; not a Must requirement).
- SYS-10: verify private-message recipient isolation (optional feature; not a Must requirement).
- SYS-11: submit invalid message input and verify safe rejection.
- SYS-12: perform the configured repeated-login-failure sequence and observe lockout.
- SYS-13: log out and verify the old session/socket cannot continue authenticated actions.
- SYS-14: execute the browser workflow in Chrome, Firefox and Edge with versions recorded.

For every case, record actual result, status, evidence filename, commit SHA, date/time and defect reference if one is raised.

## 8. SEC-REQ-06 and FR-21

**SEC-REQ-06:** The repository's security tests explicitly assert 64-character hexadecimal tokens (256 bits), distinct tokens, a 24-hour default lifetime and immediate invalidation/closure of an attached socket on logout. These are automated assertions; the current recorded full suite includes the relevant test files.

**FR-21:** The current test verifies the generic client-facing error string, checks that exception details are not returned in selected response paths, and checks server-side diagnostic logging. It does not trigger a real database/server failure. If full fault-injection evidence is required, use a disposable local database/environment, induce a controlled failure, verify the client receives only the generic message, and verify diagnostics remain server-side. Never perform fault injection against a shared or production database.

## 9. LAN performance confirmation

The existing NFR-01/NFR-07 and NFR-02 measurements were made on localhost. If the final SRS acceptance must be demonstrated on a LAN, run the server on the host machine and execute the applicable client-side benchmark from another LAN device. Record host/client network conditions, test settings, results and raw output. Use a dedicated test account and do not write its password into command history or evidence.

## 10. Final sign-off

| Role | Name | Decision | Date | Signature |
|---|---|---|---|---|
| Testing lead | To record | Pending evidence | — | — |
| Project lead | To record | Pending evidence | — | — |
| Faculty/reviewer | To record | Pending review | — | — |

A final “validated” or “accepted” conclusion is appropriate only after applicable outstanding evidence is attached and reviewed.
