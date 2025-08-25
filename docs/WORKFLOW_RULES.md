# Workflow Rules & Status Machine

## Status transitions (Sample)
Kit Issued → Collected → In Transit → **Received** → Accessioned → Extraction → **DNA Ready** → Plated → Genotyped → PRS‑Ready → Released
Failures: Recollect Needed, Re‑extract, Re‑hybridize, Hold for QA

## Gates (block next stage until passed)
- Consent must exist to move from Received → Accessioned.
- DNA QC must be Pass/Warn to move to Plated.
- Array metrics: CallRate & DishQC must meet thresholds to be “Genotyped”; else Hold for QA.

## QC Flags
- DNA QC: Pass / Warn / Fail (Warn if conc ≥ 70% of min & ratios borderline, else Fail).
- Genotype: Pass / Warn / Fail (Warn if close to thresholds; exact rule in API).

## Thresholds (initial; configurable later)
- Concentration ≥ 20 ng/µL; A260/280 in [1.7–2.1]; A260/230 ≥ 1.8
- CallRate ≥ 0.98; DishQC ≥ 0.82
