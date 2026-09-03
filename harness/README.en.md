# Experiment harness

[Chinese version](README.md) | English

This is the lightweight orchestration layer for the research line, not the final product backend. It fixes how the same case enters different models and generates auditable inputs, requests, and metadata for every run.

The current scripts require a frozen package under `data/processed/case_packets/<CASE-ID>/`. An unfrozen `data/processed/model_inputs/<CASE-ID>.txt` is candidate material only and cannot enter a formal harness run.

## Two-stage execution

The first stage materializes inputs only. It does not call a cloud API, Ollama, or llama.cpp. This allows the team to check:

- Whether all three models receive text from the same frozen case package;
- Whether prompt versions and model aliases are correct;
- Whether visual inputs have fixed page numbers and image hashes;
- Whether the redacted request contains no Authorization, API key, or environment snapshot.

The entry point is `scripts/materialize_experiment_run.cjs`. Model settings are in `harness/config/models.json`; input conditions are in `harness/config/profiles.json`.

The second stage must explicitly pass the live gate for one materialized directory:

```bash
node scripts/execute_experiment_run.cjs \
  --run-dir experiments/runs/P/<RUN-ID> \
  --confirm-live
```

The executor accepts only a `status=planned` run without a `raw/` directory. Cloud credentials are read only from the environment variable named in model configuration; Authorization headers and image base64 are never written to disk. A successful response is first marked `partial`; it becomes `completed` only after automatic parsing and citation checks pass. Failures, timeouts, and non-JSON responses stay in the original attempt, and retries create new attempts.

## Internal flow

```text
Frozen case package
    -> case loader
    -> prompt builder
    -> modality adapter
    -> provider adapter
    -> dry-run / live gate
    -> raw recorder
    -> parser + citation validator
    -> automatic and human evaluation
```

Each provider adapter handles only interface differences:

- DeepSeek: OpenAI-style messages; visual conditions use text blocks and page images;
- Ollama: `/api/chat` messages and optional images;
- Finance GGUF: local text messages through the user-selected llama.cpp-compatible interface.

## Input conditions

`standard-text-v001` is the fair baseline shared by all three models: each receives the same text and core prompt. `native-vision-v001` is only for models confirmed to support vision; the primary input is a fixed page-image set, while text-only models do not run this condition. The full text is not attached at the same time, so visual ability can be observed independently.

When a visual condition fails:

1. Save the visual attempt’s raw error, status, and diagnosis;
2. Create a new `text_fallback` attempt from the same case text;
3. Record `requested_modality`, `actual_modality`, and `fallback_reason` in `manifest.json`;
4. Report native vision, text, and text fallback separately.

Fallback is a fault-tolerance mechanism that lets the workflow complete; it must not be presented as successful vision.

## Pre-run security boundary

- The default is offline and does not call a model;
- Live mode must be explicitly enabled and cloud credentials come only from environment variables;
- Request archives never store Authorization headers or API keys;
- Raw responses, errors, and failed runs cannot be overwritten;
- Model weights, temporary page images, and local paths do not enter the public repository.
