# Experiment run archive

[Chinese version](README.md) | English

This directory stores preparation `P`, freeze-confirmation `F`, and formal `R1`/`R2`/`R3` run records. The fixed preparation matrix and exit criteria are in [P_PROTOCOL.md](P_PROTOCOL.md).

Each run directory represents one “model × case × attempt.” Recommended naming:

```text
<ROUND>-<CASE-ID>-<MODEL-ALIAS>-<UTC-TIMESTAMP>-a<ATTEMPT>
```

The full retention rules are in [EXPERIMENT_ARCHIVE.md](../EXPERIMENT_ARCHIVE.md). `INDEX.csv` records whether each case belongs to development, validation, or formal testing.

## Harness boundary

Experiment calls go through the lightweight harness at the repository root. The first phase materializes a dry run and does not call any model:

```bash
node scripts/materialize_experiment_run.cjs \
  --case-id NVDA-FY25 \
  --model-alias cloud-deepseek \
  --profile standard-text-v001 \
  --phase P \
  --round P001
```

It generates fixed `model_input.txt`, `prompt.txt`, `modality.json`, redacted `request.sanitized.json`, `manifest.json`, and a checksum list. A future real call must explicitly enable live mode. If vision fails, save the failed attempt first and then create a separate `text_fallback` attempt; never overwrite the original record.
