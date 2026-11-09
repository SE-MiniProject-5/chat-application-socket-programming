# Unit Test Report
## Chat Application using Socket Programming and WebSockets

**Document ID:** UTR-001 | **Version:** 1.0 | **Report date:** 9 November 2026  
**Status:** Successful run reported; raw execution details pending attachment

## 1. Objective
Record automated test execution for application modules using the Node.js test runner.

## 2. Test method
Run from the repository root:
```powershell
npm ci
npm test
``
The `npm test` script in `package.json` invokes 33 named test files. The collection includes both unit and integration tests; “automated test suite” is used as the collective term.

## 3. Result
The project member reports that the complete `npm test` command passed after the SR-02 test setup correction.

| Metric | Result |
|---|---|
| Overall result | PASS (reported) |
| Test files in npm script | 33 |
| Tests passed | Pending exact terminal output |
| Tests failed | 0 reported |
| Skipped/cancelled | Pending exact terminal output |
| Duration | Pending exact terminal output |
| Commit SHA | Pending |
| Node.js / npm versions | Pending |

## 4. Test areas
Registration, duplicate usernames, login/logout, room lifecycle, real-time and multi-user messaging, private messaging, history, delivery order/completeness, presence, timestamps, connection state, reconnection, typing indicator, safe errors, input validation, password hashing, authenticated sockets, sender identity, room-restricted delivery, login lockout, TLS, reliability, and performance-related verification.

## 5. Evidence
Retain unedited output and run metadata:
```powershell
git rev-parse HEAD
node --version
npm --version
npm test 2>&1 | Tee-Object -FilePath unit-test-output.txt
``
Store output under `docs/test-evidence/` or link the GitHub Actions run.

## 6. Conclusion
A successful full automated run has been reported. Exact test counts, duration, environment versions, and commit identity must be filled from the captured run before this report is fully evidenced.
