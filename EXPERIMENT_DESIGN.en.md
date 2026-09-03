# Mini-exercise Experiment Design

**Version:** v0.2.0<br>
**Status:** Preparation has closed; compact R1 and two optimized extension blind tests are complete<br>
**Project:** Group 7 — Financial filing extraction<br>
**Course:** SHBI-GB 7343 — AI in Finance

## 1. Research questions

This project studies how three models should be adapted for real financial-document risk screening, rather than measuring an answer score detached from the workflow:

1. Can the model identify important, distinguishable risks from 10-K text?
2. Can it provide verbatim, traceable source evidence?
3. Can it turn risks into financially meaningful impact mechanisms and monitoring clues?
4. What prompts and validation processes does each model require?
5. How should quality, latency, cost, compute, privacy, and deployment complexity be traded off?

The conclusion should describe the best observed configuration under this experiment’s scenario and resource constraints, not claim to identify a model’s theoretical limit.

## 2. Two experimental tracks

### 2.1 Standardized evidence track

This track makes basic factual capability comparable:

- Use the same case text;
- Use the same core task and output fields;
- Do not allow external search;
- Require all three models to provide three risks, source quotations, and risk classifications;
- Record citation accuracy, evidence-support rate, risk-theme matching, and unsupported inference.

This is the factual-reliability floor, not the complete product score.

### 2.2 Scenario-specific solution track

This track compares practical workflows. During preparation, each model may use settings suited to its characteristics, such as different prompt wording, multi-round validation, decoding parameters, context strategy, or local-runtime settings.

All differences must be recorded explicitly. If one solution uses RAG, extra retrieval, or a second validation call, whether the other solutions may use it must be decided before formal testing; permissions cannot change after seeing the results.

The standardized track answers “How does the model itself perform?” The scenario-specific track answers “Which complete solution is better suited to deployment?”

### 2.3 Input-modality protocol and visual fallback

All inputs use the official 10-K PDF as the factual source, with two equivalent views generated from the same PDF: a text view with page markers and a page-image view for a fixed page range. Models must not see analyst answers, human risk labels, or external-search results.

Report three independently identifiable input conditions:

1. `standard-text`: all three models receive exactly the same case text and core prompt, with no images. This is the fairest cross-model baseline;
2. `optimized-text`: the same case text is used, but prompts, validation steps, and local runtime parameters may be adjusted by model;
3. `native-vision`: fixed page images are sent only to models confirmed to support visual input, with the image-to-page mapping retained. Text-only models continue under the text condition and are not presented as vision models.

Visual conditions require explicit fallback. If the model, runtime, image parser, or output-quality check shows that visual input is unavailable, retain the visual attempt’s error and diagnostic record, then complete the run using the same case’s text view. Mark it `text_fallback`; do not mix it with true `native-vision` results. Otherwise the result can show only that the solution can complete, not that visual capability worked.

A visual failure does not discard the case, but it creates two auditable records: `vision_attempt` and `text_fallback`. Report native vision, text, and fallback rates separately. If the later product needs a stronger PDF parser, that is an independent product input-layer experiment and does not change the three model conditions in this study.

## 3. Fixed model set

| Solution | Model | Main observation dimension |
|---|---|---|
| General cloud | `DeepSeek-V4-Flash-Vision-Exp` | Quality, latency, API cost, service dependency |
| General local | `gemma4:26b-a4b-it-q4_K_M` | Offline capability, privacy, memory/VRAM, speed |
| Finance-specialized | `QuantFactory/Llama-3-8B-Instruct-Finance-RAG-GGUF:Q4_K_M` | Financial expression, risk structure, deployment and inference cost |

These are observation directions to be tested, not assumptions that any model is necessarily better.

## 4. Data and case governance

The primary factual source is public Form 10-K Item 1A, Risk Factors. The current pool contains eight cases; sources and hashes are in `data/manifests/filings.csv`, and the P-phase short packages are in `data/manifests/case_packets.json`. The first four are development cases and the latter four are reserve cases.

Do not pre-supply model inputs with Chinese explanations, human answers, analyst conclusions, or risk labels. Each case should retain:

- Company, fiscal year-end, filing date, and SEC accession;
- PDF, complete extracted text, and Item 1A text;
- PDF physical page, footer/printed page, and source paragraph IDs;
- Frozen short package: text file, page images, and page/paragraph locator index;
- Source URL, extraction time, and SHA-256;
- Whether it belongs to development, validation, or formal blind-test data.

A case used during preparation cannot be presented as a formal blind-test case. Formal cases may be added from outside the current candidate pool.

## 5. Preparation phase P: optimize the complete solution

The preparation phase may run multiple rounds, but every round must produce a new, non-overwriting archive.

### P0: Scenario and rubric calibration

Define the main use case. A recommended framing is “an investment researcher’s first-pass company risk screen,” where the output must provide evidence and explain financial impact.

### P1: Model-specific prompt design

Explore the following separately for all three models:

- Role and task description;
- Evidence-first output order;
- Risk-type constraints;
- Structured output format;
- Single-round or multi-round validation;
- Expression of uncertainty.

Input modality must be recorded as an independent experimental variable rather than folded into the prompt. Preparation may test text, native vision, and text fallback separately, but a model’s poor visual result must not cause the failed run to be deleted.

Record the reason for every change and the cases it affects; do not retain only the final prompt.

### P2: Financial-analysis calibration

After risk extraction, ask the model to explain:

- How the risk transmits to revenue, profit, cash flow, capital, liquidity, operations, or reputation;
- The time horizon of the impact;
- Monitorable indicators or follow-up research directions;
- Mitigation measures already disclosed by the company;
- Which points are inferences and which are not confirmed by the source.

