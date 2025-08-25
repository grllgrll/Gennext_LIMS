# Metrics Import Formats

## JSON (current)
[
  {"sample_id":"SMP-XXXXXX","call_rate":0.991,"dish_qc":0.90,"heterozygosity":0.31,"sex_call":"XY","sex_concordance":true}
]

## CSV (to support next)
Columns:
- sample_id (string)
- call_rate (float 0..1)
- dish_qc (float 0..1)
- heterozygosity (float optional)
- sex_call (string optional)
- sex_concordance (boolean optional)
