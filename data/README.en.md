# Data directory

[Chinese version](README.md) | English

This directory stores the public 10-K materials for Group 7’s Mini-exercise and their reproducibly generated text derivatives.

## Directory structure

```text
data/
├── raw/sec/<CASE-ID>/
│   ├── filing.pdf       # Official/issuer public PDF; raw material
│   ├── filing.txt       # Complete text mechanically extracted with pdftotext -layout
│   └── source.json      # Company, period, SEC accession, source URL, hashes, and pages
├── processed/item_1a/
│   └── <CASE-ID>.txt    # Item 1A text with source headers and PDF page markers
├── processed/model_inputs/
│   └── <CASE-ID>.txt    # Item 1A text plus [PAGE n] markers for model input
├── processed/case_packets/<CASE-ID>/ # Frozen short P-phase case package
│   ├── packet.txt       # Text view with PDF/printed pages and paragraph locators
│   ├── pages/*.png      # Rendered images for the same page range
│   ├── locator_index.json
│   └── packet.json      # Source, version, and hash; includes internal review metadata
└── manifests/
    ├── filings.csv
    ├── case_packet_specs.json
    └── case_packets.json
```

Files under `processed/` are mechanically generated from `raw/` by `scripts/prepare_10k_dataset.cjs`. Model inputs contain no human risk labels, analysis conclusions, or supposed gold answers. This separates source materials, model inputs, and later evaluation references. Experiment run archives live under `experiments/` at the repository root and are not mixed with raw data.

## Regeneration

Run from the project root:

```bash
node scripts/prepare_10k_dataset.cjs
node scripts/verify_10k_dataset.cjs
node scripts/build_case_packets.cjs
node scripts/verify_case_packets.cjs
```

The scripts do not access the network. They read PDFs already downloaded to `data/raw/sec/` and use the system `pdfinfo` and `pdftotext`. Each source URL is saved in both `source.json` and `filings.csv`; `pdfSha256` confirms that a file was not accidentally replaced.

## Source scope

The current list contains eight public Form 10-K materials around fiscal year 2024: NVDA, COIN, PYPL, BA, JPM, TSLA, PFE, and META. Some issuer PDFs are annual-report/ARS formats but contain the Form 10-K for the same year; `sourceType` states this explicitly. SEC HTML links remain in the metadata for authoritative source checks.

`case-packet-spec-v001` currently freezes eight short case packages: `NVDA-FY25`, `COIN-FY24`, `PYPL-FY24`, and `BA-FY24` are P-phase development cases; `JPM-FY24`, `TSLA-FY24`, `PFE-FY24`, and `META-FY24` are reserve cases and are not used for formal R1 before prompt freeze. Each package records both the PDF physical page and the printed page to prevent annual-report pagination differences from shifting citations.
