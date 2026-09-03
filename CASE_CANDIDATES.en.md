# 10-K Candidate Case List

**Project:** Financial filing extraction<br>
**Course:** SHBI-GB 7343 — AI in Finance<br>
**Group:** Group 7<br>
**Version:** v0.3.0<br>
**Retrieval date:** 2026-09-01<br>
**Status:** The P-phase development and reserve packages are frozen; this is not the formal R1 blind-test set.

## 1. Purpose of this list

This list selects real, reviewable 10-K Risk Factors cases suitable for comparing three types of models in the Mini-exercise:

1. SEC filings are the primary factual source. Every later risk judgment must be traceable back to the 10-K.
2. Public analyst articles or reports are a second-layer reference for checking whether the model covers themes discussed in professional analysis; they are not the sole gold standard.
3. A case used during the preparation (P) phase cannot become a formal R1 blind-test case after prompts are frozen, or the case would leak into development.
4. The first eight candidate materials have been downloaded, segmented, and organized under `data/`; the short `case-packet-spec-v001` packages have been generated. The first four are used for current P-phase development, while the latter four remain reserve cases. Whether they enter R1 depends on whether they were used during P.

## 2. Screening criteria and initial scores

Each dimension receives 0–2 points, for a total of 10. These are manual desktop-screening scores, not model-performance scores.

| Dimension | 2 points | 1 point | 0 points |
|---|---|---|---|
| SEC primary source | SEC filing index and direct HTML 10-K available | Source can be found but requires substantial cleanup | No stable, verifiable primary source |
| Risk separability | Clear, independently extractable risk themes in Item 1A | Themes exist but are intertwined with other risks | Difficult to form an independently verifiable risk unit |
| Timing alignment of professional reference | Analysis published very close to the 10-K date | Reference exists but is materially earlier or later | Reference clearly includes subsequent information |
| Industry/risk diversity | Adds an industry and risk structure missing from the current pool | Some repetition | Highly repetitive with existing cases |
| Text tractability | Short passages are suitable for sentence-level evidence checks | Text is long or structurally complex | Not tractable enough for a classroom demonstration |

Timing alignment matters especially here: a post-filing analysis may know what happened after the 10-K. Therefore, only themes in an analyst reference that can be independently supported by the 10-K count toward “professional-analysis overlap”; later information cannot become the 10-K answer.

## 3. First batch of candidate cases

| ID | Company / fiscal year | SEC filing date | Industry | Suitable risk themes | Initial score | Suggested role |
|---|---|---:|---|---|---:|---|
| `NVDA-FY25` | NVIDIA / FY2025 | 2025-02-26 | Semiconductors, AI infrastructure | Competition; demand/supply mismatch; third-party suppliers; export controls; cybersecurity | 10/10 | Core development case |
| `COIN-FY24` | Coinbase / FY2024 | 2025-02-13 | Crypto-asset platform, fintech | Revenue instability from crypto volatility; regulatory uncertainty; custody and security incidents; competition | 9/10 | Core development case |
| `PYPL-FY24` | PayPal / FY2024 | 2025-02-04 | Payments, fintech | Payment-industry competition; cybersecurity and data breach; regulation; user and transaction growth | 10/10 | Core development case |
| `BA-FY24` | Boeing / FY2024 | 2025-02-03 | Aerospace manufacturing, defense | Product safety and quality; production and supply chain; aviation demand; liquidity; defense contracts | 9/10 | Core development / stress case |
| `JPM-FY24` | JPMorgan Chase / FY2024 | 2025-02-14 | Banking, financial services | Macroeconomics and rates; credit and market risk; regulation; cybersecurity; scale and competition | 8/10 | Complexity stress case |
| `TSLA-FY24` | Tesla / FY2024 | 2025-01-30 | Automotive, energy, AI/autonomy | Demand and competition; manufacturing and product launches; autonomy and technology; regulation; key people and political factors | 9/10 | Industry expansion / stress case |
| `PFE-FY24` | Pfizer / FY2024 | 2025-02-27 | Pharmaceuticals | Patent expiry and competitive erosion; drug approval; pricing and reimbursement; manufacturing and supply; litigation | 7/10 | Reserve case |
| `META-FY24` | Meta / FY2024 | 2025-01-30 | Social platforms, advertising, AI | User engagement and products; privacy and data; regulation and antitrust; AI investment; content governance | 6/10 | Reserve / later expansion |

