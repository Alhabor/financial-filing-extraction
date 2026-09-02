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

  for (const result of [deepseek, gemma, finance]) {
    assert.equal(result.manifest.parameters.max_output_tokens, 1600);
    assert.equal(result.manifest.tools.external_search, false);
    assert.equal(result.manifest.tools.rag, false);
  }
  process.stdout.write('test_materialize_transport_controls: all deterministic tests passed\n');
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
