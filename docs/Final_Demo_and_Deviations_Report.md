# Final Demonstration and SRS/SAD/Test Plan Deviation Record
## Chat Application using Socket Programming and WebSockets

**Document ID:** FDR-001 | **Version:** 1.0 | **Prepared:** 9 November 2026  
**Status:** Recording and final review pending.

## 1. Purpose

This document provides a concise structure for the final working-product demonstration and a controlled record of differences between the submitted SRS, SAD, Test Plan and the delivered project. Complete the actual deviation entries by comparing the approved/submitted documents with the final repository. Do not infer a deviation from an implementation detail alone.

## 2. Suggested two-minute demonstration sequence

| Time | Demonstration | Evidence to show |
|---|---|---|
| 0:00–0:10 | Introduce the application and technology stack | Application landing page; Node.js, WebSockets and SQLite |
| 0:10–0:30 | Register or log in with a test account | Successful account/login flow; do not show credentials |
| 0:30–0:50 | Open a second independent session and join the same room | Two browser windows and room membership |
| 0:50–1:15 | Exchange real-time messages | Message appears in both intended sessions without refresh |
| 1:15–1:30 | Show room list, sender identity, timestamp and online presence | Visible UI behaviour |
| 1:30–1:45 | Show logout/session handling or reconnect behaviour | Safe workflow that has been manually verified |
| 1:45–2:00 | Close with test evidence and limitations | Automated test summary and any outstanding validation |

Use a clean test database and dedicated demo accounts. Hide passwords, tokens, browser storage, environment variables and personal data. Do not demonstrate an optional feature as a Must requirement.

## 3. Recording checklist

- [ ] Record a continuous two-minute working-product demonstration (or the exact duration required by the instructor).
- [ ] Ensure the application is running from the final intended commit.
- [ ] Use two independent browser sessions for the real-time messaging segment.
- [ ] Keep terminal output readable if showing startup or test execution.
- [ ] Do not show credentials, tokens, cookies, database contents containing personal data, or private messages.
- [ ] Confirm audio/video is understandable and the UI is visible.
- [ ] Save the final video at the agreed repository path and record its filename below.
- [ ] Verify the uploaded video can be opened from the repository.

**Video filename/path:** To record  
**Recording date:** To record  
**Commit demonstrated:** To record  
**Duration:** To record

## 4. Known scope note

The approved SRS marks FR-22 (typing indicator) and FR-23 (private one-to-one messaging) as Optional and outside the committed scope. The repository contains implementation and automated tests for these optional features. Their presence must not be used to imply that the project expanded the approved Must scope or that the optional features received manual acceptance testing.

## 5. Deviation register

Populate this table only after comparing the final implementation and evidence against the submitted baseline documents.

| ID | Baseline document and section | Submitted requirement/design/test | Actual delivered behaviour or process | Reason | Impact | Approved by / date | Evidence |
|---|---|---|---|---|---|---|---|
| DEV-01 | SRS / SAD / Test Plan — section to verify | To compare | To record | To record | To record | Pending | — |
| DEV-02 | SRS / SAD / Test Plan — section to verify | To compare | To record | To record | To record | Pending | — |
| DEV-03 | SRS / SAD / Test Plan — section to verify | To compare | To record | To record | To record | Pending | — |

Do not enter a deviation merely because a test has not yet been executed; record that as an evidence gap in the test reports. Do not treat Optional FR-22/FR-23 as a deviation from Must scope.

## 6. Final evidence references

| Artifact | Repository path / URL | Status |
|---|---|---|
| Approved SRS | `docs/SRS_Chat_Application.pdf` | Baseline |
| Software Architecture Design | Repository baseline is `docs/SA&DS.docx` (confirm document title/section before citing) | To verify |
| Test Plan | `docs/Test_Plan.md` | Updated |
| Test Cases | `docs/Test_Cases.md` | Updated |
| Test Execution Report | `docs/Test_Execution_Report.md` | Updated |
| System Validation Report | `docs/System_Validation_Report.md` | Manual results pending |
| Performance Test Report | `docs/Performance_Test_Report.md` | Partial; NFR-05 pending |
| Traceability Matrix | `docs/Traceability_Matrix.md` | Updated |
| Video | To record | Pending |
| Deviation approvals | To record | Pending |

## 7. Conclusion

The automated test and local performance evidence are recorded in their respective reports. The final demonstration, manual system validation, outstanding NFR evidence and approved deviation review must be completed before final sign-off.
