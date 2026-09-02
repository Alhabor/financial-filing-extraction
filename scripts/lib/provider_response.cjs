function assistantText(response, interfaceName) {
  if (interfaceName === 'ollama-chat') return response?.message?.content;
  return response?.choices?.[0]?.message?.content;
}

function reasoningText(response, interfaceName) {
  if (interfaceName === 'ollama-chat') return response?.message?.thinking;
  return response?.choices?.[0]?.message?.reasoning_content;
}

function responseUsage(response, interfaceName) {
  if (interfaceName === 'ollama-chat') {
    return {
      input_tokens: response?.prompt_eval_count ?? null,
      output_tokens: response?.eval_count ?? null,
      reasoning_tokens: response?.message?.thinking ? response.eval_count ?? null : 0,
      local_runtime_seconds: typeof response?.total_duration === 'number'
        ? response.total_duration / 1e9
        : null
    };
  }
  return {
    input_tokens: response?.usage?.prompt_tokens ?? null,
    output_tokens: response?.usage?.completion_tokens ?? null,
    reasoning_tokens: response?.usage?.completion_tokens_details?.reasoning_tokens ?? null,
    local_runtime_seconds: null
  };
}

function providerResponse(response, interfaceName, httpStatus, requestId = null) {
  return {
    http_status: httpStatus,
    request_id: requestId || response?.id || null,
    finish_reason: interfaceName === 'ollama-chat'
      ? response?.done_reason || null
      : response?.choices?.[0]?.finish_reason || null
  };
}

module.exports = { assistantText, reasoningText, responseUsage, providerResponse };
