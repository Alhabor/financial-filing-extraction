# Financial filing extraction: Why the small-model solution is more usable for 10-K risk extraction

[中文报告](financial_filing_extraction_report_zh.md) | English

**Course:** SHBI-GB 7343 — AI in Finance<br>
**Group:** Group 7<br>
**Project:** Mini-exercise: financial filing extraction<br>
**Report focus:** Comparing a prompt-only solution with general models and a task-decomposed solution with a finance-specialized small model<br>
**Experiment date:** 2026-09-02

---

## Abstract

The course task looks simple: give a model a 10-K Risk Factors passage and ask it to identify three material risks, quote the supporting text, and classify them. The real difficulty is not merely whether the model understands financial risks. It must screen risks, classify them, copy evidence verbatim, produce structured output, and locate the source page at the same time. A model may identify a reasonable risk but rewrite the source; it may also copy text verbatim but copy a sentence already scrambled by a two-column PDF.

The direct result of this experiment is that **the finance-specialized small-model solution was more usable than the two general-model solutions in this specific workflow**. Each frozen solution ran once on three new cases: the Finance pipeline automatically passed all three companies, Gemma passed two, and DeepSeek passed one. Even with detailed prompt constraints, the general models still produced near-paraphrases, page confusion, or citations that could not be traced back reliably.

This does not mean that an 8B finance model’s financial-analysis ability overwhelms that of larger general models. Human review found that the risks selected by all three models were mostly financially relevant. The Finance pipeline itself had classification disputes and once faithfully copied garbled evidence caused by the two-column layout. The main source of the automatic pass-rate gap was **how model responsibilities were divided**: DeepSeek and Gemma were asked to read long text and complete the entire chain independently; the finance model only judged which three items were most important among screened candidate evidence and selected Evidence IDs, while deterministic code restored the verbatim quote, paragraph, and page.

The core argument of this report is therefore: **for a focused financial-extraction task, a domain small model’s advantage may come less from stronger general capability than from a better-matched training task and a workflow with narrower, more verifiable responsibilities. The observed pass-rate gap is primarily a workflow gap, not a model-capability gap that this experiment can prove.**

PayPal and Coinbase were used during preparation to find the best prompt, output constraints, and processing mechanism for each model; they were not used for ranking. Only after the solutions were frozen were they compared without retries on three new cases. Inputs, prompts, raw responses, parsed results, automatic evaluations, tokens, latency, and hashes were retained so that every claim can be checked against the original records.

---

## 1. Clarifying the task

### 1.1 What are 10-K Risk Factors?

Form 10-K is the annual report that a U.S. public company files with the SEC. Item 1A, “Risk Factors,” is the section where the company formally discloses risks that could materially adversely affect its business, operating results, financial condition, or future performance.

A “risk” here is not a generic negative topic. It usually contains three elements:

1. **Risk driver:** what event or condition may occur;
2. **Impact mechanism:** how it may affect revenue, costs, profit, cash flow, capital, business continuity, or reputation;
3. **Uncertainty:** the company often cannot predict the probability, timing, or loss magnitude precisely.

### 1.2 What counts as a material risk?

This project does not interpret the English word `material` mechanically as a keyword. A material risk is one that, according to the company’s disclosure, could have a substantial effect on the business or financial results and deserves priority in a first-pass investor risk screen.

For example, a pharmaceutical company may state that government drug-pricing rules could reduce revenue from some products; generic or competing products could erode volume and prices; and an interruption by a third-party development partner could delay a program. These are not merely the labels “competition” and “regulation”; each has a concrete financial or operating consequence.

### 1.3 How are risk types classified?

To make model outputs comparable, we froze six primary categories:

| Primary type | Decision focus | Typical example |
|---|---|---|
| Strategic / Market / Technology | Demand, competition, pricing, product adoption, technology substitution, strategic relationships | Generic competition, lower advertising demand |
| Operational / Supply Chain | Service interruption, suppliers, production, logistics, system operations | Third-party service failure, shortage of a key input |
| Regulatory / Legal / Geopolitical | Regulation, enforcement, litigation, sanctions, political conflict | Drug-pricing rules, regulatory penalties |
| Financial / Liquidity / Credit | Rates, credit, financing, liquidity, capital loss | Credit deterioration, higher funding costs |
| Cybersecurity / Data / Privacy | Cyberattack, data breach, privacy compliance | User-data breach, platform security incident |
| Other | Cannot reasonably be covered by the five categories above | Company-specific risk |

A risk may span multiple dimensions, but the output retains one primary type. Classify by the **main driver**, not by an incidental consequence in the sentence. For example, whether “a strategic partner’s service interruption” is strategic or operational depends on whether the sentence emphasizes the relationship itself or service availability.

### 1.4 What must the model deliver?

Every run must return exactly three risks. The core fields are:

- Risk summary;
- One primary risk type;
- Verbatim supporting source text;
- Source paragraph ID;
- PDF physical page.

The core output schema is [`schemas/risk-output-core.schema.json`](../schemas/risk-output-core.schema.json). Extended fields such as rationale, financial impact, time horizon, monitoring indicators, and mitigation must explicitly abstain when the source does not support them; they must not be filled from general knowledge.

## 2. Defining “usable”: not plausible prose, but a deliverable result

