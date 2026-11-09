# Unit Test Report
## Chat Application using Socket Programming and WebSockets

**Document ID:** UTR-001 | **Version:** 1.2 | **Report date:** 9 November 2026  
**Status:** Automated test run completed successfully; manual system validation is tracked separately.

## 1. Objective
Record automated test execution for application modules using the Node.js test runner.

## 2. Test method
The run was executed from the repository root on Windows using:
```powershell
npm test
```
The `npm test` script in `package.json` invokes 33 named test files. The collection includes both unit and integration tests; “automated test suite” is used as the collective term.

## 3. Execution environment
| Item | Recorded value |
|---|---|
| Execution date/time | 9 November 2026, 19:19:24 (+05:30) |
| Source commit | `fda8aa45f62cb0a4cffeb60348f10e13decd9d75` |
| Operating environment | Windows PowerShell |
| Node.js | v22.20.0 |
| npm | 10.9.3 |
| Test command | `npm test` |
| Test files invoked | 33 |

## 4. Results
**Overall result: PASS**

| Metric | Result |
|---|---:|
| Tests passed | 181 |
| Tests failed | 0 |
| Tests skipped | 0 |
| Tests cancelled | 0 |
| Tests todo | 0 |
| Test suites | 39 |
| Total test duration | 32.13 seconds |
| Process exit code | 0 |

The test runner also printed Node.js's experimental SQLite warning. It did not cause a test failure; the process completed with exit code 0.

## 5. Test areas
Registration, duplicate usernames, login/logout, room lifecycle, real-time and multi-user messaging, private messaging, history, delivery order/completeness, presence, timestamps, connection state, reconnection, typing indicator, safe errors, input validation, password hashing, authenticated sockets, sender identity, room-restricted delivery, login lockout, TLS, reliability, and performance-related verification.

## 6. Evidence
The following run artifacts are committed under `docs/test-evidence/`:
- [`full-test-output.txt`](test-evidence/full-test-output.txt) — complete TAP output, including final totals.
- [`test-metadata.txt`](test-evidence/test-metadata.txt) — run date/time, commit SHA, Node.js/npm versions, and process exit code.

The files are retained unedited. The run's exact date, source commit, environment and exit code are recorded above.

## 7. Conclusion
The recorded automated run passed all 181 tests across 39 suites with no failures, skips, or cancellations. This result applies to the recorded commit and environment. It does not replace manual browser/system validation or performance testing.
