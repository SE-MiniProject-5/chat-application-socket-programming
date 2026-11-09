# System Validation Report
## Chat Application using Socket Programming and WebSockets

**Document ID:** SVR-001 | **Version:** 1.1 | **Report date:** 9 November 2026  
**Status:** Protocol and execution guidance prepared; manual results not yet evidenced

## 1. Objective
Validate the integrated application from the user's perspective, including browser UI, HTTP/API behaviour, WebSocket messaging, persistence, and multi-user workflows.

## 2. Environment
| Item | Actual value |
|---|---|
| OS | Windows (version pending) |
| Node.js / npm | Pending |
| Browser(s) | Pending exact name/version |
| Database | SQLite |
| WebSocket library | ws (installed version pending) |
| Commit SHA | Pending |
| Server URL / mode | Record local or deployed URL; exclude secrets |

## 3. System scenarios and results
Do not mark a scenario PASS until performed and evidence is captured.

| ID | Scenario | Expected result | Actual result | Status | Evidence |
|---|---|---|---|---|---|
| SYS-01 | Register a new account | Registration succeeds | Not recorded | NOT RUN | — |
| SYS-02 | Attempt duplicate registration | Duplicate rejected | Not recorded | NOT RUN | — |
| SYS-03 | Valid and invalid login | Correct accept/reject behaviour | Not recorded | NOT RUN | — |
| SYS-04 | Create/list/join/leave room | Room lifecycle works | Not recorded | NOT RUN | — |
| SYS-05 | Two clients exchange messages | Correct room delivery | Not recorded | NOT RUN | — |
| SYS-06 | Check sender and timestamp | Correct sender/time shown | Not recorded | NOT RUN | — |
| SYS-07 | Interrupt and restore connection | Reconnection follows requirement | Not recorded | NOT RUN | — |
| SYS-08 | Observe presence/join/leave | Presence updates correctly | Not recorded | NOT RUN | — |
| SYS-09 | Typing indicator | Indicator appears and clears | Not recorded | NOT RUN | — |
| SYS-10 | Private messaging | Only intended recipient receives it | Not recorded | NOT RUN | — |
| SYS-11 | Invalid message input | Safe rejection | Not recorded | NOT RUN | — |
| SYS-12 | Repeated failed login attempts | Configured lockout response | Not recorded | NOT RUN | — |
| SYS-13 | Logout/session invalidation | Authenticated socket cannot continue | Not recorded | NOT RUN | — |
| SYS-14 | Browser compatibility | Result recorded per browser/version | Not recorded | NOT RUN | — |

## 4. Procedure
1. Install dependencies and start the application using its documented command.
2. Open two independent browser sessions (for example, normal and private windows).
3. Execute SYS-01 through SYS-14, recording actual outcomes and screenshots.
4. Capture relevant browser/server output without exposing passwords or tokens.
5. Repeat failed cases after correction and record original and retest outcomes.

## 5. Automated vs system validation
The passing `npm test` result reported by the project member is recorded in `Unit_Test_Report.md`. It does not automatically prove that manual browser scenarios were executed.

## 6. Conclusion
System validation is not signed off because actual manual outcomes and evidence have not been supplied. Complete the result table and attach labelled evidence before declaring the system validated.


## 7. Detailed execution guidance

Use the following consistent method for each applicable scenario. Start the server from a clean test checkout, record the commit SHA and environment, and use dedicated accounts. For two-client tests, use two independent browser profiles so cookies/session state are not shared.

| ID | Execution steps | Additional observation to record |
|---|---|---|
| SYS-01 | Open the app; register a new unique test username and password; submit once | Success feedback, redirect/state, and whether the account can log in |
| SYS-02 | Submit registration again with the same username | Duplicate rejection; no duplicate account created |
| SYS-03 | Log in with the new account; log out; try an incorrect password | Valid login succeeds; invalid login is rejected without exposing internals |
| SYS-04 | Create a room; refresh/list rooms; join it; leave it | Room appears in list and membership changes as expected |
| SYS-05 | Log in from two sessions; join the same room; send one message from each | Both intended participants receive each message without page refresh |
| SYS-06 | Send a message from one account and inspect it in both sessions | Sender matches authenticated account; timestamp is present and plausible |
| SYS-07 | Join a room; disable the client network briefly; restore it | Record outage duration, reconnect time, connection indicator and room rejoin; compare with SRS timing |
| SYS-08 | Connect two users; observe online list; have one join/leave | Presence and notices update for the remaining participant |
| SYS-09 | In two sessions, begin typing in one and stop | Typing indication appears for the other session and clears; optional feature |
| SYS-10 | Send a private message from one account to another while a third account is connected | Intended recipient receives it; unrelated account does not; optional feature |
| SYS-11 | Submit empty, over-length or malformed message input through the available UI/test route | Safe rejection; no crash or internal details displayed |
| SYS-12 | Perform the configured consecutive failed-login sequence for one username | Lockout threshold and duration; avoid locking a real account |
| SYS-13 | Log in, establish a WebSocket session, then log out | Old socket closes and old token/session cannot reconnect or perform authenticated actions |
| SYS-14 | Repeat the agreed smoke workflow in Chrome, Firefox and Edge | Exact browser version, console errors, layout issues and pass/fail per browser |

For each row, replace the existing “Not recorded” value only after execution. Save evidence as `docs/test-evidence/SYS-XX-description.png` or a safe text log. Never capture passwords, tokens or browser storage.

## 8. Manual execution record

| Field | Value |
|---|---|
| Tester | To record |
| Date/time and timezone | To record |
| Source commit SHA | To record |
| OS/version | To record |
| Node.js / npm | To record |
| Browser names and exact versions | To record |
| Server URL and mode (localhost/LAN) | To record; no credentials |
| Test account labels (not passwords) | To record |

### Per-scenario result sheet

| ID | Actual result | Status (PASS/FAIL/BLOCKED/NOT RUN) | Evidence path | Defect / retest reference |
|---|---|---|---|---|
| SYS-01 to SYS-14 | Complete individually; do not use one combined status | NOT RUN until executed | — | — |

## 9. Scope and evidence notes

SYS-09 and SYS-10 exercise FR-22 and FR-23, which are Optional and outside committed scope in the approved SRS. Their implementation and automated tests do not make them Must requirements. SYS-14 must be supported by real browser execution; the automated NR-10 source-level baseline is not a substitute. SYS-07 timing must be observed during an actual network interruption; static reconnection-code checks are not a timing measurement.

The detailed remaining work and NFR evidence protocol are in `Final_Validation_Checklist.md`. The final demo and deviation register are in `Final_Demo_and_Deviations_Report.md`.


## 10. NFR-05 soak evidence cross-reference

The two-hour endurance run is recorded separately in `Performance_Test_Report.md`: 20 concurrent users, 120 minutes, 719 sent messages, 14,800 aggregate received WebSocket events, zero connection failures, `passed: true`, exit code 0. This is a harness-level NFR-05 result, not a substitute for the browser-based SYS-01–SYS-14 scenarios. Those manual system scenarios remain NOT RUN until executed and evidenced.
