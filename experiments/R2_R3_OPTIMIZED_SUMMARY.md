# Compact R2/R3 optimized-solution results

**Protocol:** `COMPACT_R2_R3_PROTOCOL.md`  
**Freeze commit:** `048db71`  
**Cases:** JPMorgan Chase FY2024 (`R2`) and Meta FY2024 (`R3`)  
**Live attempts:** six frozen optimized-text cells; no retries or prompt changes

## Automatic results

| Round / case | Solution | Automatic result | Latency | Input / output tokens | Main observation |
|---|---|---:|---:|---:|---|
| R2 / JPM | DeepSeek | failed | 6.311 s | 6,104 / 633 | Schema and metadata passed; all three quotations failed packet-string matching |
| R2 / JPM | Gemma | failed | 239.547 s | 5,901 / 730 | Schema and metadata passed; one of three quotations passed; one locator used printed page 18 instead of PDF page 20 |
| R2 / JPM | Finance pipeline | passed | 148.477 s | 3,099 / 192 | Three evidence IDs and deterministic packet locators passed |
| R3 / Meta | DeepSeek | passed | 7.195 s | 7,281 / 677 | All schema, metadata, and quotation checks passed |
| R3 / Meta | Gemma | passed | 231.120 s | 7,676 / 738 | All schema, metadata, and quotation checks passed |
| R3 / Meta | Finance pipeline | passed | 161.604 s | 2,135 / 182 | Three evidence IDs and deterministic packet locators passed |

Across the three optimized blind companies (`PFE`, `JPM`, and `META`), the automatic full-case pass counts are:

| Solution | Automatic full-case passes |
|---|---:|
| DeepSeek | 1 / 3 |
| Gemma | 2 / 3 |
| Finance pipeline | 3 / 3 |

These are traceability-gate results, not financial-analysis accuracy rankings.

## Agent-assisted semantic review

### R2 — JPMorgan Chase

The frozen JPM packet exposes a two-column PDF extraction problem. `pdftotext -layout` serialized left- and right-column lines on the same rows. Page-image review confirms that much of the DeepSeek and Gemma wording is continuous, readable text in one visual column, but that wording is not a continuous substring of the serialized packet. Their automatic failures therefore mix model behavior with an input/evaluator false-negative caused by layout extraction.

- **DeepSeek:** the three themes—regulatory enforcement, resolution-plan restructuring, and adverse economic/credit conditions—are financially relevant and visually source-grounded. The strict packet citation gate still fails, and some short quotations omit consequence wording used in the summaries. Treat as a qualified/partial result, not a full pass.
- **Gemma:** the themes are relevant. One quotation passes the packet gate; another is visually source-grounded but split by column serialization. The interest-rate item records printed page `18` instead of physical PDF page `20`, so the locator is wrong under the frozen contract. Treat as partial.
- **Finance pipeline:** deterministic localization passes because it copies the frozen packet exactly, but the copied evidence contains interleaved columns. The first item is misclassified as strategic instead of regulatory/legal, and the adverse-economic-conditions item is classified operational rather than financial/market. Automatic exactness therefore does not make this a clean semantic pass.

### R3 — Meta

Meta's packet is clean enough for all three solutions to pass the automatic evidence gate.

- **DeepSeek:** all three quotations are sufficient and the selected user-engagement, advertising-spend, and ad-signal risks are source-supported. This is the cleanest R3 result.
- **Gemma:** quotations are literal, but several stop after the risk driver and omit the consequence clause used in the summary. This is a semantic evidence-sufficiency caveat despite the automatic pass.
- **Finance pipeline:** user retention and ad targeting are strong selections. The third item identifies dependence on product development but labels it operational/supply-chain; strategic/market/technology is more defensible. Treat the automatic pass with this category caveat.

## Presentation interpretation

1. Model/workflow optimization produced usable results across more than one industry, but no solution is uniformly clean under both mechanical and semantic review.
2. The finance pipeline has the strongest automatic traceability rate and the smallest model inputs, yet it is vulnerable to deterministic propagation of malformed source extraction: exact garbage remains garbage.
3. DeepSeek remains much faster than both local solutions and produced the strongest clean Meta result, but strict citation behavior varies by document layout.
4. Gemma can produce solid grounded output, but it is slow and sometimes selects evidence spans that are too short to prove the stated consequence.
5. PDF extraction and layout-aware normalization are a first-class component of a production financial-filing analyzer, not merely preprocessing.

This three-company sample improves the presentation beyond a single case, but it still does not establish repeatability, statistical significance, or a universal model ranking. Agent-assisted judgments should be confirmed by the course team before being presented as final human scores.
