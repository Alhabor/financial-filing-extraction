# Professional-Analysis Reference Review

**Project:** Financial filing extraction<br>
**Course:** SHBI-GB 7343 — AI in Finance<br>
**Version:** v0.1.0<br>
**Review date:** 2026-09-01<br>
**Status:** Professional-reference screening; not the final answer set

## 1. Conclusion

All eight candidate cases have some form of professional analysis or analyst commentary, but no report should be treated as the sole gold standard. There are three reasons:

1. Analyst reports usually serve investment decisions and may emphasize valuation, growth, or catalysts rather than fully covering every material risk in the 10-K.
2. Analysis published after the filing date may use information outside the 10-K, creating temporal leakage if used directly to evaluate a model.
3. If a model identifies a risk with strong 10-K support that an analyst did not mention, that should not be scored as wrong for that reason.

The project therefore uses a two-layer answer standard:

- **Layer 1, textual-fact gold standard:** Group members independently annotate material risks, source evidence, and risk types using only Item 1A, then discuss and version the final annotation.
- **Layer 2, professional-overlap reference:** Record whether professional analysis focuses on the same risk theme and whether the theme is supported by this 10-K. This layer calculates analyst overlap; it does not replace Layer 1.

## 2. Professional-reference tiers

| Tier | Definition | Use |
|---|---|---|
| A1 | Independent analyst published before or very close to the 10-K filing and clearly discusses risks, uncertainty, or key observations | High-quality topic-overlap reference, still checked against the 10-K |
| A2 | Independent analyst published on or after the filing date; content is clear but may use post-filing information | Auxiliary reference; potential temporal leakage must be marked |
| B | Company research, investor materials, or industry commentary | Background only; not an independent expert standard |
| C | Later analysis far from the filing date | Candidate-theme discovery only; unsuitable for direct scoring |

This round prioritizes public Morningstar pages because they often record the author, date, risk/uncertainty, and analysis themes. Pages may be access-restricted; the repository retains only public links, metadata, and topic summaries, not complete paid reports.

## 3. Case-by-case review

| ID | Most useful professional reference | Timing | Tier | Supported overlap themes | Current recommendation |
|---|---|---|---|---|---|
| `NVDA-FY25` | Brian Colello, CPA, Morningstar, 2025-02-19; also a post-filing analysis on 2025-02-27 | First before 10-K; second after 10-K | A1 + A2 | AI data-center demand, supply/demand and capacity, cloud self-build/competition, export controls and geopolitical risk | High-quality reference; prioritize 2025-02-19, use the later version only as a supplement |
| `COIN-FY24` | Michael Miller, CFA, Morningstar, 2024-11-15; post-filing analysis on 2025-02-21; Coinbase Institutional monthly report on 2025-02-12 | Independent near-term analysis about three months before; another after filing; company material one day before | A1 + A2 + B | Crypto price and trading-volume volatility, transaction-fee dependence, regulatory uncertainty, custody/security, competition | Usable, but mark 2025-02-21 as post-filing and separate independent analysis from company material |
| `PYPL-FY24` | Brett Horn, Morningstar, 2025-02-04 | Same day as 10-K filing, around the earnings release | A2 | Slowing growth, profitable-business transition, competition, and macro demand | Usable; same-day information is mixed, so do not treat all report views as 10-K risk labels |
| `BA-FY24` | Nicolas Owens, Morningstar, 2025-01-28; also a post-filing analysis on 2025-02-04 | First before 10-K; second one day after | A1 + A2 | Production and supply chain, quality and safety, delivery ramp, defense operating risk, liquidity | High-quality stress case; prioritize 2025-01-28 |
| `JPM-FY24` | Suryansh Sharma, Morningstar, 2025-01-15 and 2025-01-24 | Both before the 10-K | A1 | Rates and macroeconomics, credit/debt cycle, regulation, scale and competition | High-quality reference; useful for financial-risk classification but large and difficult |
| `TSLA-FY24` | Seth Goldstein, CFA, Morningstar, 2025-01-23 | About one week before the 10-K | A1 | Demand and deliveries, auto gross margin, autonomy and regulation, new-model launches, competition | High-quality reference; useful for cross-industry generalization and technology-risk classification |
| `PFE-FY24` | Karen Andersen, CFA, Morningstar, 2025-07-02 | About four months after the 10-K | C | Patent expiry, competitive erosion, portfolio and R&D pipeline | Reserve for now; add a second independent reference near the filing date before using as a gold-answer case |
| `META-FY24` | Malik Ahmed Khan, CFA, Morningstar, 2025-01-23 | About one week before the 10-K | A1 | GenAI investment, Reality Labs, advertising dependence, privacy/regulation, antitrust | High-quality reference; partly overlaps NVIDIA on AI, but retain the industry distinction |

## 4. Specific public reference links

### NVIDIA

- Pre-filing analysis: <https://www.morningstar.com/stocks/going-into-earnings-is-nvidia-stock-buy-sell-or-fairly-valued-5>
- Post-filing supplement: <https://www.morningstar.com/stocks/nvidia-earnings-near-term-revenue-remains-bright>
- SEC primary 10-K: <https://www.sec.gov/Archives/edgar/data/1045810/000104581025000023/nvda-20250126.htm>

