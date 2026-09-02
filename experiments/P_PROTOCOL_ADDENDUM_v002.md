# Preparation protocol addendum v002 — finance evidence pipeline

**Approved:** 2026-09-02  
**Applies prospectively from:** P002 finance attempt 3  
**Parent protocol:** `P-PROTOCOL-v001`

## Rationale

Two prompt-only finance attempts produced valid JSON but unreliable quotations and locators. The locked finance model is fine-tuned for context-grounded financial RAG question answering, so its scenario solution may use a deterministic evidence catalog and locator. This addendum does not change any P001 or earlier P002 artifact or score.

## Declared two-stage finance solution

1. `evidence-catalog-v001` converts every physical source line in the frozen packet into an immutable record containing `evidence_id`, exact text, paragraph ID, PDF page, printed page, source line, and text hash.
2. The finance model receives the complete catalog and returns exactly three risk analyses plus one selected `evidence_id` per risk under `finance-selection-v001`.
3. `EL001` validates that each selected ID exists, is unique, resolves to at least five words, has a complete locator, and retains its catalog text hash.
4. The locator creates a `risk-output-v001` candidate by copying the catalog text, paragraph ID, and PDF page. It cannot alter the model's risk summary, type, reasoning, financial impact, horizon, indicators, mitigation, or uncertainty.
5. `AE002` evaluates the normalized candidate against the original frozen source packet, not against the transformed catalog.

An invalid or missing ID is rejected. The locator never searches for a similar sentence, repairs a hallucinated quotation, chooses a different evidence record, or silently edits analysis.

## Separate reporting

The finance arm must report both layers:

- **Raw model layer:** selection-schema validity, valid/unique evidence-ID rate, latency, tokens, and model-authored financial-analysis quality.
- **Pipeline layer:** locator pass rate, output-schema validity, paragraph/page correctness, quotation fidelity, and full solution latency.

The prompt-only P001/P002 results remain visible as the naked-model baseline. Pipeline results are never presented as evidence that the raw model independently generated accurate locators.

## Quotation matching rule

`AE002` uses whitespace-normalized matching as the primary quotation gate: only runs of extraction-layout whitespace may be folded. Every word and punctuation mark must otherwise remain unchanged. It also records the stricter `raw-exact` result as a secondary metric.

## P002 attempt-3 gate

Run `PYPL-FY24` first. Proceed to other development cases only if:

- the raw selection parses and passes its schema;
- all three evidence IDs exist and are unique;
- deterministic localization completes without repair or fallback;
- the normalized output passes schema, metadata, page, paragraph, and quotation validation;
- a human review finds no material unsupported claim in the model-authored analytical fields.
