#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const MODEL_CONFIG_PATH = path.join(ROOT, 'harness', 'config', 'models.json');
const PROFILE_CONFIG_PATH = path.join(ROOT, 'harness', 'config', 'profiles.json');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      throw new Error(`Unexpected argument: ${token}`);
    }
    const withoutPrefix = token.slice(2);
    const equalsIndex = withoutPrefix.indexOf('=');
    let key = withoutPrefix;
    let value = true;
    if (equalsIndex >= 0) {
      key = withoutPrefix.slice(0, equalsIndex);
      value = withoutPrefix.slice(equalsIndex + 1);
    } else if (argv[i + 1] && !argv[i + 1].startsWith('--')) {
      value = argv[i + 1];
      i += 1;
    }
    if (args[key] === undefined) {
      args[key] = value;
    } else if (Array.isArray(args[key])) {
      args[key].push(value);
    } else {
      args[key] = [args[key], value];
    }
  }
  return args;
}

function asArray(value) {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function required(args, key) {
  const value = args[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Missing required argument --${key}`);
  }
  return value;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function sha256Text(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function relativePath(filePath) {
  return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function gitCommit() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function utcStamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace('.', '');
}

function safePart(value, label) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)) {
    throw new Error(`Unsafe ${label}: ${value}`);
  }
  return value;
}

function imageArtifact(imagePath, index, inputDir) {
  const source = path.resolve(imagePath);
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
    throw new Error(`Image does not exist or is not a file: ${imagePath}`);
  }
  const extension = path.extname(source).toLowerCase() || '.bin';
  const target = path.join(inputDir, 'images', `page-${String(index + 1).padStart(2, '0')}${extension}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
  return {
    path: relativePath(target),
    sha256: sha256File(target),
    mime_type: extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' : 'image/png'
  };
}

function compactObject(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== null && item !== undefined));
}

function buildRequest(model, prompt, caseText, caseId, promptVersion, actualModality, images, parameters) {
  const systemContent = `${prompt.trim()}\n\nHarness metadata (copy these values exactly into the top-level JSON):\n- case_id: ${caseId}\n- model_id: ${model.model_id}\n- prompt_version: ${promptVersion}`;
  const request = {
    model: model.model_id,
    stream: false
  };

  if (model.interface === 'ollama-chat') {
    const userMessage = {
      role: 'user',
      content: actualModality === 'native-vision'
        ? 'Analyze the supplied page images using the task and output contract.'
        : caseText
    };
    if (actualModality === 'native-vision') {
      userMessage.images = images.map((image) => `<local-image:${image.path}>`);
    }
    request.messages = [{ role: 'system', content: systemContent }, userMessage];
    request.options = compactObject({
      temperature: parameters.temperature,
      top_p: parameters.top_p,
      num_predict: parameters.max_output_tokens,
      seed: parameters.seed,
      num_ctx: parameters.context_length
    });
    return request;
  }

  const userContent = actualModality === 'native-vision'
    ? [
        { type: 'text', text: 'Analyze the supplied page images using the task and output contract.' },
        ...images.map((image) => ({
          type: 'image_url',
          image_url: { url: `<local-image:${image.path}>` }
        }))
      ]
    : caseText;
  request.messages = [
    { role: 'system', content: systemContent },
    { role: 'user', content: userContent }
  ];
  Object.assign(request, compactObject({
    temperature: parameters.temperature,
    top_p: parameters.top_p,
    max_tokens: parameters.max_output_tokens,
    seed: parameters.seed
  }));
  return request;
}

function assertSanitized(value, location = 'request') {
  const serialized = JSON.stringify(value);
  const forbiddenKey = value && typeof value === 'object'
    ? Object.keys(value).find((key) => /authorization|api[_-]?key|secret|private[_-]?key/i.test(key))
    : null;
  if (forbiddenKey) {
    throw new Error(`Sanitized request contains a forbidden credential field at ${location}: ${forbiddenKey}`);
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      assertSanitized(child, `${location}.${key}`);
    }
  }
  const forbiddenValue = [
    /bearer\s+[A-Za-z0-9._-]+/i,
    /\bsk-[A-Za-z0-9]{12,}\b/i
  ].find((pattern) => pattern.test(serialized));
  if (forbiddenValue) {
    throw new Error(`Sanitized request contains a forbidden credential pattern: ${forbiddenValue}`);
  }
}

