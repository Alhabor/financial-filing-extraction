# Financial filing extraction

[Chinese version](README.md) | English

Group 7’s **SHBI-GB 7343 — AI in Finance** course project. Starting from the course task of extracting risks from 10-K filings, the project compares how three models fit a real financial-analysis workflow and extends the experiment into a traceable filing risk analyzer prototype.

## Project objective

The goal is not to find the highest-scoring model under an identical prompt. It is to study:

> In a real financial-document risk-screening scenario, which combination of model, prompt, and validation workflow can produce credible, evidence-backed, financially useful results with reasonable time, cost, and compute?

The project therefore retains two experimental tracks:

1. **Standardized evidence track:** same source text, core task, and output contract, comparing source fidelity, citation accuracy, risk classification, and unsupported inference.
2. **Scenario-specific solution track:** model-specific prompt, reasoning-round, output-structure, and runtime optimization, comparing practical quality, time, cost, compute, and usability.

## Course requirements

- Course: `SHBI-GB 7343`
- Course name: `AI in Finance`
- Group: `Group 7`
- Class task: `Mini-exercise: financial filing extraction`
- Course material: Lecture 1, Page 73
- Original task: Given a 10-K Risk Factors passage, identify three material risks, quote supporting text, classify each risk, and validate every conclusion.

## Fixed model set

| Solution | Model | Runtime |
|---|---|---|
| General cloud | `DeepSeek-V4-Flash-Vision-Exp` | Server-side API |
| General local | `gemma4:26b-a4b-it-q4_K_M` | Local inference |
| Finance-specialized | `QuantFactory/Llama-3-8B-Instruct-Finance-RAG-GGUF:Q4_K_M` | Local GGUF inference |

All model calls use a shared harness. Each run records the actual model ID, runtime parameters, call time, tokens, latency, errors, and resource consumption.

## Current status

Completed:

- Experiment design, eight public 10-Ks, frozen case packages, page/paragraph indexes, and hash checks;
- Three-model standardized benchmark preparation and multi-round PYPL/COIN prompt/workflow development;
- A deterministic evidence catalog and source-location pipeline for the finance model;
- A deadline-oriented configuration freeze, plus the compact `PFE-FY24` R1 blind test with three input conditions and eight no-retry attempts;
- Optimized R2/R3 blind tests on `JPM-FY24` and `META-FY24`, six no-retry calls in total;
- Immutable archives for successes, failures, context prechecks, raw responses, tokens, latency, and citation checks.

The compact R1 results are in [experiments/R1_PFE_SUMMARY.md](experiments/R1_PFE_SUMMARY.md), and the optimized extension blind tests are in [experiments/R2_R3_OPTIMIZED_SUMMARY.md](experiments/R2_R3_OPTIMIZED_SUMMARY.md). The planned 24-run P003 stability matrix was not executed, so the project does not claim statistical stability. The product demo repository and deployment remain future work.

The full Chinese report is [report/financial_filing_extraction_report_zh.md](report/financial_filing_extraction_report_zh.md); the English mirror is [report/financial_filing_extraction_report_en.md](report/financial_filing_extraction_report_en.md). It covers the three solution-tuning paths, R1–R3 results, the JPMorgan two-column PDF failure case, and reusable PNG/SVG charts.

## Repository boundary

This `Financial filing extraction` repository is the research repository. It stores data, prompt versions, experiment run records, evaluations, and methodology documents.

After the output contract, citation validation, and end-to-end prototype are stable, create a separate product repository:

`financial_filing_risk_analyzer`

The product repository will handle PDF/company-code input, Item 1A location, model calls, evidence validation, risk cards, source jumps, and deployment. It will reference frozen schemas and versions from the research repository rather than copying the complete experiment archive.

## Repository layout

```text
data/                    # Public 10-K source materials and model inputs
experiments/              # P, F, R1, R2, and R3 run archives and provenance templates
prompts/                  # Model prompt versions and change log
evaluations/              # Human financial analysis, automatic scoring, and expert references
report/                   # Detailed reports, chart data, sources, and PNG/SVG assets
schemas/                 # Output contracts shared by research and product lines
scripts/                 # Dataset preparation and validation scripts
EXPERIMENT_DESIGN.md     # Experiment design
EXPERIMENT_ARCHIVE.md    # Raw-record and provenance rules
PRODUCT_REPO_PLAN.md     # Product repository boundary and demo roadmap
```

## Data and experiment runs

See [data/README.md](data/README.md) for the data structure. Regenerate text derivatives with:

```bash
node scripts/prepare_10k_dataset.cjs
node scripts/verify_10k_dataset.cjs
```

Every model run must create a new run ID and must not overwrite older raw output. Save the actual input, prompt, redacted request, complete raw response, errors, parsed result, score, and validation hash for each run; see [EXPERIMENT_ARCHIVE.md](EXPERIMENT_ARCHIVE.md).

## Open-source and security

The repository is intended to publish experiment details and reproducibility records, but it must not contain API keys, passwords, cookies, Authorization headers, local model weights, private links, or complete paid reports. Cloud credentials may enter only through backend environment variables; they must not appear in the frontend or Git history.

The product is an “evidence-backed financial-document risk-screening assistant,” not investment advice, a securities rating, or an automated trading system.
