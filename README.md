# Financial filing extraction

Group 7 的 **SHBI-GB 7343 — AI in Finance** 课程项目。项目从课程要求的 10-K 风险因素抽取出发，比较三种模型在真实金融分析工作流中的适配方式，并将实验结果延伸为一个可追溯的 filing risk analyzer 原型。

## 项目目标

本项目不把目标限定为在完全相同 Prompt 下寻找一个最高分模型，而是研究：

> 在真实金融文件风险筛查场景中，哪种“模型 + Prompt + 验证工作流”组合能够以合理的时间、成本和算力，产生可信、有证据、对金融分析有帮助的结果。

因此，项目同时保留两条实验线：

1. **标准化证据线**：相同原文、相同核心任务和相同输出契约，用于比较原文忠实度、引用准确性、风险分类和无依据推断。
2. **场景化解决方案线**：允许针对每种模型优化 Prompt、推理轮次、输出结构和运行配置，用于比较实际部署质量、时间、费用、算力和可用性。

## 课程要求

- 课程编号：`SHBI-GB 7343`
- 课程名称：`AI in Finance`
- 小组：`Group 7`
- 课堂任务：`Mini-exercise: financial filing extraction`
- 课堂材料位置：Lecture 1, Page 73
- 原始任务：输入一段 10-K Risk Factors，识别三个重大风险，引用支持原文，对风险类型分类，并验证每项结论。

## 固定模型组

| 方案 | 模型 | 运行形态 |
|---|---|---|
| 通用云端 | `DeepSeek-V4-Flash-Vision-Exp` | 服务端 API |
| 通用本地 | `gemma4:26b-a4b-it-q4_K_M` | 本地推理 |
| 金融专门 | `QuantFactory/Llama-3-8B-Instruct-Finance-RAG-GGUF:Q4_K_M` | 本地 GGUF 推理 |

模型调用已通过统一 harness 完成。每次运行均记录实际模型 ID、运行参数、调用时间、Token、延迟、错误和资源消耗。

## 当前状态

已完成：

- 实验设计、8 份公开 10-K、冻结案例包、页码/段落索引和哈希校验；
- 三模型标准基准与 PYPL、COIN 多轮 Prompt/工作流准备；
- 金融模型的确定性证据目录和原文定位管线；
- 面向课堂截止时间的配置冻结，以及 `PFE-FY24` 单案例、三输入条件、8 次无重试的精简 R1 盲测；
- `JPM-FY24` 与 `META-FY24` 两个额外案例的优化方案 R2/R3，共 6 次无重试调用；
- 每次成功、失败、上下文预检、原始响应、Token、延迟和引用校验的不可覆盖档案。

精简 R1 结果见 [experiments/R1_PFE_SUMMARY.md](experiments/R1_PFE_SUMMARY.md)，额外优化方案盲测见 [experiments/R2_R3_OPTIMIZED_SUMMARY.md](experiments/R2_R3_OPTIMIZED_SUMMARY.md)。原计划 24 次 P003 稳定性矩阵未运行，因此项目不声称已建立统计稳定性。产品演示仓库和部署仍属于下一阶段。

面向课堂展示与后续网页阅读的完整中文实验报告见 [report/financial_filing_extraction_report_zh.md](report/financial_filing_extraction_report_zh.md)。报告包含三种方案的调优轨迹、R1–R3 结果、JPM 双栏 PDF 失败案例和可复用的 PNG/SVG 图表；实验结论暂时留空，等待小组阅读证据后提炼。

## 仓库边界

当前仓库 `Financial filing extraction` 是研究主仓库，保存数据、Prompt 版本、实验运行记录、评分和方法文档。

当输出契约、引用验证和端到端原型稳定后，再创建独立的产品仓库：

`financial_filing_risk_analyzer`

产品仓库负责 PDF/公司代码输入、Item 1A 定位、模型调用、证据验证、风险卡片、原文跳转和部署。它只引用研究仓库中已经冻结的 Schema 和版本，不复制全部实验档案。

## 目录

```text
data/                    # 公开 10-K 原始材料和模型输入
experiments/              # P、F、R1、R2、R3 的运行档案和留痕模板
prompts/                  # 各模型 Prompt 版本与变更记录
evaluations/              # 人工金融分析、自动评分和专家参照
report/                   # 详细中文报告、绘图数据、图源和 PNG/SVG
schemas/                 # 研究线与产品线共享的输出契约
scripts/                 # 数据准备与验证脚本
EXPERIMENT_DESIGN.md     # 实验方案
EXPERIMENT_ARCHIVE.md    # 原始结果和过程留痕规范
PRODUCT_REPO_PLAN.md     # 产品仓库边界与演示方案
```

## 数据与实验运行

数据结构见 [data/README.md](data/README.md)。重新生成文本衍生物：

```bash
node scripts/prepare_10k_dataset.cjs
node scripts/verify_10k_dataset.cjs
```

模型运行必须创建新的 run ID，不能覆盖旧的原始输出。每个运行要同时保存实际输入、Prompt、脱敏请求、完整原始响应、错误输出、解析结果、评分和校验哈希，具体规范见 [EXPERIMENT_ARCHIVE.md](EXPERIMENT_ARCHIVE.md)。

## 开源与安全

仓库计划公开用于展示实验细节和复现过程，但不提交 API Key、密码、Cookie、Authorization 请求头、本地模型权重、私有链接或付费分析报告全文。云端凭证只能通过后端环境变量注入，前端和 Git 历史均不得出现凭证。

产品定位是“有证据的金融文件风险筛查辅助工具”，不是投资建议、证券评级或自动交易系统。
