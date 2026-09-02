# Minimal freeze and R1 protocol for the class deadline

**Frozen for this compact run:** 2026-09-02  
**Reason:** presentation deadline; prioritize an auditable demonstration over a large benchmark.

## Stability decision

The original 24-run P003 matrix is not run. Existing PYPL and COIN preparation attempts already exercise all three runtimes, structured output, quote validation, deterministic localization, and failure preservation under temperature 0 and fixed seed 7343. Repeating 24 cells would add cost and delay but would not replace a genuinely broader validation set. The report must therefore say `stability not established`; it may not report a repeatability rate.

## Frozen optimized configurations

- DeepSeek: `optimized-deepseek-text-v005` + `PV016`
- Gemma: `optimized-gemma-text-v004` + `PV015`
- Finance model: `optimized-finance-pipeline-v009` + `PV013` + `evidence-catalog-v005` + `EL001`
- Core schema: `risk-output-core-v001`; finance raw selection: `finance-selection-v003`; normalized schema: `risk-output-v001`
- Automatic evaluator: `AE002`; primary quotation rule: whitespace-normalized exact words and punctuation; raw-exact remains secondary.

## Compact blind case

Use only untouched reserve case `PFE-FY24`. Do not tune prompts after viewing any PFE output. Any failure remains part of R1.

The blind demonstration has three independently reported input conditions:

1. `R1-standard-text`: one PFE run per model using `standard-text-v001` + `PV001` (3 attempts).
2. `R1-optimized-text`: one PFE run per model using the frozen optimized configurations above (3 attempts).
3. `R1-native-vision`: one PFE run for each configured vision-capable model using the same four frozen page images (2 attempts). The text-only finance model is `not applicable`, not counted as a failure.

Total maximum: 8 live attempts, no repeats and no R2. Vision failures are preserved; a text fallback is optional only if needed for the classroom demo and must receive a separate run ID.

This compact R1 is exploratory evidence for the presentation, not a statistically powered benchmark.
