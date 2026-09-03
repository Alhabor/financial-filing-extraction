# Financial filing extraction — HTML presentation

[English version](README.en.md) | 中文

中英文课堂演示入口：`presentation/index.html`

本演示是 11 页固定 16:9 静态 HTML deck，支持：

- 鼠标点击、方向键、Page Up / Page Down 与空格翻页；
- 页面右上角切换中文/英文与明暗主题；
- `F` 全屏、`T` 切换明暗主题、`L` 切换语言、`N` 显示演讲者备注；
- URL hash 直接定位幻灯片，例如 `#/6`；
- 每页链接到对应实验原始文件；
- 16:9 打印分页。

中英文正文分别保留在 `slides.zh.js` 与 `slides.en.js`；英文图表以 `.en.svg` 保存，中文原件不变。语言、主题和当前页彼此独立，切换语言时停留在同一页。当前目录是纯静态文件，可在本地 HTTP 服务器或未来的网站子路径中运行；本阶段不执行线上部署。

## 时间比较口径

- 纯人工 30 分钟是针对“已准备好的短案例”的课堂情景假设：定位 3 分钟、阅读 10 分钟、选择与分类 6 分钟、复制证据 6 分钟、复核与格式化 5 分钟。
- AI 辅助总时间采用统一情景：准备 2 分钟 + 三次冻结实验的平均机器时间 + 人工复核 5 分钟。
- 机器时间来自 `report/data/reviewed_results.csv`；人工准备、复核和纯人工基准均不是实验实测。
- 未完整通过后的额外纠错时间没有计入，因此总时间只用于展示工作流量级，不作为生产效率结论。

校验：

```bash
node presentation/validate.mjs
```
