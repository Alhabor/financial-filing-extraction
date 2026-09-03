# Frozen case packages

[Chinese version](README.md) | English

This directory contains the short case packages used during preparation. Each package is generated from the same set of PDF pages:

- `packet.txt`: text view with `[PDF_PAGE n | PRINTED_PAGE m]` and `[PARAGRAPH CASE-Pnnn]` locator markers;
- `pages/page-nnn.png`: page-image view rendered for the same page range;
- `locator_index.json`: paragraph IDs, PDF physical pages, printed pages, in-page line numbers, and paragraph hashes;
- `packet.json`: source hashes, page numbers, image hashes, and internal-review candidates.

`risk_candidates_for_internal_review` is used only for source-text review during preparation. It is not written into `packet.txt` and is not sent to models by the harness. These development packages must not be used as formal R1 blind-test material.

When regenerating a package or changing its page range, do not overwrite an existing directory. Increment the packet version, create a new directory, and retain the old version for rollback.
