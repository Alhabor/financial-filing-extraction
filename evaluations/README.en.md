# Evaluation and financial analysis

[Chinese version](README.md) | English

This directory stores risk-evidence checks, human financial analysis, expert references, and automatic summary results. Each evaluation file must link back to the raw run through `run_id`, `case_id`, `model_id`, and `rubric_version`.

Evaluation has four layers:

1. Source layer: `risk_validity`, `materiality`, `evidence_exactness`, `evidence_support`, `risk_type`, and `risk_type_correctness`;
2. Financial-analysis layer: `financial_reasoning`, priority, and `uncertainty_discipline`;
3. Reference layer: `expert_overlap`, `unsupported_inference`, and `temporal_leakage`;
4. Workflow layer: readability, actionability, latency, cost, compute, and human-correction cost.

Professional analysis is an auxiliary reference, not the sole gold standard. Independent member scores, disagreements, and adjudication should all be retained.
