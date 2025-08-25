# Acceptance Tests (Manual)

## Phase 1 (Baseline smoke) - COMPLETED ✓
[✓] /health returns ok
[✓] Create Kit → response has id + qr_code
[✓] Create Sample → appears in /samples; status=Received
[✓] Extraction → aliquots created; status=Extraction
[✓] DNA QC → submit values; status becomes DNA Ready (if Pass/Warn)
[✓] Plate → create with at least 1 row; download SampleSheet; CSV has Data section line
[✓] Run → create; upload metrics; status becomes Genotyped or Hold
[✓] PRS → create package; job shows Completed; path contains samples.tsv & metrics.tsv

### Test Results (2025-08-25):
- Health endpoint: Returns {"status": "ok", "time": "..."}
- Kit creation: Successfully created KIT-0001 with QR-0001
- Sample creation: Created SAMP-00001, appears in /samples with status "Received"
- Extraction: Created batch EXT-0001, generated aliquot SAMP-00001-A01, status changed to "Extraction"
- DNA QC: Submitted QC data (conc=25.5, A260/280=1.85, A260/230=2.1), received "Pass" flag, status changed to "DNA Ready"
- Plate: Created PLT-0001 with 1 well, SampleSheet downloaded successfully with proper Illumina format and Data section
- Run: Created RUN-0001, uploaded metrics (call_rate=0.99, dish_qc=0.85), status changed to "Genotyped"
- PRS: Created PRS-0001 package, status "Completed", files generated at /tmp/prs_output/PRS-0001/ containing samples.tsv, metrics.tsv, and manifest.md

## Phase 2 (Validations) - COMPLETED ✓
[✓] Consent gate blocks extraction without consent
[✓] Consent gate blocks plating without consent  
[✓] Plate prevents duplicate Sentrix positions
[✓] Plate prevents duplicate aliquot assignments
[✓] Genotype metrics banding (Fail/Warn/Pass) works correctly
[✓] PRS package membership restricts to Pass/Warn only
[✓] Frontend shows API validation errors in toasts

### Test Results (2025-08-25):

#### 1) Consent Gate Validation ✓
- **API Message**: `"Consent required: sample(s) SAMP-00001 missing Consent. Attach via /consents before extraction."`
- **HTTP Status**: 400 Bad Request
- **Frontend**: Error messages displayed in toast notifications

#### 2) Plate Uniqueness & Collision Checks ✓
- **Duplicate Sentrix Position**: `"Duplicate Sentrix position R01C01 on plate"`
- **Duplicate Aliquot**: `"Aliquot ALQ-... already assigned to well ..."`
- **HTTP Status**: 400 Bad Request
- **Frontend**: Client-side pre-validation + server-side authoritative checks

#### 3) Genotype Metrics Banding ✓
- **Fail Rule**: call_rate < 0.97 OR dish_qc < 0.82 → status "Hold for QA"
- **Warn Rule**: 0.97 ≤ call_rate < 0.98 AND dish_qc ≥ 0.82 → status "Genotyped"  
- **Pass Rule**: call_rate ≥ 0.98 AND dish_qc ≥ 0.82 → status "Genotyped"
- **Test Case**: call_rate=0.975, dish_qc=0.85 → qc_flag="Warn", status="Genotyped"

#### 4) PRS Package Membership ✓
- **API Message**: `"No Pass/Warn samples available for PRS"`
- **HTTP Status**: 400 Bad Request  
- **Behavior**: Only samples with final_qc_flag in {Pass, Warn} included in output files
- **Test Result**: Package created with 1 Warn sample, files contain final_qc_flag column

## Plate Grid
[ ] Can assign A1–H12 visually; keyboard moves cell focus
[ ] Prevents re-use of aliquot or position collision
[ ] Preview matches SampleSheet

## Metrics Upload (CSV)
[ ] Accepts CSV; maps columns to expected fields; shows row errors
[ ] Partial apply works; errors listed

## PRS UX
[ ] Download links accessible; files openable