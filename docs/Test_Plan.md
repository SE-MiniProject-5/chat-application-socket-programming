# Test Plan
## Chat Application using Socket Programming and WebSockets

**Document ID:** TP-001 | **Version:** 2.0 | **Status:** Updated for final testing  
**Assignment testing window:** 2–6 November 2026 | **Updated:** 9 November 2026

## 1. Purpose and scope
This plan defines testing of the implemented chat application: Node.js server, SQLite persistence, HTTP endpoints, WebSocket communication, and browser client. Scope includes registration, duplicate-account handling, login/logout, room lifecycle, real-time and private messaging, history, delivery ordering/completeness, presence, timestamps, connection state/reconnection, typing indicators, input validation, server-assigned sender identity, session-bound sockets, password hashing, login lockout, TLS behaviour, safe errors, reliability, and performance-related requirements.

## 2. Test approach
- **Automated unit/integration tests:** Node.js built-in test runner via `npm test`; the exact files are listed in `package.json`.
- **System validation:** End-to-end workflows using at least two independent browser sessions. Record actual results, browser versions, dates, and evidence.
- **Security validation:** Invalid credentials, duplicate registration, token/session validation, sender spoofing, room isolation, malformed input, login lockout, and transport-security behaviour.
- **Performance/reliability:** Use `npm run test:load`, `npm run benchmark:login`, and `npm run test:soak` only after reviewing workload and duration. Record actual settings and output.
- **Coverage:** Use c8 to measure statement, line, function, and branch coverage. Coverage is not proof of requirements completeness.

## 3. Test environment
Record actual OS, Node.js/npm versions, browser/version, test commit SHA, and whether execution was local or GitHub Actions. Commands:
```powershell
node --version
npm --version
npm ls --depth=0
```
The project uses Node.js, SQLite, `ws`, and `bcryptjs`; exact installed versions must be captured from the run environment.

## 4. Test data and controls
Use dedicated test accounts and non-production data. Do not use real passwords or personal data. Reset/isolate the database where required. Never commit passwords, session tokens, or secrets in logs/screenshots.

## 5. Entry and exit criteria
**Entry:** dependencies installed using `npm ci`; environment available; commit SHA recorded; scripts and manual steps reviewed.

**Exit:** every applicable case has a status; failures/blocked cases are explained; automated output is retained; manual evidence is labelled; coverage reports contain measured values or clearly state that measurement is pending; traceability is reviewed; limitations are documented.

A test is PASS only when observed results meet expected results. Do not infer coverage percentages or manual test outcomes.

## 6. Schedule
The assignment specifies 2–6 November 2026. If tests actually occurred then, attach contemporaneous evidence. Tests performed after 6 November must be recorded with their real dates and must not be backdated.

## 7. Deliverables
Updated Test Plan, Test Cases, Traceability Matrix, Test Execution Report, Unit Test Report, System Validation Report, Code Coverage Report, Branch Coverage Report, and supporting test output/screenshots/coverage artifacts.

## 8. Risks and limitations
Manual system validation is distinct from automated tests. Performance thresholds must come from the approved SRS. Browser compatibility requires actual browser evidence. Coverage depends on the exact source revision and test command. Unexecuted tests must be marked NOT RUN.

## 9. Approval
| Role | Name | Signature | Date |
|---|---|---|---|
| Testing Lead | TBD | TBD | TBD |
| Project Lead | TBD | TBD | TBD |
| Faculty/Reviewer | TBD | TBD | TBD |
