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

模型调用尚未开始。后续每次运行都必须记录实际模型 ID、运行参数、调用时间、Token、延迟、错误和资源消耗。

## 当前状态

已完成：

- 实验设计基线重构为场景化研究方案；
- 8 份公开 10-K 材料的 PDF、完整文本和 Item 1A 模型输入整理；
- 数据来源、页码、文件哈希和抽取脚本；
- 实验原始结果留痕规范和结构化输出契约；
- 本地 Git 阶段性提交。

尚未开始：

- 模型 API 或本地模型运行；
- Prompt 准备轮；
- 正式 R1/R2 测试；
- 产品演示仓库和部署。

## 仓库边界

当前仓库 `Financial filing extraction` 是研究主仓库，保存数据、Prompt 版本、实验运行记录、评分和方法文档。

当输出契约、引用验证和端到端原型稳定后，再创建独立的产品仓库：

`financial_filing_risk_analyzer`

产品仓库负责 PDF/公司代码输入、Item 1A 定位、模型调用、证据验证、风险卡片、原文跳转和部署。它只引用研究仓库中已经冻结的 Schema 和版本，不复制全部实验档案。

## 目录

```text
data/                    # 公开 10-K 原始材料和模型输入
experiments/              # P、F、R1、R2 的运行档案和留痕模板
prompts/                  # 各模型 Prompt 版本与变更记录
evaluations/              # 人工金融分析、自动评分和专家参照
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
