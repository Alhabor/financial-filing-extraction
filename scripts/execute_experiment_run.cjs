#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {
  assistantText,
  reasoningText,
  responseUsage,
  providerResponse
} = require('./lib/provider_response.cjs');

const ROOT = path.resolve(__dirname, '..');

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

function usage() {
  return [
    'Usage:',
    '  node scripts/execute_experiment_run.cjs --run-dir <path> --confirm-live [--timeout-ms 900000]',
    '',
    'The run must already be materialized and have status=planned.',
    'Cloud credentials are read only from the environment named in harness/config/models.json.'
  ].join('\n');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJsonAtomic(filePath, value) {
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, filePath);
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function relativePath(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function ensureInside(parent, child, label) {
  const relative = path.relative(parent, child);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`${label} resolves outside the allowed directory`);
  }
}

function mimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.webp') return 'image/webp';
  return 'image/png';
}

function decodePlaceholder(value, runDir) {
  const match = typeof value === 'string' && value.match(/^<local-image:(.+)>$/);
  if (!match) return null;
  const imagePath = path.resolve(ROOT, match[1]);
  ensureInside(runDir, imagePath, 'Image placeholder');
  if (!fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) {
    throw new Error(`Image placeholder is missing: ${match[1]}`);
  }
  return {
    base64: fs.readFileSync(imagePath).toString('base64'),
    mime: mimeType(imagePath)
  };
}

function hydrateRequest(value, runDir, interfaceName, key = null) {
  if (Array.isArray(value)) return value.map((item) => hydrateRequest(item, runDir, interfaceName, key));
  if (!value || typeof value !== 'object') {
    const image = decodePlaceholder(value, runDir);
    if (!image) return value;
    return key === 'images' || interfaceName === 'ollama-chat'
      ? image.base64
      : `data:${image.mime};base64,${image.base64}`;
  }

  const output = {};
  for (const [childKey, child] of Object.entries(value)) {
    output[childKey] = hydrateRequest(child, runDir, interfaceName, childKey);
  }
  return output;
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

function sanitizedError(error) {
  const message = String(error?.message || error || 'Unknown error')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/\bsk-[A-Za-z0-9]{12,}\b/gi, '[REDACTED]');
  return { name: error?.name || 'Error', message };
}

function redactSecrets(value, secrets) {
  let output = String(value);
  for (const secret of secrets.filter(Boolean)) output = output.split(secret).join('[REDACTED]');
  return output
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]')
    .replace(/\bsk-[A-Za-z0-9]{12,}\b/gi, '[REDACTED]');
}