Do not ask the model to invent loss amounts, probabilities, or price targets without data.

### P3: Generalization and stability checks

Keep a validation pool that is not used directly for prompt changes and check:

- Whether the solution works across companies and industries;
- Whether new citation errors appear;
- Whether risk prioritization overfits one industry;
- Whether repeated runs are stable;
- Whether retrieval, validation, or human review is worth adding.

Set the P-phase exit criteria before looking at formal results—for example, no new major evidence or formatting issue for two consecutive rounds, no visible validation-set regression, parseable output from all three models, and a frozen rubric.

## 6. F: Freeze confirmation and protocol

Freeze before formal testing:

- Prompts and adapter configurations for all three models;
- Allowed tools and retrieval boundaries;
- Risk taxonomy;
- Output schema;
- Scoring rules and weights;
- Case grouping;
- Runtime parameters and cost-recording method.

If a problem is found after the freeze, do not rewrite old results. A prompt change requires a new version and an independent test set. Even extension rounds with unchanged settings must be reported separately from earlier rounds.

## 7. R1/R2/R3: formal tests

The basic experimental unit is:

> One model × one case × one run

R1 uses new cases that did not participate in prompt changes. The classroom-deadline extension protocol defines R2 and R3 as two additional reserve cases, using only the three frozen optimized solutions; prompts are not changed in response to their outputs. Keep and report the three rounds separately, do not overwrite earlier results, and do not interpret this small sample as statistical stability evidence.

Retain raw requests, raw responses, errors, elapsed time, tokens/resources, and derived scores for every formal run; see [EXPERIMENT_ARCHIVE.md](EXPERIMENT_ARCHIVE.md).

A lightweight in-house harness handles model calls consistently: load the frozen case package, construct the request, call the corresponding adapter, redact and record raw materials and metrics, parse the output, and validate citations. The default is dry-run; no model request is sent until formal execution is explicitly enabled.

## 8. Output contract

The top-level model output must contain `case_id`, `model_id`, `prompt_version`, and `risks`; `risks` must contain exactly three risk items. Each item contains:

- `risk_id`
- `risk_summary`
- `risk_type`
- `evidence_quote`
- `source_paragraph_ids`
- `source_pages`
- `reasoning`
- `financial_impact`
- `time_horizon`
- `monitoring_indicators`
- `mitigation`
- `uncertainty`

The shared JSON Schema is `schemas/risk-output.schema.json`. A raw model output cannot be overwritten by the parser; the parsed result is a derived file only.

Risk types are fixed to:

- `Strategic / Market / Technology`
- `Operational / Supply Chain`
- `Regulatory / Legal / Geopolitical`
- `Financial / Liquidity / Credit`
- `Cybersecurity / Data / Privacy`
- `Other`

When a risk spans multiple dimensions, assign one primary type and note secondary dimensions in the explanation.

## 9. Financial-analysis scoring

The gold annotation is for checking facts and evidence, not the sole final score. Recommended dimensions are:

1. Source fidelity: is the quote copied verbatim from the input?
2. Evidence support: does the quote support the risk summary sufficiently?
3. Risk importance: does the risk materially affect the company’s finances or operations?
4. Financial transmission analysis: does the output explain how the risk affects financial and operating results?
5. Risk priority: can it distinguish major risks from ordinary risks?
6. Decision usefulness: does it provide monitoring indicators, a time horizon, and research directions?
7. Uncertainty control: does it distinguish facts, inferences, and unknowns?
8. Output usability: can an analyst review it and move it into a workflow?

Analyst material is an auxiliary reference, not the sole gold standard. A model may make a valid discovery when the filing supports the risk but the analyst did not mention it.

## 10. Cost and runtime metrics

For each model and scenario, record at least:

- Time to first response, total latency, and failure rate;
- Input/output tokens or local inference word counts;
- Cloud API cost;
- Local runtime, memory/VRAM, and CPU/GPU information;
- Call count, retry count, and human-correction time;
- Deployment complexity, privacy boundary, and reproducibility.

Present results as a combined quality–time–cost–compute comparison rather than letting a single total score hide the trade-offs.

## 11. Product extension

Once the research result is stable, move the product line into the independent `financial_filing_risk_analyzer` repository. Version 1 accepts a complete PDF or company code but prioritizes automatic Item 1A location and analysis; cross-section retrieval comes later.

Product output should support:

- Risk cards;
- Risk type and financial impact;
- Verbatim source quotations;
- PDF page or paragraph jumps;
- Comparison of the three model results;
- Latency, cost, and runtime status;
- JSON/Markdown export.

The frontend must not see cloud credentials; all model calls happen on the backend. The tool is an evidence-backed risk-screening assistant, not investment advice or automated trading.

## 12. Current status

- Research pool: eight public 10-Ks and eight `case-packet-spec-v001` packages have been organized and verified;
- Preparation: multiple PYPL and COIN results, failure diagnoses, and final configurations are archived;
- Frozen configurations: DeepSeek `PV016`, Gemma `PV015`, and finance evidence pipeline `PV013`;
- Compact R1: `PFE-FY24`, which did not participate in prompt changes, has completed standard text, optimized text, and native vision conditions, for eight no-retry attempts;
- Extension blind tests: three frozen optimized solutions were each run on `JPM-FY24` (R2) and `META-FY24` (R3), for six no-retry attempts;
- Stability boundary: the planned 24-run P003 matrix was not executed, so no statistical stability claim is made;
- Results: see `experiments/R1_PFE_SUMMARY.md` and `experiments/R2_R3_OPTIMIZED_SUMMARY.md`;
- Product repository: planned as `financial_filing_risk_analyzer`, not yet created.
