#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const MATERIALIZER = path.join(ROOT, 'scripts', 'materialize_experiment_run.cjs');
const RUNS_ROOT = path.join(ROOT, 'experiments', 'runs', 'P');
const CASES = ['NVDA-FY25', 'COIN-FY24', 'PYPL-FY24', 'BA-FY24'];
const MODELS = ['cloud-deepseek', 'local-gemma', 'finance-llama'];

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
    } else {
      args[key] = true;
    }
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
  const textCells = CASES.flatMap((caseId) => MODELS.map((modelAlias) => ({
    round: 'P001', caseId, modelAlias, profile: 'standard-text-v001'
  })));
  const smokeCells = textCells.filter((cell) => cell.caseId === 'PYPL-FY24');
  const visionCells = ['cloud-deepseek', 'local-gemma'].map((modelAlias) => ({
    round: 'P001V', caseId: 'PYPL-FY24', modelAlias, profile: 'native-vision-v001'
  }));
  if (scope === 'smoke') return smokeCells;
  if (scope === 'text') return textCells;
  if (scope === 'vision-smoke') return visionCells;
  if (scope === 'all') return [...textCells, ...visionCells];
  throw new Error('--scope must be smoke, text, vision-smoke, or all.');
}

function sameCell(manifest, cell, attempt) {
  return manifest.phase === 'P'
    && manifest.round === cell.round
    && manifest.case_id === cell.caseId
    && manifest.model_alias === cell.modelAlias
    && manifest.profile_id === cell.profile
    && manifest.attempt === attempt;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write('Usage: node scripts/materialize_p001.cjs --scope <smoke|text|vision-smoke|all> [--attempt 1]\n');
    return;
  }
  const scope = String(args.scope || 'smoke');
  const attempt = Number(args.attempt || '1');
  if (!Number.isInteger(attempt) || attempt < 1 || attempt > 99) throw new Error('--attempt must be an integer from 1 to 99.');
  const existing = manifests(RUNS_ROOT);
  const created = [];
  const skipped = [];
  for (const cell of matrix(scope)) {
    const prior = existing.find((manifest) => sameCell(manifest, cell, attempt));
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
      '--round', cell.round,
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
  process.stderr.write(`materialize_p001: ${error.message}\n`);
  process.exitCode = 1;
}
