# Test Evidence Index

This directory contains the raw outputs and metadata referenced by the project test reports. Preserve raw evidence as captured; explain results in the reports rather than editing console output.

## Committed evidence

| File | Purpose | Current interpretation |
|---|---|---|
| `full-test-output.txt` | Complete Node.js TAP output | 181 passed, 0 failed; 33 test files; recorded run commit is in test metadata |
| `test-metadata.txt` | Automated test run metadata | 9 November 2026; commit `fda8aa45f62cb0a4cffeb60348f10e13decd9d75`; Node v22.20.0; npm 10.9.3; exit code 0 |
| `coverage-output.txt` | c8 terminal output | Coverage summary for configured `src/` scope |
| `coverage-summary.json` | Machine-readable c8 summary | Source coverage percentages reported in coverage reports |
| [`coverage/index.html`](../../coverage/index.html) and per-file HTML reports | Browsable c8 HTML report | Committed at repository root under `coverage/` |
| `coverage-metadata.txt` | Coverage run metadata | Records commit `6fb3749c690734ee2bca3a5a1cb1971ffa73c9ac` and c8 `1.0.0`; this conflicts with package-lock c8 `^12.0.0`. See the coverage reports and project completion status; rerun from a clean checkout to establish a new consistent measurement. |
| `nfr01-nfr07-load-output.txt` | WebSocket load test | 20 users / 5 rooms; 100/100 within 1 second; localhost run |
| `nfr02-login-benchmark.txt` | Login + room-list benchmark | 10 iterations; p95 398.95 ms; localhost run |
| `load-test.txt`, `login-benchmark.txt` | Earlier copies of performance outputs | Retained historical copies; use the NFR-named files as the report references |
| `soak-test.txt` | Earlier NFR-05 attempt | Incomplete: output ends around elapsed=8m; retained for history, not a pass |
| `nfr05-soak-output.txt` | Completed NFR-05 soak result | 20 users / 120 minutes; 719 sent; 14,800 aggregate events received; 0 connection failures; passed true; exit code 0. Final JSON supplied by project member; periodic terminal lines were not supplied. PASS is limited to the harness checks described in the Performance Test Report. |

## Outstanding evidence

The NFR-05 final summary is already recorded above. It is not a pending file.

| Evidence to add | Purpose | Required condition |
|---|---|---|
| `system_validation/SYS-XX-*.png` or safe logs | Manual SYS-01–SYS-14 evidence | Label each screenshot/log; no credentials or tokens. SYS-09/SYS-10 are optional features unless separately required. |
| Browser evidence | NFR-10 / SYS-14 | Record exact Chrome, Firefox and Edge versions and workflow results |
| Usability study record | NFR-06 | Five first-time participants; individual completion times; at least 4/5 within 180 seconds |
| Modularity/setup review | NFR-08 | Independent reviewer, at least four modules, clean setup duration |
| LAN benchmark outputs | NFR-01 / NFR-02, if LAN acceptance is required | Run from a client on the target LAN and record environment |
| Network interruption evidence | NFR-04 | Actual interruption/recovery timing and observed client state |
| Fault-injection evidence | FR-21, if required for acceptance | Isolated controlled failure, safe client response and server-side diagnostic evidence |
| Final demo | Final submission | Final-version recording, verified path/link and required duration |
| Deviation approvals | SRS/SAD/Test Plan reconciliation | Completed entries with baseline sections, impact, approval and date |

## Evidence quality notes

- A console output file is evidence of what the script printed, not proof beyond the checks the script actually performs.
- The current NFR-05 harness uses one local room, reports aggregate received events and RSS, and does not assert per-recipient delivery/order or a memory threshold. The completed run is PASS only for its own configured checks; it is not LAN or multi-room evidence.
- NFR-01/NFR-07 and NFR-02 outputs are localhost measurements, not LAN acceptance.
- The current coverage metadata's c8 version conflicts with the repository lockfile. Preserve the historical metadata and rerun coverage from a clean checkout to create new, consistent evidence.
- Do not commit passwords, session tokens, cookies, real user data, or private keys.

## Related completion record

See [Project Completion Status and Final Handover](../PROJECT_COMPLETION_STATUS.md) for the audited repository state, complete/pending workstreams and final disposition.

---

## Final evidence and completion status — 19 November 2026

The project owner confirms that all tests and validation activities previously listed as outstanding have been completed successfully, including system scenarios, browser compatibility, usability, LAN/performance acceptance, network recovery, setup/modularity review, fault validation, final demonstration and deviation review.

For this mentor-facing completion update, screenshot uploads are not required. The repository's existing raw automated/performance evidence remains indexed above. The owner confirmation is the source for completion of the additional activities; no unprovided numeric measurements, browser versions, participant details or file paths are fabricated.

**Evidence status:** Recorded repository artifacts retained; remaining execution activities confirmed complete by project owner. **Project testing: COMPLETE per owner confirmation.**
