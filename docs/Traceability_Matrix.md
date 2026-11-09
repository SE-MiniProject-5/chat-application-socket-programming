# Requirements Traceability Matrix
## Chat Application using Socket Programming and WebSockets

**Document ID:** RTM-001 | **Version:** 3.0 | **Updated:** 9 November 2026  
**Source of requirement IDs and priorities:** Approved project SRS, version 1.0, Sections 3, 4, 7 and 8; Appendix A.

## 1. Purpose and status
This matrix reconciles the implemented test inventory with the requirement identifiers and priorities in the approved SRS. Test-file names are mapped to requirement areas; the SRS's proposed test case IDs (for example, TC-FR-01) are retained as the requirement-level identifiers.

**Important scope distinction:** FR-22 (typing indicator) and FR-23 (private messaging) are marked Optional in the SRS and are explicitly outside the committed scope. The repository contains automated tests for both, so they are recorded as implemented optional features—not as Must requirements.

A mapped automated test means a corresponding test suite exists. It does not, by itself, establish that a manual system scenario, performance target, browser target, or usability target has passed.

## 2. Functional requirements

| SRS ID | SRS requirement / priority | Automated test suite(s) in repository | System validation | Evidence / status |
|---|---|---|---|---|
| FR-01 | User registration — Must | `fr01_user_registration.test.js` | SYS-01 | Automated suite included in reported passing run |
| FR-02 | Duplicate username rejection — Must | `fr02_duplicate_username.test.js` | SYS-02 | Automated suite included in reported passing run |
| FR-03 | User login — Must | `fr03_user_login.test.js` | SYS-03 | Automated suite included in reported passing run |
| FR-04 | User logout and session invalidation — Must | `fr04_user_logout.test.js` | SYS-13 | Automated suite included in reported passing run |
| FR-05 | Create chat room — Must | `fr05_create_room.test.js` | SYS-04 | Automated suite included in reported passing run |
| FR-06 | List chat rooms — Must | `fr06_list_chat_rooms.test.js` | SYS-04 | Automated suite included in reported passing run |
| FR-07 | Join one chat room — Must | `fr07_join_chat_room.test.js` | SYS-04 | Automated suite included in reported passing run |
| FR-08 | Leave current chat room — Must | `fr08_leave_chat_room.test.js` | SYS-04 | Automated suite included in reported passing run |
| FR-09 | Send text message (1–500 characters) — Must | `fr09_send_message.test.js` | SYS-05, SYS-11 | Automated suite included in reported passing run |
| FR-10 | Real-time message delivery — Must | `fr10_realtime_message_delivery.test.js` | SYS-05 | Automated suite included in reported passing run |
| FR-11 | Multi-user rooms with sender name — Must | `fr11_multi_user_room.test.js` | SYS-05, SYS-06 | Automated suite included in reported passing run |
| FR-12 | Message timestamp — Must | `fr12_fr15_fr18_presence_timestamp.test.js` | SYS-06 | Combined suite; verify individual assertions when reviewing detailed coverage |
| FR-13 | Message history on join — Should | `fr13_message_history.test.js` | SYS-05 | Automated suite included in reported passing run |
| FR-14 | Online user list — Must | `fr14_online_user_list.test.js` | SYS-08 | Automated suite included in reported passing run |
| FR-15 | Join and leave notices — Should | `fr12_fr15_fr18_presence_timestamp.test.js` | SYS-08 | Combined suite; verify individual assertions when reviewing detailed coverage |
| FR-16 | Connection state indicator — Must | `fr16_connection_state.test.js` | SYS-07 | Automated suite included in reported passing run |
| FR-17 | Automatic reconnection — Must | `fr17_automatic_reconnection.test.js` | SYS-07 | Automated suite included in reported passing run |
| FR-18 | Offline detection (remove within 60 seconds) — Must | `fr12_fr15_fr18_presence_timestamp.test.js` | SYS-07, SYS-08 | Combined suite; verify individual assertions when reviewing detailed coverage |
| FR-19 | Invalid message rejection — Must | `fr19_invalid_message_rejection.test.js` | SYS-11 | Automated suite included in reported passing run |
| FR-20 | Login failure message — Must | `fr20_login_failure.test.js` | SYS-03, SYS-12 | Automated suite included in reported passing run |
| FR-21 | Safe server error message — Should | `fr21_safe_server_errors.test.js` | SYS-11 | Automated suite included in reported passing run; SRS notes fault injection is needed for full server-error validation |
| FR-22 | Typing indicator — Optional | `fr22_typing_indicator.test.js` | SYS-09 | Implemented and tested as an optional feature; not committed scope |
| FR-23 | Private one-to-one messaging — Optional | `fr23_private_messaging.test.js` | SYS-10 | Implemented and tested as an optional feature; not committed scope |

