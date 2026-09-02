# 数据目录说明

本目录保存 Group 7 mini-exercise 的公开 10-K 材料及其可重复生成的文本衍生物。

## 目录结构

```text
data/
├── raw/sec/<CASE-ID>/
│   ├── filing.pdf       # 官方/发行人公开 PDF；原始材料
│   ├── filing.txt       # 用 pdftotext -layout 机械抽取的完整文本
│   └── source.json      # 公司、期间、SEC accession、来源 URL、哈希和页码
├── processed/item_1a/
│   └── <CASE-ID>.txt    # 带来源头信息和 PDF 页码的 Item 1A 文本
├── processed/model_inputs/
│   └── <CASE-ID>.txt    # 仅保留 Item 1A 原文和 [PAGE n] 标记，供模型输入
└── manifests/filings.csv
```

`processed/` 文件是由 `scripts/prepare_10k_dataset.cjs` 从 `raw/` 文件机械生成的；模型输入中没有人工风险标签、分析结论或所谓标准答案。这样可以把“原始材料”“模型输入”和后续评分参考分开。实验运行档案位于仓库根目录的 `experiments/`，不与原始数据混合。

## 重新生成

在项目根目录运行：

```bash
node scripts/prepare_10k_dataset.cjs
node scripts/verify_10k_dataset.cjs
```

脚本不联网，只读取已经下载到 `data/raw/sec/` 的 PDF，并使用系统的 `pdfinfo` 与 `pdftotext`。每个来源 URL 同时保存在 `source.json` 和 `filings.csv` 中；`pdfSha256` 用于确认文件未被意外替换。

## 来源范围

当前清单包含 8 份 2024 财年附近的公开 Form 10-K 材料：NVDA、COIN、PYPL、BA、JPM、TSLA、PFE、META。部分发行人 PDF 是 annual report/ARS 格式，但其中包含同一年度 Form 10-K；`sourceType` 已在清单中明确标注。SEC HTML 链接保留在元数据中，便于回到权威原文核验。
