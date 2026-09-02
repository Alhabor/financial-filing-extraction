# 10-K 候选案例清单

**项目：** Financial filing extraction
**课程：** SHBI-GB 7343 — AI in Finance
**小组：** Group 7
**版本：** v0.3.0
**检索日期：** 2026-09-01
**状态：** 已冻结 P 阶段开发包与 reserve 包；不等于正式 R1 盲测集

## 1. 这份清单的用途

本清单用于为 Mini-exercise 选择真实、可复核、适合比较三类模型的 10-K 风险因素案例：

1. SEC 申报文件是原始事实来源，后续的风险判断必须能够回到 10-K 原文。
2. 公开的专业分析师文章或分析师报告只作为第二层参考，用于评估模型是否覆盖了专业分析中关注的主题；它们不是唯一的标准答案。
3. 在准备轮次（P phase）中使用过的案例，不能在提示词冻结后再作为正式 R1 盲测案例，否则会产生案例泄漏。
4. 第一批 8 份候选材料已经下载、切分并整理到 `data/`；短案例包版本 `case-packet-spec-v001` 已生成。前四份用于当前 P 阶段开发，后四份保留为 reserve，后续是否成为 R1 要看 P 阶段是否使用过它们。

## 2. 筛选标准与初步评分

每项 0–2 分，总分 10 分。分数是人工桌面筛选结果，不是模型表现分数。

| 维度 | 2 分 | 1 分 | 0 分 |
|---|---|---|---|
| SEC 原始来源 | 有 SEC filing index 和直接 HTML 10-K | 来源可找到但整理成本较高 | 无稳定、可核验的原始来源 |
| 风险可分离性 | Item 1A 中有清晰、可截取的独立风险主题 | 主题存在，但与其他风险交织 | 很难形成可独立核验的风险单元 |
| 专业参考的时间对齐 | 分析参考在 10-K 发布前后很近 | 有参考但相隔较远或为发布后内容 | 只有明显包含后续信息的参考 |
| 行业/风险多样性 | 能补充现有案例的行业和风险结构 | 有一定重复 | 与已有案例高度重复 |
| 文本可操作性 | 适合截取短段落并做逐句证据核验 | 文本较长或结构较复杂 | 对课堂演示不够 tractable |

时间对齐分数尤其重要：发布后的分析可能知道 10-K 之后发生的事情。因此，后续只能把分析师参考中能够由 10-K 原文独立支持的重合主题计入“专业分析重合度”，不能把后来的信息当作 10-K 的答案。

## 3. 第一批候选案例

| ID | 公司 / 财年 | SEC 申报日期 | 行业 | 适合抽取的风险主题 | 初步分数 | 建议角色 |
|---|---|---:|---|---|---:|---|
| `NVDA-FY25` | NVIDIA / FY2025 | 2025-02-26 | 半导体、AI 基础设施 | 竞争；需求和供给错配；第三方供应商；出口管制；网络安全 | 10/10 | 核心开发案例 |
| `COIN-FY24` | Coinbase / FY2024 | 2025-02-13 | 加密资产平台、金融科技 | 加密资产波动导致收入不稳定；监管不确定性；托管与安全事件；竞争 | 9/10 | 核心开发案例 |
| `PYPL-FY24` | PayPal / FY2024 | 2025-02-04 | 支付、金融科技 | 支付行业竞争；网络安全与数据泄露；监管；用户和交易增长 | 10/10 | 核心开发案例 |
| `BA-FY24` | Boeing / FY2024 | 2025-02-03 | 航空制造、国防 | 产品安全和质量；生产与供应链；航空市场需求；流动性；国防合同 | 9/10 | 核心开发/压力案例 |
| `JPM-FY24` | JPMorgan Chase / FY2024 | 2025-02-14 | 银行、金融服务 | 宏观经济和利率；信用与市场风险；监管；网络安全；规模和竞争 | 8/10 | 复杂度压力案例 |
| `TSLA-FY24` | Tesla / FY2024 | 2025-01-30 | 汽车、能源、AI/自动驾驶 | 需求与竞争；制造和产品上市；自动驾驶与技术；监管；关键人员和政治因素 | 9/10 | 行业扩展/压力案例 |
| `PFE-FY24` | Pfizer / FY2024 | 2025-02-27 | 制药 | 专利到期和竞争性侵蚀；药品审批；定价和报销；制造与供应；诉讼 | 7/10 | 储备案例 |
| `META-FY24` | Meta / FY2024 | 2025-01-30 | 社交平台、广告、AI | 用户参与和产品；隐私与数据；监管和反垄断；AI 投资；内容治理 | 6/10 | 储备/后续扩展 |

