# Test Execution Report
## Chat Application using Socket Programming and WebSockets

**Document ID:** TER-001 | **Version:** 2.1  
**Report updated:** 9 November 2026 | **Assignment testing window:** 2–6 November 2026

## 1. Purpose
Records automated and system-level test execution. Results are tied to a source commit and supported by captured console output and run metadata.

## 2. Automated execution summary
The project member supplied the complete TAP output and run metadata for the following successful execution:

| Item | Recorded result |
|---|---|
| Automated command | `npm test` |
| Test files invoked | 33 |
| Tests passed | 181 |
| Tests failed | 0 |
| Skipped | 0 |
| Cancelled | 0 |
| Todo | 0 |
| Test suites | 39 |
| Duration | 32,130.879 ms (32.13 seconds) |
| Execution date/time | 9 November 2026, 19:19:24 (+05:30) |
| Source commit | `fda8aa45f62cb0a4cffeb60348f10e13decd9d75` |
| Environment | Windows PowerShell |
| Node.js / npm | v22.20.0 / 10.9.3 |
| Process exit code | 0 |
| Raw evidence | `docs/test-evidence/full-test-output.txt` and `docs/test-evidence/test-metadata.txt` |

**Automated result: PASS.** The SQLite experimental warning appeared during execution but did not affect the successful exit status.

## 3. Automated test scope
The npm test script invokes the 33 test files listed in `package.json`. The inventory is maintained in `Test_Cases.md` and includes functional, integration, security, reliability, and non-functional verification.

## 4. System validation
Manual end-to-end results are recorded separately in `System_Validation_Report.md`. Automated test success does not establish that all browser workflows or manual scenarios were performed. The 14 manual system scenarios remain NOT RUN until actual execution evidence is recorded.

## 5. Defects and retesting
The SR-02 test instability was addressed by making expiry conditions deterministic rather than relying on a globally shortened 1.5-second session TTL. The test teardown also closes tracked WebSocket clients, and event assertions wait for the intended message types. The recorded full-suite run on the commit above passed all 181 tests.

| Reference | Description | Recorded status |
|---|---|---|
| PR #76 | Deterministic SR-02 session-expiry test setup | Earlier test-stability correction |
| Commit `e33cb2e` | Ensure SR-02 test teardown closes upgraded WebSocket clients | Committed to main |
| Commit `fda8aa4` | Make SR-02 WebSocket tests wait for intended events | Included in recorded test commit |

This was a test-reliability correction and is not, by itself, evidence of a production authentication defect.

## 6. Coverage execution
Coverage was measured separately with c8 using `npm test`, instrumenting `src/` and excluding `tests/`. The measured totals are documented in `Code_Coverage_Report.md` and `Branch_Coverage_Report.md`. Coverage results should be associated with the same source checkout; the supplied test metadata records commit `fda8aa45f62cb0a4cffeb60348f10e13decd9d75`.

## 7. Limitations
Manual system/browser results have not been supplied and are not claimed as passed. Performance/load/soak results must be reported separately if those scripts were executed. Coverage is limited to the configured `src/` scope and does not measure browser-side code under `public/`.

## 8. Conclusion
The captured automated run passed 181 tests across 39 suites with zero failures, skips, or cancellations. Final project sign-off still requires manual system-validation evidence, SRS traceability reconciliation, and any performance evidence required by the approved SRS.
