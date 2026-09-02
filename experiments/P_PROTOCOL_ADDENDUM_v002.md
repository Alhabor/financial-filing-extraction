# Preparation protocol addendum v002 — finance evidence pipeline

**Approved:** 2026-09-02  
**Applies prospectively from:** P002 finance attempt 3  
**Parent protocol:** `P-PROTOCOL-v001`

## Rationale

Two prompt-only finance attempts produced valid JSON but unreliable quotations and locators. The locked finance model is fine-tuned for context-grounded financial RAG question answering, so its scenario solution may use a deterministic evidence catalog and locator. This addendum does not change any P001 or earlier P002 artifact or score.

## Declared two-stage finance solution

1. `evidence-catalog-v001` converts every physical source line in the frozen packet into an immutable record containing `evidence_id`, exact text, paragraph ID, PDF page, printed page, source line, and text hash.
2. The finance model receives the compact ID-plus-exact-text catalog view and returns exactly three risk analyses plus one selected `evidence_id` per risk under `finance-selection-v001`. Paragraph/page metadata remains in the archived catalog and is not spent as repeated model-input tokens.
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

After the compact physical-line catalog passed automatic checks but exposed incomplete-line and theme-expansion problems in manual review, `evidence-catalog-v003` may prospectively use complete sentence spans. It normalizes extraction whitespace only, retains the original paragraph/page mapping, and remains subject to `AE002` word-and-punctuation fidelity checks. `v001` is the original verbose locator view; `v002` is the compact physical-line view; neither is rewritten.

## Attempt-6 core-task contract

Attempt 5 showed that requiring the finance model to populate non-core analytical fields induced unsupported generic claims even when its evidence IDs were valid. Prospectively, `finance-selection-v003` therefore limits the model-authored contract to the exercise's stated core tasks: a concrete risk summary, one risk-type classification, and one evidence ID for each of exactly three risks.

`evidence-catalog-v004` applies the fixed, case-agnostic `material-consequence-screen-v001` to the complete-sentence catalog. The screen keeps sentences with explicit consequence language and basic completeness checks. It is a retrieval aid, not a gold label: the model must still select three distinct material risks, and all retained and rejected sentence records remain derivable from the archived frozen packet.

For `finance-selection-v003`, `EL001` copies the exact evidence and locators as before. Fields outside the core exercise are populated with the explicit marker `Not separately analyzed in the core extraction task.` or an empty indicator array. These markers are pipeline-authored abstentions, not model analysis, and must not receive credit as extracted financial detail. Agent-assisted review still evaluates whether each risk summary and category are supported by its selected sentence.

Attempt 6 exposed a false positive in `material-consequence-screen-v001`: the ordinary noun `material` could satisfy the materiality rule. `evidence-catalog-v005` prospectively uses `material-consequence-screen-v002`, which requires materiality language to modify an impact verb. It also displays a deterministic group ID for each source paragraph. `EL001` rejects repeated paragraph groups for v005 runs as a mechanical safeguard against presenting two sentences from the same source risk paragraph as independent themes.

COIN preparation showed that downstream financial effects and third-party involvement can obscure the primary driver used for taxonomy. `PV013` prospectively assigns category by primary driver: market demand, prices, competition, adoption, and strategic partnerships take precedence over generic financial consequences; third-party involvement is operational only for service dependency or disruption.

The same COIN run also showed that a full analytical schema induced unsupported horizons and monitoring indicators in the cloud model. `risk-output-core-v001` prospectively keeps the shared normalized shape but constrains non-core fields to explicit abstention markers. DeepSeek and Gemma continue to author summaries, categories, exact quotes, paragraph IDs, and pages. This aligns the optimized task with the course requirement and the finance pipeline's core-only contract; abstentions receive no analytical-content credit.
