# Experiment harness

这是研究线的轻量实验编排层，不是最终产品后端。它把“同一案例如何进入不同模型”固定下来，并为每次运行生成可审计的输入、请求和元数据。

当前脚本强制读取 `data/processed/case_packets/<CASE-ID>/` 中已经冻结的案例包。未冻结的 `data/processed/model_inputs/<CASE-ID>.txt` 只能作为候选材料，不能进入正式 harness 运行。

## 当前阶段：dry-run

当前只实现输入物料化，不调用云端 API、Ollama 或 llama.cpp。这样可以先检查：

- 三个模型收到的文本是否来自同一个固定案例包；
- Prompt 版本和模型别名是否正确；
- 视觉输入是否有固定页码和图像哈希；
- 脱敏请求中没有 Authorization、API Key 或环境变量快照。

入口脚本是 `scripts/materialize_experiment_run.cjs`。模型配置在 `harness/config/models.json`，输入条件在 `harness/config/profiles.json`。

## 内部流程

```text
固定案例包
    -> case loader
    -> prompt builder
    -> modality adapter
    -> provider adapter
    -> dry-run / live gate
    -> raw recorder
    -> parser + citation validator
    -> automatic and human evaluation
```

正式实现时，每个 provider adapter 只负责接口差异：

- DeepSeek：OpenAI 风格消息；视觉条件使用文字块与页面图像；
- Ollama：`/api/chat` 消息和可选图片；
- Finance GGUF：本地文本消息，通过用户选定的 llama.cpp 兼容接口调用。

## 输入条件

`standard-text-v001` 是三模型共用的公平基准，所有模型只收到同一份文本和同一份核心 Prompt。`native-vision-v001` 只用于已确认支持视觉的模型，主输入是固定页面图像，文本模型不运行该条件；视觉条件不同时附送完整文本，否则无法单独观察视觉能力。

视觉条件失败时的规则是：

1. 保存视觉 attempt 的原始错误、状态和诊断；
2. 使用同一案例文本创建新的 `text_fallback` attempt；
3. 在 `manifest.json` 中记录 `requested_modality`、`actual_modality` 和 `fallback_reason`；
4. 报告时将 native vision、text 和 text fallback 分开统计。

fallback 是保证流程可完成的容错机制，不是把视觉失败伪装成视觉成功。

## 运行前的安全边界

- 默认不联网、不调用模型；
- live mode 必须显式开启，并且只从环境变量读取云端凭证；
- 请求档案永远不写 Authorization 请求头或 API Key；
- 原始响应、错误和失败运行均不可覆盖；
- 模型权重、临时页面图像和本地路径不进入公开仓库。
