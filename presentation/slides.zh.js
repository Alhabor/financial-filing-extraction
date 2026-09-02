window.FINANCIAL_FILING_SLIDES = [
  {
    layout: "hero", kicker: "SHBI-GB 7343 · AI in Finance · Group 7",
    title: "Financial filing<br>extraction",
    body: `<p class="hero-subtitle">用 AI 从公司年报中找出三个重大风险，并让每条结论都能回到原文</p><div class="hero-thesis"><span>这套展示回答什么</span><strong>哪种工作流能在完整性、速度与可追溯性之间取得最好平衡？核心思路是：判断交给模型，逐字引文与页码交给程序。</strong></div><p class="byline">Heyang Li · Haoyu Zheng · Haisen Zhang</p>`,
    sources: [["中文报告", "report/financial_filing_extraction_report_zh.md"]], notes: "开场只说明任务和比较对象，不展开模型背景。"
  },
  {
    layout: "task", kicker: "01 · 成功标准", title: "任务：从 10-K 的风险章节中交付三个可核验风险",
    body: `<div class="task-grid"><div class="filing-sheet"><span>10-K · 美国上市公司年度报告</span><p><strong>Item 1A / Risk Factors：</strong>集中披露可能影响公司经营或财务表现的重大风险。</p><mark>输入：一段该章节原文</mark></div><ol class="number-list"><li><span><strong>选出</strong>恰好三个重大风险（可能明显影响经营、现金流或损失）</span></li><li><span><strong>概括</strong>风险及其金融影响</span></li><li><span><strong>归入</strong>一个主类型，如监管、市场或运营</span></li><li><span><strong>逐字引用</strong>支持判断的原句</span></li><li><span><strong>定位</strong>段落与 PDF 物理页（阅读器显示的第几页）</span></li></ol></div><p class="bottom-claim"><strong>成功 = 判断合理 + 引文逐字一致 + 位置可回查。</strong>答案只是“听起来合理”还不够。</p>`,
    sources: [["任务定义", "report/financial_filing_extraction_report_zh.md#1-先把任务说清楚"]], notes: "重大风险不是找 material 单词，而是识别有明确经营或财务影响的风险。"
  },
  {
    layout: "manual-time", kicker: "02 · 假定的人工基线", title: "没有 AI：完成一个短案例约 30 分钟",
    body: `<div class="manual-flow"><article><span>01</span><strong>定位 Item 1A</strong><em>3 min</em><p>打开文件并确认页码</p></article><b>→</b><article><span>02</span><strong>阅读与标记</strong><em>10 min</em><p>找出可能重大风险</p></article><b>→</b><article><span>03</span><strong>选择与分类</strong><em>6 min</em><p>确定前三项及主类型</p></article><b>→</b><article><span>04</span><strong>复制证据</strong><em>6 min</em><p>抄录原文与页码</p></article><b>→</b><article><span>05</span><strong>复核与格式化</strong><em>5 min</em><p>检查引用并整理输出</p></article></div><div class="manual-summary"><span style="--share:53%"><strong>53%</strong> 阅读 + 证据复制</span><span style="--share:20%"><strong>20%</strong> 选择与分类</span><span style="--share:27%"><strong>27%</strong> 定位 + 复核</span></div><div class="assumption-box"><strong>30 分钟是情景假设，不是实验实测。</strong><p>范围是一份已经准备好的短 10-K 风险案例；文档长度、行业熟悉度和分析深度都会改变实际时间。</p></div>`,
    sources: [["任务步骤依据", "report/financial_filing_extraction_report_zh.md#14-模型必须交付什么"]], notes: "明确说明这是一组用于课堂比较的透明假设。"
  },
  {
    layout: "architecture", kicker: "03 · 三种候选方案", title: "相同任务，差别在谁负责判断、谁负责精确复制",
    body: `<div class="figure-wrap"><img src="assets/final_solution_architectures.svg" alt="三种最终工作流"></div><div class="workflow-labels"><span><strong>DeepSeek</strong> 云端通用模型，直接写完整答案</span><span><strong>Gemma</strong> 本地通用模型，直接写完整答案</span><span><strong>Finance pipeline</strong> 金融模型做判断，程序复制原文与页码</span></div><p class="reader-note architecture-note"><strong>工作流 = 模型 + 前后处理程序的完整组合。</strong>这里比较的是三种解决方案，不是同一指令下谁“更聪明”。</p>`,
    sources: [["工作流配置", "harness/config/profiles.json"], ["架构说明", "report/financial_filing_extraction_report_zh.md#3-三条工作流的模型基础与职责设计"]], notes: "比较完整方案，不做同 Prompt 的裸模型排行榜。"
  },
  {
    layout: "simple-compare", kicker: "04 · 核心设计差别", title: "前两种靠模型指令约束，第三种把任务拆给模型和程序",
    body: `<div class="simple-columns"><article><span>DeepSeek</span><h3>用 Prompt（模型指令）约束输出</h3><p>要求模型返回 JSON——一种有固定字段、便于程序读取的答案格式。</p><strong>剩余问题：模型仍可能改写引文</strong></article><article><span>Gemma</span><h3>在 Prompt 中再加逐字自检</h3><p>要求模型核对每个词和标点，再填写段落与页码。</p><strong>剩余问题：运行较慢，定位仍会失败</strong></article><article><span>Finance pipeline</span><h3>模型只选 Evidence ID（证据编号）</h3><p>程序先给每段原文编号；模型选三个编号，程序再恢复原句与页码。</p><strong>设计变化：判断交给模型，精确复制交给程序</strong></article></div>`,
    sources: [["DeepSeek PV016", "prompts/PV016.md"], ["Gemma PV015", "prompts/PV015.md"], ["Finance PV013", "prompts/PV013.md"]], notes: "只讲三种方案如何不同，不再展开所有调优版本。"
  },
  {
    layout: "result", kicker: "05 · 稳定性结果 · 冻结 = 测试前不再改指令或规则", title: "冻结方案测试：Finance pipeline 3 / 3 完整通过",
    body: `<div class="figure-wrap result-figure"><img src="assets/02_blind_outcome_matrix.svg" alt="三个案例与三种方案的结果"></div><div class="score-summary"><span>DeepSeek <strong>1 / 3</strong></span><span>Gemma <strong>2 / 3</strong></span><span>Finance pipeline <strong>3 / 3</strong></span></div><p class="reader-note"><strong>完整通过 = 固定格式、逐字引文、段落/页码三项同时合格。</strong>1/3 是三个公司中一个全部合格，不是“只答对一个风险”或 33% 金融准确率。</p>`,
    sources: [["复核结果", "report/data/reviewed_results.csv"], ["实验索引", "experiments/INDEX.csv"]], notes: "结果指结构、逐字证据和定位同时通过。"
  },
  {
    layout: "metric", kicker: "06 · 速度结果", title: "机器运行时间：DeepSeek 最快，Finance 居中",
    body: `<div class="metric-layout"><div class="figure-wrap"><img src="assets/03_optimized_latency.svg" alt="三种方案实测运行时间"></div><div class="metric-copy"><p><span>DeepSeek</span><strong>平均 6.7 秒</strong>范围 6.3–7.2 秒</p><p><span>Finance</span><strong>平均 126.3 秒</strong>范围 68.7–161.6 秒</p><p><span>Gemma</span><strong>平均 209.1 秒</strong>范围 156.5–239.5 秒</p></div></div><p class="bottom-claim"><strong>纵轴是对数刻度：相同高度差代表倍数变化，不代表相同秒数差；请以右侧秒数为准。</strong>运行环境不同，所以这里只比较本实验从输入到校验完成的总耗时。</p>`,
    sources: [["实测数据", "report/data/reviewed_results.csv"]], notes: "云端 DeepSeek 最快，但速度与完整通过率要分开看。"
  },
  {
    layout: "assisted-time", kicker: "07 · 把上一页机器时间放入同一人工流程", title: "按同一人工复核假设，约从 30 分钟降到 7–11 分钟",
    body: `<div class="time-bars"><div><span>纯人工</span><i style="--time:100%"></i><strong>30.0 min</strong></div><div><span>DeepSeek 辅助</span><i style="--time:24%"></i><strong>7.1 min</strong></div><div><span>Finance 辅助</span><i style="--time:30%"></i><strong>9.1 min</strong></div><div><span>Gemma 辅助</span><i style="--time:35%"></i><strong>10.5 min</strong></div></div><div class="savings-row"><span>DeepSeek <strong>−76%</strong></span><span>Finance <strong>−70%</strong></span><span>Gemma <strong>−65%</strong></span></div><div class="time-formula"><span>统一计算式</span><strong>总时间 = 2 分钟准备 + 上一页机器实测 + 5 分钟人工复核（如 DeepSeek ≈ 7.1 分钟）</strong></div><p class="reader-note"><strong>纠错时间未计入。</strong>如果输出未完整通过，DeepSeek 与 Gemma 还需要额外人工修正，因此本页不是生产效率实测。</p>`,
    sources: [["机器时间", "report/data/reviewed_results.csv"], ["计算口径", "presentation/README.md"]], notes: "只有模型运行时间来自实验；其余时间均为明确假设。"
  },
  {
    layout: "pipeline", kicker: "08 · 为什么 Finance 更稳定", title: "判断交给模型，逐字复制与页码交给程序",
    body: `<div class="pipeline-lanes"><div class="lane deterministic"><span>程序</span><strong>① 给每段原文一个 Evidence ID</strong><p>证据编号绑定原句 · 段落 · PDF 页</p></div><b>→</b><div class="lane model"><span>金融模型</span><strong>② 从编号中选择 3 项</strong><p>写摘要与分类，不抄原文</p></div><b>→</b><div class="lane deterministic"><span>程序</span><strong>③ 按编号回填原文</strong><p>逐字引文 · 页码 · 格式校验</p></div></div><div class="ownership-grid"><p><span>模型负责</span><strong>风险判断与分类</strong></p><p><span>程序负责</span><strong>原文、页码与格式</strong></p><p><span>人工负责</span><strong>最终金融合理性复核</strong></p></div><div class="responsibility-row"><span>没有重新训练模型</span><strong>它更稳定，是因为程序接管了最容易出错的精确复制工作，而不是模型变得更聪明</strong></div>`,
    sources: [["Evidence Catalog", "scripts/lib/evidence_catalog.cjs"], ["Locator", "scripts/apply_evidence_locator.cjs"]], notes: "Evidence ID 是不可变引用。模型做金融判断，程序做精确复制。"
  },
  {
    layout: "jpm", kicker: "09 · 自动评价的边界", title: "自动通过，只能证明“匹配抽取文本”，不能证明页面解析正确",
    body: `<div class="figure-wrap jpm-figure"><img src="assets/jpm_two_column_failure.svg" alt="JPMorgan 双栏 PDF 导致抽取文本交错"></div><div class="jpm-verdicts"><p><span>DeepSeek</span><strong>0 / 3 字符串匹配</strong>页面上仍能找到相关内容</p><p><span>Gemma</span><strong>1 / 3 字符串匹配</strong>另有一处页码错误</p><p><span>Finance</span><strong>3 / 3 字符串匹配</strong>却可能复制左右栏交错文本</p></div><p class="reader-note jpm-note"><strong>因此仍需人工查看 PDF 页面。</strong>自动校验只比较字符串，不理解双栏版面和金融语义。</p>`,
    sources: [["R2/R3 摘要", "experiments/R2_R3_OPTIMIZED_SUMMARY.md"], ["JPM 页面", "data/processed/case_packets/JPM-FY24/pages/page-016.png"]], notes: "只说明为什么仍要人工复核。"
  },
  {
    layout: "close", kicker: "10 · 选择结论", title: "在“可追溯优先”的目标下，最实用的是<br>Finance pipeline",
    body: `<div class="closing-evidence"><article><span>稳定性</span><strong>3 / 3 公司完整通过</strong><p>格式、逐字引文与位置均可回查</p></article><article><span>时间代价</span><strong>平均机器时间 2.1 分钟</strong><p>慢于 DeepSeek，快于 Gemma</p></article><article><span>为什么选择它</span><strong>减少模型容易犯的错误</strong><p>模型判断；程序负责精确字段</p></article></div><blockquote><strong>选择顺序：先保证完整与可追溯，再比较速度。</strong>DeepSeek 更快但仅 1/3 完整通过；Finance 较慢却 3/3 完整通过。因此本任务选择 Finance，不代表小模型本身更聪明。</blockquote><p class="thanks">谢谢 · Questions welcome</p>`,
    sources: [["中文完整报告", "report/financial_filing_extraction_report_zh.md"], ["项目仓库", "https://github.com/Alhabor/financial-filing-extraction"]], notes: "结束时只重复方案选择、时间权衡和原因。"
  }
];