## 4. Primary sources and professional references

The SEC links below are the preferred entry points for the primary materials. “Professional reference” means a publicly accessible Morningstar analyst article, Stock Analyst Note, or related analysis page. If a page becomes restricted, changes, or cannot be accessed reliably, retain the link and access date and downgrade it to an auxiliary reference.

### 4.1 NVIDIA

- SEC filing index: <https://www.sec.gov/Archives/edgar/data/1045810/000104581025000023/0001045810-25-000023-index.htm>
- Direct SEC 10-K: <https://www.sec.gov/Archives/edgar/data/1045810/000104581025000023/nvda-20250126.htm>
- Professional reference: Brian Colello, CPA, 2025-02-19, covering data-center demand, a possible demand pause or inventory correction, supply-constrained revenue, and AI/DeepSeek uncertainty: <https://www.morningstar.com/stocks/going-into-earnings-is-nvidia-stock-buy-sell-or-fairly-valued-5>
- Note: This reference predates the 10-K and is well aligned in time. It is suitable for testing whether a model can identify supply/demand, competition, and regulatory risks from the filing rather than merely repeat popular narratives.

### 4.2 Coinbase

- SEC filing index: <https://www.sec.gov/Archives/edgar/data/1679788/000167978825000022/0001679788-25-000022-index.htm>
- Direct SEC 10-K: <https://www.sec.gov/Archives/edgar/data/1679788/000167978825000022/coin-20241231.htm>
- Professional reference: Michael Miller, CFA, 2025-02-21, covering crypto-asset exposure, dependence on transaction fees, volatility, regulation, custody/security, and USDC rate sensitivity: <https://www.morningstar.com/stocks/after-earnings-is-coinbase-stock-buy-sell-or-fairly-valued-4>
- Another public analysis reference: 2025-02-20, discussing the effect of high crypto prices and volatility on Coinbase: <https://www.morningstar.com/company-reports/1265774-high-cryptocurrency-prices-and-volatility-benefit-coinbase-heading-into-2025>
- Note: The analysis is about one week after the filing, so timing alignment is medium. Use only themes that overlap with and are supported by the 10-K.

### 4.3 PayPal

- SEC filing index: <https://www.sec.gov/Archives/edgar/data/1633917/000163391725000019/0001633917-25-000019-index.htm>
- Direct SEC 10-K: <https://www.sec.gov/Archives/edgar/data/1633917/000163391725000019/pypl-20241231.htm>
- Professional reference: Brett Horn, 2025-02-04, discussing a focus on profitable businesses and slowing growth: <https://www.morningstar.com/company-reports/1262138-paypal-earnings-growth-slows-as-management-focuses-on-profitable-business>
- Note: The filing date and analysis date are the same. The risk structure is clear, making this a good interpretable fintech/payments baseline case.

### 4.4 Boeing

- SEC filing index: <https://www.sec.gov/Archives/edgar/data/12927/000001292725000015/0000012927-25-000015-index.htm>
- Direct SEC 10-K: <https://www.sec.gov/Archives/edgar/data/12927/000001292725000015/ba-20241231.htm>
- Professional reference: Nicolas Owens, 2025-02-04, discussing operating and supply constraints, macro/demand risk, the production and delivery ramp, and China/trade factors: <https://www.morningstar.com/stocks/after-earnings-is-boeing-stock-buy-sell-or-fairly-valued-6>
- Note: The analysis is one day after filing. The source risk boundaries are fairly clear, making this a useful cross-industry stress case, but later information must not be imported into the filing judgment.

### 4.5 JPMorgan Chase

- SEC filing index: <https://www.sec.gov/Archives/edgar/data/19617/000001961725000270/0000019617-25-000270-index.htm>
- Direct SEC 10-K: <https://www.sec.gov/Archives/edgar/data/19617/000001961725000270/jpm-20241231.htm>
- Professional reference: Suryansh Sharma, 2025-01-24, discussing higher rates, regulation, macroeconomics, the credit/debt cycle, and competition: <https://www.morningstar.com/company-reports/1260461-jpmorgan-will-continue-to-benefit-from-higher-rates-but-shares-are-priced-for-perfection>
- Note: The reference predates the filing and is well aligned in time. However, the 10-K is long and conceptually dense, so it is better as a complexity stress test after prompts are stable than as the first classroom example.

### 4.6 Tesla

