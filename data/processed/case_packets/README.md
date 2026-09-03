# Frozen case packets

[English version](README.en.md) | 中文

这里保存准备轮使用的短案例包。每个案例包由同一组 PDF 页面生成：

- `packet.txt`：带 `[PDF_PAGE n | PRINTED_PAGE m]` 和 `[PARAGRAPH CASE-Pnnn]` 定位标记的文本视图；
- `pages/page-nnn.png`：同页范围渲染的页面图像视图；
- `locator_index.json`：段落 ID、PDF 物理页码、印刷页码、页内行号和段落哈希；
- `packet.json`：来源哈希、页码、图像哈希和内部复核候选项。

`risk_candidates_for_internal_review` 只用于准备阶段的内部原文核查，不写入 `packet.txt`，也不由 harness 发送给模型。正式 R1 不得使用这些开发包作为盲测材料。

重新生成或修改页面范围时，不能覆盖既有目录；应提高 packet 版本并生成新的目录，保留旧版本以便回滚。
