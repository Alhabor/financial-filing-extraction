window.FINANCIAL_FILING_SLIDES = [
  {
    layout: "hero", kicker: "SHBI-GB 7343 · AI in Finance · Group 7",
    title: "Financial filing<br>extraction",
    body: `<p class="hero-subtitle">三种 AI 工作流如何完成 10-K 重大风险识别、分类与证据定位</p><div class="hero-thesis"><span>一句结论</span><strong>金融小模型方案的领先主要来自工作流拆分，而不是本实验能够证明的裸模型能力差距。</strong></div><p class="byline">Heyang Li · Haoyu Zheng · Haisen Zhang</p>`,
    sources: [["中文报告", "report/financial_filing_extraction_report_zh.md"]], notes: "开场只说明任务和比较对象，不展开模型背景。"
  },
  {
    layout: "task", kicker: "课程任务", title: "从一段 10-K 原文中，交付三个可核验风险",
    body: `<div class="task-grid"><div class="filing-sheet"><span>FORM 10-K · ITEM 1A</span><p>输入：一段 Risk Factors 原文</p><mark>“identify three material risks”</mark></div><ol class="number-list"><li><span><strong>选出</strong>恰好三个重大风险</span></li><li><span><strong>概括</strong>风险及其金融影响</span></li><li><span><strong>归入</strong>一个主风险类型</span></li><li><span><strong>逐字引用</strong>支持原文</span></li><li><span><strong>定位</strong>段落与 PDF 物理页</span></li></ol></div><p class="bottom-claim">答案“看起来合理”不够；每项判断都必须能回到原文核对。</p>`,
    sources: [["任务定义", "report/financial_filing_extraction_report_zh.md#1-先把任务说清楚"]], notes: "重大风险不是找 material 单词，而是识别有明确经营或财务影响的风险。"
  },
  {
    layout: "manual-time", kicker: "假定的原始人工流程", title: "没有 AI：完成一个短案例约 30 分钟",
    body: `<div class="manual-flow"><article><span>01</span><strong>定位 Item 1A</strong><em>3 min</em><p>打开文件并确认页码</p></article><b>→</b><article><span>02</span><strong>阅读与标记</strong><em>10 min</em><p>找出可能重大风险</p></article><b>→</b><article><span>03</span><strong>选择与分类</strong><em>6 min</em><p>确定前三项及主类型</p></article><b>→</b><article><span>04</span><strong>复制证据</strong><em>6 min</em><p>抄录原文与页码</p></article><b>→</b><article><span>05</span><strong>复核与格式化</strong><em>5 min</em><p>检查引用并整理输出</p></article></div><div class="manual-summary"><span style="--share:53%"><strong>53%</strong> 阅读 + 证据复制</span><span style="--share:20%"><strong>20%</strong> 选择与分类</span><span style="--share:27%"><strong>27%</strong> 定位 + 复核</span></div><div class="assumption-box"><strong>30 分钟是情景假设，不是实验实测。</strong><p>范围是一份已经准备好的短 10-K 风险案例；文档长度、行业熟悉度和分析深度都会改变实际时间。</p></div>`,
    sources: [["任务步骤依据", "report/financial_filing_extraction_report_zh.md#14-模型必须交付什么"]], notes: "明确说明这是一组用于课堂比较的透明假设。"
  },
  {
    layout: "architecture", kicker: "三种 AI 方案", title: "相同任务，三种模型与职责分配",
    body: `<div class="figure-wrap"><img src="assets/final_solution_architectures.svg" alt="三种最终工作流"></div><div class="workflow-labels"><span><strong>DeepSeek</strong> 云端通用模型，直接生成完整结果</span><span><strong>Gemma</strong> 本地通用模型，直接生成完整结果</span><span><strong>Finance pipeline</strong> 本地金融小模型，只选择证据与分类</span></div>`,
    sources: [["工作流配置", "harness/config/profiles.json"], ["架构说明", "report/financial_filing_extraction_report_zh.md#3-三条工作流的模型基础与职责设计"]], notes: "比较完整方案，不做同 Prompt 的裸模型排行榜。"
  },
  {
    layout: "simple-compare", kicker: "方案差别", title: "前两种靠 Prompt 约束，第三种靠管线拆分",
    body: `<div class="simple-columns"><article><span>DeepSeek</span><h3>Prompt 修复 JSON</h3><p>关闭 reasoning、写明字段类型、收缩输出范围。</p><strong>剩余问题：仍可能改写引文</strong></article><article><span>Gemma</span><h3>Prompt 增加复制检查</h3><p>逐词与标点核对，再填写段落和页码。</p><strong>剩余问题：慢，定位仍会失败</strong></article><article><span>Finance pipeline</span><h3>模型只选 Evidence ID</h3><p>程序筛选证据，并按 ID 恢复引文和页码。</p><strong>变化：精确字段不再自由生成</strong></article></div>`,
    sources: [["DeepSeek PV016", "prompts/PV016.md"], ["Gemma PV015", "prompts/PV015.md"], ["Finance PV013", "prompts/PV013.md"]], notes: "只讲三种方案如何不同，不再展开所有调优版本。"
  },
  {
    layout: "result", kicker: "冻结后 · Pfizer / JPMorgan / Meta · 单次无重试", title: "三种方案的完整通过结果",
    body: `<div class="figure-wrap result-figure"><img src="assets/02_blind_outcome_matrix.svg" alt="三个案例与三种方案的结果"></div><div class="score-summary"><span>DeepSeek <strong>1 / 3</strong></span><span>Gemma <strong>2 / 3</strong></span><span>Finance pipeline <strong>3 / 3</strong></span></div><p class="reader-note"><strong>1/3 表示 3 个公司中有 1 个完整通过，</strong>不是只答对 1 个风险；它也不等于金融准确率 33%。</p>`,
    sources: [["复核结果", "report/data/reviewed_results.csv"], ["实验索引", "experiments/INDEX.csv"]], notes: "结果指结构、逐字证据和定位同时通过。"
  },
  {
    layout: "metric", kicker: "机器实测时间", title: "模型运行：DeepSeek 最快，Finance 居中",
    body: `<div class="metric-layout"><div class="figure-wrap"><img src="assets/03_optimized_latency.svg" alt="三种方案实测运行时间"></div><div class="metric-copy"><p><span>DeepSeek</span><strong>平均 6.7 秒</strong>范围 6.3–7.2 秒</p><p><span>Finance</span><strong>平均 126.3 秒</strong>范围 68.7–161.6 秒</p><p><span>Gemma</span><strong>平均 209.1 秒</strong>范围 156.5–239.5 秒</p></div></div><p class="bottom-claim">这是一次完整工作流的端到端实测时间；三种方案使用不同运行环境。</p>`,
    sources: [["实测数据", "report/data/reviewed_results.csv"]], notes: "云端 DeepSeek 最快，但速度与完整通过率要分开看。"
  },
  {
    layout: "assisted-time", kicker: "AI 辅助后的情景时间", title: "按同一人工复核假设，约从 30 分钟降到 7–11 分钟",
    body: `<div class="time-bars"><div><span>纯人工</span><i style="--time:100%"></i><strong>30.0 min</strong></div><div><span>DeepSeek 辅助</span><i style="--time:24%"></i><strong>7.1 min</strong></div><div><span>Finance 辅助</span><i style="--time:30%"></i><strong>9.1 min</strong></div><div><span>Gemma 辅助</span><i style="--time:35%"></i><strong>10.5 min</strong></div></div><div class="savings-row"><span>DeepSeek <strong>−76%</strong></span><span>Finance <strong>−70%</strong></span><span>Gemma <strong>−65%</strong></span></div><div class="time-formula"><span>共同假设</span><strong>2 分钟准备 + 实测机器运行 + 5 分钟人工复核</strong></div><p class="reader-note"><strong>纠错时间未计入。</strong>如果输出未完整通过，DeepSeek 与 Gemma 还需要额外人工修正，因此本页不是生产效率实测。</p>`,
    sources: [["机器时间", "report/data/reviewed_results.csv"], ["计算口径", "presentation/README.md"]], notes: "只有模型运行时间来自实验；其余时间均为明确假设。"
  },
  {
    layout: "pipeline", kicker: "为什么 Finance 更稳定", title: "模型做判断，程序保证逐字忠实",
    body: `<div class="pipeline-lanes"><div class="lane deterministic"><span>程序</span><strong>① 筛选候选证据</strong><p>完整句 · 段落 · PDF 页</p></div><b>→</b><div class="lane model"><span>金融模型</span><strong>② 选择 3 个 Evidence ID</strong><p>摘要 · 分类 · 不生成引文</p></div><b>→</b><div class="lane deterministic"><span>程序</span><strong>③ 按 ID 原样回填</strong><p>逐字引用 · 页码 · 校验</p></div></div><div class="ownership-grid"><p><span>模型负责</span><strong>风险判断与分类</strong></p><p><span>程序负责</span><strong>原文、页码与格式</strong></p><p><span>人工负责</span><strong>最终金融合理性复核</strong></p></div><div class="responsibility-row"><span>模型权重没有改变</span><strong>减少输入和职责后，引用与定位错误被管线直接消除</strong></div>`,
    sources: [["Evidence Catalog", "scripts/lib/evidence_catalog.cjs"], ["Locator", "scripts/apply_evidence_locator.cjs"]], notes: "Evidence ID 是不可变引用。模型做金融判断，程序做精确复制。"
  },
  {
    layout: "jpm", kicker: "必须保留的一个提醒", title: "自动通过不代表原始文档一定被正确解析",
    body: `<div class="figure-wrap jpm-figure"><img src="assets/jpm_two_column_failure.svg" alt="JPMorgan 双栏 PDF 导致抽取文本交错"></div><div class="jpm-verdicts"><p><span>DeepSeek</span><strong>0 / 3 引文匹配</strong>页面上仍能找到相关内容</p><p><span>Gemma</span><strong>1 / 3 引文匹配</strong>另有一处页码错误</p><p><span>Finance</span><strong>3 / 3 自动匹配</strong>却复制了交错文本</p></div>`,
    sources: [["R2/R3 摘要", "experiments/R2_R3_OPTIMIZED_SUMMARY.md"], ["JPM 页面", "data/processed/case_packets/JPM-FY24/pages/page-016.png"]], notes: "只说明为什么仍要人工复核。"
  },
  {
    layout: "close", kicker: "结论", title: "对这个任务，最实用的是<br>Finance pipeline",
    body: `<div class="closing-evidence"><article><span>稳定性</span><strong>3 / 3 公司完整通过</strong><p>结构、引文与定位均可回查</p></article><article><span>时间</span><strong>平均机器时间 2.1 分钟</strong><p>慢于 DeepSeek，快于 Gemma</p></article><article><span>原因</span><strong>工作流缩小失败空间</strong><p>模型不再负责逐字复制与页码</p></article></div><blockquote>这里的结论不是“小模型打败大模型”，而是：在一个聚焦任务里，职责拆分比继续堆 Prompt 更有效。</blockquote><p class="thanks">谢谢 · Questions welcome</p>`,
    sources: [["中文完整报告", "report/financial_filing_extraction_report_zh.md"], ["项目仓库", "https://github.com/Alhabor/financial-filing-extraction"]], notes: "结束时只重复方案选择、时间权衡和原因。"
  }
];
