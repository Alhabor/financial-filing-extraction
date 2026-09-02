#!/usr/bin/env node

/*
 * Bounded, dependency-free evaluator for one completed experiment run.
 *
 * Deliberately reads only the run manifest, input/model_input.txt, and
 * raw/response.txt. Raw files are never changed. This is an automatic
 * evidence gate, not a substitute for the later human finance review.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const SCRIPT_NAME = 'evaluate_experiment_run.cjs';
const PARSER_VERSION = 'PE001';
const EVALUATION_VERSION = 'AE002';
const SCHEMA_PATH = path.resolve(__dirname, '..', 'schemas', 'risk-output.schema.json');

function usage() {
  return `Usage: node scripts/${SCRIPT_NAME} <run-directory> [--force] [--candidate <relative-path>] [--label <name>]

Parse and automatically validate one experiment run.

Expected files:
  <run-directory>/manifest.json
  <run-directory>/input/model_input.txt
  <run-directory>/raw/response.txt

Writes (and never writes raw files):
  <run-directory>/derived/parsed.json
  <run-directory>/evaluation/automatic.json

Options:
  --force     Explicitly replace existing derived/evaluation outputs
  --candidate Validate a derived candidate instead of raw/response.txt
  --label     Safe artifact label used with --candidate, for example pipeline
  -h, --help  Show this help

The response must be plain JSON or one fenced JSON block. The command exits
nonzero when JSON/schema validation or evidence citation validation fails.`;
}

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  let runDirectory = null;
  let force = false;
  let candidate = null;
  let label = 'automatic';
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '-h' || token === '--help') {
      if (runDirectory !== null) fail('Do not combine --help with a run directory.');
      return { help: true, force: false, runDirectory: null };
    }
    if (token === '--force') {
      force = true;
      continue;
    }
    if (token === '--candidate' || token === '--label') {
      const value = argv[index + 1];
      if (!value || value.startsWith('-')) fail(`${token} requires a value.`);
      if (token === '--candidate') candidate = value;
      else label = value;
      index += 1;
      continue;
    }
    if (token.startsWith('-')) fail(`Unknown option: ${token}`);
    if (runDirectory !== null) fail(`Expected one run directory, received another: ${token}`);
    runDirectory = token;
  }
  if (!runDirectory) fail('Missing run directory. Use --help for usage.');
  if (!/^[a-z][a-z0-9_-]*$/.test(label)) fail('--label must be a safe lowercase identifier.');
  if (!candidate && label !== 'automatic') fail('--label requires --candidate.');
  return { help: false, force, runDirectory, candidate, label };
}

function readText(filePath, label) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    fail(`Cannot read ${label}: ${filePath} (${error.code || error.message})`);
  }
}

function readJson(filePath, label) {
  const text = readText(filePath, label);
  try {
    return JSON.parse(text);
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function sha256(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function filesRecursively(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...filesRecursively(target));
    else if (entry.isFile() && entry.name !== 'checksums.sha256') files.push(target);
  }
  return files;
}

function refreshChecksums(runDirectory) {
  const rows = filesRecursively(runDirectory)
    .map((filePath) => ({
      path: path.relative(runDirectory, filePath).split(path.sep).join('/'),
      sha256: sha256File(filePath)
    }))
    .sort((left, right) => left.path.localeCompare(right.path))
    .map((entry) => `${entry.sha256}  ${entry.path}`);
  fs.writeFileSync(path.join(runDirectory, 'checksums.sha256'), `${rows.join('\n')}\n`, 'utf8');
}

function parseResponseText(responseText) {
  const withoutBom = responseText.replace(/^\uFEFF/, '');
  const trimmed = withoutBom.trim();
  if (!trimmed) fail('raw/response.txt is empty.');

  let jsonText = trimmed;
  let format = 'plain-json';
  const fenced = trimmed.match(/^```(?:json)?[ \t]*(?:\r?\n)?([\s\S]*?)(?:\r?\n)?[ \t]*```$/i);
  if (fenced) {
    jsonText = fenced[1].trim();
    format = 'fenced-json';
  }
  if (!jsonText) fail('raw/response.txt contains an empty JSON block.');

  let value;
  try {
    value = JSON.parse(jsonText);
  } catch (error) {
    fail(`Could not parse raw/response.txt as ${format}: ${error.message}`);
  }
  return { value, format, parsed_text_sha256: sha256(jsonText) };
}

function resolveSchema(schema, rootSchema) {
  if (!schema || typeof schema !== 'object') return schema;
  if (typeof schema.$ref !== 'string') return schema;
  const prefix = '#/$defs/';
  if (!schema.$ref.startsWith(prefix)) fail(`Unsupported schema reference: ${schema.$ref}`);
  const definition = rootSchema.$defs?.[schema.$ref.slice(prefix.length)];
  if (!definition) fail(`Missing schema definition for ${schema.$ref}`);
  return definition;
}

function validateAgainstSchema(value, schema, rootSchema, location = '$') {
  const errors = [];
  const resolved = resolveSchema(schema, rootSchema);

  if (resolved.type === 'object') {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return [`${location} must be an object`];
    }
    for (const required of resolved.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, required)) {
        errors.push(`${location}.${required} is required`);
      }
    }
    const properties = resolved.properties || {};
    if (resolved.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.prototype.hasOwnProperty.call(properties, key)) {
          errors.push(`${location}.${key} is not allowed by the schema`);
        }
      }
    }
    for (const [key, propertySchema] of Object.entries(properties)) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(...validateAgainstSchema(value[key], propertySchema, rootSchema, `${location}.${key}`));
      }
    }
    return errors;
  }

  if (resolved.type === 'array') {
    if (!Array.isArray(value)) return [`${location} must be an array`];
    if (resolved.minItems !== undefined && value.length < resolved.minItems) {
      errors.push(`${location} must contain at least ${resolved.minItems} items`);
    }
    if (resolved.maxItems !== undefined && value.length > resolved.maxItems) {
      errors.push(`${location} must contain at most ${resolved.maxItems} items`);
    }
    if (resolved.items) {
      value.forEach((item, index) => {
        errors.push(...validateAgainstSchema(item, resolved.items, rootSchema, `${location}[${index}]`));
      });
    }
    return errors;
  }

  if (resolved.type === 'string') {
    if (typeof value !== 'string') return [`${location} must be a string`];
    if (resolved.minLength !== undefined && value.length < resolved.minLength) {
      errors.push(`${location} must not be empty`);
    }
    if (resolved.pattern && !(new RegExp(resolved.pattern)).test(value)) {
      errors.push(`${location} does not match ${resolved.pattern}`);
    }
    if (resolved.enum && !resolved.enum.includes(value)) {
      errors.push(`${location} must be one of: ${resolved.enum.join(', ')}`);
    }
    return errors;
  }

  if (resolved.type === 'integer') {
    if (!Number.isInteger(value)) return [`${location} must be an integer`];
    if (resolved.minimum !== undefined && value < resolved.minimum) {
      errors.push(`${location} must be at least ${resolved.minimum}`);
    }
    return errors;
  }

  if (resolved.type === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value)) return [`${location} must be a number`];
    return errors;
  }

  if (resolved.type === 'boolean' && typeof value !== 'boolean') {
    return [`${location} must be a boolean`];
  }
  return errors;
}

function parseInputEvidence(inputText) {
  const pagePattern = /\[PDF_PAGE\s+(\d+)\s*\|\s*PRINTED_PAGE\s+(\d+|unknown)\]/g;
  const paragraphPattern = /\[PARAGRAPH\s+([^\]\s]+)\]/g;
  const pages = [];
  let pageMatch;
  while ((pageMatch = pagePattern.exec(inputText)) !== null) {
    pages.push({
      pdf_page: Number(pageMatch[1]),
      printed_page: pageMatch[2] === 'unknown' ? null : Number(pageMatch[2]),
      start: pageMatch.index
    });
  }
  const paragraphs = [];
  let paragraphMatch;
  while ((paragraphMatch = paragraphPattern.exec(inputText)) !== null) {
    const nextParagraph = paragraphPattern.exec(inputText);
    paragraphPattern.lastIndex = nextParagraph ? nextParagraph.index : inputText.length;
    const page = [...pages].reverse().find((candidate) => candidate.start < paragraphMatch.index);
    const body = inputText.slice(paragraphMatch.index + paragraphMatch[0].length, nextParagraph ? nextParagraph.index : inputText.length);
    paragraphs.push({
      paragraph_id: paragraphMatch[1],
      pdf_page: page ? page.pdf_page : null,
      printed_page: page ? page.printed_page : null,
      text: body
    });
  }
  return { pages, paragraphs };
}

function validateCitations(output, inputText) {
  const evidence = parseInputEvidence(inputText);
  const paragraphById = new Map(evidence.paragraphs.map((paragraph) => [paragraph.paragraph_id, paragraph]));
  const pageSet = new Set(evidence.pages.map((page) => page.pdf_page));
  const riskChecks = [];
  const errors = [];

  output.risks.forEach((risk) => {
    const riskErrors = [];
    const ids = risk.source_paragraph_ids;
    const citedParagraphs = ids.map((id) => paragraphById.get(id)).filter(Boolean);
    const missingParagraphIds = ids.filter((id) => !paragraphById.has(id));
    const duplicateParagraphIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const missingPages = risk.source_pages.filter((page) => !pageSet.has(page));
    const paragraphPages = [...new Set(citedParagraphs.map((paragraph) => paragraph.pdf_page).filter(Number.isInteger))];
    const paragraphsWithoutPages = citedParagraphs
      .filter((paragraph) => !Number.isInteger(paragraph.pdf_page))
      .map((paragraph) => paragraph.paragraph_id);
    const uncitedParagraphPages = paragraphPages.filter((page) => !risk.source_pages.includes(page));
    const citedText = citedParagraphs.map((paragraph) => paragraph.text).join('\n');
    const normalizedQuote = typeof risk.evidence_quote === 'string'
      ? risk.evidence_quote.replace(/\s+/gu, ' ').trim()
      : '';
    const normalizedInput = inputText.replace(/\s+/gu, ' ').trim();
    const normalizedCitedText = citedText.replace(/\s+/gu, ' ').trim();
    const quoteInInput = typeof risk.evidence_quote === 'string' && inputText.includes(risk.evidence_quote);
    const quoteInCitedParagraphs = typeof risk.evidence_quote === 'string' && citedText.includes(risk.evidence_quote);
    const normalizedQuoteInInput = normalizedQuote.length > 0 && normalizedInput.includes(normalizedQuote);
    const normalizedQuoteInCitedParagraphs = normalizedQuote.length > 0 && normalizedCitedText.includes(normalizedQuote);

    if (missingParagraphIds.length) riskErrors.push(`missing paragraph IDs: ${missingParagraphIds.join(', ')}`);
    if (duplicateParagraphIds.length) riskErrors.push(`duplicate paragraph IDs: ${[...new Set(duplicateParagraphIds)].join(', ')}`);
    if (paragraphsWithoutPages.length) riskErrors.push(`cited paragraphs have no PDF page marker: ${paragraphsWithoutPages.join(', ')}`);
    if (missingPages.length) riskErrors.push(`source pages not present in input: ${[...new Set(missingPages)].join(', ')}`);
    if (uncitedParagraphPages.length) riskErrors.push(`cited paragraph pages omitted from source_pages: ${uncitedParagraphPages.join(', ')}`);
    if (!normalizedQuoteInInput) riskErrors.push('evidence_quote changes more than extraction-layout whitespace relative to input/model_input.txt');
    if (!normalizedQuoteInCitedParagraphs) riskErrors.push('evidence_quote is not supported by the cited paragraph text after whitespace normalization');
    if (!ids.length) riskErrors.push('source_paragraph_ids must identify at least one paragraph');
    if (!risk.source_pages.length) riskErrors.push('source_pages must identify at least one page');

    const check = {
      risk_id: risk.risk_id,
      passed: riskErrors.length === 0,
      exact_substring_in_input: quoteInInput,
      supported_by_cited_paragraphs: quoteInCitedParagraphs,
      whitespace_normalized_substring_in_input: normalizedQuoteInInput,
      whitespace_normalized_supported_by_cited_paragraphs: normalizedQuoteInCitedParagraphs,
      citation_match_mode: quoteInInput && quoteInCitedParagraphs
        ? 'raw-exact'
        : normalizedQuoteInInput && normalizedQuoteInCitedParagraphs
          ? 'whitespace-normalized'
          : null,
      paragraph_ids_exist: missingParagraphIds.length === 0,
      cited_pages_exist: missingPages.length === 0,
      cited_paragraphs_have_pages: paragraphsWithoutPages.length === 0,
      cited_paragraph_pages_in_source_pages: uncitedParagraphPages.length === 0,
      cited_paragraph_ids: ids,
      cited_pdf_pages: paragraphPages,
      errors: riskErrors
    };
    riskChecks.push(check);
    for (const error of riskErrors) errors.push(`${risk.risk_id}: ${error}`);
  });

  return {
    passed: errors.length === 0,
    input_page_count: evidence.pages.length,
    input_paragraph_count: evidence.paragraphs.length,
    risk_checks: riskChecks,
    errors
  };
}

function metadataChecks(output, manifest) {
  const errors = [];
  if (manifest.case_id && output.case_id !== manifest.case_id) errors.push(`case_id does not match manifest (${manifest.case_id})`);
  if (manifest.model_id && output.model_id !== manifest.model_id) errors.push(`model_id does not match manifest (${manifest.model_id})`);
  if (manifest.prompt_version && output.prompt_version !== manifest.prompt_version) errors.push(`prompt_version does not match manifest (${manifest.prompt_version})`);
  const riskIds = output.risks.map((risk) => risk.risk_id);
  if (new Set(riskIds).size !== 3 || !['R1', 'R2', 'R3'].every((riskId) => riskIds.includes(riskId))) {
    errors.push('risks must contain the unique IDs R1, R2, and R3');
  }
  return errors;
}

function resolveInside(runDirectory, relative, label) {
  if (path.isAbsolute(relative)) fail(`${label} must be relative to the run directory.`);
  const resolved = path.resolve(runDirectory, relative);
  const relation = path.relative(runDirectory, resolved);
  if (relation.startsWith('..') || path.isAbsolute(relation)) fail(`${label} resolves outside the run directory.`);
  return resolved;
}

function outputPaths(runDirectory, candidate, label, inputRelative) {
  const defaultMode = !candidate;
  return {
    manifest: path.join(runDirectory, 'manifest.json'),
    input: resolveInside(runDirectory, inputRelative, 'Evaluation input'),
    candidate: resolveInside(runDirectory, candidate || 'raw/response.txt', 'Candidate'),
    parsed: path.join(runDirectory, 'derived', defaultMode ? 'parsed.json' : `parsed.${label}.json`),
    automatic: path.join(runDirectory, 'evaluation', defaultMode ? 'automatic.json' : `${label}.json`)
  };
}

function assertWritableOutputs(paths, force) {
  if (!force) {
    const existing = [paths.parsed, paths.automatic].filter((filePath) => fs.existsSync(filePath));
    if (existing.length) fail(`Refusing to overwrite existing derived output(s): ${existing.join(', ')}. Re-run with --force to replace them.`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const runDirectory = path.resolve(args.runDirectory);
  if (!fs.existsSync(runDirectory) || !fs.statSync(runDirectory).isDirectory()) {
    fail(`Run directory does not exist or is not a directory: ${runDirectory}`);
  }
  const manifestPath = path.join(runDirectory, 'manifest.json');
  const manifest = readJson(manifestPath, 'manifest.json');
  const inputRelative = manifest.input?.evaluation_path || 'input/model_input.txt';
  const candidateRelative = args.candidate || 'raw/response.txt';
  const paths = outputPaths(runDirectory, args.candidate, args.label, inputRelative);
  assertWritableOutputs(paths, args.force);
  const inputText = readText(paths.input, inputRelative);
  const responseText = readText(paths.candidate, candidateRelative);
  const parsedArtifact = path.relative(runDirectory, paths.parsed).split(path.sep).join('/');
  const evaluationArtifact = path.relative(runDirectory, paths.automatic).split(path.sep).join('/');
  const parsedArtifactKey = args.candidate ? `${args.label}_parsed_output` : 'parsed_output';
  const evaluationArtifactKey = args.candidate ? `${args.label}_evaluation` : 'automatic_evaluation';
  const automatic = {
    evaluation_version: EVALUATION_VERSION,
    parser_version: PARSER_VERSION,
    run_id: manifest.run_id || null,
    case_id: manifest.case_id || null,
    model_id: manifest.model_id || null,
    prompt_version: manifest.prompt_version || null,
    source_files: {
      candidate_response: candidateRelative,
      evaluation_input: inputRelative,
      raw_response_sha256: sha256(responseText),
      model_input_sha256: sha256(inputText)
    },
    parse: { passed: false, format: null, errors: [] },
    schema: { passed: false, errors: [] },
    metadata: { passed: false, errors: [] },
    citations: { passed: false, errors: [], risk_checks: [] },
    status: 'failed'
  };

  let parsedResponse;
  try {
    parsedResponse = parseResponseText(responseText);
    automatic.parse = {
      passed: true,
      format: parsedResponse.format,
      parsed_text_sha256: parsedResponse.parsed_text_sha256,
      errors: []
    };
  } catch (error) {
    automatic.parse.errors = [error.message];
    writeJson(paths.automatic, automatic);
    manifest.artifacts = {
      ...(manifest.artifacts || {}),
      [evaluationArtifactKey]: evaluationArtifact
    };
    manifest.evaluation = { ...(manifest.evaluation || {}), [args.label]: {
      parser_version: PARSER_VERSION,
      automatic_evaluation_version: EVALUATION_VERSION,
      automatic_status: 'failed'
    } };
    manifest.status = 'partial';
    manifest.notes = 'Raw response was preserved, but automatic JSON parsing failed.';
    writeJson(paths.manifest, manifest);
    fs.appendFileSync(path.join(runDirectory, 'events.ndjson'), `${JSON.stringify({
      timestamp_utc: new Date().toISOString(),
      event: 'automatic_evaluation_completed',
      label: args.label,
      status: 'failed',
      stage: 'parse'
    })}\n`, 'utf8');
    refreshChecksums(runDirectory);
    fail(error.message);
  }

  const schema = readJson(SCHEMA_PATH, 'risk-output.schema.json');
  const schemaErrors = validateAgainstSchema(parsedResponse.value, schema, schema);
  automatic.schema = { passed: schemaErrors.length === 0, errors: schemaErrors };
  if (schemaErrors.length === 0) {
    automatic.metadata.errors = metadataChecks(parsedResponse.value, manifest);
    automatic.metadata.passed = automatic.metadata.errors.length === 0;
    automatic.citations = validateCitations(parsedResponse.value, inputText);
  } else {
    automatic.metadata = { passed: false, errors: ['Skipped because schema validation failed.'] };
    automatic.citations = { passed: false, errors: ['Skipped because schema validation failed.'], risk_checks: [] };
  }

  const allPassed = automatic.parse.passed
    && automatic.schema.passed
    && automatic.metadata.passed
    && automatic.citations.passed;
  automatic.status = allPassed ? 'passed' : 'failed';

  writeJson(paths.parsed, parsedResponse.value);
  writeJson(paths.automatic, automatic);
  manifest.artifacts = {
    ...(manifest.artifacts || {}),
    [parsedArtifactKey]: parsedArtifact,
    [evaluationArtifactKey]: evaluationArtifact
  };
  manifest.evaluation = { ...(manifest.evaluation || {}), [args.label]: {
    parser_version: PARSER_VERSION,
    automatic_evaluation_version: EVALUATION_VERSION,
    automatic_status: automatic.status
  } };
  if (allPassed) {
    manifest.status = 'completed';
    manifest.notes = `${candidateRelative}, schema, metadata, and citation validation completed successfully.`;
  } else {
    manifest.status = 'partial';
    manifest.notes = `${candidateRelative} was preserved, but automatic schema, metadata, or citation validation failed.`;
  }
  writeJson(paths.manifest, manifest);
  fs.appendFileSync(path.join(runDirectory, 'events.ndjson'), `${JSON.stringify({
    timestamp_utc: new Date().toISOString(),
    event: 'automatic_evaluation_completed',
    label: args.label,
    status: automatic.status
  })}\n`, 'utf8');
  refreshChecksums(runDirectory);
  process.stdout.write(`${JSON.stringify({
    status: automatic.status,
    run_id: automatic.run_id,
    parsed: paths.parsed,
    automatic_evaluation: paths.automatic,
    schema_errors: automatic.schema.errors.length,
    citation_errors: automatic.citations.errors.length
  }, null, 2)}\n`);
  if (!allPassed) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  process.stderr.write(`${SCRIPT_NAME}: ${error.message}\n`);
  process.exitCode = 1;
}
