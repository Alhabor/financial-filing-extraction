#!/usr/bin/env node

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { spawn } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'execute_experiment_run.cjs');
const FIXTURE_DIR = path.join(__dirname, 'fixtures', 'execute-run');
const RUNS_ROOT = path.join(ROOT, 'experiments', 'runs');
const TEST_SECRET = 'sk-testcredential123456';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function readFixture(name) {
  return fs.readFileSync(path.join(FIXTURE_DIR, name));
}

function readTextFixture(name) {
  return readFixture(name).toString('utf8');
}

function makeRun(label, endpoint, { image = false, corruptInput = false } = {}) {
  const suffix = `${process.pid}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const runDir = path.join(RUNS_ROOT, `test-execute-run-${label}-${suffix}`);
  const inputDir = path.join(runDir, 'input');
  fs.mkdirSync(inputDir, { recursive: true });

  const modelInput = readTextFixture('model_input.txt');
  fs.writeFileSync(path.join(inputDir, 'model_input.txt'), corruptInput ? `${modelInput}tampered\n` : modelInput);
  fs.writeFileSync(path.join(inputDir, 'prompt.txt'), 'Return the requested JSON.');
  const modelConfig = {
    display_name: 'Test OpenAI-style model',
    provider: 'test-provider',
    interface: 'chat-completions',
    model_id: 'test-model',
    modalities: ['text', 'image'],
    credential_env: 'EXECUTE_TEST_API_KEY',
    endpoint,
    default_parameters: { temperature: 0, max_output_tokens: 64 }
  };
  fs.writeFileSync(path.join(inputDir, 'model_config.json'), `${JSON.stringify(modelConfig, null, 2)}\n`);

  const modality = { requested_modality: image ? 'native-vision' : 'text', actual_modality: image ? 'native-vision' : 'text', images: [] };
  const request = {
    model: modelConfig.model_id,
    stream: false,
    messages: [
      { role: 'system', content: 'Return JSON.' },
      { role: 'user', content: image
        ? [
            { type: 'text', text: 'Analyze the pinned page.' },
            { type: 'image_url', image_url: { url: null } }
          ]
        : 'Analyze the filing.' }
    ]
  };

  if (image) {
    const imageDir = path.join(inputDir, 'images');
    fs.mkdirSync(imageDir, { recursive: true });
    const imagePath = path.join(imageDir, 'page-01.png');
    const imageBytes = Buffer.from(readTextFixture('pinned-page.png.base64').trim(), 'base64');
    fs.writeFileSync(imagePath, imageBytes);
    const relativeImage = path.relative(ROOT, imagePath).split(path.sep).join('/');
    modality.images.push({ path: relativeImage, sha256: sha256(imageBytes), mime_type: 'image/png' });
    request.messages[1].content[1].image_url.url = `<local-image:${relativeImage}>`;
  }

  fs.writeFileSync(path.join(inputDir, 'modality.json'), `${JSON.stringify(modality, null, 2)}\n`);
  fs.writeFileSync(path.join(inputDir, 'request.sanitized.json'), `${JSON.stringify(request, null, 2)}\n`);

  const expectedInput = modelInput;
  const manifest = {
    run_id: path.basename(runDir),
    phase: 'P',
    round: 'P001',
    status: 'planned',
    attempt: 1,
    case_id: 'FIXTURE-FY24',
    dataset_role: 'development',
    model_alias: 'test-model',
    model_display_name: modelConfig.display_name,
    model_id: modelConfig.model_id,
    provider: modelConfig.provider,
    interface: modelConfig.interface,
    profile_id: 'test-profile',
    prompt_version: 'PVTEST',
    output_schema_version: 'risk-output-v001',
    rubric_version: 'RV001',
    input: {
      path: 'input/model_input.txt',
      sha256: sha256(expectedInput),
      requested_modality: modality.requested_modality,
      actual_modality: modality.actual_modality,
      input_view: image ? 'page_images' : 'text',
      image_count: modality.images.length
    },
    parameters: { temperature: 0, max_output_tokens: 64 },
    timing: { started_at_utc: null, ended_at_utc: null, latency_ms: null },
    usage: { input_tokens: null, output_tokens: null, local_runtime_seconds: null },
    harness: { mode: 'dry-run', network_called: false },
    artifacts: {},
    failure: null,
    notes: 'Test fixture.'
  };
  fs.writeFileSync(path.join(runDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return { runDir, request, image: modality.images[0] || null };
}

function removeRun(runDir) {
  const resolved = path.resolve(runDir);
  const relative = path.relative(RUNS_ROOT, resolved);
  assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative));
  assert.match(path.basename(resolved), /^test-execute-run-/);
  fs.rmSync(resolved, { recursive: true, force: true });
}

function invoke(runDir, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT, '--run-dir', runDir, '--confirm-live', '--timeout-ms', String(timeoutMs)], {
      cwd: ROOT,
      env: { PATH: process.env.PATH || '', EXECUTE_TEST_API_KEY: TEST_SECRET },
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    const killTimer = setTimeout(() => child.kill('SIGKILL'), 10000);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      clearTimeout(killTimer);
      resolve({ code, signal, stdout, stderr });
    });
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function allFiles(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...allFiles(target));
    else result.push(target);
  }
  return result;
}

function assertChecksums(runDir) {
  const checksumPath = path.join(runDir, 'checksums.sha256');
  assert.ok(fs.existsSync(checksumPath));
  const rows = fs.readFileSync(checksumPath, 'utf8').trim().split('\n');
  assert.ok(rows.length >= 5);
  for (const row of rows) {
    const match = row.match(/^([a-f0-9]{64})  (.+)$/);
    assert.ok(match, `invalid checksum row: ${row}`);
    const target = path.join(runDir, match[2]);
    assert.ok(fs.existsSync(target), `missing checksummed artifact: ${match[2]}`);
    assert.equal(sha256(fs.readFileSync(target)), match[1], `checksum mismatch: ${match[2]}`);
  }
}

function assertNoSecret(runDir) {
  for (const filePath of allFiles(runDir)) {
    if (path.basename(filePath) === 'checksums.sha256') continue;
    assert.doesNotMatch(fs.readFileSync(filePath, 'utf8'), new RegExp(TEST_SECRET, 'g'), filePath);
  }
}

async function startMockServer() {
  const requests = [];
  const server = http.createServer((request, response) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      const record = {
        path: request.url,
        authorization: request.headers.authorization || null,
        body: Buffer.concat(chunks).toString('utf8')
      };
      requests.push(record);
      if (request.url === '/success') {
        response.writeHead(200, { 'content-type': 'application/json', 'x-request-id': 'mock-success-001', connection: 'close' });
        response.end(JSON.stringify({
          id: 'mock-response-001',
          choices: [{ message: { role: 'assistant', content: '{"risks":[]}' }, finish_reason: 'stop' }],
          usage: { prompt_tokens: 12, completion_tokens: 8 },
          echoed_authorization: `Bearer ${TEST_SECRET}`
        }));
      } else if (request.url === '/error') {
        response.writeHead(500, { 'content-type': 'application/json', connection: 'close' });
        response.end(JSON.stringify({ error: { message: 'mock provider failure', type: 'server_error' } }));
      } else if (request.url === '/timeout') {
        setTimeout(() => {
          response.writeHead(200, { 'content-type': 'application/json', connection: 'close' });
          response.end(JSON.stringify({ choices: [{ message: { content: '{}' } }] }));
        }, 1500);
      } else {
        response.writeHead(404, { 'content-type': 'application/json', connection: 'close' });
        response.end('{}');
      }
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  return {
    requests,
    endpoint(pathname) { return `http://127.0.0.1:${address.port}${pathname}`; },
    async close() {
      if (typeof server.closeAllConnections === 'function') server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
    }
  };
}

