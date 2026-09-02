#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { buildEvidenceCatalog } = require('../scripts/lib/evidence_catalog.cjs');

const ROOT = path.resolve(__dirname, '..');
const LOCATOR = path.join(ROOT, 'scripts', 'apply_evidence_locator.cjs');
const EVALUATOR = path.join(ROOT, 'scripts', 'evaluate_experiment_run.cjs');
const FIXTURE = path.join(__dirname, 'fixtures', 'valid-run');
const RUNS_ROOT = path.join(ROOT, 'experiments', 'runs');

function makeRun() {
  const runDir = fs.mkdtempSync(path.join(RUNS_ROOT, 'test-evidence-locator-'));
  fs.cpSync(FIXTURE, runDir, { recursive: true });
  const sourcePacket = fs.readFileSync(path.join(runDir, 'input', 'model_input.txt'), 'utf8');
  const transformed = buildEvidenceCatalog(sourcePacket, 'FIXTURE-FY24');
  fs.writeFileSync(path.join(runDir, 'input', 'source_packet.txt'), sourcePacket);
  fs.writeFileSync(path.join(runDir, 'input', 'model_input.txt'), transformed.modelInput);
  fs.writeFileSync(path.join(runDir, 'input', 'evidence_catalog.json'), `${JSON.stringify(transformed.catalog, null, 2)}\n`);
  const manifestPath = path.join(runDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.output_schema_version = 'finance-selection-v001';
  manifest.pipeline_output_schema_version = 'risk-output-v001';
  manifest.status = 'partial';
  manifest.input = { evaluation_path: 'input/source_packet.txt' };
  manifest.artifacts = {};
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(path.join(runDir, 'events.ndjson'), '');
  const evidence = transformed.catalog.records.filter((record) => record.text.trim().split(/\s+/).length >= 5).slice(0, 3);
  const selection = {
    case_id: manifest.case_id,
    model_id: manifest.model_id,
    prompt_version: manifest.prompt_version,
    risks: evidence.map((record, index) => ({
      risk_id: `R${index + 1}`,
      risk_summary: `Risk ${index + 1}`,
      risk_type: index === 0 ? 'Strategic / Market / Technology' : index === 1 ? 'Operational / Supply Chain' : 'Regulatory / Legal / Geopolitical',
      evidence_id: record.evidence_id,
      reasoning: 'Grounded reasoning.',
      financial_impact: 'Potential operating or financial impact.',
      time_horizon: 'Not disclosed in the selected evidence line.',
      monitoring_indicators: [],
      mitigation: 'Not disclosed in the selected evidence line.',
      uncertainty: 'Not disclosed in the selected evidence line.'
    }))
  };
  fs.writeFileSync(path.join(runDir, 'raw', 'response.txt'), `${JSON.stringify(selection)}\n`);
  return { runDir, evidence };
}

function removeRun(runDir) {
  assert.match(path.basename(runDir), /^test-evidence-locator-/);
  fs.rmSync(runDir, { recursive: true, force: true });
}

function main() {
  fs.mkdirSync(RUNS_ROOT, { recursive: true });
  const { runDir, evidence } = makeRun();
  try {
    const located = spawnSync(process.execPath, [LOCATOR, '--run-dir', runDir], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(located.status, 0, located.stderr);
    const output = JSON.parse(fs.readFileSync(path.join(runDir, 'derived', 'pipeline_output.json'), 'utf8'));
    assert.equal(output.risks[0].evidence_quote, evidence[0].text);
    assert.deepEqual(output.risks[0].source_paragraph_ids, [evidence[0].paragraph_id]);
    assert.deepEqual(output.risks[0].source_pages, [evidence[0].pdf_page]);
    const evaluation = spawnSync(process.execPath, [
      EVALUATOR, runDir, '--candidate', 'derived/pipeline_output.json', '--label', 'pipeline'
    ], { cwd: ROOT, encoding: 'utf8' });
    assert.equal(evaluation.status, 0, evaluation.stderr);
    assert.equal(JSON.parse(fs.readFileSync(path.join(runDir, 'evaluation', 'pipeline.json'), 'utf8')).status, 'passed');
    assert.equal(spawnSync(process.execPath, [LOCATOR, '--run-dir', runDir], { cwd: ROOT }).status, 1, 'locator must not overwrite its outputs');
    process.stdout.write('test_evidence_locator: all deterministic tests passed\n');
  } finally {
    removeRun(runDir);
  }
}

main();
