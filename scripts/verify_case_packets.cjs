#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const INDEX_PATH = path.join(ROOT, 'data', 'manifests', 'case_packets.json');
const SPECS_PATH = path.join(ROOT, 'data', 'manifests', 'case_packet_specs.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function fail(message) {
  throw new Error(message);
}

function main() {
  const index = readJson(INDEX_PATH);
  const specs = readJson(SPECS_PATH);
  const specByCase = new Map(specs.cases.map((spec) => [spec.case_id, spec]));
  if (index.cases.length !== 8) fail(`expected 8 packets, found ${index.cases.length}`);

  for (const summary of index.cases) {
    const spec = specByCase.get(summary.case_id);
    if (!spec) fail(`${summary.case_id}: missing specification`);
    const packetDir = path.join(ROOT, 'data', 'processed', 'case_packets', summary.case_id);
    const packetManifestPath = path.join(packetDir, 'packet.json');
    const locatorPath = path.join(packetDir, 'locator_index.json');
    const packetPath = path.join(packetDir, 'packet.txt');
    const manifest = readJson(packetManifestPath);
    const locator = readJson(locatorPath);
    const packetText = fs.readFileSync(packetPath, 'utf8');

    if (manifest.packet_id !== summary.packet_id) fail(`${summary.case_id}: packet id mismatch`);
    if (manifest.dataset_role !== spec.dataset_role) fail(`${summary.case_id}: dataset role mismatch`);
    if (manifest.source.selected_pages.length !== spec.selected_pages.length) fail(`${summary.case_id}: page count mismatch`);
    if (manifest.model_input.text_sha256 !== sha256File(packetPath)) fail(`${summary.case_id}: packet text hash mismatch`);
    if (manifest.model_input.locator_sha256 !== sha256File(locatorPath)) fail(`${summary.case_id}: locator hash mismatch`);

    const markerMatches = [...packetText.matchAll(/^\[PDF_PAGE (\d+) \| PRINTED_PAGE (\d+|unknown)\]$/gm)];
    if (markerMatches.length !== spec.selected_pages.length) fail(`${summary.case_id}: page marker count mismatch`);
    const markerPages = markerMatches.map((match) => Number(match[1]));
    if (JSON.stringify(markerPages) !== JSON.stringify(spec.selected_pages)) fail(`${summary.case_id}: page marker order mismatch`);

    const paragraphIds = locator.paragraphs.map((paragraph) => paragraph.paragraph_id);
    if (new Set(paragraphIds).size !== paragraphIds.length) fail(`${summary.case_id}: duplicate paragraph id`);
    const selectedPageSet = new Set(spec.selected_pages);
    for (const paragraph of locator.paragraphs) {
      if (!selectedPageSet.has(paragraph.pdf_page)) fail(`${summary.case_id}: locator points outside selected pages`);
      if (!packetText.includes(`[PARAGRAPH ${paragraph.paragraph_id}]`)) fail(`${summary.case_id}: missing paragraph marker ${paragraph.paragraph_id}`);
    }

    for (const image of manifest.model_input.images) {
      const imagePath = path.join(ROOT, image.path);
      if (!fs.existsSync(imagePath) || fs.statSync(imagePath).size === 0) fail(`${summary.case_id}: missing image ${image.path}`);
      if (sha256File(imagePath) !== image.sha256) fail(`${summary.case_id}: image hash mismatch ${image.path}`);
      if (image.mime_type !== 'image/png') fail(`${summary.case_id}: non-PNG image ${image.path}`);
    }

    for (const candidate of spec.risk_candidates) {
      if (!packetText.replace(/\s+/g, ' ').includes(candidate.anchor.replace(/\s+/g, ' '))) {
        fail(`${summary.case_id}: candidate anchor missing from packet text`);
      }
      if (packetText.includes(candidate.label) || packetText.includes('risk_candidates_for_internal_review')) {
        fail(`${summary.case_id}: internal candidate metadata leaked into packet text`);
      }
    }
    console.log(`${summary.case_id}: verified; ${locator.paragraphs.length} unique paragraphs; ${manifest.model_input.images.length} image hashes`);
  }
  console.log(`${index.cases.length} case packets verified`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`verify_case_packets: ${error.message}\n`);
  process.exitCode = 1;
}
