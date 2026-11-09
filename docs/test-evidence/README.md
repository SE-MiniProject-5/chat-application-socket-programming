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
| `coverage-metadata.txt` | Coverage run metadata | Records commit `6fb3749c690734ee2bca3a5a1cb1971ffa73c9ac` and c8 `1.0.0`; note discrepancy with package-lock c8 `12.0.0`, which must be reconciled |
| `nfr01-nfr07-load-output.txt` | WebSocket load test | 20 users / 5 rooms; 100/100 within 1 second; localhost run |
| `nfr02-login-benchmark.txt` | Login + room-list benchmark | 10 iterations; p95 398.95 ms; localhost run |
| `load-test.txt`, `login-benchmark.txt` | Earlier copies of performance outputs | Retained historical copies; use the NFR-named files as the report references |
| `soak-test.txt` | Earlier NFR-05 attempt | Incomplete: output ends around elapsed=8m; retained for history, not a pass |
| `nfr05-soak-output.txt` | Completed NFR-05 soak result | 20 users / 120 minutes; 719 sent; 14,800 aggregate events received; 0 connection failures; passed true; exit code 0. Final JSON supplied by project member; periodic terminal lines not supplied |

## Pending evidence

| File to add | Purpose | Required condition |
|---|---|---|
| `nfr05-soak-output.txt` | Completed NFR-05 final summary and exit code | Recorded; periodic console output was not supplied |
| `system_validation/SYS-XX-*.png` or safe logs | Manual SYS-01–SYS-14 evidence | Label each screenshot/log; no credentials or tokens |
| Browser evidence | NFR-10 / SYS-14 | Record exact Chrome, Firefox and Edge versions and workflow results |
| Usability study record | NFR-06 | Five first-time participants; individual completion times; at least 4/5 within 180 seconds |
| Modularity/setup review | NFR-08 | Reviewer, at least four modules, clean setup duration |
| LAN benchmark outputs | NFR-01 / NFR-02, if LAN acceptance is required | Run from a client on the target LAN and record environment |

## NFR-05 capture command

From the repository root in PowerShell:

```powershell
New-Item -ItemType Directory -Force docs\test-evidence | Out-Null
npm run test:soak 2>&1 | Tee-Object docs\test-evidence\nfr05-soak-output.txt
$LASTEXITCODE
```

Do not use a shortened `DURATION_MINUTES` for the acceptance run. Keep the existing partial `soak-test.txt` for historical traceability; do not overwrite it with the new run.

## Evidence quality notes

- A console output file is evidence of what the script printed, not proof beyond the checks the script actually performs.
- The current NFR-05 harness uses one local room, reports aggregate received events and RSS, and does not assert per-recipient delivery/order or a memory threshold. The completed run is PASS only for the harness's checks; it is not LAN or multi-room evidence.
- The current coverage metadata's c8 version conflicts with the repository lockfile. Reconcile the original coverage environment; do not silently edit the captured metadata.
- Do not commit passwords, session tokens, cookies, real user data, or private keys.