## 4. 原始来源与专业参考

下表的 SEC 链接是后续原始材料的优先入口；“专业参考”是公开可访问的 Morningstar 分析师文章、Stock Analyst Note 或相关分析页面。后续若发现文章受限、内容发生更新或无法稳定访问，应保留链接和访问日期，并将其降级为辅助参考。

### 4.1 NVIDIA

- SEC filing index：<https://www.sec.gov/Archives/edgar/data/1045810/000104581025000023/0001045810-25-000023-index.htm>
- SEC 直接 10-K：<https://www.sec.gov/Archives/edgar/data/1045810/000104581025000023/nvda-20250126.htm>
- 专业参考：Brian Colello, CPA，2025-02-19，围绕数据中心需求、需求暂停或库存修正、供应约束收入和 AI/DeepSeek 不确定性展开：<https://www.morningstar.com/stocks/going-into-earnings-is-nvidia-stock-buy-sell-or-fairly-valued-5>
- 备注：参考文章在 10-K 申报前，时间对齐较好；适合检验模型能否从原文识别供需、竞争和监管风险，而不是只复述热门叙事。

### 4.2 Coinbase

- SEC filing index：<https://www.sec.gov/Archives/edgar/data/1679788/000167978825000022/0001679788-25-000022-index.htm>
- SEC 直接 10-K：<https://www.sec.gov/Archives/edgar/data/1679788/000167978825000022/coin-20241231.htm>
- 专业参考：Michael Miller, CFA，2025-02-21，围绕加密资产敞口、交易费依赖、波动性、监管、托管安全和 USDC 利率敏感性展开：<https://www.morningstar.com/stocks/after-earnings-is-coinbase-stock-buy-sell-or-fairly-valued-4>
- 另一条公开分析参考：2025-02-20，讨论高加密货币价格和波动性对 Coinbase 的影响：<https://www.morningstar.com/company-reports/1265774-high-cryptocurrency-prices-and-volatility-benefit-coinbase-heading-into-2025>
- 备注：分析参考晚于申报日约一周，时间对齐为中等；只使用与 10-K 原文重合的风险主题。

### 4.3 PayPal

- SEC filing index：<https://www.sec.gov/Archives/edgar/data/1633917/000163391725000019/0001633917-25-000019-index.htm>
- SEC 直接 10-K：<https://www.sec.gov/Archives/edgar/data/1633917/000163391725000019/pypl-20241231.htm>
- 专业参考：Brett Horn，2025-02-04，讨论盈利性业务聚焦和增长放缓：<https://www.morningstar.com/company-reports/1262138-paypal-earnings-growth-slows-as-management-focuses-on-profitable-business>
- 备注：申报日与分析参考日期相同；风险结构清晰，适合作为金融科技/支付类的易解释基准案例。

### 4.4 Boeing

- SEC filing index：<https://www.sec.gov/Archives/edgar/data/12927/000001292725000015/0000012927-25-000015-index.htm>
- SEC 直接 10-K：<https://www.sec.gov/Archives/edgar/data/12927/000001292725000015/ba-20241231.htm>
- 专业参考：Nicolas Owens，2025-02-04，讨论运营和供应约束、宏观/需求风险、生产交付爬坡以及中国和贸易因素：<https://www.morningstar.com/stocks/after-earnings-is-boeing-stock-buy-sell-or-fairly-valued-6>
- 备注：分析参考在申报日后一天；原文风险主题边界较清楚，适合做跨行业压力案例，但要防止把分析师后来获得的信息带入原文判断。

### 4.5 JPMorgan Chase

- SEC filing index：<https://www.sec.gov/Archives/edgar/data/19617/000001961725000270/0000019617-25-000270-index.htm>
- SEC 直接 10-K：<https://www.sec.gov/Archives/edgar/data/19617/000001961725000270/jpm-20241231.htm>
- 专业参考：Suryansh Sharma，2025-01-24，讨论较高利率、监管、宏观经济、信用/债务周期和竞争：<https://www.morningstar.com/company-reports/1260461-jpmorgan-will-continue-to-benefit-from-higher-rates-but-shares-are-priced-for-perfection>
- 备注：专业参考早于申报日，时间对齐好；但 10-K 很长、银行风险概念密集，适合在提示词稳定后作为复杂度压力测试，而不宜作为最早的课堂示例。

### 4.6 Tesla

