# Compact R1 blind result — PFE-FY24

**Case:** Pfizer FY2024, untouched reserve packet `PFE-FY24`  
**Freeze commit:** `83cd0a8`  
**Live attempts:** 8 maximum protocol cells completed; no retries  
**Interpretation:** exploratory classroom evidence, not a statistically powered benchmark

## Results by input condition

| Condition | Model | Status | Latency | Input / output tokens | Main result |
|---|---|---:|---:|---:|---|
| Standard text | DeepSeek | failed | 16.183 s | 6,898 / 1,600 | Output budget consumed by reasoning; no assistant answer |
| Standard text | Gemma | failed | 246.034 s | 7,032 / 1,600 | Output budget consumed by reasoning; no assistant answer |
| Standard text | Finance | preflight failed | — | 6,840 input measured | 6,840 + 1,600 reserve exceeded the 8,192 context |
| Optimized text | DeepSeek | partial | 6.641 s | 6,980 / 601 | Schema passed; 2 of 3 quotations passed; one quotation changed source wording |
| Optimized text | Gemma | passed | 156.519 s | 7,050 / 748 | Three risks, schema, metadata, and quotations passed |
| Optimized text | Finance pipeline | passed | 68.676 s | 2,426 / 189 | Three grouped evidence selections and deterministic source localization passed |
| Native vision | DeepSeek | failed | 16.138 s | 1,851 / 1,600 | Output budget consumed by reasoning; no assistant answer |
| Native vision | Gemma | failed | 188.465 s | 1,514 / 1,600 | Output budget consumed by reasoning; no assistant answer |

## What the blind case shows

1. Prompt and workflow design changed task completion more than the generic `PV001` baseline: no standard-text model completed, while two optimized solutions passed fully.
2. The finance evidence pipeline reduced its model input from a 6,840-token standard request to 2,426 live input tokens and converted a context failure into a complete result.
3. DeepSeek was fastest in the optimized condition but changed one cited phrase. The exact filing says `certain drug pricing provisions`; the model quoted `The drug pricing provisions`, so `AE002` correctly rejected it.
4. Gemma's optimized output was fully valid but slowest among successful optimized solutions.
5. Native vision was not usable under the frozen `PV001`/1,600-token setup. This is a recorded experiment outcome, not evidence that the underlying models lack all vision ability.

## Successful optimized risk themes

The finance pipeline selected generic-manufacturer competition, regulatory/product revenue exposure, and counterfeit/cybersecurity-related consumer harm. Gemma selected payer negotiating power, competitive product launches, and third-party collaborator disruption. Both sets are source-supported and illustrate that multiple valid top-three selections can coexist.

## Limits

- One blind company and one run per cell cannot establish repeatability or general model rankings.
- The original 24-run P003 stability matrix was deliberately skipped for the class deadline; `stability not established` must appear in the presentation.
- Agent-assisted semantic review remains subject to course-team confirmation.
- Non-core financial-analysis fields were deliberately set to explicit abstentions in optimized runs to prevent unsupported content. A production tool should add a separately evaluated analysis stage.