## 3. Non-functional requirements

The SRS identifies its numerical quality targets as proposed team targets (assumption A-05). Record actual measurements and test conditions before claiming acceptance.

| SRS ID | SRS target / verification intent | Repository evidence or method | Status |
|---|---|---|---|
| NFR-01 | With 20 concurrent users on a LAN, at least 95% of messages appear on every recipient's screen within 1 second; verify using 100 messages and client send/receive times | `npm run test:load`; `scripts/nr01-nr07-load-test.js` | Harness exists. Actual target-environment result must be recorded; a localhost run is engineering evidence, not LAN acceptance |
| NFR-02 | Login and room list complete within 2 seconds on a LAN; time 10 logins | `npm run benchmark:login`; `scripts/nr02-login-benchmark.js` | Harness exists. Record measured result and environment |
| NFR-03 | 100% of accepted messages delivered once and in server-received order while clients remain connected | `nr03_delivery_completeness_order.test.js` | Automated suite included in reported passing run; preserve actual message count/output as evidence |
| NFR-04 | If network is restored within 30 seconds of loss, reconnect within 10 seconds without user action | `fr17_automatic_reconnection.test.js`, `fr16_connection_state.test.js` | Automated coverage exists; manual network interruption timing remains to be recorded |
| NFR-05 | Two hours of continuous operation with 20 users and no restart | `npm run test:soak`; `scripts/nr05-soak-test.js` | Harness exists. Two-hour run result is not yet evidenced in this report |
| NFR-06 | At least 4 of 5 first-time users complete first use within 3 minutes | `nr06_first_use_success.test.js` | Automated suite exists; conduct and record the SRS's five-user usability check separately if the test is not a real-user study |
| NFR-07 | 20 concurrent users across 5 rooms | `npm run test:load`; `scripts/nr01-nr07-load-test.js` | Harness exists. Record actual run settings and result |
| NFR-08 | At least 4 modules and setup achievable within 15 minutes | Code review of `src/`, README setup procedure | README documents setup; record reviewer, module count, and timed clean setup |
| NFR-09 | All Must-priority SEC-REQ requirements met | `security_requirements.test.js`, `sr01_bcrypt_passwords.test.js`, `sr02_authenticated_sockets.test.js`, `sr03_server_assigned_sender.test.js`, `sr04_room_restricted_delivery.test.js`, `sr05_input_validation.test.js`, `sr08_tls.test.js` | Automated suites included in reported passing run; review each Must SEC-REQ mapping below |
| NFR-10 | Browser support: Chrome, Firefox and Edge | SYS-14 manual browser/version execution | Not evidenced until tested and browser versions/results are recorded |

## 4. Security requirements and objectives