- SEC filing index：<https://www.sec.gov/Archives/edgar/data/1318605/000162828025003063/0001628280-25-003063-index.htm>
- SEC 直接 10-K：<https://www.sec.gov/Archives/edgar/data/1318605/000162828025003063/tsla-20241231.htm>
- 专业参考之一：2025-01-24 的 Morningstar Investing Insights 播客，涉及政策和 Tesla 展望：<https://www.morningstar.com/podcasts/investing-insights/c187283c-c009-4447-b6a3-537abde104f7>
- 可作补充的后续分析：2025-07-30，涉及需求、竞争、自动驾驶和政治风险：<https://www.morningstar.com/stocks/after-earnings-is-tesla-stock-buy-sell-or-fairly-valued-8>
- 备注：行业和风险多样性高，但最直接的公开分析参考多为申报后内容，时间对齐弱于 NVIDIA、PayPal 和 JPMorgan；适合作为轮换或压力案例。

### 4.7 Pfizer

- SEC filing index：<https://www.sec.gov/Archives/edgar/data/78003/000007800325000054/0000078003-25-000054-index.htm>
- SEC 直接 10-K：<https://www.sec.gov/Archives/edgar/data/78003/000007800325000054/pfe-20241231.htm>
- 专业参考：Karen Andersen, CFA，2025-07-02，讨论专利到期和竞争性侵蚀：<https://global.morningstar.com/en-ca/stocks/pfizer-competitive-advantages-still-exist-signs-erosion-lead-us-lower-our-valuation>
- 备注：药品行业能补充行业覆盖，但公开分析参考距申报日较远，容易带入后续信息；暂列储备。

### 4.8 Meta

- SEC 直接 10-K：<https://www.sec.gov/Archives/edgar/data/1326801/000132680125000017/meta-20241231.htm>
- 专业参考之一：2025-07-21，涉及 AI 投资、反垄断、数据/隐私和法律风险：<https://www.morningstar.com/stocks/going-into-earnings-is-meta-stock-buy-sell-or-fairly-valued-7>
- 备注：适合研究平台、隐私和 AI 投资风险，但与 NVIDIA 的 AI 主题有部分重复，且分析参考时间较晚；暂列储备。

## 5. 当前推荐的使用顺序

### 5.1 准备轮次 P：建议优先使用

当前 P 阶段固定先使用以下四份，形成跨行业、风险结构清楚、公开分析参考相对可用的开发池：

1. `NVDA-FY25`：供需、竞争、供应链、出口限制。
2. `COIN-FY24`：波动性、监管、托管安全、收入模式。
3. `PYPL-FY24`：支付竞争、网络安全、监管、增长。
4. `BA-FY24`：产品安全、质量、生产供应链、流动性。

这四份足以支持提示词、风险类型分类和证据引用格式的多轮调整；如果发现某一类风险的输出不稳定，再加入 `JPM-FY24` 或 `TSLA-FY24` 做压力测试。

### 5.2 Reserve 与 R1 正式盲测

`JPM-FY24`、`TSLA-FY24`、`PFE-FY24`、`META-FY24` 当前只冻结输入，不进入 P 的 Prompt 调整。R1 的案例必须在 P 阶段结束后，从当时没有被用于提示词调整的材料中最终冻结。可行做法是：

- P 阶段使用四份案例；
- 冻结提示词、风险类型定义、输出 schema、模型设置和评分规则；
- 从 `JPM-FY24`、`TSLA-FY24`、`PFE-FY24`、`META-FY24` 中选择 2–4 份作为 R1；
- 如果 P 阶段使用了这些案例，则相应案例自动失去 R1 资格，需要从储备池补充。

这样可以把“提示词是否适应了某一份 10-K”与“模型在新文件上的泛化能力”区分开。

## 6. 证据与版权边界

- SEC 10-K 的直接 HTML 和 filing index 用作可追溯原始来源；后续记录 accession number、申报日期、财年截止日、Item 1A 定位和原文摘录。
- 专业分析参考只保存公开链接、作者、日期和主题摘要，不把受版权保护的完整付费报告复制到仓库。
- 原始材料中的每一条模型结论都应对应一个可核验的 10-K 文本片段；分析师参考只能用于比较“主题重合”，不能替代文本证据。
- 公开 GitHub 仓库后续不应提交 API token、完整本地模型权重、私有分析报告、浏览器凭证或未经核查的网页抓取结果。

## 7. 已完成与下一步门槛

已完成短案例包、页面图像、PDF/印刷页码映射和段落定位索引。下一阶段在真实模型运行前，仍需对推荐的前四份案例进行输入复核，记录：

1. 原文标题和段落边界；
2. SEC 页码或 HTML 定位信息；
3. 可接受的风险主题标签；
4. 是否适合在一次课堂演示中处理；
5. 是否存在会导致案例泄漏或时间穿越的外部信息。

完成这一步后，才开始 P 的真实模型调用；reserve 包继续保持未参与 Prompt 调整的状态。