async function main() {
  const mock = await startMockServer();
  const runs = [];
  try {
    const success = makeRun('success', mock.endpoint('/success'), { image: true });
    runs.push(success.runDir);
    const successResult = await invoke(success.runDir);
    assert.equal(successResult.code, 0, successResult.stderr);
    const successManifest = readJson(path.join(success.runDir, 'manifest.json'));
    assert.equal(successManifest.status, 'partial');
    assert.equal(successManifest.harness.network_called, true);
    assert.equal(successManifest.provider_response.request_id, 'mock-success-001');
    assert.equal(successManifest.usage.input_tokens, 12);
    assert.ok(fs.existsSync(path.join(success.runDir, 'raw', 'response.body.txt')));
    assert.ok(fs.existsSync(path.join(success.runDir, 'raw', 'response.json')));
    assert.ok(fs.existsSync(path.join(success.runDir, 'raw', 'response.txt')));
    const successBody = fs.readFileSync(path.join(success.runDir, 'raw', 'response.body.txt'), 'utf8');
    assert.match(successBody, /\[REDACTED\]/);
    assert.doesNotMatch(successBody, new RegExp(TEST_SECRET));
    assert.equal(readJson(path.join(success.runDir, 'input', 'request.sanitized.json')).messages[1].content[1].image_url.url, `<local-image:${success.image.path}>`);
    const successRequest = mock.requests.find((request) => request.path === '/success');
    assert.ok(successRequest);
    const capturedImageUrl = JSON.parse(successRequest.body).messages[1].content[1].image_url.url;
    assert.equal(capturedImageUrl, `data:image/png;base64,${readTextFixture('pinned-page.png.base64').trim()}`);
    assert.equal(successRequest.authorization, `Bearer ${TEST_SECRET}`);
    assertNoSecret(success.runDir);
    assertChecksums(success.runDir);
    const successEvents = fs.readFileSync(path.join(success.runDir, 'events.ndjson'), 'utf8').trim().split('\n').map(JSON.parse);
    assert.deepEqual(successEvents.map((event) => event.event), ['dispatch_started', 'response_received', 'raw_capture_completed']);

    const requestCountAfterSuccess = mock.requests.length;
    const rerun = await invoke(success.runDir);
    assert.notEqual(rerun.code, 0);
    assert.match(rerun.stderr, /status must be planned|raw\/ already exists/);
    assert.equal(mock.requests.length, requestCountAfterSuccess);

    const errorRun = makeRun('error', mock.endpoint('/error'));
    runs.push(errorRun.runDir);
    const errorResult = await invoke(errorRun.runDir);
    assert.notEqual(errorResult.code, 0);
    const errorManifest = readJson(path.join(errorRun.runDir, 'manifest.json'));
    assert.equal(errorManifest.status, 'failed');
    assert.match(fs.readFileSync(path.join(errorRun.runDir, 'raw', 'response.body.txt'), 'utf8'), /mock provider failure/);
    assert.equal(readJson(path.join(errorRun.runDir, 'raw', 'response.json')).error.message, 'mock provider failure');
    assert.match(fs.readFileSync(path.join(errorRun.runDir, 'raw', 'stderr.txt'), 'utf8'), /mock provider failure/);
    assertChecksums(errorRun.runDir);

    const timeoutRun = makeRun('timeout', mock.endpoint('/timeout'));
    runs.push(timeoutRun.runDir);
    const timeoutResult = await invoke(timeoutRun.runDir, 1000);
    assert.notEqual(timeoutResult.code, 0);
    assert.equal(readJson(path.join(timeoutRun.runDir, 'manifest.json')).status, 'timeout');
    assert.match(fs.readFileSync(path.join(timeoutRun.runDir, 'raw', 'stderr.txt'), 'utf8'), /aborted|abort|timeout/i);
    assertChecksums(timeoutRun.runDir);

    const mismatchRun = makeRun('hash-mismatch', mock.endpoint('/success'), { corruptInput: true });
    runs.push(mismatchRun.runDir);
    const requestsBeforeMismatch = mock.requests.length;
    const mismatchResult = await invoke(mismatchRun.runDir);
    assert.notEqual(mismatchResult.code, 0);
    assert.match(mismatchResult.stderr, /input hash does not match/);
    assert.equal(mock.requests.length, requestsBeforeMismatch, 'hash mismatch must be rejected before dispatch');
    assert.equal(readJson(path.join(mismatchRun.runDir, 'manifest.json')).status, 'planned');
    assert.ok(!fs.existsSync(path.join(mismatchRun.runDir, 'raw')));

    process.stdout.write('test_execute_experiment_run: all deterministic tests passed\n');
  } finally {
    for (const runDir of runs) {
      if (fs.existsSync(runDir)) removeRun(runDir);
    }
    await mock.close();
  }
}

main().catch((error) => {
  process.stderr.write(`test_execute_experiment_run: ${error.stack || error}\n`);
  process.exitCode = 1;
});
