# 专业解读参考核查

[English version](EXPERT_REFERENCE_REVIEW.en.md) | 中文

**项目：** Financial filing extraction  
**课程：** SHBI-GB 7343 — AI in Finance  
**版本：** v0.1.0  
**核查日期：** 2026-09-01  
**状态：** 专业参考筛选；不是最终答案集

## 1. 结论

目前八个候选案例都能找到不同程度的专业分析或分析师评论，但不能把任何一篇报告直接当作唯一标准答案。原因有三点：

1. 分析师报告通常服务于投资判断，可能强调估值、增长或催化剂，而不是完整覆盖 10-K 的所有重大风险。
2. 申报日之后发布的分析可能使用了 10-K 之外的新信息，直接拿来评估模型会造成时间泄漏。
3. 模型识别出一个有充分 10-K 原文支持、但分析师没有提到的风险时，不应因此被判错。

因此，后续采用“双层标准答案”：

- **第一层，文本事实标准答案：** 小组成员只依据 Item 1A 原文，独立标注重大风险、原文证据和风险类型，再进行讨论和版本化定稿。
- **第二层，专业重合参考：** 记录专业分析师是否关注同一风险主题，并检查该主题能否由本份 10-K 原文支持。该层用于计算 analyst overlap，不替代第一层。

## 2. 专业参考分级

| 等级 | 定义 | 用途 |
|---|---|---|
| A1 | 独立专业分析师在 10-K 申报前或很接近申报日发布，且明确讨论风险、不确定性或关键观察点 | 可作为高质量主题重合参考，但仍需回到 10-K |
| A2 | 独立专业分析师在申报日当天或之后发布，内容清晰但可能使用了申报后的信息 | 可作为辅助参考；必须标注潜在时间泄漏 |
| B | 公司自己的研究、投资者材料或行业观点 | 可作背景材料，不作为独立专家标准 |
| C | 距申报日较远的后续分析 | 只适合发现可能的候选主题，不适合直接评分 |

本轮以 Morningstar 公开页面为主，因为其页面通常能记录作者、日期、风险/不确定性以及分析主题；页面有时会受访问限制，仓库只保留公开链接、元数据和主题摘要，不复制完整付费报告。

## 3. 逐案例核查结果

| ID | 最有用的专业参考 | 时间关系 | 分级 | 能支持的重合主题 | 当前使用建议 |
|---|---|---|---|---|---|
| `NVDA-FY25` | Brian Colello, CPA，Morningstar，2025-02-19；另有 2025-02-27 申报后分析 | 前一篇早于 10-K；后一篇晚于 10-K | A1 + A2 | AI 数据中心需求、供需和产能、云厂商自研/竞争、出口限制和地缘风险 | 高质量参考；优先使用 2025-02-19 的版本，申报后版本只作补充 |
| `COIN-FY24` | Michael Miller, CFA，Morningstar，2024-11-15；2025-02-21 申报后分析；Coinbase Institutional 2025-02-12 月报 | 独立近期期分析早于 10-K 约三个月；另一篇晚于 10-K；公司材料在前一天 | A1 + A2 + B | 加密资产价格和交易量波动、交易费依赖、监管不确定性、托管/安全、竞争 | 可用，但必须把 2025-02-21 标为申报后；独立参考与公司材料分开记录 |
| `PYPL-FY24` | Brett Horn，Morningstar，2025-02-04 | 与 10-K 申报日相同，且围绕当天业绩 | A2 | 增长放缓、盈利性业务转型、竞争和宏观需求 | 可用；由于同日信息混合，不能把报告中的全部观点当作 10-K 风险标签 |
| `BA-FY24` | Nicolas Owens，Morningstar，2025-01-28；另有 2025-02-04 申报后分析 | 前一篇早于 10-K；后一篇晚于 10-K 一天 | A1 + A2 | 生产和供应链、质量和安全、交付爬坡、国防业务运营风险、流动性 | 高质量压力案例；优先使用 2025-01-28 的版本 |
| `JPM-FY24` | Suryansh Sharma，Morningstar，2025-01-15、2025-01-24 | 两篇均早于 10-K | A1 | 利率和宏观经济、信用/债务周期、监管、规模和竞争 | 高质量参考；适合测试金融风险分类，但文本量大、难度较高 |
| `TSLA-FY24` | Seth Goldstein, CFA，Morningstar，2025-01-23 | 早于 10-K 约一周 | A1 | 需求和交付、汽车毛利、自动驾驶和监管、新车型推出、竞争 | 高质量参考；适合跨行业泛化和技术风险分类 |
| `PFE-FY24` | Karen Andersen, CFA，Morningstar，2025-07-02 | 晚于 10-K 约四个月 | C | 专利到期、竞争性侵蚀、产品组合和研发管线 | 暂作储备；除非补到申报日前后的第二个独立参考 |
| `META-FY24` | Malik Ahmed Khan, CFA，Morningstar，2025-01-23 | 早于 10-K 约一周 | A1 | GenAI 投资、Reality Labs、广告依赖、隐私/监管、反垄断 | 高质量参考；与 NVIDIA 的 AI 主题有部分重叠，需保留行业差异 |

## 4. 具体公开参考链接

### NVIDIA

