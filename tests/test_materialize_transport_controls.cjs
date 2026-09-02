#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const MATERIALIZER = path.join(ROOT, 'scripts', 'materialize_experiment_run.cjs');

function materialize(outputRoot, modelAlias, profile) {
  const result = JSON.parse(execFileSync(process.execPath, [
    MATERIALIZER,
    '--case-id', 'PYPL-FY24',
    '--model-alias', modelAlias,
    '--profile', profile,
    '--phase', 'P',
    '--round', 'P002-TEST',
    '--output-root', outputRoot
  ], { cwd: ROOT, encoding: 'utf8' }));
  const runDir = path.join(ROOT, result.run_dir);
  return {
    runDir,
    request: JSON.parse(fs.readFileSync(path.join(runDir, 'input', 'request.sanitized.json'), 'utf8')),
    manifest: JSON.parse(fs.readFileSync(path.join(runDir, 'manifest.json'), 'utf8'))
  };
}

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'financial-filing-materializer-'));
try {
  const deepseek = materialize(temporary, 'cloud-deepseek', 'optimized-deepseek-text-v002');
  assert.deepEqual(deepseek.request.thinking, { type: 'disabled' });
  assert.deepEqual(deepseek.request.response_format, { type: 'json_object' });
  assert.equal(deepseek.manifest.prompt_version, 'PV002');

  const gemma = materialize(temporary, 'local-gemma', 'optimized-gemma-text-v002');
  assert.equal(gemma.request.think, false);
  assert.equal(gemma.request.format.$id, 'risk-output-v001');
  assert.equal(gemma.manifest.prompt_version, 'PV003');

  const finance = materialize(temporary, 'finance-llama', 'optimized-finance-text-v002');
  assert.equal(finance.request.response_format.type, 'json_object');
  assert.equal(finance.request.response_format.schema.$id, 'risk-output-v001');
  assert.equal(finance.manifest.prompt_version, 'PV004');

  const deepseekV3 = materialize(temporary, 'cloud-deepseek', 'optimized-deepseek-text-v003');
  assert.deepEqual(deepseekV3.request.thinking, { type: 'disabled' });
  assert.equal(deepseekV3.manifest.prompt_version, 'PV005');

  const gemmaV3 = materialize(temporary, 'local-gemma', 'optimized-gemma-text-v003');
  assert.equal(gemmaV3.request.think, false);
  assert.equal(gemmaV3.request.format.$id, 'risk-output-v001');
  assert.equal(gemmaV3.manifest.prompt_version, 'PV006');

  const financeV3 = materialize(temporary, 'finance-llama', 'optimized-finance-text-v003');
  assert.equal(financeV3.request.response_format.schema.$id, 'risk-output-v001');
  assert.equal(financeV3.manifest.prompt_version, 'PV007');

  const financePipeline = materialize(temporary, 'finance-llama', 'optimized-finance-pipeline-v004');
  assert.equal(financePipeline.request.response_format.schema.$id, 'finance-selection-v001');
  assert.equal(financePipeline.manifest.prompt_version, 'PV008');
  assert.equal(financePipeline.manifest.input.transform, 'evidence-catalog-v001');
  assert.equal(financePipeline.manifest.input.evaluation_path, 'input/source_packet.txt');
  assert.equal(financePipeline.manifest.output_schema_version, 'finance-selection-v001');
  assert.equal(financePipeline.manifest.pipeline_output_schema_version, 'risk-output-v001');
  const catalog = JSON.parse(fs.readFileSync(path.join(financePipeline.runDir, 'input', 'evidence_catalog.json'), 'utf8'));
  assert.ok(catalog.record_count > 20);
  assert.match(financePipeline.request.messages[1].content, /\[EVIDENCE PYPL-FY24-E0001 \| PDF_PAGE 18 \| PARAGRAPH PYPL-FY24-P001\]/);
  assert.ok(fs.existsSync(path.join(financePipeline.runDir, 'input', 'source_packet.txt')));

  const financePipelineV2 = materialize(temporary, 'finance-llama', 'optimized-finance-pipeline-v006');
  assert.equal(financePipelineV2.request.response_format.schema.$id, 'finance-selection-v002');
  assert.equal(financePipelineV2.manifest.prompt_version, 'PV010');
  assert.equal(financePipelineV2.manifest.input.transform, 'evidence-catalog-v003');
  const sentenceCatalog = JSON.parse(fs.readFileSync(path.join(financePipelineV2.runDir, 'input', 'evidence_catalog.json'), 'utf8'));
  assert.equal(sentenceCatalog.catalog_version, 'evidence-catalog-v003');
  assert.ok(sentenceCatalog.records.some((record) => record.match_mode === 'whitespace-normalized'));
  assert.match(financePipelineV2.request.messages[1].content, /\[E0001\]/);

  const financePipelineV3 = materialize(temporary, 'finance-llama', 'optimized-finance-pipeline-v007');
  assert.equal(financePipelineV3.request.response_format.schema.$id, 'finance-selection-v003');
  assert.equal(financePipelineV3.manifest.prompt_version, 'PV011');
  assert.equal(financePipelineV3.manifest.input.transform, 'evidence-catalog-v004');
  const consequenceCatalog = JSON.parse(fs.readFileSync(path.join(financePipelineV3.runDir, 'input', 'evidence_catalog.json'), 'utf8'));
  assert.equal(consequenceCatalog.catalog_version, 'evidence-catalog-v004');
  assert.equal(consequenceCatalog.screen_version, 'material-consequence-screen-v001');
  assert.ok(consequenceCatalog.record_count >= 3);
  assert.ok(consequenceCatalog.record_count < consequenceCatalog.source_record_count);
  assert.doesNotMatch(financePipelineV3.request.messages[1].content, /\[E0051\]/);

  const financePipelineV4 = materialize(temporary, 'finance-llama', 'optimized-finance-pipeline-v008');
  assert.equal(financePipelineV4.request.response_format.schema.$id, 'finance-selection-v003');
  assert.equal(financePipelineV4.manifest.prompt_version, 'PV012');
  assert.equal(financePipelineV4.manifest.input.transform, 'evidence-catalog-v005');
  const groupedCatalog = JSON.parse(fs.readFileSync(path.join(financePipelineV4.runDir, 'input', 'evidence_catalog.json'), 'utf8'));
  assert.equal(groupedCatalog.catalog_version, 'evidence-catalog-v005');
  assert.equal(groupedCatalog.screen_version, 'material-consequence-screen-v002');
  assert.ok(groupedCatalog.records.every((record) => /^G[0-9]{3}$/.test(record.group_id)));
  assert.doesNotMatch(financePipelineV4.request.messages[1].content, /copyrighted material, to others/);
  assert.match(financePipelineV4.request.messages[1].content, /\[E[0-9]{4} \| GROUP G[0-9]{3}\]/);

  for (const result of [deepseek, gemma, finance, deepseekV3, gemmaV3, financeV3]) {
    assert.equal(result.manifest.parameters.max_output_tokens, 1600);
    assert.equal(result.manifest.tools.external_search, false);
    assert.equal(result.manifest.tools.rag, false);
  }
  assert.equal(financePipeline.manifest.parameters.max_output_tokens, 1600);
  assert.equal(financePipeline.manifest.tools.external_search, false);
  assert.equal(financePipeline.manifest.tools.rag, true);
  assert.equal(financePipelineV2.manifest.parameters.max_output_tokens, 1600);
  assert.equal(financePipelineV2.manifest.tools.rag, true);
  assert.equal(financePipelineV3.manifest.parameters.max_output_tokens, 1600);
  assert.equal(financePipelineV3.manifest.tools.rag, true);
  assert.equal(financePipelineV4.manifest.parameters.max_output_tokens, 1600);
  assert.equal(financePipelineV4.manifest.tools.rag, true);

  const deepseekCore = materialize(temporary, 'cloud-deepseek', 'optimized-deepseek-text-v004');
  assert.deepEqual(deepseekCore.request.thinking, { type: 'disabled' });
  assert.deepEqual(deepseekCore.request.response_format, { type: 'json_object' });
  assert.equal(deepseekCore.manifest.prompt_version, 'PV014');
  assert.equal(deepseekCore.manifest.output_schema_version, 'risk-output-core-v001');

  const gemmaCore = materialize(temporary, 'local-gemma', 'optimized-gemma-text-v004');
  assert.equal(gemmaCore.request.think, false);
  assert.equal(gemmaCore.request.format.$id, 'risk-output-core-v001');
  assert.equal(gemmaCore.manifest.prompt_version, 'PV015');

  const financePipelineV5 = materialize(temporary, 'finance-llama', 'optimized-finance-pipeline-v009');
  assert.equal(financePipelineV5.request.response_format.schema.$id, 'finance-selection-v003');
  assert.equal(financePipelineV5.manifest.prompt_version, 'PV013');
  assert.equal(financePipelineV5.manifest.input.transform, 'evidence-catalog-v005');

  const deepseekCoreV2 = materialize(temporary, 'cloud-deepseek', 'optimized-deepseek-text-v005');
  assert.deepEqual(deepseekCoreV2.request.thinking, { type: 'disabled' });
  assert.deepEqual(deepseekCoreV2.request.response_format, { type: 'json_object' });
  assert.equal(deepseekCoreV2.manifest.prompt_version, 'PV016');
  assert.equal(deepseekCoreV2.manifest.output_schema_version, 'risk-output-core-v001');
  process.stdout.write('test_materialize_transport_controls: all deterministic tests passed\n');
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