In this report, “more usable” does not mean that the wording sounds more like a professional analyst, nor that the three risks must exactly match one predetermined answer. It means that one run returns exactly three risks as agreed, in a machine-readable structure, with verbatim-checkable citations, locatable paragraphs and pages, and source-supported financial summaries and classifications.

This definition matters because it separates “the model seems to understand the content” from “the result can enter an actual analysis workflow.” It also explains why this experiment cannot be scored by subjective impression alone.

### 2.1 Three result states

| State | Precise definition |
|---|---|
| Complete pass | JSON parses, schema is valid, case/model/prompt metadata are correct, and all three citations pass source matching |
| Partial pass | A usable structured answer exists, but at least one citation or other core gate fails |
| Fail | No usable final answer, a precheck fails, or core automatic gates fail broadly |

### 2.2 Automatic pass is not financial semantic correctness

Automatic evaluation answers: “Can the output be read and located reliably by a program?” It does not automatically answer:

- Whether the three risks are truly the three most important;
- Whether the citation proves every causal consequence in the summary;
- Whether the classification follows the primary driver;
- Whether the PDF extraction itself has already been scrambled by layout.

The report therefore keeps two layers separate:

1. **Automatic gates:** structure, metadata, citation strings, and locators;
2. **Semantic review:** materiality, evidence sufficiency, classification, and financial meaning.

## 3. Model foundations and responsibility design across three workflows

All three workflows solve the same business task, but use different model foundations and responsibility allocations. DeepSeek and Gemma retain end-to-end generation responsibilities. The Finance workflow narrows the model to a judgment component and gives evidence handling to deterministic code.

| Solution | Model | Runtime | Final prompt / profile | Final input |
|---|---|---|---|---|
| General cloud | `DeepSeek-V4-Flash-Vision-Exp` | Cloud API | `PV016` / `optimized-deepseek-text-v005` | Frozen text directly |
| General local | `gemma4:26b-a4b-it-q4_K_M` | Local Ollama | `PV015` / `optimized-gemma-text-v004` | Frozen text directly |
| Finance-specialized | `QuantFactory/Llama-3-8B-Instruct-Finance-RAG-GGUF:Q4_K_M` | Local GGUF | `PV013` / `optimized-finance-pipeline-v009` | Candidate evidence catalog + deterministic restoration |

### 3.1 Background and rationale for the three models

The models are not merely three labels—cloud, general local, and finance local. They differ in developer, scale, training objective, openness, and runtime mechanism, all of which directly affect solution design.

| Model | Developer and source | Architecture or scale | Original positioning | What it represents here |
|---|---|---|---|---|
| DeepSeek-V4-Flash-Vision-Exp | DeepSeek experimental official API model | Parameter count and weights not published; cloud-hosted | General multimodal, reasoning, agent, and tool use | A high-capability general cloud solution available through an API |
| Gemma 4 26B A4B IT | Open-weight Google DeepMind model; local Ollama Q4_K_M version | MoE; roughly 25.2B total and 3.8B active parameters in official description | General text, vision, reasoning, and tool use | A high-capability general model with data kept on the local machine |
| Llama-3-8B-Instruct-Finance-RAG | Finance LoRA fine-tune of Meta Llama 3 8B Instruct; converted to GGUF by QuantFactory | 8B; Q4_K_M in this experiment | Answer financial questions from provided 10-K context | A small, locally runnable model adapted to a finance task |

#### 3.1.1 DeepSeek-V4-Flash-Vision-Exp

