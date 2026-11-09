# Requirements Traceability Matrix
## Chat Application using Socket Programming and WebSockets

**Document Status:** Updated working matrix | **Version:** 2.0 | **Updated:** 9 November 2026

## 1. Purpose
This matrix links implemented test suites and system scenarios to requirement areas. Requirement IDs and exact statements must be copied from the approved SRS before this matrix is final. Test filenames indicate scope but are not a substitute for SRS verification.

## 2. Traceability by test suite
| Requirement area / SRS identifier to verify | Automated test suite(s) | System scenario(s) | Coverage note |
|---|---|---|---|
| User registration | `fr01_user_registration.test.js` | SYS-01 | Automated suite present |
| Duplicate username | `fr02_duplicate_username.test.js` | SYS-02 | Automated suite present |
| User login | `fr03_user_login.test.js`, `fr20_login_failure.test.js` | SYS-03 | Automated suites present |
| User logout | `fr04_user_logout.test.js` | SYS-13 | Automated suite present |
| Room create/list/join/leave | `fr05_create_room.test.js`, `fr06_list_chat_rooms.test.js`, `fr07_join_chat_room.test.js`, `fr08_leave_chat_room.test.js` | SYS-04 | Automated suites present |
| Sending and real-time delivery | `fr09_send_message.test.js`, `fr10_realtime_message_delivery.test.js`, `fr11_multi_user_room.test.js` | SYS-05 | Automated suites present |
| Presence, timestamps, online users | `fr12_fr15_fr18_presence_timestamp.test.js`, `fr14_online_user_list.test.js` | SYS-06, SYS-08 | Automated suites present |
| Message history | `fr13_message_history.test.js` | SYS-05 | Automated suite present |
| Connection state/reconnection | `fr16_connection_state.test.js`, `fr17_automatic_reconnection.test.js` | SYS-07, SYS-13 | Automated suites present |
| Invalid messages/safe errors | `fr19_invalid_message_rejection.test.js`, `fr21_safe_server_errors.test.js`, `sr05_input_validation.test.js` | SYS-11 | Automated suites present |
| Typing indicator | `fr22_typing_indicator.test.js` | SYS-09 | Automated suite present |
| Private messaging | `fr23_private_messaging.test.js` | SYS-10 | Automated suite present |
| Delivery completeness/order | `nr03_delivery_completeness_order.test.js` | SYS-05 | Automated suite present |
| Performance/stability/modularity | `nr02_nr05_nr08_verification.test.js`, load/benchmark/soak scripts | Record separately | Execution evidence required |
| Reliability/compatibility/security | `nr04_nr10_sr06_reliability_security.test.js` | SYS-07, SYS-14 | Manual/browser evidence still needed for system-level claims |
| First-use success | `nr06_first_use_success.test.js` | SYS-01 to SYS-05 | Automated suite present |
| Password hashing | `sr01_bcrypt_passwords.test.js` | Not directly observable in UI | Automated suite present |
| Authenticated sockets/session expiry | `sr02_authenticated_sockets.test.js`, `security_requirements.test.js` | SYS-13 | Automated suites present |
| Server-assigned sender identity | `sr03_server_assigned_sender.test.js` | SYS-06 | Automated suite present |
| Room-restricted delivery | `sr04_room_restricted_delivery.test.js` | SYS-05, SYS-10 | Automated suite present |
| Login lockout | `sr07_login_attempt_lockout.test.js` | SYS-12 | Automated suite present |
| TLS/transport security | `sr08_tls.test.js` | Verify configured deployment | Automated suite present |

## 3. Coverage summary
| Metric | Status |
|---|---|
| Automated test files in npm test | 33 |
| Requirement IDs reconciled verbatim against approved SRS | Pending SRS cross-check |
| Automated execution | Project member reports full suite PASS; attach raw output |
| Manual system scenarios | Pending evidence |
| Requirements with confirmed PASS evidence | Pending result-by-result mapping |

## 4. Completion actions
1. Compare each row with the approved SRS and replace area labels with exact SRS IDs and wording.
2. Add SRS requirements missing from this matrix.
3. Confirm each test file's assertions verify the mapped requirement.
4. Add execution status, run reference, and evidence location.
5. Mark requirements with no test as NOT COVERED and add tests where needed.

## 5. Limitations
This working matrix is based on the current `npm test` inventory and named test suites. It does not claim 100% SRS coverage. Exact SRS identifiers were not available for reliable reconciliation during this update.
