# Test Plan
## Chat Application using Socket Programming and WebSockets

**Document ID:** TP-001 | **Version:** 2.2 | **Status:** Automated results recorded; final manual/NFR evidence tracked separately  
**Assignment testing window:** 2–6 November 2026 | **Updated:** 9 November 2026

## 1. Purpose and scope
This plan defines testing of the implemented chat application: Node.js server, SQLite persistence, HTTP endpoints, WebSocket communication, and browser client. Scope includes registration, duplicate-account handling, login/logout, room lifecycle, real-time and private messaging, history, delivery ordering/completeness, presence, timestamps, connection state/reconnection, typing indicators, input validation, server-assigned sender identity, session-bound sockets, password hashing, login lockout, TLS behaviour, safe errors, reliability, and performance-related requirements.

## 2. Test approach
- **Automated unit/integration tests:** Node.js built-in test runner via `npm test`; the exact files are listed in `package.json`.
- **System validation:** End-to-end workflows using at least two independent browser sessions. Record actual results, browser versions, dates, and evidence. These manual scenarios remain NOT RUN until executed and recorded.
- **Security validation:** Invalid credentials, duplicate registration, token/session validation, sender spoofing, room isolation, malformed input, login lockout, and transport-security behaviour.
- **Performance/reliability:** Use `npm run test:load`, `npm run benchmark:login`, and `npm run test:soak` only after reviewing workload and duration. Record actual settings and output.
- **Coverage:** Use c8 to measure statement, line, function, and branch coverage. Coverage is not proof of requirements completeness.

## 3. Test environment
The recorded automated run used:
| Item | Recorded value |
|---|---|
| OS/shell | Windows PowerShell |
| Node.js | v22.20.0 |
| npm | 10.9.3 |
| Database | SQLite |
| Test command | `npm test` |
| Source commit | `fda8aa45f62cb0a4cffeb60348f10e13decd9d75` |
| Run date/time | 9 November 2026, 19:19:24 (+05:30) |

Record actual browser names/versions and the exact installed dependency versions when completing manual system validation. Commands:
```powershell
node --version
npm --version
npm ls --depth=0
```

## 4. Test data and controls
Use dedicated test accounts and non-production data. Do not use real passwords or personal data. Reset/isolate the database where required. Never commit passwords, session tokens, or secrets in logs/screenshots.

## 5. Entry and exit criteria
**Entry:** dependencies installed using `npm ci`; environment available; commit SHA recorded; scripts and manual steps reviewed.

**Exit:** every applicable case has a status; failures/blocked cases are explained; automated output is retained; manual evidence is labelled; coverage reports contain measured values or clearly state that measurement is pending; traceability is reviewed; limitations are documented.

A test is PASS only when observed results meet expected results. Do not infer coverage percentages or manual test outcomes.

## 6. Recorded automated result
The supplied full test output records 181 passed tests, 0 failed, 0 skipped, 0 cancelled, across 39 suites. The process exited with code 0 and reported a duration of 32.13 seconds. See `Unit_Test_Report.md` and `Test_Execution_Report.md`.

The c8 measurement for `src/` reports 74.88% statement/line coverage, 90.16% function coverage, and 83.92% branch coverage. See `Code_Coverage_Report.md` and `Branch_Coverage_Report.md`.

## 7. Schedule
The assignment specifies 2–6 November 2026. The supplied successful automated run occurred on 9 November 2026. It is recorded with its actual date and is not represented as having occurred within the assignment testing window. Any earlier execution must be supported by contemporaneous evidence.

## 8. Deliverables
Updated Test Plan, Test Cases, Traceability Matrix, Test Execution Report, Unit Test Report, System Validation Report, Code Coverage Report, Branch Coverage Report, and supporting test output/screenshots/coverage artifacts.

## 9. Risks and limitations
Manual system validation is distinct from automated tests. Performance thresholds must come from the approved SRS. Browser compatibility requires actual browser evidence. Coverage depends on the exact source revision and test command. The current coverage scope excludes browser code under `public/`. Unexecuted tests must be marked NOT RUN.

## 10. Approval
| Role | Name | Signature | Date |
|---|---|---|---|
| Testing Lead | TBD | TBD | TBD |
| Project Lead | TBD | TBD | TBD |
| Faculty/Reviewer | TBD | TBD | TBD |


## 11. Additional performance execution results (9 November 2026)

The supplied local load-test output records 20 authenticated WebSocket users across five rooms. All 100 measured messages reached every member of their respective room within 1,000 ms (100.0%); p50 was 9.75 ms, p95 was 22.85 ms, and maximum was 38.13 ms. The script exited 0.

The supplied login benchmark ran 10 iterations against `http://127.0.0.1:3000`. Average login-plus-room-list time was 188.77 ms, p50 153.72 ms, and p95 / maximum 398.95 ms; the script exited 0.

These results satisfy the scripts' configured thresholds in the localhost environment. Since the SRS targets specify LAN conditions, repeat or confirm measurements on the intended LAN before final LAN acceptance. The two-hour NFR-05 soak test and manual browser validation remain pending. The raw output files are committed under `docs/test-evidence/`. An existing `soak-test.txt` is only an approximately 8-minute partial run and does not satisfy the 120-minute target. Do not include test credentials.


## 12. Final validation work remaining

The following evidence items are not inferred from the automated suite and must be completed before final acceptance:

1. Complete SYS-01 through SYS-14 using the execution steps in `System_Validation_Report.md`; retain labelled evidence.
2. Complete the default 120-minute NFR-05 run with 20 users and retain the entire output. Report the soak harness's single-room/local limitations accurately.
3. Conduct the NFR-06 first-use study with five first-time participants and record individual times; the existing automated test is not a substitute.
4. Have a reviewer perform the NFR-08 module review and time a clean setup; existing source checks do not measure either activity.
5. Execute SYS-14 in Chrome, Firefox and Edge, recording exact versions and results; existing NR-10 checks are source-level only.
6. If required for SRS acceptance, repeat NFR-01/NFR-02 measurements from a client on the target LAN; the recorded values are localhost measurements.
7. Perform controlled FR-21 fault injection only in an isolated test environment if runtime failure behaviour must be demonstrated.
8. Complete the final demo and deviation register in `Final_Demo_and_Deviations_Report.md`.

The working checklist and evidence tables are in `Final_Validation_Checklist.md`. Optional FR-22 and FR-23 remain outside committed Must scope. Use NOT RUN until actual evidence is recorded.


## 13. Final submission artifacts

The repository now includes a final validation checklist, a final demonstration/deviation report, and an evidence index in addition to the test and coverage reports. The committed HTML coverage report is available at `coverage/index.html`; raw console output and metadata are indexed in `docs/test-evidence/README.md`.
