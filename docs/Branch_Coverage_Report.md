# Branch Coverage Report
## Chat Application using Socket Programming and WebSockets

**Document ID:** BCR-001 | **Version:** 1.0 | **Report date:** 9 November 2026  
**Status:** Measurement procedure prepared; branch percentage pending execution

## 1. Objective
Measure whether conditional outcomes and other instrumented branch paths are exercised by automated tests.

## 2. Measurement method
c8/Istanbul reports branch coverage as part of its coverage summary. Run the same instrumented test command used for the Code Coverage Report:
```powershell
npx c8 --all --include=src --exclude=tests --reporter=text --reporter=html --reporter=json-summary npm test
``
Branch metrics appear in the text summary and `coverage/coverage-summary.json`. Use the same source scope and commit SHA as the code coverage report.

## 3. Results
| Metric | Measured result |
|---|---|
| Branches covered | Pending c8 output |
| Total branches | Pending c8 output |
| Branch coverage percentage | Pending c8 output |
| Instrumented files | Pending c8 output |
| Source scope | `src/**/*.js` (verify c8 output) |
| Test command | `npm test` |
| Commit SHA | Pending |

Do not estimate branch coverage from the number of passing tests. They are different measurements.

## 4. Evidence and analysis
Attach `coverage/coverage-summary.json`, HTML report, and terminal output. Review uncovered branches and identify untested conditional paths, error/boundary paths requiring tests, and intentionally unreachable/environment-specific paths with justification.

## 5. Limitations
The suggested command instruments `src/` only. It does not automatically establish browser-side branch coverage for `public/`. If browser JavaScript is in scope, configure browser instrumentation and report it separately.

## 6. Conclusion
The measurement procedure is documented. Enter final branch totals and percentage from c8 output for the same commit used in the code coverage report.
