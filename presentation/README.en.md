# Financial filing extraction — HTML presentation

[Chinese version](README.md) | English

Classroom presentation entry point: `presentation/index.html`

This is an 11-slide fixed 16:9 static HTML deck. It supports:

- Mouse clicks, arrow keys, Page Up / Page Down, and Space for navigation;
- A top-right switch for Chinese/English and light/dark themes;
- `F` for fullscreen, `T` for theme, `L` for language, and `N` for speaker notes;
- Direct slide navigation with a URL hash such as `#/6`;
- Links from each slide to the corresponding experiment records;
- 16:9 print pagination.

Chinese and English copy are kept separately in `slides.zh.js` and `slides.en.js`. English charts use `.en.svg` assets while the Chinese originals remain unchanged. Language, theme, and current slide are independent; changing language keeps the same slide. This directory is static and can run from a local HTTP server or a future website subpath. It is not deployed online at this stage.

## Timing definitions

- The 30-minute manual baseline is a classroom scenario for an already prepared short case: 3 minutes to locate, 10 to read, 6 to select/classify, 6 to copy evidence, and 5 to review/format.
- AI-assisted total time uses one consistent scenario: 2 minutes of preparation + mean machine time for the three frozen experiments + 5 minutes of human review.
- Machine time comes from `report/data/reviewed_results.csv`; manual preparation, review, and the manual baseline are not measured experimentally.
- Extra correction time after an incomplete pass is excluded, so total time shows workflow scale and is not a production-efficiency claim.

Validation:

```bash
node presentation/validate.mjs
```
