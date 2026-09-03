# 实验运行档案

[English version](README.en.md) | 中文

这里保存准备轮 `P`、冻结确认 `F` 和正式测试 `R1`/`R2`/`R3` 的运行记录。准备轮的固定矩阵与退出条件见 [P_PROTOCOL.md](P_PROTOCOL.md)。

每个运行目录对应一次“模型 × 案例 × 尝试”。推荐命名：

```text
<ROUND>-<CASE-ID>-<MODEL-ALIAS>-<UTC-TIMESTAMP>-a<ATTEMPT>
```

完整保存规则见 [EXPERIMENT_ARCHIVE.md](../EXPERIMENT_ARCHIVE.md)。运行索引 `INDEX.csv` 应记录案例是否属于开发集、验证集或正式测试集。

## Harness 使用边界

实验调用统一经过根目录的轻量 harness。第一阶段只使用 dry-run 物料化，不调用任何模型：

```bash
node scripts/materialize_experiment_run.cjs \
  --case-id NVDA-FY25 \
  --model-alias cloud-deepseek \
  --profile standard-text-v001 \
  --phase P \
  --round P001
```

它会生成固定的 `model_input.txt`、`prompt.txt`、`modality.json`、脱敏 `request.sanitized.json`、`manifest.json` 和哈希清单。未来真实调用必须显式启用 live mode；视觉失败时先保存失败 attempt，再创建独立的 `text_fallback` attempt，不能覆盖原记录。
