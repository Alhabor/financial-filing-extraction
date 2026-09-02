#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  reasoningText,
  responseUsage,
  providerResponse
} = require('./lib/provider_response.cjs');

const ROOT = path.resolve(__dirname, '..');
const RUNS_ROOT = path.join(ROOT, 'experiments', 'runs');

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function ensureInside(parent, child) {
  const relative = path.relative(parent, child);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Run directory must be an existing child of experiments/runs.');
  }
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
  const index = process.argv.indexOf('--run-dir');
  if (index < 0 || !process.argv[index + 1]) throw new Error('Usage: node scripts/reconcile_experiment_run.cjs --run-dir <path>');
  const runDir = path.resolve(process.argv[index + 1]);
  ensureInside(RUNS_ROOT, runDir);
  const manifestPath = path.join(runDir, 'manifest.json');
  const responsePath = path.join(runDir, 'raw', 'response.json');
  if (!fs.existsSync(manifestPath) || !fs.existsSync(responsePath)) throw new Error('Manifest or raw response is missing.');

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const response = JSON.parse(fs.readFileSync(responsePath, 'utf8'));
  const usage = responseUsage(response, manifest.interface);
  manifest.usage.input_tokens = usage.input_tokens;
  manifest.usage.output_tokens = usage.output_tokens;
  manifest.usage.reasoning_tokens = usage.reasoning_tokens;
  manifest.usage.local_runtime_seconds = usage.local_runtime_seconds;
  manifest.provider_response = providerResponse(response, manifest.interface, 200, manifest.provider_response?.request_id);
  manifest.artifacts.raw_response = 'raw/response.json';
  manifest.artifacts.raw_body = fs.existsSync(path.join(runDir, 'raw', 'response.body.txt')) ? 'raw/response.body.txt' : null;
  manifest.artifacts.events = 'events.ndjson';

  const reasoning = reasoningText(response, manifest.interface);
  if (typeof reasoning === 'string' && reasoning.trim() !== '') {
    const derivedDir = path.join(runDir, 'derived');
    fs.mkdirSync(derivedDir, { recursive: true });
    const reasoningPath = path.join(derivedDir, 'reasoning.txt');
    if (!fs.existsSync(reasoningPath)) fs.writeFileSync(reasoningPath, reasoning, { encoding: 'utf8', flag: 'wx' });
    manifest.artifacts.reasoning = 'derived/reasoning.txt';
  }

  manifest.notes = `${manifest.notes || ''} Provider metrics reconciled from the immutable raw response.`.trim();
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.appendFileSync(path.join(runDir, 'events.ndjson'), `${JSON.stringify({
    timestamp_utc: new Date().toISOString(),
    event: 'provider_metrics_reconciled',
    source: 'raw/response.json'
  })}\n`, 'utf8');
  refreshChecksums(runDir);
  process.stdout.write(`${manifest.run_id}: reconciled ${usage.input_tokens ?? 'unknown'} input and ${usage.output_tokens ?? 'unknown'} output tokens\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`reconcile_experiment_run: ${error.message}\n`);
  process.exitCode = 1;
}
