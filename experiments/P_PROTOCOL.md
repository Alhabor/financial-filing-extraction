# Preparation phase protocol

**Protocol version:** `P-PROTOCOL-v001`
**Packet version:** `case-packet-spec-v001`
**Core prompt:** `PV001`
**Output schema:** `risk-output-v001`
**Rubric:** `RV001`

This protocol fixes the preparation sequence before live outputs are inspected. The four `development` cases are `NVDA-FY25`, `COIN-FY24`, `PYPL-FY24`, and `BA-FY24`. The four `reserve` cases remain untouched throughout P and are not eligible for prompt tuning.

## Runtime gates

- DeepSeek must report the locked API model ID `deepseek-v4-flash-vision-exp`.
- Ollama must report `gemma4:26b-a4b-it-q4_K_M` with text and vision capability.
- llama.cpp must report the locked finance model alias and an 8192-token context.
- Every live run starts from a frozen packet, archived model/profile config, sanitized logical request, and checksums.
- Credentials, Authorization headers, image base64 payloads, and local GGUF paths are never persisted in a run archive.
- No automatic provider retry is allowed. Every retry is a new attempt and preserves the prior failure.

The finance tokenizer measured the following approximate request inputs after adding `PV001` and harness metadata:

| Case | Input tokens | 8192-context implication |
|---|---:|---|
| `NVDA-FY25` | 8,642 | Input alone exceeds context; P001 must record a context failure rather than truncate. |
| `COIN-FY24` | 5,972 | Fits with the fixed 1,600-token output budget but has little headroom. |
| `PYPL-FY24` | 5,176 | Safest first smoke case. |
| `BA-FY24` | 5,805 | Fits with limited headroom. |

These counts are an explicit P001 finding. If shorter inputs are needed, create `case-packet-spec-v002`; never edit v001 in place.

## P001: shared baseline and failure diagnosis

### P001-T standard text

Run `standard-text-v001 + PV001` for four cases and three models: 12 attempts. All models receive the same packet text, task, risk taxonomy, no search, no RAG, temperature 0, seed 7343, and a 1,600-token output budget. Provider-specific transport differences are recorded but are not treated as prompt improvements.

Order:

1. `PYPL-FY24` across all three models as the live smoke gate.
2. `COIN-FY24` and `BA-FY24` across all three models.
3. `NVDA-FY25` across all three models; the finance context failure is expected and must remain visible.

### P001-V vision smoke

After P001-T raw capture works, run `native-vision-v001 + PV001` on `PYPL-FY24` for DeepSeek and Gemma. The primary input is the frozen page-image set. A failed vision attempt is preserved; a text fallback receives a separate run ID and `fallback_reason`.

### P001 exit gate

- Every attempt has immutable input, raw output or error, lifecycle events, manifest, and checksums.
- Successful responses have parsed output and automatic schema/metadata/citation evaluation.
- Quotes must match the packet exactly and be supported by cited paragraph IDs and PDF pages.
- Context errors, truncation, malformed JSON, and citation failures are classified; none are silently repaired.
- At least 11 of 12 text attempts must either pass automatically or have a single clearly diagnosed, protocol-relevant failure. The known NVDA finance context failure may satisfy the diagnosed-failure allowance.

## P002: model-specific preparation

Use `NVDA-FY25`, `COIN-FY24`, and `PYPL-FY24` for tuning; keep `BA-FY24` as a revised-prompt holdout. Create one new prompt per model, never overwrite `PV001`. Prompts may make the JSON field contract explicit, reduce verbosity, or add a self-check, but may not introduce candidate labels, analyst answers, external search, or RAG.

If v001 packet size prevents a fair finance run, generate a shorter common `case-packet-spec-v002` for all three models. A model-specific truncated packet is not allowed on the shared baseline line.

P002 exits when each model produces complete, parseable three-risk outputs on the three tuning cases without a new major quote or locator error, and one selected configuration per model is documented. Rejected prompt versions and failed attempts remain archived.

## P003: frozen stability check

Freeze the selected P002 prompt/profile before P003. Run four development cases, three models, and two repeats: 24 text attempts. For any selected vision solution, run paired image repeats separately. No prompt changes are permitted during P003.

P003 exits only when:

- no unexplained truncation, schema failure, or quote drift remains;
- repeated runs retain at least two of three major risk themes with compatible primary evidence;
- there are no material unsupported amounts, probabilities, forecasts, or causal claims;
- timing, token/resource, failure, and retry records are complete;
- the BA holdout shows no material regression.

Passing P003 leads to phase F. If any prompt, schema, packet, model runtime, or scoring rule changes after that point, create a new version and a new formal round; never rewrite earlier artifacts.
