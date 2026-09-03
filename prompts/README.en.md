# Prompt versions

[Chinese version](README.md) | English

Prompts use immutable version identifiers such as `PV001`. Each version stores:

- The complete prompt text;
- The shared core task;
- Model-specific adaptations;
- The output-schema version;
- The reason for the change and affected cases;
- Preparation-round validation results.

Prompts may be optimized for a model, but formal comparisons must record both the standardized evidence track and the scenario-specific solution track. Prompt files must not contain human gold answers, analyst answers, API keys, or other credentials.
