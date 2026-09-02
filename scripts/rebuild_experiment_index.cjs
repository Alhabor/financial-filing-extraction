#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const RUNS_ROOT = path.join(ROOT, 'experiments', 'runs');
const INDEX_PATH = path.join(ROOT, 'experiments', 'INDEX.csv');

const COLUMNS = [
  'run_id', 'phase', 'round', 'case_id', 'model_alias', 'model_id', 'prompt_version', 'status',
  'dataset_role', 'started_at_utc', 'ended_at_utc', 'latency_ms', 'input_tokens', 'output_tokens',
  'estimated_api_cost_usd', 'local_runtime_seconds', 'git_commit', 'notes'
];

function csv(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function manifests(directory) {
  if (!fs.existsSync(directory)) return [];
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...manifests(target));
    else if (entry.isFile() && entry.name === 'manifest.json') found.push(target);
  }
  return found;
}

function row(manifest) {
  const values = {
    run_id: manifest.run_id,
    phase: manifest.phase,
    round: manifest.round,
    case_id: manifest.case_id,
    model_alias: manifest.model_alias,
    model_id: manifest.model_id,
    prompt_version: manifest.prompt_version,
    status: manifest.status,
    dataset_role: manifest.dataset_role || (manifest.phase === 'P' ? 'development' : ''),
    started_at_utc: manifest.timing?.started_at_utc,
    ended_at_utc: manifest.timing?.ended_at_utc,
    latency_ms: manifest.timing?.latency_ms,
    input_tokens: manifest.usage?.input_tokens,
    output_tokens: manifest.usage?.output_tokens,
    estimated_api_cost_usd: manifest.usage?.estimated_api_cost_usd,
    local_runtime_seconds: manifest.usage?.local_runtime_seconds,
    git_commit: manifest.environment?.git_commit,
    notes: manifest.notes
  };
  return COLUMNS.map((column) => csv(values[column])).join(',');
}

const records = manifests(RUNS_ROOT)
  .map((manifestPath) => JSON.parse(fs.readFileSync(manifestPath, 'utf8')))
  .sort((left, right) => left.run_id.localeCompare(right.run_id));
const output = [COLUMNS.join(','), ...records.map(row)].join('\n') + '\n';
fs.writeFileSync(INDEX_PATH, output, 'utf8');
process.stdout.write(`Indexed ${records.length} experiment runs\n`);
