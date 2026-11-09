# Branch Coverage Report
## Chat Application using Socket Programming and WebSockets

**Document ID:** BCR-001 | **Version:** 1.2 | **Report date:** 9 November 2026  
**Status:** Branch coverage measured using c8 for the configured `src/` scope.

## 1. Objective
Measure whether conditional outcomes and other instrumented branch paths are exercised by automated tests.

## 2. Measurement method
Branch coverage was collected with the same c8 command used for the Code Coverage Report:
```powershell
npx c8 --all --include=src --exclude=tests --reporter=text --reporter=html --reporter=json-summary npm test
```
The project manifest declares c8 as `^12.0.0`. The instrumented scope is `src/`, excluding `tests/`; browser code under `public/` is outside this measurement.

## 3. Overall result
**Branch coverage: 83.92%**

| Metric | Result |
|---|---:|
| Branches covered | 235 |
| Total branches | 280 |
| Branches not covered | 45 |
| Branch coverage | 83.92% |

## 4. Per-file branch coverage
| Source file | Covered branches | Total branches | Coverage |
|---|---:|---:|---:|
| `auth.js` | 31 | 38 | 81.57% |
| `chatManager.js` | 66 | 76 | 86.84% |
| `db.js` | 4 | 4 | 100% |
| `loginAttemptLimiter.js` | 22 | 24 | 91.66% |
| `rooms.js` | 8 | 8 | 100% |
| `server.js` | 35 | 53 | 66.03% |
| `sessionManager.js` | 30 | 34 | 88.23% |
| `tls.js` | 11 | 15 | 73.33% |
| `validation.js` | 28 | 28 | 100% |
| **Total** | **235** | **280** | **83.92%** |

## 5. Analysis and recommended action
The largest branch-coverage gaps are in `server.js` (18 uncovered branches), `chatManager.js` (10), `auth.js` (7), `sessionManager.js` (4), `tls.js` (4), and `loginAttemptLimiter.js` (2). Prioritise meaningful tests for server-side exceptional paths, authorization and connection states, and TLS configuration decisions.

A branch not executed is not automatically a defect. Review each uncovered path against the SRS and design; document any path that is intentionally environment-specific or infeasible to exercise in the current test environment.

## 6. Evidence
The committed evidence includes `docs/test-evidence/coverage-summary.json`, `docs/test-evidence/coverage-output.txt`, `docs/test-evidence/coverage-metadata.txt`, and the browsable HTML report at `coverage/index.html`. The metadata records coverage source commit `6fb3749c690734ee2bca3a5a1cb1971ffa73c9ac` and c8 `1.0.0`, while `package-lock.json` pins c8 `12.0.0`. Reconcile this version discrepancy using the original coverage environment before claiming the exact runtime version. The separate automated test run metadata records commit `fda8aa45f62cb0a4cffeb60348f10e13decd9d75`; do not conflate the two source revisions.

## 7. Limitations
This report measures branches only in the configured `src/` scope. It does not establish browser-side branch coverage for `public/`, nor does it prove all SRS requirements have been tested.

## 8. Conclusion
The measured branch coverage is 83.92% (235 of 280 branches) across 9 source files. The remaining 45 branches should be reviewed to determine whether additional tests are warranted.
