# P002 COIN final optimization review

## Selected configurations

| Model | Selected profile | Prompt | COIN run | Automatic gate | Agent-assisted gate |
|---|---|---|---|---|---|
| DeepSeek | `optimized-deepseek-text-v005` | `PV016` | `P002-COIN-FY24-cloud-deepseek-20260902T061841594Z-571a3b-a03` | passed | passed pending course-team confirmation |
| Gemma | `optimized-gemma-text-v004` | `PV015` | `P002-COIN-FY24-local-gemma-20260902T061406117Z-ae2c03-a02` | passed | passed pending course-team confirmation |
| Finance pipeline | `optimized-finance-pipeline-v009` | `PV013` | `P002-COIN-FY24-finance-llama-20260902T061406113Z-51ea66-a02` | passed | passed with one classification caveat |

DeepSeek and Gemma produced three schema-valid, exactly located risks with explicit abstentions in non-core fields. The finance pipeline produced three valid evidence selections from different paragraph groups and restored exact source sentences and locators. Its second COIN item contains both strategic-relationship and operational-service language; the model selected `Operational / Supply Chain`. This is defensible from the selected sentence, although a reviewer could prefer `Strategic / Market / Technology`. No further prompt tuning is justified for the class deadline.

## Preparation stop rule

The project stops iterative tuning here. PYPL and COIN provide two industries and multiple successive attempts showing that the selected configurations can produce parseable three-risk outputs with verifiable evidence. This is sufficient for a compact classroom demonstration, but it is not a claim of statistical stability or model-performance limits.
