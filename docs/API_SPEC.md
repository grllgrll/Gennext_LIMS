# API Spec (FastAPI)
See live docs at http://localhost:8000/docs

## Endpoints (MVP set)
- GET /health
- POST /kits → {clinic_id} → KitOut
- GET /kits
- POST /samples → {kit_qr, sample_type, subject_pseudoid, collection_datetime} → SampleOut
- GET /samples → SampleOut[]
- POST /consents → {sample_id, ...}
- POST /extractions → {sample_ids[]} → creates Aliquots
- GET /aliquots → list (id, sample_id, label, qc_flags[])
- POST /extractions/qc → DNAQCIn[] → {qcs:[{aliquot_id, qc_flag}]}
- POST /plates → PlateCreate → {plate_id}
- GET /plates → list plates
- GET /plates/{id}/samplesheet → CSV text (Illumina layout)
- POST /runs → RunCreate → {run_id}
- GET /runs → list runs
- POST /runs/{run_id}/metrics → MetricsIn[]
- POST /runs/{run_id}/prs_package → PRSJobOut
- GET /prs_jobs → PRSJobOut[]

**QC thresholds (env or defaults)**
- DNA_MIN_CONC=20, A260_280=[1.7,2.1], A260_230>=1.8, CALLRATE>=0.98, DISHQC>=0.82
