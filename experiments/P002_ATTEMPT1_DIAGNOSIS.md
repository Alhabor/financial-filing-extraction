# P002 model-specific smoke — attempt 1 diagnosis

**Case:** `PYPL-FY24`  
**Attempt:** `a01`  
**Evaluator:** `AE002`  

## Why AE002 was introduced

PDF text extraction inserts physical line breaks that are not part of the filing's prose. `AE001` required byte-for-byte substrings and therefore rejected otherwise unchanged quotations when a model converted an extraction newline into a space. `AE002` records both measures:

- `raw-exact`: the quote is a literal substring including extraction whitespace;
- `whitespace-normalized`: only runs of whitespace are folded; every word and punctuation mark must remain unchanged.

The second measure is the citation pass condition. Word omissions, substitutions, punctuation changes, wrong paragraph IDs, and wrong pages still fail. Existing P001 evaluation artifacts remain on `AE001`; no raw response was changed.

## Results

| Model | Prompt | Latency | Input | Output | Structure | Citation result | Next change |
|---|---|---:|---:|---:|---|---|---|
| DeepSeek | `PV002` | 9.129 s | 5,274 | 966 | JSON parsed, but nine fields that must be arrays were scalars. | Not evaluated because schema failed. | Add a compact, answer-free JSON type skeleton. |
| Gemma | `PV003` | 133.085 s | 5,450 | 913 | Schema and metadata passed. | Two of three quotes passed after whitespace normalization; one omitted a word. Paragraph IDs and pages were correct. | Force a short quote copied from one physical line and check token sequence. |
| Finance Llama | `PV004` | 161.881 s | 5,193 | 672 | Schema and metadata passed. | Two quotes were raw-exact, but all three source pages were wrong; one quote was attached to the wrong paragraph and one mitigation was inferred. | Add an explicit page/paragraph state algorithm and conservative absent-detail rule. |

## Interpretation

The P002 transport controls solved the P001 output-channel failures for all three models: each produced parseable JSON within the same 1,600-token budget. The remaining failures are now narrower and model-specific. Attempt 2 will change prompts only; data, schema, taxonomy, model IDs, temperature, seed, context limits, and output budget remain fixed.
