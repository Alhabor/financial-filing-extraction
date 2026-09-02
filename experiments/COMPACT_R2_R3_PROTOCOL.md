# Compact R2/R3 optimized-solution protocol

**Frozen:** 2026-09-02  
**Base commit:** `72114f7`  
**Purpose:** add two independent blind companies before the class presentation without reopening prompt optimization.

## Blind cases

- `R2`: `JPM-FY24` — reserve case; no earlier experiment run.
- `R3`: `META-FY24` — reserve case; no earlier experiment run.

The case packets, page/paragraph locators, and SHA-256 values already frozen in `data/manifests/case_packets.json` are used unchanged. Neither case may be used to revise a prompt, profile, evidence transform, schema, evaluator, or model parameter during these rounds.

## Frozen cells

Each round contains exactly three optimized text cells:

1. DeepSeek: `optimized-deepseek-text-v005` + `PV016`.
2. Gemma: `optimized-gemma-text-v004` + `PV015`.
3. Finance pipeline: `optimized-finance-pipeline-v009` + `PV013` + `evidence-catalog-v005` + `EL001`.

Total maximum: six live attempts. There are no standard-text or native-vision cells because those conditions were already demonstrated in compact R1 and are not the focus of this extension.

## Failure and review rules

- Run once per cell; preserve failures and do not retry or tune.
- Apply `EL001` before `AE002` for the finance pipeline.
- Report automatic schema, metadata, and quotation results separately from agent-assisted semantic review.
- Keep R1, R2, and R3 results separate; a small three-company sample remains exploratory and does not establish statistical stability or a universal model ranking.
