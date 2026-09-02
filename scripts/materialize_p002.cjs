#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const MATERIALIZER = path.join(ROOT, 'scripts', 'materialize_experiment_run.cjs');
const RUNS_ROOT = path.join(ROOT, 'experiments', 'runs', 'P');
const CONFIGURATIONS = [
  ['cloud-deepseek', 'optimized-deepseek-text-v002'],
  ['local-gemma', 'optimized-gemma-text-v002'],
  ['finance-llama', 'optimized-finance-text-v002']
];

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`Unexpected argument: ${token}`);
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      args[key] = next;
      index += 1;
    } else args[key] = true;
  }
  return args;
}

function manifests(directory) {
  if (!fs.existsSync(directory)) return [];
  const found = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...manifests(target));
    else if (entry.isFile() && entry.name === 'manifest.json') found.push(JSON.parse(fs.readFileSync(target, 'utf8')));
  }
  return found;
}

function matrix(scope) {
  const cases = scope === 'smoke'
    ? ['PYPL-FY24']
    : scope === 'tuning'
      ? ['PYPL-FY24', 'COIN-FY24', 'NVDA-FY25']
      : scope === 'holdout'
        ? ['BA-FY24']
        : null;
  if (!cases) throw new Error('--scope must be smoke, tuning, or holdout.');
  return cases.flatMap((caseId) => CONFIGURATIONS.map(([modelAlias, profile]) => ({ caseId, modelAlias, profile })));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write('Usage: node scripts/materialize_p002.cjs --scope <smoke|tuning|holdout> [--attempt 1]\n');
    return;
  }
  const scope = String(args.scope || 'smoke');
  const attempt = Number(args.attempt || '1');
  if (!Number.isInteger(attempt) || attempt < 1 || attempt > 99) throw new Error('--attempt must be an integer from 1 to 99.');
  const existing = manifests(RUNS_ROOT);
  const created = [];
  const skipped = [];
  for (const cell of matrix(scope)) {
    const prior = existing.find((manifest) => manifest.phase === 'P'
      && manifest.round === 'P002'
      && manifest.case_id === cell.caseId
      && manifest.model_alias === cell.modelAlias
      && manifest.profile_id === cell.profile
      && manifest.attempt === attempt);
    if (prior) {
      skipped.push({ ...cell, run_id: prior.run_id, status: prior.status });
      continue;
    }
    const result = JSON.parse(execFileSync(process.execPath, [
      MATERIALIZER,
      '--case-id', cell.caseId,
      '--model-alias', cell.modelAlias,
      '--profile', cell.profile,
      '--phase', 'P',
      '--round', 'P002',
      '--attempt', String(attempt)
    ], { cwd: ROOT, encoding: 'utf8' }));
    created.push({ ...cell, run_id: result.run_id, run_dir: result.run_dir });
  }
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'rebuild_experiment_index.cjs')], { cwd: ROOT, stdio: 'inherit' });
  process.stdout.write(`${JSON.stringify({ scope, attempt, created, skipped }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`materialize_p002: ${error.message}\n`);
  process.exitCode = 1;
}