function buildChecksums(files) {
  return files
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((file) => `${file.sha256}  ${file.path}`)
    .join('\n') + '\n';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const caseId = safePart(required(args, 'case-id'), 'case id');
  const modelAlias = safePart(required(args, 'model-alias'), 'model alias');
  const profileId = safePart(required(args, 'profile'), 'profile');
  const phase = safePart(String(args.phase || 'P'), 'phase');
  const round = safePart(String(args.round || 'P001'), 'round');
  const attemptNumber = Number(args.attempt || '1');
  if (!Number.isInteger(attemptNumber) || attemptNumber < 1 || attemptNumber > 99) {
    throw new Error('--attempt must be a positive integer from 1 to 99');
  }
  const attempt = String(attemptNumber).padStart(2, '0');

  const models = readJson(MODEL_CONFIG_PATH);
  const profiles = readJson(PROFILE_CONFIG_PATH);
  const model = models[modelAlias];
  const profile = profiles[profileId];
  if (!model) throw new Error(`Unknown model alias: ${modelAlias}`);
  if (!profile) throw new Error(`Unknown profile: ${profileId}`);

  const packetDir = path.join(ROOT, 'data', 'processed', 'case_packets', caseId);
  const packetPath = path.join(packetDir, 'packet.txt');
  const packetManifestPath = path.join(packetDir, 'packet.json');
  if (!fs.existsSync(packetPath) || !fs.existsSync(packetManifestPath)) {
    throw new Error(`Frozen case packet does not exist for ${caseId}; run scripts/build_case_packets.cjs first.`);
  }
  const packetManifest = readJson(packetManifestPath);
  if (packetManifest.case_id !== caseId) throw new Error(`Frozen packet case_id mismatch: ${packetManifest.case_id}`);
  const inputPath = packetPath;
  const promptPath = path.join(ROOT, profile.prompt_path);
  if (!fs.existsSync(promptPath)) throw new Error(`Prompt does not exist: ${relativePath(promptPath)}`);

  const fallbackReason = args['fallback-reason'] || null;
  const actualModality = fallbackReason ? 'text_fallback' : profile.actual_modality;
  const requestedModality = profile.requested_modality;
  if (actualModality === 'native-vision' && !model.modalities.includes('image')) {
    throw new Error(`Model ${modelAlias} is not configured for image input; materialize a text fallback explicitly.`);
  }

  if (packetManifest.model_input?.text_sha256 !== sha256File(packetPath)) {
    throw new Error(`Frozen packet text hash mismatch for ${caseId}.`);
  }
  const locatorPath = path.join(ROOT, packetManifest.model_input.locator_path);
  if (!fs.existsSync(locatorPath) || packetManifest.model_input.locator_sha256 !== sha256File(locatorPath)) {
    throw new Error(`Frozen packet locator hash mismatch for ${caseId}.`);
  }
  const packetImages = (packetManifest.model_input?.images || []).map((image) => {
    const imagePath = path.join(ROOT, image.path);
    if (!fs.existsSync(imagePath) || image.sha256 !== sha256File(imagePath)) {
      throw new Error(`Frozen packet image hash mismatch: ${image.path}`);
    }
    return imagePath;
  });
  const imageArgs = actualModality === 'native-vision'
    ? (args.image === undefined ? packetImages : asArray(args.image))
    : [];
  if (actualModality === 'native-vision' && imageArgs.length === 0) {
    throw new Error('Native vision materialization requires at least one --image path.');
  }
  if (actualModality !== 'native-vision' && imageArgs.length > 0) {
    throw new Error('--image is only valid when actual modality is native-vision.');
  }
  if (actualModality === 'native-vision') {
    const requestedImages = imageArgs.map((imagePath) => path.resolve(imagePath));
    const canonicalImages = packetImages.map((imagePath) => path.resolve(imagePath));
    if (JSON.stringify(requestedImages) !== JSON.stringify(canonicalImages)) {
      throw new Error('Native vision runs must use every frozen packet image in canonical order.');
    }
  }

  const caseText = fs.readFileSync(inputPath, 'utf8');
  const prompt = fs.readFileSync(promptPath, 'utf8');
  const parameters = {
    temperature: null,
    top_p: null,
    max_output_tokens: null,
    seed: null,
    context_length: null,
    ...(model.default_parameters || {}),
    ...(profile.parameters || {})
  };
  const outputRoot = path.resolve(String(args['output-root'] || path.join('experiments', 'runs')));
  const runId = `${round}-${caseId}-${modelAlias}-${utcStamp()}-${crypto.randomBytes(3).toString('hex')}-a${attempt}`;
  const runDir = path.join(outputRoot, phase, runId);
  if (fs.existsSync(runDir)) throw new Error(`Refusing to overwrite existing run: ${runDir}`);

  const inputDir = path.join(runDir, 'input');
  fs.mkdirSync(path.dirname(runDir), { recursive: true });
  fs.mkdirSync(runDir);
  fs.mkdirSync(inputDir);
  fs.writeFileSync(path.join(inputDir, 'model_input.txt'), caseText, 'utf8');
  fs.writeFileSync(path.join(inputDir, 'prompt.txt'), prompt, 'utf8');
  writeJson(path.join(inputDir, 'model_config.json'), model);
  writeJson(path.join(inputDir, 'profile.json'), profile);

  const images = imageArgs.map((imagePath, index) => imageArtifact(imagePath, index, inputDir));
  const modality = {
    requested_modality: requestedModality,
    actual_modality: actualModality,
    input_view: actualModality === 'native-vision' ? 'page_images' : 'text',
    fallback_allowed: Boolean(profile.fallback_allowed),
    fallback_reason: fallbackReason,
    images
  };
  writeJson(path.join(inputDir, 'modality.json'), modality);

  const request = buildRequest(model, prompt, caseText, caseId, profile.prompt_version, actualModality, images, parameters);
  assertSanitized(request);
  writeJson(path.join(inputDir, 'request.sanitized.json'), request);

  const manifest = {
    run_id: runId,
    phase,
    round,
    status: 'planned',
    attempt: Number(attempt),
    case_id: caseId,
    dataset_role: packetManifest.dataset_role,
    model_alias: modelAlias,
    model_display_name: model.display_name,
    model_id: model.model_id,
    model_config_version: model.config_version || null,
    provider: model.provider,
    interface: model.interface,
    profile_id: profileId,
    prompt_version: profile.prompt_version,
    output_schema_version: 'risk-output-v001',
    rubric_version: 'RV001',
    input: {
      path: relativePath(path.join(inputDir, 'model_input.txt')),
      source_path: relativePath(inputPath),
      packet_id: packetManifest.packet_id,
      canonical_pdf_path: packetManifest.source.pdf_path,
      sha256: sha256Text(caseText),
      requested_modality: requestedModality,
      actual_modality: actualModality,
      input_view: actualModality === 'native-vision' ? 'page_images' : 'text',
      fallback_reason: fallbackReason,
      image_count: images.length
    },
    parameters,
    tools: {
      external_search: Boolean(profile.allow_external_search),
      rag: Boolean(profile.allow_rag),
      human_intervention: Boolean(profile.allow_human_intervention)
    },
    timing: {
      started_at_utc: null,
      ended_at_utc: null,
      latency_ms: null,
      time_to_first_token_ms: null
    },
    usage: {
      input_tokens: null,
      output_tokens: null,
      estimated_api_cost_usd: null,
      local_runtime_seconds: null
    },
    environment: {
      git_commit: gitCommit(),
      runtime: `node ${process.version}`,
      hardware: `${os.platform()} ${os.arch()}`
    },
    harness: {
      mode: 'dry-run',
      network_called: false,
      credential_env_name: model.credential_env,
      case_packet_version: packetManifest.packet_version
    },
    artifacts: {
      model_input: 'input/model_input.txt',
      prompt: 'input/prompt.txt',
      modality: 'input/modality.json',
      request_sanitized: 'input/request.sanitized.json',
      model_config: 'input/model_config.json',
      profile: 'input/profile.json',
      checksums: 'checksums.sha256'
    },
    secret_policy: 'Credentials and authorization headers are never written to experiment artifacts.',
    failure: null,
    notes: 'Materialized without invoking a model. This run is not an experiment result.'
  };
  writeJson(path.join(runDir, 'manifest.json'), manifest);

  const checksumFiles = [
    'input/model_input.txt',
    'input/prompt.txt',
    'input/modality.json',
    'input/request.sanitized.json',
    'input/model_config.json',
    'input/profile.json',
    'manifest.json'
  ].map((relative) => ({
    path: relative,
    sha256: sha256File(path.join(runDir, relative))
  }));
  for (const image of images) {
    checksumFiles.push({
      path: image.path.replace(`${relativePath(runDir)}/`, ''),
      sha256: image.sha256
    });
  }
  fs.writeFileSync(path.join(runDir, 'checksums.sha256'), buildChecksums(checksumFiles), 'utf8');

  process.stdout.write(`${JSON.stringify({
    mode: 'dry-run',
    run_id: runId,
    run_dir: relativePath(runDir),
    model_alias: modelAlias,
    profile: profileId,
    actual_modality: actualModality,
    network_called: false
  }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`materialize_experiment_run: ${error.message}\n`);
  process.exitCode = 1;
}