- 申报前分析：<https://www.morningstar.com/stocks/going-into-earnings-is-nvidia-stock-buy-sell-or-fairly-valued-5>
- 申报后补充：<https://www.morningstar.com/stocks/nvidia-earnings-near-term-revenue-remains-bright>
- SEC 原始 10-K：<https://www.sec.gov/Archives/edgar/data/1045810/000104581025000023/nvda-20250126.htm>

### Coinbase

- 申报前独立分析：<https://www.morningstar.com/stocks/after-earnings-is-coinbase-stock-buy-sell-or-fairly-valued-3>
- 申报后独立分析：<https://www.morningstar.com/stocks/after-earnings-is-coinbase-stock-buy-sell-or-fairly-valued-4>
- 申报前公司研究材料：<https://www.coinbase.com/institutional/research-insights/research/monthly-outlook/monthly-outlook-feb-2025>
- SEC 原始 10-K：<https://www.sec.gov/Archives/edgar/data/1679788/000167978825000022/coin-20241231.htm>

### PayPal

- 同日 Morningstar 分析：<https://www.morningstar.com/company-reports/1262138-paypal-earnings-growth-slows-as-management-focuses-on-profitable-business>
- SEC 原始 10-K：<https://www.sec.gov/Archives/edgar/data/1633917/000163391725000019/pypl-20241231.htm>

### Boeing

- 申报前分析：<https://www.morningstar.com/stocks/boeing-earnings-dismal-close-2024-turnaround-progress-nears>
- 申报后分析：<https://www.morningstar.com/stocks/after-earnings-is-boeing-stock-buy-sell-or-fairly-valued-6>
- SEC 原始 10-K：<https://www.sec.gov/Archives/edgar/data/12927/000001292725000015/ba-20241231.htm>

### JPMorgan Chase

- 申报前分析：<https://www.morningstar.com/stocks/jpmorgan-earnings-fundamentals-remain-robust-implied-expectations-are-bit-too-optimistic>
- 申报前公司报告页：<https://www.morningstar.com/company-reports/1260461-jpmorgan-will-continue-to-benefit-from-higher-rates-but-shares-are-priced-for-perfection>
- SEC filing index：<https://www.sec.gov/Archives/edgar/data/19617/000001961725000270/0000019617-25-000270-index.html>
- SEC 原始 10-K：<https://www.sec.gov/Archives/edgar/data/19617/000001961725000270/jpm-20241231.htm>

### Tesla

- 申报前分析：<https://www.morningstar.com/stocks/going-into-earnings-is-tesla-stock-buy-sell-or-fairly-valued-6>
- SEC 原始 10-K：<https://www.sec.gov/Archives/edgar/data/1318605/000162828025003063/tsla-20241231.htm>

### Pfizer

- 申报后分析：<https://global.morningstar.com/en-ca/stocks/pfizer-competitive-advantages-still-exist-signs-erosion-lead-us-lower-our-valuation>
- SEC 原始 10-K：<https://www.sec.gov/Archives/edgar/data/78003/000007800325000054/pfe-20241231.htm>

### Meta

- 申报前分析：<https://www.morningstar.com/stocks/going-into-earnings-is-meta-stock-buy-sell-or-fairly-valued-5>
- SEC 原始 10-K：<https://www.sec.gov/Archives/edgar/data/1326801/000132680125000017/meta-20241231.htm>

## 5. 建议的标准答案制作流程

对每一份正式案例，建立一个不依赖模型输出的 `gold_annotation`：

1. 两名组员分别只阅读指定的 Item 1A 原文，选择三项重大风险。
2. 每项风险必须填写：风险名称、原文短引、SEC 定位、风险类型、为什么属于 material risk。
3. 组员先独立完成，再讨论分歧；保留分歧和修改记录，避免事后迎合模型答案。
4. 逐项对照 A1/A2 专业参考，增加 `expert_overlap` 字段：`supported_overlap`、`expert_only`、`filing_only`。
5. 对 `filing_only` 不自动扣分；只要风险有充分原文支持，就应算作可能的正确发现。
6. 对 `expert_only` 不直接算作模型错误，先检查是否来自申报后的信息、其他章节或分析师的估值判断。

## 6. 建议采用的评分字段

最终记录不只保存一个“标准答案命中/未命中”，而是至少保存：

- `risk_validity`：风险是否确实由 10-K 原文支持；
- `materiality`：是否达到题目要求的重大风险层级；
- `evidence_exactness`：引文是否为原文且足够支持结论；
- `risk_type`：风险类型是否符合冻结后的 taxonomy；
- `expert_overlap`：是否与专业参考关注的主题重合；
- `unsupported_inference`：是否添加了原文或当时信息无法支持的推断；
- `temporal_leakage`：是否使用了申报日之后才出现的信息。

## 7. 当前决定

- `NVDA-FY25`、`BA-FY24`、`JPM-FY24`、`TSLA-FY24`、`META-FY24`：专业参考时间对齐较好，可作为高质量候选。
- `PYPL-FY24`：分析师参考很接近，但同日业绩信息与 10-K 信息混合，使用时需严格拆分。
- `COIN-FY24`：有独立分析和公司研究，但最接近申报日的独立分析在申报后，需显式标记泄漏风险。
- `PFE-FY24`：目前只有明显较晚的独立参考，暂不作为第一批标准答案案例。

下一阶段仍应先完成 10-K Item 1A 的原文抽取和人工标注，再把专业参考加入对照表；不能先根据分析师报告反向编写答案。
