#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const RUNS_ROOT = path.join(ROOT, 'experiments', 'runs');
const LOCATOR_VERSION = 'EL001';

function sha256Text(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function ensureInside(parent, child) {
  const relative = path.relative(parent, child);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Run directory must be an existing child of experiments/runs.');
  }
}

function parseJsonResponse(text) {
  const trimmed = text.replace(/^\uFEFF/, '').trim();
  const fenced = trimmed.match(/^```(?:json)?[ \t]*(?:\r?\n)?([\s\S]*?)(?:\r?\n)?[ \t]*```$/i);
  return JSON.parse(fenced ? fenced[1].trim() : trimmed);
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

function validateSelection(selection, manifest, recordById) {
  const errors = [];
  if (selection?.case_id !== manifest.case_id) errors.push('case_id does not match the manifest');
  if (selection?.model_id !== manifest.model_id) errors.push('model_id does not match the manifest');
  if (selection?.prompt_version !== manifest.prompt_version) errors.push('prompt_version does not match the manifest');
  if (!Array.isArray(selection?.risks) || selection.risks.length !== 3) errors.push('risks must contain exactly three objects');
  const risks = Array.isArray(selection?.risks) ? selection.risks : [];
  const expectedIds = ['R1', 'R2', 'R3'];
  if (JSON.stringify(risks.map((risk) => risk?.risk_id)) !== JSON.stringify(expectedIds)) {
    errors.push('risk_id values must be ordered R1, R2, R3');
  }
  const selectedEvidence = new Set();
  for (const risk of risks) {
    const prefix = risk?.risk_id || 'unknown risk';
    const requiredStrings = [
      'risk_summary', 'risk_type', 'evidence_id', 'reasoning', 'financial_impact',
      'time_horizon', 'mitigation', 'uncertainty'
    ];
    for (const field of requiredStrings) {
      if (typeof risk?.[field] !== 'string' || risk[field].trim() === '') errors.push(`${prefix}.${field} must be a non-empty string`);
    }
    if (!Array.isArray(risk?.monitoring_indicators) || risk.monitoring_indicators.some((item) => typeof item !== 'string')) {
      errors.push(`${prefix}.monitoring_indicators must be an array of strings`);
    }
    const record = recordById.get(risk?.evidence_id);
    if (!record) errors.push(`${prefix}.evidence_id does not exist in the frozen catalog`);
    if (selectedEvidence.has(risk?.evidence_id)) errors.push(`${prefix}.evidence_id duplicates another risk`);
    selectedEvidence.add(risk?.evidence_id);
    if (record) {
      if (sha256Text(record.text) !== record.text_sha256) errors.push(`${prefix}.evidence_id has a catalog text hash mismatch`);
      if (record.text.trim().split(/\s+/u).length < 5) errors.push(`${prefix}.evidence_id resolves to fewer than five words`);
      if (!record.paragraph_id || !Number.isInteger(record.pdf_page)) errors.push(`${prefix}.evidence_id has an incomplete locator`);
    }
  }
  return errors;
}

function main() {
  const index = process.argv.indexOf('--run-dir');
  if (index < 0 || !process.argv[index + 1]) {
    throw new Error('Usage: node scripts/apply_evidence_locator.cjs --run-dir <path>');
  }
  const runDir = path.resolve(process.argv[index + 1]);
  ensureInside(RUNS_ROOT, runDir);
  const manifestPath = path.join(runDir, 'manifest.json');
  const rawTextPath = path.join(runDir, 'raw', 'response.txt');
  const catalogPath = path.join(runDir, 'input', 'evidence_catalog.json');
  const sourcePacketPath = path.join(runDir, 'input', 'source_packet.txt');
  for (const filePath of [manifestPath, rawTextPath, catalogPath, sourcePacketPath]) {
    if (!fs.existsSync(filePath)) throw new Error(`Required artifact is missing: ${path.relative(runDir, filePath)}`);
  }
  const outputPaths = [
    path.join(runDir, 'derived', 'selection.json'),
    path.join(runDir, 'derived', 'pipeline_output.json'),
    path.join(runDir, 'evaluation', 'locator.json')
  ];
  if (outputPaths.some((filePath) => fs.existsSync(filePath))) {
    throw new Error('Locator outputs already exist; preserve this attempt and materialize another run.');
  }

  const manifest = readJson(manifestPath);
  const catalog = readJson(catalogPath);
  const sourcePacket = fs.readFileSync(sourcePacketPath, 'utf8');
  if (manifest.output_schema_version !== 'finance-selection-v001') throw new Error('Run does not use the finance-selection-v001 raw contract.');
  if (catalog.catalog_version !== 'evidence-catalog-v001') throw new Error('Unsupported evidence catalog version.');
  if (catalog.case_id !== manifest.case_id) throw new Error('Catalog case_id does not match the run.');
  if (catalog.source_packet_sha256 !== sha256Text(sourcePacket)) throw new Error('Frozen source packet hash does not match the catalog.');
  if (!Array.isArray(catalog.records) || catalog.records.length !== catalog.record_count) throw new Error('Catalog record count is inconsistent.');

  const rawText = fs.readFileSync(rawTextPath, 'utf8');
  const selection = parseJsonResponse(rawText);
  const recordById = new Map(catalog.records.map((record) => [record.evidence_id, record]));
  const errors = validateSelection(selection, manifest, recordById);
  const locatorEvaluation = {
    locator_version: LOCATOR_VERSION,
    run_id: manifest.run_id,
    source_files: {
      raw_selection: 'raw/response.txt',
      raw_selection_sha256: sha256Text(rawText),
      evidence_catalog: 'input/evidence_catalog.json',
      evidence_catalog_sha256: sha256File(catalogPath),
      source_packet: 'input/source_packet.txt',
      source_packet_sha256: sha256Text(sourcePacket)
    },
    passed: errors.length === 0,
    errors,
    mappings: []
  };
  writeJson(outputPaths[0], selection);

  if (errors.length) {
    writeJson(outputPaths[2], locatorEvaluation);
    manifest.pipeline = { locator_version: LOCATOR_VERSION, locator_status: 'failed' };
    manifest.artifacts.selection = 'derived/selection.json';
    manifest.artifacts.locator_evaluation = 'evaluation/locator.json';
    manifest.notes = 'Raw finance selection was preserved, but deterministic evidence localization failed.';
    writeJson(manifestPath, manifest);
    fs.appendFileSync(path.join(runDir, 'events.ndjson'), `${JSON.stringify({ timestamp_utc: new Date().toISOString(), event: 'evidence_locator_completed', status: 'failed' })}\n`);
    refreshChecksums(runDir);
    throw new Error(errors.join('; '));
  }

  const output = {
    case_id: selection.case_id,
    model_id: selection.model_id,
    prompt_version: selection.prompt_version,
    risks: selection.risks.map((risk) => {
      const record = recordById.get(risk.evidence_id);
      locatorEvaluation.mappings.push({
        risk_id: risk.risk_id,
        evidence_id: record.evidence_id,
        paragraph_id: record.paragraph_id,
        pdf_page: record.pdf_page,
        source_line: record.source_line,
        text_sha256: record.text_sha256
      });
      return {
        risk_id: risk.risk_id,
        risk_summary: risk.risk_summary,
        risk_type: risk.risk_type,
        evidence_quote: record.text,
        source_paragraph_ids: [record.paragraph_id],
        source_pages: [record.pdf_page],
        reasoning: risk.reasoning,
        financial_impact: risk.financial_impact,
        time_horizon: risk.time_horizon,
        monitoring_indicators: risk.monitoring_indicators,
        mitigation: risk.mitigation,
        uncertainty: risk.uncertainty
      };
    })
  };

  writeJson(outputPaths[1], output);
  writeJson(outputPaths[2], locatorEvaluation);
  manifest.pipeline = { locator_version: LOCATOR_VERSION, locator_status: 'passed', normalized_output_schema: 'risk-output-v001' };
  manifest.artifacts.selection = 'derived/selection.json';
  manifest.artifacts.pipeline_output = 'derived/pipeline_output.json';
  manifest.artifacts.locator_evaluation = 'evaluation/locator.json';
  manifest.notes = 'Raw finance selection and deterministic evidence localization were preserved; pipeline evaluation is pending.';
  writeJson(manifestPath, manifest);
  fs.appendFileSync(path.join(runDir, 'events.ndjson'), `${JSON.stringify({ timestamp_utc: new Date().toISOString(), event: 'evidence_locator_completed', status: 'passed', locator_version: LOCATOR_VERSION })}\n`);
  refreshChecksums(runDir);
  process.stdout.write(`${JSON.stringify({ run_id: manifest.run_id, status: 'passed', mappings: locatorEvaluation.mappings }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`apply_evidence_locator: ${error.message}\n`);
  process.exitCode = 1;
}
