# Claude Prompts — Getting Started

**Prompt 1 — Verify workspace & dev servers**
```
Open folder /Users/ozkanozdemir/Sandbox/Gennext_LIMS in VS Code.
Ensure Docker Desktop is running. Reopen in Dev Container.
Run the VS Code task: Start Both (API + Web).
Then confirm http://localhost:3000 and http://localhost:8000/health are reachable.
Report any build errors and fix them.
```
**Prompt 2 — Phase 2 validations (frontend)**
```
Implement client-side validations per docs/FRONTEND_SPEC.md and docs/WORKFLOW_RULES.md on /intake, /qc, /plate, /runs.
Add a simple toast system for errors/success. Do not change backend logic.
After changes, run through docs/ACCEPTANCE_TESTS.md Phase 2 and paste the checklist with results.
```
**Prompt 3 — Plate 96‑well grid**
```
Replace the simple table on /plate with a 96‑well grid (A1–H12). Keyboard nav: arrows to move, Enter to edit.
Include an aliquot search modal. Enforce uniqueness of wells and Sentrix positions client-side.
Provide a Preview SampleSheet modal. Keep API unchanged.
```
**Prompt 4 — Metrics CSV upload**
```
Add CSV upload to /runs with column mapping to API's MetricsIn. Validate numeric ranges. Allow partial apply; show per-row errors.
Retain JSON upload as alternative.
```
