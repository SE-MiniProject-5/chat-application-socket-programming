# Test Cases
## Chat Application using Socket Programming and WebSockets

**Document ID:** TC-001 | **Version:** 2.0 | **Status:** Updated to reflect implemented test suites  
**Updated:** 9 November 2026

## 1. Purpose
This document identifies the automated test suites and system-level scenarios for the chat application. The executable automated suite is the authoritative list of test files in the `npm test` script in `package.json`. Detailed assertions and individual test names remain in the corresponding files under `tests/`.

## 2. Automated test suite inventory
| Test file | Coverage area |
|---|---|
| `fr01_user_registration.test.js` | User registration |
| `fr02_duplicate_username.test.js` | Duplicate username rejection |
| `fr03_user_login.test.js` | User login |
| `fr04_user_logout.test.js` | User logout |
| `fr05_create_room.test.js` | Room creation |
| `fr06_list_chat_rooms.test.js` | Room listing |
| `fr07_join_chat_room.test.js` | Joining a chat room |
| `fr08_leave_chat_room.test.js` | Leaving a chat room |
| `fr09_send_message.test.js` | Sending messages |
| `fr10_realtime_message_delivery.test.js` | Real-time message delivery |
| `fr11_multi_user_room.test.js` | Multi-user room communication |
| `fr12_fr15_fr18_presence_timestamp.test.js` | Presence and timestamp behaviour |
| `fr13_message_history.test.js` | Message history |
| `fr14_online_user_list.test.js` | Online-user list |
| `fr16_connection_state.test.js` | Connection state |
| `fr17_automatic_reconnection.test.js` | Automatic reconnection |
| `fr19_invalid_message_rejection.test.js` | Invalid message rejection |
| `fr20_login_failure.test.js` | Login failure |
| `fr21_safe_server_errors.test.js` | Safe server error responses |
| `fr22_typing_indicator.test.js` | Typing indicator |
| `fr23_private_messaging.test.js` | Private messaging |
| `nr02_nr05_nr08_verification.test.js` | Performance/stability/modularity-related verification |
| `nr03_delivery_completeness_order.test.js` | Message delivery completeness and ordering |
| `nr04_nr10_sr06_reliability_security.test.js` | Reliability and compatibility/security-related verification |
| `nr06_first_use_success.test.js` | First-use success |
| `security_requirements.test.js` | Security requirement checks |
| `sr01_bcrypt_passwords.test.js` | Password hashing |
| `sr02_authenticated_sockets.test.js` | Authenticated WebSocket sessions |
| `sr03_server_assigned_sender.test.js` | Server-assigned sender identity |
| `sr04_room_restricted_delivery.test.js` | Room-restricted message delivery |
| `sr05_input_validation.test.js` | Input validation |
| `sr07_login_attempt_lockout.test.js` | Login-attempt lockout |
| `sr08_tls.test.js` | TLS/transport security |

## 3. System validation scenarios
Execute these against the running application and record actual outcomes in `System_Validation_Report.md`.

| ID | Scenario | Expected result |
|---|---|---|
| SYS-01 | Register a new user | Account is created and success feedback is shown |
| SYS-02 | Register an existing username | Duplicate account is rejected safely |
| SYS-03 | Valid and invalid login | Correct accept/reject behaviour |
| SYS-04 | Create, list, join, and leave a room | Room lifecycle works |
| SYS-05 | Two clients exchange room messages | Messages reach intended room participants |
| SYS-06 | Inspect sender and timestamp | Sender identity and timestamp are correct |
| SYS-07 | Interrupt and restore connection | Reconnection follows documented behaviour |
| SYS-08 | Observe online users and join/leave notices | Presence reflects connected room members |
| SYS-09 | Type and stop typing | Typing indicator appears and clears |
| SYS-10 | Send a private message | Only intended recipient receives it |
| SYS-11 | Send malformed/invalid input | Invalid input is rejected safely |
| SYS-12 | Repeatedly fail login | Configured lockout response occurs |
| SYS-13 | Log out and reuse a socket/session | Invalidated session cannot continue authenticated actions |
| SYS-14 | Run in supported browsers | Record actual browser/version results; do not claim untested compatibility |

## 4. Execution record fields
For every case record test ID, requirement ID (where confirmed), date/time, commit SHA, environment, preconditions, steps, expected result, actual result, status (PASS/FAIL/BLOCKED/NOT RUN), evidence path, and defect ID if applicable.

## 5. Notes
The inventory is derived from the current `npm test` command; update it if `package.json` changes. The suite includes unit and integration checks; do not describe every test as a pure unit test. Manual system scenarios remain planned until actual execution is recorded. Map requirement IDs verbatim from the approved SRS; do not infer them from filenames.