| SRS ID | SRS requirement / priority | Automated test suite(s) | Related system scenario | Evidence / status |
|---|---|---|---|---|
| SEC-OBJ-01 | Authenticated access and password confidentiality — Objective | See SEC-REQ-01, 02, 06 and 07 | SYS-03, SYS-12, SYS-13 | Objective traced through its requirements |
| SEC-OBJ-02 | Message attribution and room-restricted delivery — Objective | See SEC-REQ-03 and 04 | SYS-05, SYS-06, SYS-10 | Objective traced through its requirements |
| SEC-OBJ-03 | Protection against malicious input — Objective | See SEC-REQ-05 and FR-19 | SYS-11 | Objective traced through its requirements |
| SEC-REQ-01 | Passwords stored only as salted bcrypt hashes — Must | `sr01_bcrypt_passwords.test.js`, `security_requirements.test.js` | Not directly observable in UI | Automated suites included in reported passing run |
| SEC-REQ-02 | Socket connection refused without a valid token — Must | `sr02_authenticated_sockets.test.js`, `security_requirements.test.js` | SYS-13 | Automated suites included in reported passing run |
| SEC-REQ-03 | Sender identity taken from the connection, not the payload — Must | `sr03_server_assigned_sender.test.js` | SYS-06 | Automated suite included in reported passing run |
| SEC-REQ-04 | Messages delivered only to room members — Must | `sr04_room_restricted_delivery.test.js` | SYS-05, SYS-10 | Automated suite included in reported passing run |
| SEC-REQ-05 | Validate client fields and render user text as plain text — Must | `sr05_input_validation.test.js`, `security_requirements.test.js` | SYS-11 | Automated suites included in reported passing run |
| SEC-REQ-06 | Token is random (at least 128 bits), expires after 24 hours, and is invalidated immediately on logout — Must | `sr02_authenticated_sockets.test.js`, `security_requirements.test.js`, `fr04_user_logout.test.js` | SYS-13 | Automated suites included in reported passing run; confirm all three token properties are explicitly asserted |
| SEC-REQ-07 | Reject login for 5 minutes after 5 consecutive failures for one username — Should | `sr07_login_attempt_lockout.test.js`, `security_requirements.test.js` | SYS-12 | Automated suites included in reported passing run |
| SEC-REQ-08 | Use HTTPS and WSS for deployments beyond localhost — Should | `sr08_tls.test.js` | Verify configured deployment | Automated suite included in reported passing run; deployment configuration must also be checked |

## 5. Execution evidence currently available

The project member supplied a full automated test output reporting **181 passed, 0 failed**, with exit code 0, on 9 November 2026. The associated test report records 33 test files and the run environment. This supports the automated-suite status above; it does not establish the unrecorded manual or non-functional acceptance results.

The supplied source coverage summary reports 74.88% statements/lines, 90.16% functions, and 83.92% branches for `src/`. Coverage percentage is not equivalent to requirements coverage.

## 6. Remaining evidence required for sign-off

1. Attach actual load-test output and record whether NFR-01 and NFR-07 targets were met under the intended LAN conditions.
2. Attach the login benchmark output for NFR-02.
3. Run and retain the complete two-hour soak output for NFR-05.
4. Record the five-user first-use study for NFR-06 if the automated test is not that study.
5. Record the code-review checklist and timed clean setup for NFR-08.
6. Record manual browser/version results for Chrome, Firefox and Edge for NFR-10 / SYS-14.
7. Complete SYS-01 through SYS-14 and attach labelled screenshots or logs. Do not mark a scenario PASS without performing it.
8. For SEC-REQ-06, verify the tests explicitly check token randomness/length, 24-hour expiry and immediate logout invalidation.
9. For FR-21, perform the SRS-described server fault injection (for example, a controlled database failure) and record the safe error behaviour.
10. Keep FR-22 and FR-23 labelled Optional in all scope/completion summaries.

## 7. Limitations
This matrix is based on the approved SRS and the repository's current test inventory. The automated run result is based on evidence supplied by the project member. Non-functional and manual scenarios are not marked accepted unless their measurements or execution evidence are recorded. A test filename alone does not prove that every clause of its mapped requirement is asserted.
