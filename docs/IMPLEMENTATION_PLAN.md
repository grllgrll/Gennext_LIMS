# Implementation Plan (Claude)
This is the step-by-step plan Claude should follow. Each step ends with a manual test checkpoint.

## Phase 1 — Wire core pages to API (baseline already present)
- Verify health: GET /health from web.
- Intake: create Kit → create Sample. Ensure sample appears in /samples.
- DNA QC: create Extraction Batch, list Aliquots, submit QC.
- Plate: create Plate, download SampleSheet.
- Runs: create Run, upload metrics JSON.
- PRS: create Package, verify files at path printed by API.

**Checkpoint:** All pages load, minimal flows complete without errors.

## Phase 2 — UX hardening & validations
- Add client-side validations:
  - Intake: prevent empty clinic ID, empty kit QR.
  - QC: highlight out-of-range values; disable submit until valid.
  - Plate: validate well format (A1–H12), unique (barcode, position) pairs, and non-empty aliquot_id.
  - Runs: enforce at least one chip; validate JSON metrics; helpful error toasts.
- Add status badges with consistent colors (Received, Accessioned, Extraction, DNA Ready, Plated, Genotyped, Hold for QA).
- Add top-level error boundary and toast notifications.

**Checkpoint:** docs/ACCEPTANCE_TESTS.md “Phase 2” passes.

## Phase 3 — Plate Builder 96‑well grid
- Implement grid view A1–H12 with keyboard navigation and search for aliquots.
- Auto-fill SentrixPosition in row/col pattern (R##C##) with collision detection.
- “Preview SampleSheet” modal before creation.

**Checkpoint:** docs/ACCEPTANCE_TESTS.md “Plate Grid” passes.

## Phase 4 — Metrics CSV upload & parser
- Add CSV uploader that maps columns → {sample_id, call_rate, dish_qc, heterozygosity, sex_call, sex_concordance}.
- Validate numeric ranges and show per-row issues; allow partial apply with warnings.
- Keep JSON upload as alternative.

**Checkpoint:** docs/ACCEPTANCE_TESTS.md “Metrics Upload” passes.

## Phase 5 — PRS packaging UX
- Show download links for `samples.tsv`, `metrics.tsv`, `manifest.md` if API exposes static serving path.
- Add checksum display if provided later.

**Checkpoint:** docs/ACCEPTANCE_TESTS.md “PRS UX” passes.
