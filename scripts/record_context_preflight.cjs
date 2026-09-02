#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const RUNS_ROOT = path.join(ROOT, 'experiments', 'runs');

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  if (index < 0 || !process.argv[index + 1]) throw new Error(`Missing --${name}.`);
  return process.argv[index + 1];
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function filesRecursively(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...filesRecursively(target));
    else if (entry.isFile() && entry.name !== 'checksums.sha256' && !entry.name.endsWith('.tmp')) files.push(target);
  }
  return files;
}

function refreshChecksums(runDir) {
  const rows = filesRecursively(runDir)
    .map((filePath) => ({ path: path.relative(runDir, filePath).split(path.sep).join('/'), sha256: sha256File(filePath) }))
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((entry) => `${entry.sha256}  ${entry.path}`);
  fs.writeFileSync(path.join(runDir, 'checksums.sha256'), `${rows.join('\n')}\n`, 'utf8');
}

function main() {
  const runDir = path.resolve(argument('run-dir'));
  const relation = path.relative(RUNS_ROOT, runDir);
  if (!relation || relation.startsWith('..') || path.isAbsolute(relation)) throw new Error('Run directory is outside experiments/runs.');
  const inputTokens = Number(argument('input-tokens'));
  if (!Number.isInteger(inputTokens) || inputTokens < 1) throw new Error('--input-tokens must be a positive integer.');
  const manifestPath = path.join(runDir, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.status !== 'planned') throw new Error(`Run must be planned, found ${manifest.status}.`);
  const contextLength = manifest.parameters?.context_length;
  const outputReserve = manifest.parameters?.max_output_tokens;
  if (!Number.isInteger(contextLength) || !Number.isInteger(outputReserve)) throw new Error('Manifest context or output budget is absent.');
  const passed = inputTokens + outputReserve <= contextLength;
  const report = {
    preflight_version: 'CP001',
    run_id: manifest.run_id,
    tokenizer: 'llama.cpp-/tokenize-concatenated-messages-v001',
    input_tokens: inputTokens,
    reserved_output_tokens: outputReserve,
    required_context_tokens: inputTokens + outputReserve,
    configured_context_tokens: contextLength,
    passed,
    measured_at_utc: new Date().toISOString()
  };
  fs.mkdirSync(path.join(runDir, 'evaluation'), { recursive: true });
  fs.writeFileSync(path.join(runDir, 'evaluation', 'context_preflight.json'), `${JSON.stringify(report, null, 2)}\n`);
  manifest.status = passed ? 'planned' : 'preflight_failed';
  manifest.artifacts.context_preflight = 'evaluation/context_preflight.json';
  manifest.notes = passed
    ? 'Tokenizer preflight passed; live execution remains planned.'
    : `Tokenizer preflight rejected live execution: ${inputTokens} input + ${outputReserve} output exceeds ${contextLength} context tokens.`;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.appendFileSync(path.join(runDir, 'events.ndjson'), `${JSON.stringify({ timestamp_utc: new Date().toISOString(), event: 'context_preflight_completed', status: passed ? 'passed' : 'failed' })}\n`);
  refreshChecksums(runDir);
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!passed) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  process.stderr.write(`record_context_preflight: ${error.message}\n`);
  process.exitCode = 1;
}
