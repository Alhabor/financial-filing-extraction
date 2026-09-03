# Product Repository Roadmap

## Product repository name

`financial_filing_risk_analyzer`

The current `Financial filing extraction` repository remains the course research repository. Create the product repository only after the output contract, citation validation, and at least one end-to-end prototype are stable; do not copy an empty shell while the research is still underway.

## Responsibilities of the research repository

- 10-K source materials and model inputs;
- Prompt preparation, freeze, and formal tests;
- Raw model outputs and run logs;
- Human financial analysis and expert references;
- Quality, time, cost, and compute comparisons;
- Reproducible scripts and course presentation materials.

## Responsibilities of the product repository

- PDF upload and company-code lookup;
- Form 10-K / Item 1A location;
- Text segmentation and page/character anchors;
- Adapters for the three models;
- Verbatim-source validation;
- Risk cards, financial-impact explanations, and source jumps;
- JSON/Markdown export and deployment configuration.

The product repository does not copy the research repository’s complete run archive. It pins versioned output schemas, citation-validation protocols, and model-solution versions. Example data uses small public fixtures; complete experiment materials remain in the research repository.

## Product version boundaries

### V1: Item 1A risk screening

Accept a complete PDF or company code, locate Item 1A automatically, and output three risks, source evidence, risk types, and financial impacts. Clicking a risk card jumps to the relevant PDF page.

### V2: Full-document linked evidence

Search MD&A, financial-statement notes, and other sections in addition to Item 1A, and validate how a risk transmits to revenue, profit, cash flow, capital, or operations.

### V3: Continuous monitoring

Support year-over-year risk changes for the same company, risk-theme tracking, and comparison with new 10-K filings.

## Security boundaries

- Complete all cloud-model calls on the backend;
- Inject API keys only through runtime environment variables or deployment-platform secrets;
- Keep Authorization headers away from the frontend;
- Do not save uploaded files by default unless storage is explicitly enabled;
- Set limits on uploaded files, request rate, context length, and cost;
- Position the product as an evidence-backed risk-screening assistant, not investment advice or automated trading.