### Coinbase

- Pre-filing independent analysis: <https://www.morningstar.com/stocks/after-earnings-is-coinbase-stock-buy-sell-or-fairly-valued-3>
- Post-filing independent analysis: <https://www.morningstar.com/stocks/after-earnings-is-coinbase-stock-buy-sell-or-fairly-valued-4>
- Pre-filing company research: <https://www.coinbase.com/institutional/research-insights/research/monthly-outlook/monthly-outlook-feb-2025>
- SEC primary 10-K: <https://www.sec.gov/Archives/edgar/data/1679788/000167978825000022/coin-20241231.htm>

### PayPal

- Same-day Morningstar analysis: <https://www.morningstar.com/company-reports/1262138-paypal-earnings-growth-slows-as-management-focuses-on-profitable-business>
- SEC primary 10-K: <https://www.sec.gov/Archives/edgar/data/1633917/000163391725000019/pypl-20241231.htm>

### Boeing

- Pre-filing analysis: <https://www.morningstar.com/stocks/boeing-earnings-dismal-close-2024-turnaround-progress-nears>
- Post-filing analysis: <https://www.morningstar.com/stocks/after-earnings-is-boeing-stock-buy-sell-or-fairly-valued-6>
- SEC primary 10-K: <https://www.sec.gov/Archives/edgar/data/12927/000001292725000015/ba-20241231.htm>

### JPMorgan Chase

- Pre-filing analysis: <https://www.morningstar.com/stocks/jpmorgan-earnings-fundamentals-remain-robust-implied-expectations-are-bit-too-optimistic>
- Pre-filing company-report page: <https://www.morningstar.com/company-reports/1260461-jpmorgan-will-continue-to-benefit-from-higher-rates-but-shares-are-priced-for-perfection>
- SEC filing index: <https://www.sec.gov/Archives/edgar/data/19617/000001961725000270/0000019617-25-000270-index.html>
- SEC primary 10-K: <https://www.sec.gov/Archives/edgar/data/19617/000001961725000270/jpm-20241231.htm>

### Tesla

- Pre-filing analysis: <https://www.morningstar.com/stocks/going-into-earnings-is-tesla-stock-buy-sell-or-fairly-valued-6>
- SEC primary 10-K: <https://www.sec.gov/Archives/edgar/data/1318605/000162828025003063/tsla-20241231.htm>

### Pfizer

- Post-filing analysis: <https://global.morningstar.com/en-ca/stocks/pfizer-competitive-advantages-still-exist-signs-erosion-lead-us-lower-our-valuation>
- SEC primary 10-K: <https://www.sec.gov/Archives/edgar/data/78003/000007800325000054/pfe-20241231.htm>

### Meta

- Pre-filing analysis: <https://www.morningstar.com/stocks/going-into-earnings-is-meta-stock-buy-sell-or-fairly-valued-5>
- SEC primary 10-K: <https://www.sec.gov/Archives/edgar/data/1326801/000132680125000017/meta-20241231.htm>

## 5. Recommended gold-annotation process

For each formal case, create a model-independent `gold_annotation`:

1. Two group members independently read only the specified Item 1A text and select three material risks.
2. For each risk, record the risk name, short source quote, SEC locator, risk type, and why it qualifies as material.
3. Complete the annotations independently before discussing disagreements; retain disagreement and revision records to avoid fitting the answer to model output after the fact.
4. Compare each item with A1/A2 references and add `expert_overlap`: `supported_overlap`, `expert_only`, and `filing_only`.
5. Do not deduct automatically for `filing_only`; a risk with strong source support is a potentially correct discovery.
6. Do not count `expert_only` directly as a model error. First check whether it came from post-filing information, another section, or an analyst valuation judgment.

## 6. Recommended scoring fields

Do not save only a binary “gold-answer hit.” At minimum, record:

- `risk_validity`: whether the risk is supported by the 10-K;
- `materiality`: whether it reaches the required material-risk level;
- `evidence_exactness`: whether the quote is verbatim and sufficient;
- `risk_type`: whether it matches the frozen taxonomy;
- `expert_overlap`: whether it overlaps with professional references;
- `unsupported_inference`: whether the model added an inference unsupported by the filing or information available at the time;
- `temporal_leakage`: whether it used information that appeared only after the filing date.

## 7. Current decision

- `NVDA-FY25`, `BA-FY24`, `JPM-FY24`, `TSLA-FY24`, `META-FY24`: good timing alignment and suitable as high-quality candidates.
- `PYPL-FY24`: the reference is close, but same-day earnings information is mixed with 10-K information and must be separated carefully.
- `COIN-FY24`: independent analysis and company research are available, but the closest independent analysis is post-filing and the leakage risk must be marked explicitly.
- `PFE-FY24`: currently has only a clearly late independent reference and should not be a first-batch gold-answer case.

The next phase should complete source extraction and human annotation for Item 1A first, then add professional references to the comparison table. Do not write answers backwards from analyst reports.
