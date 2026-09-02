# Report assets

主报告：[`financial_filing_extraction_report_zh.md`](financial_filing_extraction_report_zh.md)

## 图表再生成

数值图的来源是 `data/*.csv`，生成脚本是 `visuals/src/generate_report_charts.py`。在项目根目录运行：

```bash
uv run --with matplotlib --with pillow \
  python report/visuals/src/generate_report_charts.py
```

Mermaid 图源保存在 `visuals/src/*.mmd`；每张图同时提交 PNG 与 SVG。后续制作网页时优先使用 SVG，制作 Markdown/PPT 预览时可直接使用 PNG。

`reviewed_results.csv` 的 `automatic_status` 是自动结构与引用门槛，不是金融语义正确率。报告中的语义判断应同时回查对应 run 的原始输出、自动评价和页面图像。

提交前可用以下命令核对报告 CSV 与不可变实验索引中的延迟、Token 和资产完整性：

```bash
python3 report/visuals/src/verify_report_data.py
```
