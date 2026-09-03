# 评分与金融分析

[English version](README.en.md) | 中文

这里保存风险证据核验、人工金融分析、专家参照和自动统计结果。评分文件必须通过 `run_id`、`case_id`、`model_id` 和 `rubric_version` 与原始运行关联。

评价分为三层：

1. 原文层：`risk_validity`、`materiality`、`evidence_exactness`、`evidence_support`、`risk_type` 和 `risk_type_correctness`；
2. 金融分析层：`financial_reasoning`、优先级和 `uncertainty_discipline`；
3. 参照层：`expert_overlap`、`unsupported_inference` 和 `temporal_leakage`；
4. 工作流层：可读性、可操作性、延迟、费用、算力和人工修正成本。

专业分析师资料是辅助参照，不是唯一金标准。成员独立评分、分歧和裁决均应保留。
