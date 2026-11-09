# System Validation Report
## Chat Application using Socket Programming and WebSockets

**Document ID:** SVR-001 | **Version:** 1.0 | **Report date:** 9 November 2026  
**Status:** Protocol prepared; manual results not yet evidenced

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
