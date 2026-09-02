# P001 shared-baseline smoke diagnosis

**Decision timestamp:** 2026-09-02T04:46Z  
**Protocol:** `P-PROTOCOL-v001`  
**Case:** `PYPL-FY24` (`development`)  
**Profile:** `standard-text-v001`  
**Prompt:** `PV001`  

## Outcome

The three-cell P001 text smoke gate failed for three different, preserved reasons. The remaining nine text cells and the two vision cells were not dispatched because they would repeat known configuration-level failures rather than add useful evidence. P001 is therefore closed as a failed shared baseline; its original prompt, requests, raw responses, manifests, and checksums remain unchanged and available for audit.

| Model | Latency | Input | Output | Observed failure | Classification |
|---|---:|---:|---:|---|---|
| DeepSeek-V4-Flash-Vision-Exp | 14.554 s | 5,284 | 1,600 | All completion tokens were reasoning tokens; visible content was empty; `finish_reason=length`. | Reasoning-budget exhaustion |
| gemma4:26b-a4b-it-q4_K_M | 203.388 s | 5,466 | 1,600 | The response contained thinking but no visible content; `done_reason=length`. | Reasoning-budget exhaustion |
| Finance Llama 3 8B | 138.422 s | 5,199 | 487 | Returned prose instead of the required JSON, so automatic parsing failed. | Output-contract failure |

The executor initially classified the two reasoning-only responses correctly as failed but did not copy their already-returned usage fields into the manifest. `scripts/reconcile_experiment_run.cjs` subsequently derived those fields and plain-text reasoning artifacts from each immutable `raw/response.json`; the reconciliation event is recorded in `events.ndjson`.

## Source-faithfulness warning from the finance response

The finance model's prose cannot be treated as a partially correct structured answer:

- The stablecoin passage is present in `PYPL-FY24-P002`, although line wrapping means a raw one-line string comparison is insufficient.
- The third-party-provider passage appears in `PYPL-FY24-P029`, not the cited `P028` heading paragraph.
- The purported cyber-threat quotation does not occur in the frozen packet.
- Several mitigation statements add controls or plans that are not supported by the cited passages.

These are diagnostic observations only. They are not a hand-repaired score and do not replace the automatic evaluator.

## Forward decision

P002 will test model-specific inference controls and prompts while keeping the case packet, task, taxonomy, evidence rules, output schema, temperature, seed, and 1,600-token output budget fixed:

1. Disable optional reasoning for DeepSeek and Gemma so the fixed budget can reach visible output.
2. Enforce provider-supported JSON output for all three runtimes.
3. Give each model an explicit compact JSON skeleton and evidence self-check without supplying candidate risks or analyst labels.
4. Repeat `PYPL-FY24` as the P002 smoke case before dispatching any additional tuning case.

This is a prospective P002 change. No P001 artifact or protocol rule is rewritten retroactively.
