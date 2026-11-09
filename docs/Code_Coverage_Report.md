# Code Coverage Report
## Chat Application using Socket Programming and WebSockets

**Document ID:** CCR-001 | **Version:** 1.2 | **Report date:** 9 November 2026  
**Status:** Coverage measured; source scope and limitations documented.

## 1. Objective
Measure the proportion of executable source code exercised by automated tests. This report records statement, line, and function coverage. Branch coverage is detailed in `Branch_Coverage_Report.md`.

## 2. Tool and scope
Coverage was generated using c8/Istanbul with the project test command:
```powershell
npx c8 --all --include=src --exclude=tests --reporter=text --reporter=html --reporter=json-summary npm test
```
The project manifest declares c8 as `^12.0.0`. The configured scope instruments JavaScript under `src/` and excludes `tests/`. Browser-side JavaScript under `public/` is not included.

## 3. Overall results
| Metric | Covered | Total | Coverage |
|---|---:|---:|---:|
| Statements | 1,184 | 1,581 | 74.88% |
| Lines | 1,184 | 1,581 | 74.88% |
| Functions | 55 | 61 | 90.16% |
| Branches | 235 | 280 | 83.92% |

The measurement includes 9 source files. A passing test suite and a coverage percentage are different measures: coverage records execution, not correctness or requirements completeness.

## 4. Per-file results
| Source file | Line/statement coverage | Function coverage | Branch coverage |
|---|---:|---:|---:|
| `auth.js` | 91.53% | 100% | 81.57% |
| `chatManager.js` | 99.01% | 100% | 86.84% |
| `db.js` | 100% | 100% | 100% |
| `loginAttemptLimiter.js` | 100% | 100% | 91.66% |
| `rooms.js` | 100% | 100% | 100% |
| `server.js` | 36.01% | 44.44% | 66.03% |
| `sessionManager.js` | 98.46% | 92.30% | 88.23% |
| `tls.js` | 73.58% | 100% | 73.33% |
| `validation.js` | 100% | 100% | 100% |

## 5. Analysis
Overall line/statement coverage is 74.88%, function coverage is 90.16%, and branch coverage is 83.92%. The main area for improvement is `server.js`, with 36.01% line/statement coverage and 44.44% function coverage. `tls.js` has 73.58% line/statement coverage. The other modules range from 91.53% to 100% line/statement coverage.

Recommended follow-up: inspect uncovered server routes, startup/shutdown paths, exceptional conditions, and TLS configuration paths. Add tests only where they verify meaningful behaviour; do not weaken assertions or remove code merely to raise the percentage.

## 6. Evidence and reproducibility
Retain the following artifacts from the same checkout:
- c8 terminal output (`coverage-output.txt`);
- `coverage/coverage-summary.json`;
- `coverage/index.html` (or an archive of the generated `coverage/` directory);
- source commit SHA and tool versions.

The committed `docs/test-evidence/coverage-metadata.txt` records coverage date 9 November 2026 19:50:38 (+05:30), source commit `6fb3749c690734ee2bca3a5a1cb1971ffa73c9ac`, and c8 version `1.0.0`. However, `package-lock.json` pins c8 `12.0.0`. This is an evidence metadata discrepancy: verify the original environment (for example, `npm ls c8` and `npx c8 --version` from the exact coverage checkout) before treating either version as the actual runtime version. Do not silently change the raw metadata file. The coverage revision recorded in the metadata is `6fb3749c690734ee2bca3a5a1cb1971ffa73c9ac`; the separate full-test run was on `fda8aa45f62cb0a4cffeb60348f10e13decd9d75`.

## 7. Interpretation and limitations
Coverage measures code execution, not correctness, security assurance, or requirements completeness. The report covers only `src/`; it does not claim coverage for browser-side JavaScript in `public/`. Uncovered code may include untested functionality, defensive/error-handling paths, or environment-specific code and should be reviewed.

## 8. Conclusion
The measured overall coverage is 74.88% for statements/lines, 90.16% for functions, and 83.92% for branches across 9 files under `src/`. The server module is the largest opportunity for additional meaningful test coverage.
