# P002 model-specific smoke — attempt 2 diagnosis

**Case:** `PYPL-FY24`  
**Attempt:** `a02`  
**Evaluator:** `AE002`

## Results

| Model | Prompt | Latency | Input | Output | Automatic result |
|---|---|---:|---:|---:|---|
| DeepSeek | `PV005` | 9.923 s | 5,286 | 956 | Passed JSON, schema, metadata, paragraph/page locators, and all three quotations. |
| Gemma | `PV006` | 118.198 s | 5,498 | 828 | Passed JSON, schema, metadata, paragraph/page locators, and all three quotations. |
| Finance Llama | `PV007` | 288.642 s | 5,248 | 1,311 | JSON/schema/metadata passed; citations failed with wrong pages, wrong paragraph associations, altered quotations, and unsupported mitigation. |

DeepSeek used two multi-paragraph citation lists even though each quotation can be localized more narrowly. This does not defeat verification, but it is less precise for a future “jump to source” interface and should be reported as a locator-precision metric. Gemma used one paragraph per quote.

The finance model did not follow the explicit locator-state algorithm. Increasing prompt detail also increased latency and output length while source faithfulness regressed. A third prose-only prompt iteration is therefore not justified by the evidence.

## Decision gate

The recommended next finance configuration is a declared two-stage solution:

1. preserve and score the model's raw risk analysis separately;
2. apply a deterministic evidence locator/validator that maps an exact selected source span to its frozen paragraph and PDF page;
3. reject, rather than silently repair, a span that is not present in the packet;
4. archive both raw and pipeline-normalized outputs with provenance.

This is closer to a production workflow and to the course project's “scenario solution” framing, but it changes the finance arm from prompt-only optimization to a model-plus-deterministic-tool pipeline. It must be approved and disclosed before implementation. Until then, `PV007` is rejected and the finance P002 gate remains open.
