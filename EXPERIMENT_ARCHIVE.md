# 实验原始记录与留痕规范

[English version](EXPERIMENT_ARCHIVE.en.md) | 中文

本文件定义如何保留准备轮、冻结轮和正式测试产生的全部实验痕迹。原则是：原始输入和原始输出不可覆盖，派生结果与人工判断必须另存，任何失败运行也要保留。

## 1. 运行档案位置

```text
prompts/
├── PV001.md
├── PV001-model-gemma.md
└── prompt_changelog.csv
experiments/
├── runs/                         # 首次模型运行时创建
│   ├── P/                         # 准备轮
│   ├── F/                         # 冻结前确认
│   ├── R1/                        # 第一正式轮
│   └── R2/                        # 后续独立轮次
├── templates/
│   ├── run-manifest.template.json
│   └── evaluation.template.json
└── INDEX.csv
harness/
├── config/                      # 模型别名、接口和输入条件；不保存凭证
└── README.md                    # dry-run、适配器和回退协议
```

单个实验单元是一个“模型 × 案例 × 一次尝试”。每次重跑都必须创建新的目录，不得覆盖同一案例的旧结果。

```text
experiments/runs/R1/R1-COIN-FY24-<model>-<timestamp>-a01/
├── manifest.json
├── input/
│   ├── model_input.txt
│   ├── prompt.txt
│   ├── modality.json
│   └── request.sanitized.json
├── raw/
│   ├── response.json
│   ├── response.txt
│   ├── stdout.txt
│   ├── stderr.txt
│   └── stream.ndjson
├── derived/
│   └── parsed.json
├── evaluation/
│   ├── automatic.json
│   ├── human_review.json
│   └── adjudication.json
└── checksums.sha256
```

没有流式输出的运行可以省略 `stream.ndjson`；本地模型没有 HTTP 响应时仍要保存原始 `stdout.txt` 和 `stderr.txt`。

## 2. 必须记录的元数据

`manifest.json` 至少记录：

- `run_id`、`phase`、`round`、`attempt` 和 `status`；
- `case_id`、输入文件路径和输入 SHA-256；
- 请求模态、实际模态、是否发生文本回退及回退原因；
- `model_alias`、实际 `model_id`、provider 和运行接口；
- `prompt_version`、输出 Schema 版本和评分规则版本；
- temperature、top-p、最大输出长度、seed 等参数；
- 开始时间、结束时间、总延迟和重试信息；
- 输入/输出 Token 或本地推理字数；
- 本地 CPU/GPU、内存/显存和运行环境摘要；
- Git commit、脚本版本和解析器版本；
- 是否允许使用 RAG、检索、工具调用或人工介入；
- 失败原因、人工修正和备注。

不得记录 Authorization 请求头、API Key、环境变量完整快照、Cookie、私钥或其他凭证。`request.sanitized.json` 只保留脱敏后的请求正文和非敏感调用参数。

## 3.1 Harness 与视觉回退

harness 只接受已固定的案例包，不在运行时偷偷改变输入。适配器负责将统一的内部请求转换为 provider 格式：云端视觉接口使用文本块和页面图像引用，本地 Ollama 接口使用 `messages`/`images`，文本 GGUF 接口使用纯文本消息。真实调用时，图片可以在内存中编码为请求需要的格式，但档案只保存图片路径、SHA-256 和脱敏请求，不保存带凭证的请求头。

视觉运行失败、模型不支持图像、图像解码失败或视觉输出未通过最小引用检查时，harness 保存原始失败痕迹，然后用相同案例文本创建新的 `text_fallback` attempt。两次 attempt 必须拥有不同的 `run_id`，并在索引中关联；回退结果不得覆盖视觉尝试。

## 3. 原始层和派生层

### 原始层 `raw/`

保存 provider 返回的完整 JSON、完整文本、流式分块、标准输出和标准错误。原始文件只读，不进行人工润色，不用修正后的文本替换它。

### 派生层 `derived/`

保存结构化解析结果、引用验证结果和统计数据。解析器升级时生成新版本，例如 `parsed.v2.json`，不能回写旧解析结果。

### 评价层 `evaluation/`

保存自动评分、成员独立评分、分歧说明和最终裁决。评分规则变化时建立新的 `rubric_version`，不覆盖旧分数。

## 4. 运行状态

运行可以处于 `planned`、`running`、`completed`、`failed`、`timeout` 或 `partial`。如果调用失败、格式错误、超时或人工中断，仍然保存已有输入、日志和错误信息，并以新的 attempt 继续，不删除失败记录。

只有同时满足以下条件，运行才标记为 `completed`：

- 原始输出已保存；
- 输出可以被解析或已明确记录解析失败；
- 原文引用验证已执行；
- manifest、哈希和运行指标齐全。

## 5. 准备轮与正式轮隔离

准备轮的案例、Prompt 版本和输出全部保留，但在 `INDEX.csv` 中标记为 `development` 或 `validation`。正式 R1 只能使用冻结前没有用于 Prompt 针对性修改的案例。

如果正式轮之后修改 Prompt，必须创建新的 Prompt 版本和 R2，不得修改 R1 的输入、原始输出或评分。

## 6. GitHub 发布边界

本地完整档案是研究记录的 canonical archive。公开仓库发布前，另行生成脱敏公共档案，并检查：

- 没有凭证、请求头和本地路径泄漏；
- 没有未授权的付费报告全文；
- 原始输入、输出和评分之间仍可通过 run ID 关联；
- 大型本地模型权重没有被复制进仓库；
- 公共结果中保留必要的来源和复现说明。
