# Experimental Records and Provenance Rules

This file defines how to retain all traces produced by preparation, freeze, and formal-test rounds. The rule is simple: raw inputs and outputs are never overwritten; derived results and human judgments are saved separately; failed runs are retained too.

## 1. Run archive locations

```text
prompts/
├── PV001.md
├── PV001-model-gemma.md
└── prompt_changelog.csv
experiments/
├── runs/                         # Created on the first model run
│   ├── P/                         # Preparation
│   ├── F/                         # Pre-freeze confirmation
│   ├── R1/                        # First formal round
│   └── R2/                        # Later independent rounds
├── templates/
│   ├── run-manifest.template.json
│   └── evaluation.template.json
└── INDEX.csv
harness/
├── config/                      # Model aliases, interfaces, input conditions; no credentials
└── README.md                    # Dry-run, adapters, and fallback protocol
```

A single experimental unit is one “model × case × attempt.” Every rerun must create a new directory and must not overwrite earlier results for the same case.

```text
experiments/runs/R1/R1-COIN-FY24-<model>-<timestamp>-a01/
├── manifest.json
├── input/
│   ├── model_input.txt
│   ├── prompt.txt
│   ├── modality.json
│   └── request.sanitized.json
├── raw/
│   ├── response.json
│   ├── response.txt
│   ├── stdout.txt
│   ├── stderr.txt
│   └── stream.ndjson
├── derived/
│   └── parsed.json
├── evaluation/
│   ├── automatic.json
│   ├── human_review.json
│   └── adjudication.json
└── checksums.sha256
```

Runs without streaming output may omit `stream.ndjson`. A local model without an HTTP response must still save the raw `stdout.txt` and `stderr.txt`.

## 2. Required metadata

`manifest.json` must record at least:

- `run_id`, `phase`, `round`, `attempt`, and `status`;
- `case_id`, input-file path, and input SHA-256;
- requested modality, actual modality, whether text fallback occurred, and why;
- `model_alias`, actual `model_id`, provider, and interface;
- `prompt_version`, output-schema version, and rubric version;
- temperature, top-p, maximum output length, seed, and other parameters;
- start time, end time, total latency, and retry information;
- input/output tokens or local-inference word counts;
- local CPU/GPU, memory/VRAM, and runtime-environment summary;
- Git commit, script version, and parser version;
- whether RAG, retrieval, tool calls, or human intervention were allowed;
- failure reason, human corrections, and notes.

Never record Authorization headers, API keys, complete environment snapshots, cookies, private keys, or other credentials. `request.sanitized.json` contains only the redacted request body and non-sensitive call parameters.

## 3.1 Harness and visual fallback

The harness accepts only frozen case packages and must not silently change inputs at runtime. Adapters translate a unified internal request into provider format: cloud vision interfaces use text blocks and page-image references, local Ollama uses `messages`/`images`, and text GGUF uses plain-text messages. During a real call, images may be encoded in memory as required by the request, but the archive stores only image paths, SHA-256 values, and the redacted request—not credential-bearing headers.

If a visual run fails, the model does not support images, image decoding fails, or visual output does not pass the minimum citation check, the harness saves the original failure trace and creates a new `text_fallback` attempt from the same case text. The two attempts must have different `run_id` values and be linked in the index. The fallback result must not overwrite the visual attempt.

## 3. Raw and derived layers

### Raw layer: `raw/`

Save the complete provider JSON, complete text, streaming chunks, standard output, and standard error. Raw files are read-only: do not polish them or replace them with corrected text.

### Derived layer: `derived/`

Save structured parsing results, citation-validation results, and statistics. When the parser is upgraded, create a new version such as `parsed.v2.json`; do not rewrite an old parsed result.

### Evaluation layer: `evaluation/`

Save automatic scores, independent member scores, disagreement notes, and the final adjudication. When the rubric changes, create a new `rubric_version` rather than overwriting old scores.

## 4. Run states

A run may be `planned`, `running`, `completed`, `failed`, `timeout`, or `partial`. If a call fails, returns invalid formatting, times out, or is interrupted by a person, retain the inputs, logs, and error information already available and continue with a new attempt rather than deleting the failure record.

Mark a run `completed` only when all of the following are true:

- Raw output is saved;
- The output is parsed, or parse failure is explicitly recorded;
- Source-text citation validation has run;
- Manifest, checksums, and run metrics are complete.

## 5. Separating preparation from formal rounds

Retain all preparation cases, prompt versions, and outputs, but mark them as `development` or `validation` in `INDEX.csv`. Formal R1 may use only cases that were not used for targeted prompt changes before the freeze.

If a prompt changes after a formal round, create a new prompt version and R2. Never modify R1 inputs, raw outputs, or scores.

## 6. GitHub publication boundary

The complete local archive is the canonical research record. Before publishing to the public repository, generate a separately redacted public archive and check that:

- Credentials, request headers, and local paths are absent;
- No unauthorized full paid report is included;
- Raw inputs, outputs, and scores remain linkable by run ID;
- Large local model weights have not been copied into the repository;
- Public results retain the necessary source and reproducibility notes.
