# Performance Test Report
## Chat Application using Socket Programming and WebSockets

**Document ID:** PTR-001 | **Version:** 1.2 | **Execution date:** 9 November 2026  
**Evidence source:** Console output supplied by the project member. The assistant did not independently execute these tests.

## 1. Scope
This report records execution evidence for:
- NFR-01: at least 95% of messages displayed to every recipient within 1 second with 20 concurrent users on a LAN.
- NFR-02: login request and room-list display within 2 seconds on a LAN.
- NFR-07: 20 concurrent users across five rooms.

## 2. NFR-01 and NFR-07 — WebSocket load test

**Command:** `npm run test:load`  
**Script:** `scripts/nr01-nr07-load-test.js`  
**Exit code:** 0

| Measurement | Result |
|---|---:|
| Authenticated users | 20 |
| Rooms | 5 |
| Messages measured | 100 |
| Messages received by every expected room member within 1 second | 100/100 (100.0%) |
| p50 end-to-end delivery | 9.75 ms |
| p95 end-to-end delivery | 22.85 ms |
| Maximum delivery | 38.13 ms |
| Script outcome | PASS |

The script starts an isolated local server and temporary SQLite database, authenticates 20 WebSocket clients, distributes them across five rooms, and measures each message until all expected members of its room receive it.

**Result:** NFR-01's numerical threshold and NFR-07's load configuration passed in this localhost run.

**Limitation:** The approved SRS defines the performance target on a LAN. This run used loopback/localhost and therefore does not prove the same target on the intended LAN.

## 3. NFR-02 — Login and room-list benchmark

**Command:** `npm run benchmark:login`  
**Script:** `scripts/nr02-login-benchmark.js`  
**Base URL:** `http://127.0.0.1:3000`  
**Iterations:** 10  
**Exit code:** 0

| Measurement | Result |
|---|---:|
| Average | 188.77 ms |
| p50 | 153.72 ms |
| p95 | 398.95 ms |
| Maximum | 398.95 ms |
| SRS threshold | ≤ 2,000 ms |
| Script outcome | PASS |

**Result:** The local p95 is below the 2,000 ms threshold.

**Limitation:** The SRS specifies a LAN environment. This localhost result is not represented as LAN acceptance.

## 4. Evidence files
The console outputs are present in the repository at:
- [`docs/test-evidence/nfr01-nfr07-load-output.txt`](test-evidence/nfr01-nfr07-load-output.txt) — committed.
- [`docs/test-evidence/nfr02-login-benchmark.txt`](test-evidence/nfr02-login-benchmark.txt) — committed.

The repository also contains `docs/test-evidence/soak-test.txt`, an earlier incomplete run of approximately 8 minutes. The completed 120-minute result is preserved separately in [`docs/test-evidence/nfr05-soak-output.txt`](test-evidence/nfr05-soak-output.txt). That file contains the exact final JSON summary and exit code supplied by the project member; periodic console lines were not supplied. No passwords, session tokens, or credentials are included.

## 5. Remaining performance validation
- NFR-01: repeat/confirm on the intended LAN if final acceptance requires the SRS environment.
- NFR-02: repeat/confirm on the intended LAN if final acceptance requires the SRS environment.
- NFR-05: completed 120-minute run recorded below; preserve the harness limitations stated in Section 7.
- NFR-06: conduct the five-person first-use usability check; source-level UI tests do not substitute for real users.
- NFR-08: source inventory has nine modules (minimum four met); independent reviewer sign-off and timed clean setup remain pending.
- NFR-10: record Chrome, Firefox, and Edge versions and actual browser results.

## 6. Conclusion
The supplied outputs show successful local execution of NFR-01/NFR-07, NFR-02 and NFR-05 harness runs, each with exit code 0. NFR-05 completed 20 users for 120 minutes with 719 sent messages, 14,800 received WebSocket events and zero connection failures. These results are limited to what each local harness measures; NFR-01/NFR-02 remain localhost rather than LAN evidence. Other non-functional and manual validation requirements remain pending.


## 7. NFR-05 soak harness — measurement scope

The current `scripts/nr05-soak-test.js` defaults to 20 authenticated WebSocket users and 120 minutes. It starts an isolated local server on loopback, creates a temporary SQLite database and one room, connects the clients, and sends a message approximately every 10 seconds. Periodic output records elapsed minutes, sent messages, received WebSocket event count, connection-failure count and process resident memory (RSS).

The final summary reports configured users, elapsed duration, sent count, received-event count, connection failures and a `passed` boolean. The script sets its pass condition from at least 20 users, elapsed duration meeting the configured duration, and zero connection failures.

**Important measurement limitation:** the harness uses one room and does not assert that every expected recipient received each message, verify message ordering/completeness, or apply a memory-growth threshold. It therefore provides an endurance/connection-stability observation for this local harness; it is not a separate multi-room delivery test, LAN test, or proof of bounded memory use. Keep the report wording aligned with these exact checks.

**Completed run (9 November 2026; project-member supplied result):** 20 users; 120 minutes; 719 sent messages; 14,800 received WebSocket events; 0 connection failures; `passed: true`; process exit code 0. The exact final JSON and exit code are preserved in `docs/test-evidence/nfr05-soak-output.txt`. Periodic terminal lines were not supplied, so the repository records the supplied final summary rather than claiming a full raw terminal transcript.

**Result:** NFR-05 passes the current harness's configured acceptance checks: at least 20 users, at least 120 minutes and zero connection failures. This does not establish more than the harness asserts. In particular, the harness uses one local room and does not assert per-recipient delivery/order or a memory-growth threshold.

## 8. NFR-06, NFR-08 and NFR-10 evidence distinction

- **NFR-06:** `tests/nr06_first_use_success.test.js` checks the seeded General room, quick-start text and auto-join code path. These are automated implementation checks, not the SRS's five-person usability study. Record five first-time participants and actual completion times separately.
- **NFR-08:** `tests/nr02_nr05_nr08_verification.test.js` checks script syntax, selected benchmark logic and README setup references. It does not itself time a clean setup or conduct a reviewer-led module count. Record both separately.
- **NFR-10:** the reliability/security test checks use of standard browser APIs and absence of selected vendor-prefixed APIs. This is a source-level baseline, not proof that the app was executed in Chrome, Firefox and Edge. Record exact browser versions and actual workflow results.

See `Final_Validation_Checklist.md` for the corresponding evidence forms and procedures.


## 9. NFR-05 execution result and disposition

| Measurement | Supplied result |
|---|---:|
| Concurrent authenticated users | 20 |
| Duration | 120 minutes |
| Messages sent | 719 |
| WebSocket events received (aggregate) | 14,800 |
| Connection failures | 0 |
| Harness `passed` | true |
| Process exit code | 0 |
| Disposition | PASS for the current harness's checks |

The result was supplied by the project member after the two-hour run. The final JSON and exit code are preserved in `docs/test-evidence/nfr05-soak-output.txt`. The periodic console log was not supplied. The PASS disposition is limited to the script's own pass condition and is not a claim of multi-room delivery, per-recipient completeness/order, LAN operation, or bounded memory growth.