DeepSeek launched this experimental multimodal API model on 2026-08-21. According to the [DeepSeek release note](https://api-docs.deepseek.com/news/news260821/), its text capability aligns with DeepSeek-V4-Flash and adds image understanding. The official interface supports Chat Completions, Responses, JSON output, tool calls, and thinking/non-thinking modes. The [official model documentation](https://api-docs.deepseek.com/quick_start/pricing/) lists a 1M-token service context length, but parameter count, weights, and exact network structure are not public, so this report does not describe it using an unverified parameter size.

The reason for selecting it is not finance-specific training. It represents a common production path: obtain strong general language and vision capability through a cloud API without loading a model locally. The trade-offs are that document content is sent to an external service, execution depends on the network and provider interface, and calls incur token-based cost.

Its direct relationship to the 10-K task is that the model must understand “material risk,” “verbatim quote,” “primary risk type,” and “page locator” from the prompt and independently generate a complete structured result. The first preparation adjustment was to disable reasoning so internal reasoning would not consume the final output budget.

#### 3.1.2 Gemma 4 26B A4B IT Q4_K_M

Gemma is Google DeepMind’s open-weight model family based on Gemini research and technology. This experiment uses the instruction-tuned Gemma 4 26B A4B. According to the [official Google Gemma 4 model card](https://ai.google.dev/gemma/docs/core/model_card_4), it uses a Mixture-of-Experts (MoE) architecture with about 25.2B total parameters and about 3.8B active per inference; `A4B` indicates approximately 4B active parameters. The official version supports text and images, has a native 256K-token context, and offers switchable thinking mode.

The local `ollama show` output reports an installed `gemma4` architecture with approximately 25.8B parameters, a 262,144-token native context, and support for completion, vision, tools, and thinking. The redacted command output is saved in [`report/data/gemma_runtime_snapshot.txt`](data/gemma_runtime_snapshot.txt). The suffix `Q4_K_M` denotes a medium K-quant 4-bit version: it trades some precision for lower memory use and local feasibility. This experiment further limits the harness context to 32,768 tokens instead of using the full declared model limit.

Gemma was selected as a general multimodal solution comparable to DeepSeek but runnable entirely locally. It was not fine-tuned for financial 10-Ks, so the prompt must teach it the risk-selection, classification, and verbatim-evidence rules. Local deployment also keeps the filing away from a cloud provider. The most important preparation adjustments were disabling thinking and breaking verbatim copying into explicit self-check steps.

#### 3.1.3 Llama-3-8B-Instruct-Finance-RAG-GGUF Q4_K_M

This name contains three layers of provenance and should not be treated as a finance “large model” trained from scratch:

1. The base model is Meta’s Llama 3 8B Instruct;
2. `curiousily/Llama-3-8B-Instruct-Finance-RAG` uses LoRA fine-tuning on 4,000 samples from `virattt/financial-qa-10K`;
3. QuantFactory converted it with llama.cpp and quantized it to GGUF; this experiment uses `Q4_K_M`.

These sources and training details can be checked step by step in the [QuantFactory model card](https://huggingface.co/QuantFactory/Llama-3-8B-Instruct-Finance-RAG-GGUF). The model card lists a `Q4_K_M` file of about 4.92 GB. This experiment runs it locally through llama.cpp with an 8,192-token context.

`RAG` in the name does not mean that the model automatically searches, builds an index, or retrieves a 10-K. Its training format is “given a question and context, answer from the context.” Retrieval and context preparation still require external code. This explains why the final solution uses it to select Evidence IDs from a candidate catalog but not to independently handle PDF parsing, full-text retrieval, strict JSON, paragraph IDs, and page restoration all at once.

It was selected to test whether a small local model that has seen 10-K financial QA data can complete risk extraction through a workflow closer to its training pattern. Its difference from Gemma is not only parameter count but training scope: Gemma is a general reasoning and multimodal model, while Finance-RAG is closer to a specialized component that answers from supplied financial evidence.

#### 3.1.4 What the three workflows represent

The experiment does not treat cloud, local, and finance as a single capability ranking. It uses them to represent three implementable routes:

- **General cloud route:** prioritize model capability and calling convenience;
- **General local route:** prioritize privacy and local control while retaining broad capability;
- **Local finance-specialized route:** use a smaller domain-fine-tuned model and let an external evidence pipeline cover tasks it handles poorly.

The comparison is therefore not “which model name is most advanced,” but which adapted complete solution best fits 10-K risk-evidence extraction. This distinction is the report’s explanatory frame: whenever pass rates differ, inspect what the model actually received, what steps it owned, and which errors the program removed.

### 3.2 Shared runtime boundaries

All three workflows use `temperature = 0`, `top_p = 1`, `max_output_tokens = 1600`, and `seed = 7343`. The output budget ensures that one run delivers three structured risks within a limited space instead of expanding indefinitely; long 10-K inputs must also reserve room for final JSON. Gemma’s experimental context limit is 32,768 tokens and the finance model’s is 8,192, so the Finance workflow must compress candidate evidence first. Full parameters are in [`harness/config/models.json`](../harness/config/models.json) and [`harness/config/profiles.json`](../harness/config/profiles.json).

This experiment compares three complete workflows designed for different model characteristics under the same business task and core output contract. The critical difference in the diagram below is not the model icon: the Finance route moves candidate screening, verbatim copying, and paragraph/page restoration out of the generative model.

![Three final workflow architectures](visuals/rendered/final_solution_architectures.png)

DeepSeek and Gemma read the case text directly and generate complete JSON. Because of the 8K context and weaker structured-output behavior, the Finance model only selects three Evidence IDs and supplies summaries and classifications; code restores the quote, paragraph, and page from the ID.

## 4. Separating prompt tuning from final-solution comparison

To distinguish “workflow redesign helped” from “a model happened to answer a development case correctly,” the experiment has two functionally different phases. Preparation allows continued solution design from observed results. The frozen evaluation phase prohibits changing prompts in response to new cases. The first explains how a solution was formed; the second tests whether it transfers to companies not used for tuning.

![Experiment route](visuals/rendered/experiment_route.png)

### 4.1 Data pool and case roles

The project organized eight public 10-Ks: NVDA, COIN, PYPL, BA, JPM, TSLA, PFE, and META. Each retains:

- Official or issuer-public PDF;
- Mechanically extracted text generated by `pdftotext -layout`;
- Item 1A text;
- Frozen short case package;
- PDF physical page, printed page, paragraph ID, and locator index;
- Source URL, SEC accession, and SHA-256.

Sources and roles are listed in [`data/manifests/filings.csv`](../data/manifests/filings.csv) and [`data/manifests/case_packets.json`](../data/manifests/case_packets.json). Model inputs contain no human answers, risk labels, or analyst conclusions.

The case allocation used in this report is:

| Phase | Companies | Role in experiment design | Included in cross-solution comparison? |
|---|---|---|---|
| Preparation P | PayPal, Coinbase | Design prompts, output contracts, and evidence mechanisms for the three workflows | No; results explain design iterations only |
| R1 | Pfizer | First evaluation of the three frozen workflows | Yes |
| R2 | JPMorgan Chase | Cross-industry evaluation of frozen optimized solutions | Yes |
| R3 | Meta | Cross-industry evaluation of frozen optimized solutions | Yes |

### 4.2 Solution-design phase and frozen evaluation phase

The primary goal of preparation was to complete workflow design. PayPal and Coinbase provided development material that could be inspected repeatedly. Based on each specific failure, the team could revise prompts, shrink the output schema, or move source-location work unsuitable for a generative model to deterministic code. The three workflows did not need the same number of revisions, and preparation pass counts, failure counts, latency, and tokens were not used to rank them.

The preparation exit condition was a candidate solution for each model that could complete the course’s core task and whose failure mechanism was understood. DeepSeek `PV016`, Gemma `PV015`, and Finance pipeline `PV013` were then frozen. Only results from Pfizer, JPMorgan Chase, and Meta after the freeze were used to compare cross-case behavior, latency, and input/output scale.

This separation gives the two evidence sets different jobs. Preparation answers “Why was each solution designed this way?” Frozen evaluation answers “How did the three solutions perform on new cases after design was complete?”

### 4.3 What each call retains

The basic unit is “one model × one case × one attempt.” Every run directory stores:

- Actual input and prompt;
- Redacted request;
- Provider raw JSON and raw text;
- Parsed JSON;
- Automatic evaluation;
- Manifest, tokens, latency, status, and Git commit;
- File checksums.

Failed runs are retained and are not overwritten by later attempts. The full index is [`experiments/INDEX.csv`](../experiments/INDEX.csv); retention rules are in [`EXPERIMENT_ARCHIVE.md`](../EXPERIMENT_ARCHIVE.md).

## 5. DeepSeek workflow: prompts repair output structure but cannot guarantee verbatim evidence

### 5.1 Optimization chain

| Version / case | Change | Observation | Why continue |
|---|---|---|---|
| `PV002` / PYPL | Disable reasoning and require JSON | 9.129 s; JSON exists, but array fields are scalars | State the type of every field in the prompt |
| `PV005` / PYPL | Explicit array, object, and verbatim-quote rules | 9.923 s; all automatic gates pass | Move to the second development case |
| `PV005` / COIN | Generalize the same prompt | Automatic pass, but extended analysis contains source-external inference | Narrow to the course core task |
| `PV014` / COIN | Core-only schema | 6.075 s; nested structure invalid | State the shape of every object and array |
| `PV016` / COIN | Explicit nested-field types | 6.406 s; automatic and semantic review pass | Freeze |

### 5.2 What was the most effective change?

The DeepSeek solution became deliverable not by adding more financial knowledge, but through three structural output changes:

1. **Disable reasoning:** prevent internal reasoning from consuming the 1,600-token final-answer budget;
2. **State JSON types explicitly:** for example, `source_pages` must be an integer array, not one number;
3. **Narrow output responsibilities:** require only the summary, classification, verbatim quote, and locator that the course needs, and explicitly abstain on other fields.

`PV014` also showed that a smaller schema does not automatically succeed. If the prompt does not state that `risks` is an array of objects and which fields each object contains, the model can produce semantically correct but structurally invalid JSON. The final frozen prompt is [`prompts/PV016.md`](../prompts/PV016.md).

### 5.3 Behavior of the final solution

After freezing, DeepSeek was the fastest of the three: the three blind-test cases took 6.641, 6.311, and 7.195 seconds. Fast does not mean verbatim copying every time. In Pfizer, the source text said `certain drug pricing provisions`, while the model wrote `The drug pricing provisions`, so the result was only a partial pass. In JPMorgan, all three themes were financially relevant, but the citations did not match the frozen text verbatim. Prompts substantially improved format and behavior, but did not turn a generative model into a deterministic evidence copier.

## 6. Gemma workflow: copying constraints improve fidelity, but the model still owns the full chain

### 6.1 Optimization chain

| Version / case | Change | Observation | Why continue |
|---|---|---|---|
| `PV003` / PYPL | Disable thinking and use structured output | 133.085 s; structure and metadata correct, but one of three quotes omits a word | Add a verbatim-copy self-check |
| `PV006` / PYPL | Six-step literal-line copy check | 118.198 s; all automatic gates pass | Move to COIN |
| `PV006` / COIN | Generalize the rule | 158.015 s; passes, but still outputs non-core analysis | Narrow to Core-only |
| `PV015` / COIN | Keep core fields only and explicitly abstain on non-core fields | 157.559 s; automatic and semantic review pass | Freeze |

### 6.2 What did the six-step verbatim-copy check solve?

Gemma’s first structured attempt was close to success: three reasonable risks and parseable JSON, but one quote omitted a word. For a person the difference is small; for traceable evidence it means the model generated a near-sentence rather than copying from the source.

`PV006` therefore broke the action into: find a complete supporting sentence, copy directly from the input, prohibit synonym rewriting, check every word and punctuation mark, then fill the page and paragraph. This constrained output behavior rather than improving financial reasoning. Final `PV015` also removed non-core fields that encouraged free-form elaboration. The frozen prompt is [`prompts/PV015.md`](../prompts/PV015.md).

### 6.3 Behavior of the final solution

Gemma automatically passed on Pfizer and Meta, while only one of its three JPMorgan citations matched the frozen text as a continuous string. Its main cost was time: the three blind-test cases took 156.519, 239.547, and 231.120 seconds.

Meta exposed a finer issue than verbatim copying. Some quotes were completely present in the source but included only the “risk driver,” not the consequence asserted in the summary. Such output can pass automatic checks while providing incomplete evidentiary support.

Both general-model routes demonstrated the value of prompt tuning and exposed the same upper bound: as long as the generative model owns verbatim quotation and location, format success does not necessarily mean reliable evidence. The Finance route addressed this responsibility boundary next.

## 7. Finance workflow: the small model performs only focused judgment

This report retains the nine nodes from the Finance workflow’s independent design. Early versions used increasingly detailed prompts and asked the 8B model to read, judge, quote, produce JSON, and locate pages independently; they continued to fail. The effective turning point was not more prompt rules. It was recognizing that the model is closer to a component that judges from supplied financial context, then reallocating responsibilities between model and program. These nodes explain how the workflow formed; they are not a score for the bare model.

![Finance-solution optimization path](visuals/rendered/05_finance_optimization.png)

### 7.1 What happened at the nine nodes

| Node | Prompt | Automatic gate | Semantic review | Key change or failure |
|---|---|---|---|---|
| P002 a01 | `PV004` | Fail | Fail | Page still wrong after adding JSON contract |
| P002 a02 | `PV007` | Fail | Fail | A page state machine in the prompt regressed to 288.642 s |
| P002 a03 | `PV008` | Precheck fail | Not run | Long Evidence Catalog: 9,429 + 1,600 exceeded the 8,192 context |
| P002 a04 | `PV008` | Pass | Fail | Physical-line IDs made citations locatable, but lines were incomplete and themes expanded beyond the source |
| P002 a05 | `PV010` | Pass | Fail | Complete sentences improved readability, but non-core analysis still inferred beyond the source |
| P002 a06 | `PV011` | Pass | Fail | Core-only + consequence screen treated `material` in `copyrighted material` as a materiality signal and selected duplicate themes |
| P002 a07 | `PV012` | Pass | Pass | Fixed materiality rule and added paragraph-group uniqueness |
| COIN a01 | `PV012` | Pass | Fail | Evidence was correct, but primary-driver classification priority was unclear |
| COIN a02 | `PV013` | Pass | Pass with classification note | Added primary-driver precedence and froze |

### 7.2 Why did a more detailed page rule fail?

`PV007` tried to make the 8B finance model maintain page, paragraph, and quote state by itself. It did not solve location; output became longer and slower, and page numbers remained unreliable. For this model, source location was a deterministic task that natural-language prompt rules were not a good way to keep adding.

### 7.3 How the Evidence ID pipeline works

Starting with `PV008`, the work was split:

1. Code generates an immutable Evidence Catalog from the frozen case package. Each record has an `evidence_id`, source text, paragraph group, PDF page, and text hash;
2. The model selects three Evidence IDs and generates a summary and classification;
3. `EL001` checks that IDs exist, are distinct, and belong to different paragraph groups;
4. Code restores the quote, paragraph, and page from the IDs exactly;
5. Final output is checked against the frozen source for schema and citation validity.

The locator does not fuzzy-search similar sentences, repair model quotes, or choose a different source on the model’s behalf. See [`experiments/P_PROTOCOL_ADDENDUM_v002.md`](../experiments/P_PROTOCOL_ADDENDUM_v002.md) for the protocol and [`scripts/lib/evidence_catalog.cjs`](../scripts/lib/evidence_catalog.cjs) plus [`scripts/apply_evidence_locator.cjs`](../scripts/apply_evidence_locator.cjs) for the implementation.

### 7.4 Why keep shrinking candidate evidence?

Sending every line of the full text still exceeded the 8K context. Later versions reduced the input three times:

- Physical-line catalog: fewer tokens, but sentences were cut by line breaks;
- Complete-sentence catalog: more readable evidence, but the model still produced unsupported `horizon`, `indicator`, and other extended analysis;
- Core-only + material-consequence screen: retained complete candidate sentences with explicit consequence language and left only summary, classification, and ID selection to the model.

From `PV010` to `PV011`, input fell from 5,070 to 1,952 tokens, a **61.5%** reduction; runtime fell from 161.398 to 60.424 seconds, about **62.6%**. The improvement was not that the model became smarter. The task became smaller and clearer. This is also the most direct development-stage evidence for the final conclusion: weights stayed the same, but changing the workflow boundary made the result faster, more stable, and easier to verify.

### 7.5 How false positives improved the rules

The first `material-consequence` screen could retain a sentence merely because it contained `material`, causing the ordinary noun in `copyrighted material` to be interpreted as “material impact.” The second version required materiality language to modify an impact verb and added a paragraph-group ID, preventing two sentences from the same risk paragraph from being counted as two independent material risks.

Coinbase exposed a classification conflict: a sentence contained both a strategic relationship and third-party-service language. `PV013` therefore added primary-driver precedence: demand, price, competition, adoption, and strategic relationships are primarily `Strategic / Market / Technology`; third-party involvement is `Operational` only when the emphasis is service dependence or interruption.

The final frozen prompt is [`prompts/PV013.md`](../prompts/PV013.md); the COIN closeout review is [`experiments/P002_COIN_FINAL_REVIEW.md`](../experiments/P002_COIN_FINAL_REVIEW.md).

## 8. R1 Pfizer: first comparison of the three frozen workflows

R1 uses the Pfizer FY2024 case, which did not participate in workflow design. DeepSeek, Gemma, and the Finance pipeline each ran once without retries.

### 8.1 Results

| Workflow | Result | Time | Input / output tokens | Meaning |
|---|---|---:|---:|---|
| DeepSeek | Partial pass | 6.641 s | 6,980 / 601 | Schema passed; two of three citations passed |
| Gemma | Complete pass | 156.519 s | 7,050 / 748 | All automatic gates passed |
| Finance pipeline | Complete pass | 68.676 s | 2,426 / 189 | Three Evidence IDs and deterministic locators passed |

On Pfizer, Gemma and the Finance pipeline fully passed, while DeepSeek was partial because of one near-paraphrased quote. The first round already shows the workflow difference: Finance gives the model only candidate evidence, so input and output are shorter; DeepSeek and Gemma still generate verbatim quotes and locators independently.

### 8.2 Did the three workflows select exactly the same risks?

No, and disagreement alone should not be scored as error.

- Gemma: payer bargaining power, launch of competing products, and interruption by a third-party partner;
- Finance pipeline: generic competition, regulation and product-revenue exposure, and consumer harm related to counterfeit products/cybersecurity;
- DeepSeek: drug-pricing regulation, competing and generic products, and counterfeit products.

The same 10-K can support multiple sets of “top three” risks. A core difficulty of the course task is not to treat an analyst’s selection as the only possible answer. The complete R1 summary is [`experiments/R1_PFE_SUMMARY.md`](../experiments/R1_PFE_SUMMARY.md).

## 9. R2 JPMorgan: the workflow passed, but financial judgment and document quality must be separated

JPMorgan is the most useful boundary case in the experiment. Automatic gates produce a clear winner—only the Finance pipeline fully passes. Page review shows that the outcome is driven mainly by how the three solutions handle evidence, not by an equally large gap in risk-theme judgment.

![JPMorgan two-column failure mechanism](visuals/rendered/jpm_two_column_failure.png)

### 9.1 What happened?

The JPMorgan annual report uses a two-column layout. On some pages, `pdftotext -layout` joins text at the same height from the left and right columns on one line. Visually, each column contains continuous, readable sentences; in serialized text, fragments from the two columns are interleaved.

This produced three different behaviors:

- **DeepSeek** generated continuous wording that could be found visually in one column, but it was not a continuous substring of the frozen text, so all three citations were rejected by the automatic gate;
- **Gemma** had only one of three citations pass. Another was valid in the page image but interrupted by the other column in the frozen text; it also wrote printed page 18 as the wrong PDF physical page under the physical-page-20 rule;
- **Finance pipeline** copied the frozen text directly, so all automatic citation gates passed, but it faithfully copied text already interleaved by the two-column extraction, making readability and semantic completeness worse.

### 9.2 Automatic results

| Solution | Automatic result | Time | Input / output tokens | Automatic observation |
|---|---|---:|---:|---|
| DeepSeek | Fail | 6.311 s | 6,104 / 633 | Schema/metadata passed; none of the three citation strings matched |
| Gemma | Fail | 239.547 s | 5,901 / 730 | Only one of three citations matched; one page was confused |
| Finance pipeline | Complete pass | 148.477 s | 3,099 / 192 | Evidence IDs and deterministic locators all passed |

### 9.3 What changes after reviewing page images?

- DeepSeek’s three themes—regulatory enforcement, restructuring of a resolution plan, and the economic/credit environment—are financially relevant and supported in the visual page columns. Some short quotes did not cover all consequences in the summaries, so the result is better described as “conditional partial” than as three pure hallucinations.
- Gemma’s themes of regulatory resolution, political/geopolitical uncertainty, and rates/credit spreads are also relevant. But its page contract has one independent error that cannot be attributed to two-column extraction.
- The Finance pipeline’s first item, “litigation exposure,” is closer to Regulatory / Legal than Strategic; “adverse economic conditions” is closer to Financial / Market than Operational. It proves verbatim locatability but does not automatically prove classification correctness.

### 9.4 Impact on evaluation design

JPMorgan requires at least four separate scores:

1. Whether visual evidence exists on the original PDF page;
2. Whether extracted text preserves the correct reading order;
3. Whether the model faithfully quotes the input it actually received;
4. Whether the summary and classification are adequately supported by evidence.

String matching alone over-penalizes DeepSeek and Gemma. Page-level meaning alone hides page and evidence-truncation errors. Finance’s automatic pass alone would reward “precise copying of garbled evidence.”

## 10. R3 Meta: when the document is clean, all three workflows pass

Meta’s extraction layout is relatively clean, and all three frozen workflows pass the automatic gates. This provides the key contrast with JPMorgan: when document parsing and citation location no longer create the main obstacle, the gap in “can the task be completed?” narrows substantially. Differences move to which three risks are selected, whether the evidence span is sufficient, and whether classification is appropriate.

| Solution | Automatic result | Time | Input / output tokens | Semantic-review observation |
|---|---|---:|---:|---|
| DeepSeek | Complete pass | 7.195 s | 7,281 / 677 | User participation, ad spending, and ad signals all have strong source support; cleanest this round |
| Gemma | Complete pass | 231.120 s | 7,676 / 738 | Quotes are verbatim, but some include only drivers and omit the consequences in the summary |
| Finance pipeline | Complete pass | 161.604 s | 2,135 / 182 | Strong on user retention and ad targeting; classifying product development as Operational / Supply Chain is debatable |

Meta shows that once JSON, location, and verbatim copying stop being the main problems, model differences shift to finer financial judgments: which three risks to select, how long the quote must be to prove the summary, and whether classification follows the driver or the operating consequence.

## 11. Cross-case results: the Finance pipeline is the most stable workflow

The three blind-test cases point in the same direction: the Finance pipeline has the highest automatic deliverability, DeepSeek is fastest, and Gemma is between them. The numbers below therefore describe complete-workflow pass rates, not a ranking of bare model capability.

### 11.1 Number of companies with a complete automatic pass

![Blind-test outcome matrix for three cases](visuals/rendered/02_blind_outcome_matrix.png)

Across the three frozen optimized blind-test cases:

- DeepSeek: **1 complete automatic pass and 2 incomplete passes (3 total)**;
- Gemma: **2 complete automatic passes and 1 incomplete pass (3 total)**;
- Finance pipeline: **3 complete automatic passes (3 total)**.

These numbers represent automatic traceability gates only. JPMorgan’s two-column issue and Finance’s classification issue show why they cannot be interpreted as financial-analysis accuracy of 33%, 67%, and 100%. A more accurate interpretation is that, in three single runs, Evidence IDs and deterministic restoration turned the citation and location steps most likely to fail for the finance model into program-guaranteed steps.

### 11.2 Time

![Latency across three blind-test cases](visuals/rendered/03_optimized_latency.png)

DeepSeek took about 6–7 seconds each time; Gemma took about 157–240 seconds; Finance took about 69–162 seconds. Because the fastest and slowest differ by more than an order of magnitude, the chart uses a logarithmic y-axis.

This is not a pure model-throughput benchmark. Finance includes candidate-evidence selection and pipeline processing; DeepSeek includes remote API round trip; Gemma and Finance use different local inference stacks. The metric is the end-to-end time a user waits for a complete solution.

### 11.3 Input and output tokens

![Input and output tokens for three blind-test cases](visuals/rendered/04_optimized_tokens.png)

DeepSeek and Gemma read the complete frozen case and use about 5,900–7,700 input tokens. The Finance pipeline reads only screened candidate evidence and uses about 2,100–3,100 input tokens. Its output is also only about 182–192 tokens because the model returns core judgments and Evidence IDs; code restores the full quote and page.

Token differences should not be described as “the finance model is more concise.” More precisely, the finance solution moves some text processing and output responsibilities from the generative model to deterministic code.

### 11.4 Results table

| Company | DeepSeek | Gemma | Finance pipeline |
|---|---|---|---|
| Pfizer | Partial; one near-paraphrased quote | Complete automatic pass | Complete automatic pass |
| JPMorgan | Automatic fail; conditional partial after visual review | Automatic fail; two-column false negative plus a real page error | Complete automatic pass; interleaved evidence and wrong classification |
| Meta | Complete automatic pass; cleanest this round | Complete automatic pass; some evidence spans too short | Complete automatic pass; one classification is debatable |

This table is closer to the real result than one total score: one output can receive different evaluations for structure, citation, layout, and financial classification.

## 12. How to verify the argument from the raw records

To decide whether the Finance advantage comes from the model or the workflow, do not read only the summary numbers. Use the following order and check separately what the model judged and what post-processing did.

### 12.1 First layer: read the three summaries

1. [`experiments/P002_COIN_FINAL_REVIEW.md`](../experiments/P002_COIN_FINAL_REVIEW.md): why tuning stopped for the three solutions;
2. [`experiments/R1_PFE_SUMMARY.md`](../experiments/R1_PFE_SUMMARY.md): the complete Pfizer record; this report uses only the three frozen-workflow results;
3. [`experiments/R2_R3_OPTIMIZED_SUMMARY.md`](../experiments/R2_R3_OPTIMIZED_SUMMARY.md): automatic results and semantic review for JPMorgan and Meta.

### 12.2 Second layer: inspect runs, not just tables

Read each run in the same order:

1. `manifest.json`: confirm model, prompt, case, parameters, latency, and tokens;
2. `input/model_input.txt`: confirm what the model actually saw;
3. `raw/response.txt`: confirm the raw model output before post-processing;
4. `derived/parsed.json` or `derived/pipeline_output.json`: inspect the structured result;
5. `evaluation/automatic.json`: see exactly which gate passed or failed;
6. For two-column or page issues, inspect the case-package `pages/*.png` and `locator_index.json`.

For example, the DeepSeek JPMorgan run is:

[`experiments/runs/R2/R2-optimized-text-JPM-FY24-cloud-deepseek-20260902T065650192Z-e621ba-a01/`](../experiments/runs/R2/R2-optimized-text-JPM-FY24-cloud-deepseek-20260902T065650192Z-e621ba-a01/)

The Finance pipeline JPMorgan run is:

[`experiments/runs/R2/R2-optimized-text-JPM-FY24-finance-llama-20260902T065650202Z-ad27f8-a01/`](../experiments/runs/R2/R2-optimized-text-JPM-FY24-finance-llama-20260902T065650202Z-ad27f8-a01/)

Viewing these directories side by side shows the difference between “visually reasonable but string-invalid” and “string-exact but text-interleaved.”

### 12.3 Third layer: review versions, not only final prompts

The final version alone cannot explain the optimization process. Read each workflow as a chain:

- DeepSeek: [`PV002`](../prompts/PV002.md) → [`PV005`](../prompts/PV005.md) → [`PV014`](../prompts/PV014.md) → [`PV016`](../prompts/PV016.md);
- Gemma: [`PV003`](../prompts/PV003.md) → [`PV006`](../prompts/PV006.md) → [`PV015`](../prompts/PV015.md);
- Finance: [`PV004`](../prompts/PV004.md) → [`PV007`](../prompts/PV007.md) → [`PV008`](../prompts/PV008.md) → [`PV010`](../prompts/PV010.md) → [`PV011`](../prompts/PV011.md) → [`PV012`](../prompts/PV012.md) → [`PV013`](../prompts/PV013.md).

Every change should map to the previous failure and be validated by a later run. A prompt rule counts as an effective optimization only when it points to a concrete error and a subsequent run verifies its effect.

## 13. Reproducibility and report-chart sources

Run metrics in this report come from [`experiments/INDEX.csv`](../experiments/INDEX.csv) and each run’s `manifest.json`. Human-review summary data used for charts are stored in:

- [`report/data/reviewed_results.csv`](data/reviewed_results.csv)
- [`report/data/finance_optimization.csv`](data/finance_optimization.csv)

Chart sources and rendered outputs are retained together:

- Numeric chart generator: [`report/visuals/src/generate_report_charts.py`](visuals/src/generate_report_charts.py)
- Mermaid sources: [`report/visuals/src/`](visuals/src/)
- PNG / SVG: [`report/visuals/rendered/`](visuals/rendered/)

All numeric charts are regenerated from CSV; numbers are not edited manually in an image editor. SVG can be reused directly on a later website, while PNG is used for Markdown, slide decks, and quick previews.

The scope must be stated precisely: preparation records multiple iterations of the three workflows. After freezing, each of the three workflows ran on Pfizer, JPMorgan Chase, and Meta, for nine evaluation units. Each unit had one no-retry run. This is an auditable classroom experiment, not a statistically significant benchmark based on repeated sampling.

## 14. Experimental conclusion: design model responsibilities before choosing a model

### 14.1 Direct answer

In this 10-K risk-evidence extraction experiment, **the finance-specialized small-model solution was more usable than the two general-model solutions**. “Usable” has a specific meaning: the result can be read by a program, all three risks can be located in the source, and the output can enter later financial review. Across three frozen blind-test cases, the Finance pipeline automatically passed all three companies, Gemma passed two, and DeepSeek passed one.

The actual gap in risk-theme identification was smaller than the automatic pass-rate gap. DeepSeek’s JPMorgan citation strings failed even though its themes were financially relevant; all three workflows passed Meta; and the Finance pipeline had classification disputes and precisely copied two-column-garbled text in JPMorgan. Complete pass rate mainly reflects whether a workflow can convert judgment into evidence that can be traced back reliably.

### 14.2 What really created the gap?

The general-model solutions use an almost end-to-end workflow: the model reads a long frozen text and is responsible for selecting risks, summarizing, classifying, copying quotes verbatim, filling paragraphs and pages, and satisfying the JSON schema. Detailed prompts can disable reasoning, constrain field types, and request verbatim self-checks, but they cannot fully remove generative paraphrase and locator errors. The probabilistic model is asked to be analyst, transcriber, and document locator at once.

The final finance solution uses a split workflow. Code first screens candidate evidence with explicit consequence language and assigns immutable Evidence IDs. The 8B finance model handles the task it is more familiar with—selecting three risks, summarizing, and classifying from supplied financial context. Code then restores the quote, paragraph, and page from the ID. The model still does the judgment; deterministic code handles the parts that must be exact.

| Responsibility | DeepSeek / Gemma | Finance pipeline |
|---|---|---|
| Read input | Model reads the complete frozen text | Program creates candidate evidence; model reads a compressed catalog |
| Select three risks | Model | Model |
| Risk summary and classification | Model | Model |
| Verbatim quote | Generated by model | Restored exactly by ID |
| Paragraph and page | Generated by model | Restored by index |
| Structure and citation checks | Validate after generation; failure is not automatically repaired | Validate after generation; key locator fields are guaranteed by code |

This responsibility redesign produced observable effects. During preparation, from `PV010` to `PV011`, model input fell from 5,070 to 1,952 tokens and runtime from 161.398 to 60.424 seconds without changing model weights. In frozen evaluation, the Finance pipeline achieved complete automatic passes for all three companies. The best-supported explanation is not that the model suddenly became more capable; the workflow removed noise and eliminated citation and locator generation errors at the source.

### 14.3 What does this experiment actually support?

The experiment supports a conclusion about **three workflow designs**:

> For a focused, decomposable task such as 10-K risk-evidence extraction—where financial judgment and verbatim traceability are both required—a domain small model with a targeted evidence workflow can deliver more reliably than a stronger general model paired with a complex prompt. The main advantage comes from correctly narrowing the model’s responsibilities, not from asking it to complete everything independently.

This is why the finance small model is not a low-cost replacement for a general model but a different system component. We do not expect it to read a full raw filing and produce a perfect answer. We use its training direction for focused judgment and use code to guarantee evidence fidelity. Conversely, even when a general model understands more tasks, its high capability does not automatically become stable, verifiable delivery if the entire chain still depends on one free-form generation.

The final take-away is not “smaller parameters are always better” or “finance models always beat general models.” It is: **model capability determines what the model may understand; workflow design determines whether that capability becomes a stable deliverable. In this experiment, workflow differences are the explanation for the automatic pass-rate gap with the strongest evidence.**
