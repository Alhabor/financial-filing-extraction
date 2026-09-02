# 实验运行档案

这里保存准备轮 `P`、冻结确认 `F` 和正式测试 `R1`/`R2` 的运行记录。目前尚未开始模型调用，因此 `runs/` 尚未创建，只有目录规范和运行模板。

每个运行目录对应一次“模型 × 案例 × 尝试”。推荐命名：

```text
<ROUND>-<CASE-ID>-<MODEL-ALIAS>-<UTC-TIMESTAMP>-a<ATTEMPT>
```

完整保存规则见 [EXPERIMENT_ARCHIVE.md](../EXPERIMENT_ARCHIVE.md)。运行索引 `INDEX.csv` 应记录案例是否属于开发集、验证集或正式测试集。