function appendEvent(runDir, event, details = {}) {
  const record = { timestamp_utc: new Date().toISOString(), event, ...details };
  fs.appendFileSync(path.join(runDir, 'events.ndjson'), `${JSON.stringify(record)}\n`, 'utf8');
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  if (args['confirm-live'] !== true) throw new Error('Live execution requires the explicit --confirm-live flag.');
  if (typeof args['run-dir'] !== 'string') throw new Error('Missing required argument --run-dir.');

  const runDir = path.resolve(args['run-dir']);
  const runsRoot = path.join(ROOT, 'experiments', 'runs');
  ensureInside(runsRoot, runDir, 'Run directory');
  const manifestPath = path.join(runDir, 'manifest.json');
  const requestPath = path.join(runDir, 'input', 'request.sanitized.json');
  const modelConfigPath = path.join(runDir, 'input', 'model_config.json');
  const modalityPath = path.join(runDir, 'input', 'modality.json');
  const modelInputPath = path.join(runDir, 'input', 'model_input.txt');
  if (![manifestPath, requestPath, modelConfigPath, modalityPath, modelInputPath].every((filePath) => fs.existsSync(filePath))) {
    throw new Error('Run is not fully materialized.');
  }

  const manifest = readJson(manifestPath);
  if (manifest.status !== 'planned') throw new Error(`Run status must be planned, found ${manifest.status}. Create a new attempt instead of overwriting.`);
  const model = readJson(modelConfigPath);
  if (model.model_id !== manifest.model_id) throw new Error('Archived model config does not match the run manifest.');
  if (!model.endpoint) throw new Error(`Model ${manifest.model_alias} has no configured endpoint.`);
  const modelInput = fs.readFileSync(modelInputPath, 'utf8');
  if (sha256Text(modelInput) !== manifest.input.sha256) throw new Error('Materialized model input hash does not match the manifest.');
  const modality = readJson(modalityPath);
  for (const image of modality.images || []) {
    const imagePath = path.resolve(ROOT, image.path);
    ensureInside(runDir, imagePath, 'Materialized image');
    if (!fs.existsSync(imagePath) || sha256File(imagePath) !== image.sha256) {
      throw new Error(`Materialized image hash mismatch: ${image.path}`);
    }
  }

  const credential = model.credential_env ? process.env[model.credential_env] : null;
  if (model.credential_env && !credential) throw new Error(`Required credential environment variable is absent: ${model.credential_env}`);

  const timeoutMs = Number(args['timeout-ms'] || 900000);
  if (!Number.isFinite(timeoutMs) || timeoutMs < 1000) throw new Error('--timeout-ms must be at least 1000.');

  const rawDir = path.join(runDir, 'raw');
  if (fs.existsSync(rawDir)) throw new Error('raw/ already exists. Create a new attempt instead of overwriting.');
  fs.mkdirSync(rawDir);

  const startedAt = new Date();
  manifest.status = 'running';
  manifest.timing.started_at_utc = startedAt.toISOString();
  manifest.harness.mode = 'live';
  manifest.harness.network_called = true;
  manifest.harness.endpoint = model.endpoint;
  manifest.notes = 'Live execution started. Raw and failure artifacts are immutable; retries require a new attempt.';
  writeJsonAtomic(manifestPath, manifest);
  appendEvent(runDir, 'dispatch_started', { provider: manifest.provider, model_id: manifest.model_id });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const sanitizedRequest = readJson(requestPath);
    const liveRequest = hydrateRequest(sanitizedRequest, runDir, model.interface);
    const headers = { 'Content-Type': 'application/json' };
    if (credential) headers.Authorization = `Bearer ${credential}`;

    const response = await fetch(model.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(liveRequest),
      signal: controller.signal
    });
    const responseBody = redactSecrets(await response.text(), [credential]);
    fs.writeFileSync(path.join(rawDir, 'response.body.txt'), responseBody, { encoding: 'utf8', flag: 'wx' });
    appendEvent(runDir, 'response_received', { http_status: response.status });

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseBody);
    } catch {
      throw new Error(`Provider returned non-JSON content with HTTP ${response.status}.`);
    }
    fs.writeFileSync(path.join(rawDir, 'response.json'), `${JSON.stringify(parsedResponse, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });

    // Record provider metadata before validating assistant content so a length-limited
    // reasoning-only response remains measurable instead of looking like no response.
    const usage = responseUsage(parsedResponse, model.interface);
    manifest.usage.input_tokens = usage.input_tokens;
    manifest.usage.output_tokens = usage.output_tokens;
    manifest.usage.reasoning_tokens = usage.reasoning_tokens;
    manifest.usage.local_runtime_seconds = usage.local_runtime_seconds;
    manifest.provider_response = providerResponse(
      parsedResponse,
      model.interface,
      response.status,
      response.headers.get('x-request-id') || response.headers.get('request-id')
    );
    manifest.artifacts.raw_response = 'raw/response.json';
    manifest.artifacts.raw_body = 'raw/response.body.txt';
    manifest.artifacts.events = 'events.ndjson';
    const reasoning = reasoningText(parsedResponse, model.interface);
    if (typeof reasoning === 'string' && reasoning.trim() !== '') {
      const derivedDir = path.join(runDir, 'derived');
      fs.mkdirSync(derivedDir, { recursive: true });
      fs.writeFileSync(path.join(derivedDir, 'reasoning.txt'), reasoning, { encoding: 'utf8', flag: 'wx' });
      manifest.artifacts.reasoning = 'derived/reasoning.txt';
    }
    if (!response.ok) {
      const providerMessage = parsedResponse?.error?.message || parsedResponse?.message || `HTTP ${response.status}`;
      throw new Error(`Provider request failed: ${providerMessage}`);
    }

    const text = assistantText(parsedResponse, model.interface);
    if (typeof text !== 'string' || text.trim() === '') throw new Error('Provider response did not contain assistant text.');
    fs.writeFileSync(path.join(rawDir, 'response.txt'), text, { encoding: 'utf8', flag: 'wx' });

    const endedAt = new Date();
    manifest.status = 'partial';
    manifest.timing.ended_at_utc = endedAt.toISOString();
    manifest.timing.latency_ms = endedAt.getTime() - startedAt.getTime();
    manifest.artifacts.raw_text = 'raw/response.txt';
    manifest.failure = null;
    manifest.notes = 'Raw response captured successfully. Automatic parsing and citation validation are still required before status=completed.';
    writeJsonAtomic(manifestPath, manifest);
    appendEvent(runDir, 'raw_capture_completed', { status: manifest.status });
    refreshChecksums(runDir);

    process.stdout.write(`${JSON.stringify({
      run_id: manifest.run_id,
      status: manifest.status,
      provider: manifest.provider,
      latency_ms: manifest.timing.latency_ms,
      input_tokens: manifest.usage.input_tokens,
      output_tokens: manifest.usage.output_tokens,
      raw_text: relativePath(path.join(rawDir, 'response.txt'))
    }, null, 2)}\n`);
  } catch (error) {
    const endedAt = new Date();
    const safeError = sanitizedError(error);
    manifest.status = error?.name === 'AbortError' ? 'timeout' : 'failed';
    manifest.timing.ended_at_utc = endedAt.toISOString();
    manifest.timing.latency_ms = endedAt.getTime() - startedAt.getTime();
    manifest.failure = safeError;
    manifest.notes = 'Live execution failed. Preserve this attempt and create a new attempt for any retry.';
    fs.writeFileSync(path.join(rawDir, 'stderr.txt'), `${safeError.name}: ${safeError.message}\n`, { encoding: 'utf8', flag: 'wx' });
    appendEvent(runDir, 'dispatch_failed', { status: manifest.status, error_name: safeError.name, error_message: safeError.message });
    writeJsonAtomic(manifestPath, manifest);
    refreshChecksums(runDir);
    throw new Error(`${manifest.run_id}: ${safeError.message}`);
  } finally {
    clearTimeout(timer);
  }
}

main().catch((error) => {
  process.stderr.write(`execute_experiment_run: ${sanitizedError(error).message}\n`);
  process.exitCode = 1;
});
