#!/usr/bin/env node

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'evaluate_experiment_run.cjs');
const FIXTURE = path.join(__dirname, 'fixtures', 'valid-run');

function copyFixture(label) {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), `evaluate-run-${label}-`));
  const run = path.join(base, 'run');
  fs.cpSync(FIXTURE, run, { recursive: true });
  return run;
}

function invoke(run, ...args) {
  return spawnSync(process.execPath, [SCRIPT, run, ...args], { encoding: 'utf8' });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function responsePath(run) {
  return path.join(run, 'raw', 'response.txt');
}

function automaticPath(run) {
  return path.join(run, 'evaluation', 'automatic.json');
}

function parsedPath(run) {
  return path.join(run, 'derived', 'parsed.json');
}

function main() {
  const help = spawnSync(process.execPath, [SCRIPT, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /Usage: node scripts\/evaluate_experiment_run\.cjs/);

  const plainRun = copyFixture('plain');
  const plain = invoke(plainRun);
  assert.equal(plain.status, 0, plain.stderr);
  assert.equal(readJson(automaticPath(plainRun)).status, 'passed');
  assert.equal(readJson(automaticPath(plainRun)).parse.format, 'plain-json');
  assert.equal(readJson(parsedPath(plainRun)).risks.length, 3);
  assert.equal(invoke(plainRun).status, 1, 'existing outputs must not be overwritten');
  assert.equal(invoke(plainRun, '--force').status, 0);

  const fencedRun = copyFixture('fenced');
  const plainResponse = fs.readFileSync(responsePath(fencedRun), 'utf8');
  fs.writeFileSync(responsePath(fencedRun), `\n\`\`\`json\n${plainResponse}\n\`\`\`\n`, 'utf8');
  const fenced = invoke(fencedRun);
  assert.equal(fenced.status, 0, fenced.stderr);
  assert.equal(readJson(automaticPath(fencedRun)).parse.format, 'fenced-json');

  const schemaRun = copyFixture('schema');
  const schemaOutput = readJson(responsePath(schemaRun));
  schemaOutput.risks.pop();
  fs.writeFileSync(responsePath(schemaRun), JSON.stringify(schemaOutput), 'utf8');
  const schema = invoke(schemaRun);
  assert.equal(schema.status, 1);
  assert.equal(readJson(automaticPath(schemaRun)).status, 'failed');
  assert.ok(readJson(automaticPath(schemaRun)).schema.errors.some((error) => error.includes('at least 3')));

  const citationRun = copyFixture('citation');
  const citationOutput = readJson(responsePath(citationRun));
  citationOutput.risks[0].evidence_quote = 'a disruption could delay production';
  citationOutput.risks[0].source_paragraph_ids = ['FIXTURE-FY24-P001'];
  fs.writeFileSync(responsePath(citationRun), JSON.stringify(citationOutput), 'utf8');
  const citation = invoke(citationRun);
  assert.equal(citation.status, 1);
  const citationEvaluation = readJson(automaticPath(citationRun));
  assert.equal(citationEvaluation.status, 'failed');
  assert.equal(citationEvaluation.citations.risk_checks[0].exact_substring_in_input, true);
  assert.ok(citationEvaluation.citations.errors.some((error) => error.includes('supported')));

  const missingRun = copyFixture('missing');
  const missingOutput = readJson(responsePath(missingRun));
  missingOutput.risks[1].source_paragraph_ids = ['FIXTURE-FY24-P999'];
  missingOutput.risks[1].source_pages = [99];
  fs.writeFileSync(responsePath(missingRun), JSON.stringify(missingOutput), 'utf8');
  const missing = invoke(missingRun);
  assert.equal(missing.status, 1);
  const missingEvaluation = readJson(automaticPath(missingRun));
  assert.ok(missingEvaluation.citations.errors.some((error) => error.includes('missing paragraph IDs')));
  assert.ok(missingEvaluation.citations.errors.some((error) => error.includes('not present in input')));

  const rawBefore = fs.readFileSync(responsePath(plainRun), 'utf8');
  invoke(plainRun, '--force');
  assert.equal(fs.readFileSync(responsePath(plainRun), 'utf8'), rawBefore, 'raw response must remain unchanged');
  process.stdout.write('test_evaluate_experiment_run: all deterministic tests passed\n');
}

main();
