# P002 finance pipeline attempt 7 — agent-assisted financial review

**Run:** `P002-PYPL-FY24-finance-llama-20260902T054506739Z-c04e11-a07`  
**Prompt:** `PV012`  
**Catalog:** `evidence-catalog-v005`  
**Automatic result:** passed  
**Agent-assisted financial-fidelity gate:** passed pending course-team confirmation

## What passed

- Exact tokenizer preflight passed at 2,189 input tokens plus a 1,600-token output reserve within the 8,192-token context.
- Runtime was 59.900 seconds with 2,202 input and 187 output tokens.
- The raw response followed `finance-selection-v003`; all three evidence IDs existed, were unique, and resolved to different paragraph groups.
- `EL001` restored three complete source sentences and their frozen paragraph/page locators without semantic repair.
- The normalized output passed `AE002` schema, metadata, and whitespace-normalized quotation checks with zero errors.
- R1's regulatory/legal label is directly supported by non-compliance, enforcement, fines, and penalties.
- R2's financial classification is defensible because the sentence expressly states financial risks, loss, counterparties, financial condition, and reserve/default exposure. The same sentence also contains operational third-party dimensions, but the required single-label choice does not add an unsupported domain.
- R3's strategic/market classification is directly supported by differentiation, competition, adoption, and effects on results and financial condition.
- No model-authored non-core analytical fields were generated. Pipeline abstention markers remain visibly separate and receive no content credit.

## Gate interpretation

This pass closes only the PYPL smoke gate for the finance pipeline. It does not freeze `PV012` and does not authorize blind evaluation. The next preparation work must test the same prospective profile on the remaining development cases and the BA preparation holdout before any stability freeze or formal R1 run.