- SEC filing index: <https://www.sec.gov/Archives/edgar/data/1318605/000162828025003063/0001628280-25-003063-index.htm>
- Direct SEC 10-K: <https://www.sec.gov/Archives/edgar/data/1318605/000162828025003063/tsla-20241231.htm>
- One professional reference: Morningstar Investing Insights podcast, 2025-01-24, covering policy and the Tesla outlook: <https://www.morningstar.com/podcasts/investing-insights/c187283c-c009-4447-b6a3-537abde104f7>
- Supplemental later analysis: 2025-07-30, covering demand, competition, autonomy, and political risk: <https://www.morningstar.com/stocks/after-earnings-is-tesla-stock-buy-sell-or-fairly-valued-8>
- Note: Industry and risk diversity are high, but the most direct public analysis is mostly post-filing, so timing alignment is weaker than for NVIDIA, PayPal, and JPMorgan. Use it as a rotation or stress case.

### 4.7 Pfizer

- SEC filing index: <https://www.sec.gov/Archives/edgar/data/78003/000007800325000054/0000078003-25-000054-index.htm>
- Direct SEC 10-K: <https://www.sec.gov/Archives/edgar/data/78003/000007800325000054/pfe-20241231.htm>
- Professional reference: Karen Andersen, CFA, 2025-07-02, discussing patent expiry and competitive erosion: <https://global.morningstar.com/en-ca/stocks/pfizer-competitive-advantages-still-exist-signs-erosion-lead-us-lower-our-valuation>
- Note: Pharmaceuticals add industry coverage, but the public analysis is far from the filing date and may import later information. Keep this as a reserve case.

### 4.8 Meta

- Direct SEC 10-K: <https://www.sec.gov/Archives/edgar/data/1326801/000132680125000017/meta-20241231.htm>
- One professional reference: 2025-07-21, covering AI investment, antitrust, data/privacy, and legal risk: <https://www.morningstar.com/stocks/going-into-earnings-is-meta-stock-buy-sell-or-fairly-valued-7>
- Note: This is useful for platform, privacy, and AI-investment risks, but some AI themes overlap with NVIDIA and the reference is late. Keep it as a reserve case.

## 5. Recommended order of use

### 5.1 Recommended P-phase cases

The P phase is fixed to the following four cases: they provide cross-industry coverage, clear risk structures, and relatively usable public references:

1. `NVDA-FY25`: supply/demand, competition, supply chain, export restrictions.
2. `COIN-FY24`: volatility, regulation, custody/security, revenue model.
3. `PYPL-FY24`: payments competition, cybersecurity, regulation, growth.
4. `BA-FY24`: product safety, quality, production/supply chain, liquidity.

These four are sufficient for multiple rounds of prompt, risk-taxonomy, and evidence-format adjustment. If a risk class remains unstable, add `JPM-FY24` or `TSLA-FY24` as a stress test.

### 5.2 Reserve and formal R1 blind test

`JPM-FY24`, `TSLA-FY24`, `PFE-FY24`, and `META-FY24` are currently frozen as inputs only and must not enter P-phase prompt tuning. After freezing prompts, risk definitions, output schema, model settings, and scoring rules, select 2–4 of them for R1. If a case is used during P, it automatically loses R1 eligibility and must be replaced from the reserve pool.

This separates “the prompt adapted to one particular 10-K” from “the model generalized to a new filing.”

## 6. Evidence and copyright boundaries

- Use direct SEC 10-K HTML and filing indexes as traceable primary sources; record the accession number, filing date, fiscal year-end date, Item 1A locator, and excerpts.
- Store only public links, authors, dates, and topic summaries for professional references. Do not copy complete paid reports into the repository.
- Every model conclusion in the primary material should map to a verifiable 10-K text span. Analyst references can compare topic overlap but cannot replace textual evidence.
- Do not commit API tokens, complete local model weights, private analyst reports, browser credentials, or unchecked scraped web content to the public repository.

## 7. Completed work and next gate

The short case packages, page images, PDF/print-page mapping, and paragraph-location indexes are complete. Before real model runs, the first four recommended cases still require input review covering:

1. Source headings and paragraph boundaries;
2. SEC page numbers or HTML locators;
3. Acceptable risk-theme labels;
4. Suitability for a single classroom demonstration;
5. External information that could cause case leakage or time travel.

Only after this review should real P-phase model calls begin. The reserve package remains excluded from prompt tuning.
