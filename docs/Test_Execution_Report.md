# Test Execution Report
## Chat Application using Socket Programming and WebSockets

**Document ID:** TER-001 | **Version:** 2.2  
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
| Raw evidence | `docs/test-evidence/full-test-output.txt` and `docs/test-evidence/test-metadata.txt` (both committed) |

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


## 7. Performance execution evidence (9 November 2026)

The project member supplied successful outputs from the repository's load test and login benchmark. Both commands exited with code 0.

### NFR-01 / NFR-07: WebSocket load test

| Measurement | Observed result |
|---|---:|
| Authenticated concurrent users | 20 |
| Rooms | 5 |
| Messages measured | 100 |
| Messages delivered to every member within 1,000 ms | 100/100 (100.0%) |
| p50 end-to-end room delivery | 9.75 ms |
| p95 end-to-end room delivery | 22.85 ms |
| Maximum observed delivery | 38.13 ms |
| Script result | PASS |
| Process exit code | 0 |

The test script created an isolated server and SQLite database and connected 20 authenticated WebSocket clients across five rooms. It measured delivery until every expected member of the sender's room had received each message.

**Interpretation:** The run satisfied the script's NFR-01 threshold and the NFR-07 concurrency/room-count conditions. The test ran against localhost (127.0.0.1), not a LAN deployment. Therefore, it is evidence for the local test environment and does not establish the SRS's LAN performance target.

### NFR-02: Login and room-list benchmark

| Measurement | Observed result |
|---|---:|
| Base URL | http://127.0.0.1:3000 |
| Iterations | 10 |
| Average login + room-list time | 188.77 ms |
| p50 | 153.72 ms |
| p95 | 398.95 ms |
| Maximum | 398.95 ms |
| SRS target | ≤ 2,000 ms |
| Script result | PASS |
| Process exit code | 0 |

**Interpretation:** The local benchmark's p95 was below the 2,000 ms threshold. The SRS verification target specifies a LAN, whereas this run used localhost; confirm on the intended LAN before claiming full environment-level acceptance.

### Evidence files and limitations

The raw command output is committed as:
- `docs/test-evidence/nfr01-nfr07-load-output.txt`
- `docs/test-evidence/nfr02-login-benchmark.txt`

Both raw output files are committed and available to reviewers. The benchmark used a dedicated test account; credentials are intentionally excluded from this report and must not be committed. An earlier `docs/test-evidence/soak-test.txt` is only an approximately 8-minute partial run with no final summary; it is not acceptance evidence for the 120-minute target.

NFR-05's two-hour soak test and manual system/browser validation remain outstanding. No result is inferred for tests that have not been run.


## 9. Final validation status

The full automated result remains 181 passed and zero failures for the recorded run. The later localhost performance outputs for NFR-01/NFR-07 and NFR-02 are recorded in `Performance_Test_Report.md`; they do not establish LAN acceptance.

The following are still pending actual execution evidence: the 120-minute NFR-05 run, five-person NFR-06 study, reviewer-led/timed NFR-08 check, actual Chrome/Firefox/Edge execution for NFR-10, manual SYS-01 through SYS-14, and any required FR-21 runtime fault injection. The exact measurement limitations of the existing automated checks are documented in the Traceability Matrix and Final Validation Checklist.

SEC-REQ-06 is explicitly asserted by the current automated tests for 256-bit token format/uniqueness, 24-hour expiry and immediate logout invalidation. FR-22 and FR-23 remain Optional in the approved SRS and outside committed scope.

See `Final_Validation_Checklist.md` for the remaining evidence collection procedure and `Final_Demo_and_Deviations_Report.md` for the final recording/deviation register.
