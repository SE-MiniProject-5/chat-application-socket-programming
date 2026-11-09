# Code Coverage Report
## Chat Application using Socket Programming and WebSockets

**Document ID:** CCR-001 | **Version:** 1.0 | **Report date:** 9 November 2026  
**Status:** Measurement procedure prepared; percentages pending execution

## 1. Objective
Measure the proportion of executable source code exercised by automated tests. This report covers statement, line, and function coverage. Branch coverage is reported separately in `Branch_Coverage_Report.md`.

## 2. Tool and scope
Use Istanbul c8 with the existing npm test command. Suggested scope is server-side JavaScript under `src/`; browser-side code under `public/` is not included unless explicitly instrumented/configured.

Install c8 as a development dependency:
```powershell
npm install --save-dev c8
``
Run:
```powershell
npx c8 --all --include=src --exclude=tests --reporter=text --reporter=html --reporter=json-summary npm test
``
This creates `coverage/`, including an HTML report and JSON summary. Verify the actual include/exclude scope before interpreting results.

## 3. Results
| Metric | Measured result |
|---|---|
| Statements | Pending c8 output |
| Lines | Pending c8 output |
| Functions | Pending c8 output |
| Instrumented files | Pending c8 output |
| Source scope | `src/**/*.js` (verify c8 output) |
| Test command | `npm test` |
| Commit SHA | Pending |
| c8 version | Pending |

No coverage percentage is asserted until c8 has been run and its summary captured.

## 4. Evidence
Retain terminal output, `coverage/coverage-summary.json`, `coverage/index.html` or zipped `coverage/`, commit SHA, and tool versions.

## 5. Interpretation and limitations
Coverage measures code execution, not correctness or requirements completeness. Review uncovered code to determine whether it represents untested functionality, defensive/error-handling code, or unreachable code. Do not increase coverage by deleting assertions or weakening tests.

## 6. Conclusion
The procedure is prepared. Populate measured values from c8 output and attach HTML/JSON evidence before submission.
