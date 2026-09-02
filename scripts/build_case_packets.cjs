#!/usr/bin/env node

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const SPECS_PATH = path.join(ROOT, 'data', 'manifests', 'case_packet_specs.json');
const PACKET_ROOT = path.join(ROOT, 'data', 'processed', 'case_packets');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function run(command, args) {
  return execFileSync(command, args, {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024
  });
}

function parsePages(text) {
  const lines = text.split(/\r?\n/);
  const pages = new Map();
  let current = null;
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^\[PAGE (\d+)\]$/);
    if (match) {
      current = {
        page: Number(match[1]),
        marker_line: index + 1,
        lines: [],
        source_line_start: index + 2
      };
      pages.set(current.page, current);
      continue;
    }
    if (current) current.lines.push({ text: lines[index], source_line: index + 1 });
  }
  return pages;
}

function pageParagraphs(pdfPage, printedPage, pageText, caseId, paragraphOffset) {
  const paragraphs = [];
  const lines = pageText.split(/\r?\n/).map((text, index) => ({ text, source_line: index + 1 }));
  let pending = [];
  const flush = () => {
    if (!pending.length || pending.every((line) => line.text.trim() === '')) {
      pending = [];
      return;
    }
    const first = pending[0];
    const last = pending[pending.length - 1];
    const text = pending.map((line) => line.text).join('\n').trim();
    if (text) {
      paragraphs.push({
        paragraph_id: `${caseId}-P${String(paragraphOffset + paragraphs.length + 1).padStart(3, '0')}`,
        pdf_page: pdfPage,
        printed_page: printedPage,
        page_text_line_start: first.source_line,
        page_text_line_end: last.source_line,
        text,
        text_sha256: sha256Text(text)
      });
    }
    pending = [];
  };
  for (const line of lines) {
    if (line.text.trim() === '') flush();
    else pending.push(line);
  }
  flush();
  return paragraphs;
}

function inputPageText(pdfPage, printedPage, paragraphs) {
  const blocks = paragraphs.map((paragraph) => (
    `[PARAGRAPH ${paragraph.paragraph_id}]\n${paragraph.text}`
  ));
  const printedLabel = printedPage === null ? 'unknown' : printedPage;
  return `[PDF_PAGE ${pdfPage} | PRINTED_PAGE ${printedLabel}]\n${blocks.join('\n\n')}`;
}

function readPdfPage(pdfPath, pageNumber) {
  return run('pdftotext', [
    '-layout',
    '-f', String(pageNumber),
    '-l', String(pageNumber),
    pdfPath,
    '-'
  ]);
}

function cleanPdfPageText(text) {
  const lines = text.split(/\r?\n/);
  while (lines.length && /^\s*Table of Contents\s*$/i.test(lines[0])) lines.shift();
  return lines.join('\n').trim();
}

function stripPdfFooter(pageText, printedPage) {
  const lines = pageText.split(/\r?\n/);
  for (let index = lines.length - 1; index >= Math.max(0, lines.length - 14); index -= 1) {
    const line = lines[index].trim();
    if (!line) continue;
    if (printedPage !== null && line === String(printedPage)) {
      lines.splice(index, 1);
      break;
    }
    if (printedPage !== null && /(?:Form 10-K|PayPal|Pfizer Inc\.)/.test(line) && new RegExp(`\\s${printedPage}$`).test(line)) {
      lines.splice(index, 1);
      break;
    }
    break;
  }
  return lines.join('\n').trim();
}

function printedPageNumber(pageText) {
  const lines = pageText.split(/\r?\n/);
  for (const line of lines.slice(Math.max(0, lines.length - 14)).reverse()) {
    const match = line.trim().match(/(?:^|\s)(\d{1,3})\s*$/);
    if (match) return Number(match[1]);
  }
  return null;
}

function renderPage(pdfPath, page, targetWithoutExtension) {
  run('pdftoppm', [
    '-png',
    '-r', '144',
    '-f', String(page),
    '-l', String(page),
    '-singlefile',
    pdfPath,
    targetWithoutExtension
  ]);
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function main() {
  const specs = readJson(SPECS_PATH);
  const generated = [];
  for (const spec of specs.cases) {
    const caseRoot = path.join(ROOT, 'data', 'raw', 'sec', spec.case_id);
    const sourceMetadataPath = path.join(caseRoot, 'source.json');
    const sourceMetadata = readJson(sourceMetadataPath);
    const sourceTextPath = path.join(ROOT, 'data', 'processed', 'item_1a', `${spec.case_id}.txt`);
    const sourceText = fs.readFileSync(sourceTextPath, 'utf8');
    const sourcePages = parsePages(sourceText);
    for (const page of spec.selected_pages) {
      if (!sourcePages.has(page)) throw new Error(`${spec.case_id}: missing [PAGE ${page}] in ${sourceTextPath}`);
    }
    const pdfPath = path.join(caseRoot, 'filing.pdf');
    const selectedPages = spec.selected_pages.map((page) => {
      const rawText = cleanPdfPageText(readPdfPage(pdfPath, page));
      const printedPage = printedPageNumber(rawText);
      return {
        page,
        printed_page: printedPage,
        text: stripPdfFooter(rawText, printedPage)
      };
    });
    const selectedText = selectedPages.map((page) => page.text).join('\n');
    const normalizedSelectedText = selectedText.replace(/\s+/g, ' ');
    for (const candidate of spec.risk_candidates) {
      if (!normalizedSelectedText.includes(candidate.anchor.replace(/\s+/g, ' '))) {
        throw new Error(`${spec.case_id}: candidate anchor not found in selected pages: ${candidate.anchor}`);
      }
    }

    const packetDir = path.join(PACKET_ROOT, spec.case_id);
    if (fs.existsSync(packetDir)) throw new Error(`Refusing to overwrite existing packet: ${packetDir}`);
    const pagesDir = path.join(packetDir, 'pages');
    fs.mkdirSync(pagesDir, { recursive: true });

    const locator = [];
    const packetPageBlocks = [];
    let paragraphOffset = 0;
    for (const page of selectedPages) {
      const paragraphs = pageParagraphs(page.page, page.printed_page, page.text, spec.case_id, paragraphOffset);
      paragraphOffset += paragraphs.length;
      locator.push(...paragraphs);
      packetPageBlocks.push(inputPageText(page.page, page.printed_page, paragraphs));
    }

    const packetText = [
      `Case: ${spec.case_id}`,
      'Form: 10-K',
      'Section: Item 1A. Risk Factors',
      `Input view: selected PDF physical pages ${spec.selected_pages.join(', ')}; printed page numbers are retained where detected.`,
      'The paragraph markers are harness locators; quoted evidence must still match the text exactly.',
      '',
      packetPageBlocks.join('\n\n')
    ].join('\n');
    const packetPath = path.join(packetDir, 'packet.txt');
    fs.writeFileSync(packetPath, `${packetText}\n`, 'utf8');

    const imageArtifacts = [];
    for (const page of spec.selected_pages) {
      const fileName = `page-${String(page).padStart(3, '0')}.png`;
      const target = path.join(pagesDir, fileName);
      renderPage(pdfPath, page, target.slice(0, -4));
      const pageMetadata = selectedPages.find((selected) => selected.page === page);
      imageArtifacts.push({
        pdf_page: page,
        printed_page: pageMetadata.printed_page,
        path: path.relative(ROOT, target).split(path.sep).join('/'),
        sha256: sha256File(target),
        mime_type: 'image/png'
      });
    }

    const packetManifest = {
      packet_id: `CP-${spec.case_id}-v001`,
      case_id: spec.case_id,
      dataset_role: spec.dataset_role || specs.dataset_role,
      packet_version: specs.version,
      source: {
        pdf_path: sourceMetadata.localFiles.pdf,
        pdf_sha256: sourceMetadata.pdf.sha256,
        item1a_path: sourceMetadata.localFiles.item1a,
        item1a_sha256: sha256File(sourceTextPath),
        selected_pages: spec.selected_pages,
        page_map: selectedPages.map((pageMetadata) => ({
          pdf_page: pageMetadata.page,
          printed_page: pageMetadata.printed_page
        }))
      },
      model_input: {
        text_path: path.relative(ROOT, packetPath).split(path.sep).join('/'),
        text_sha256: sha256File(packetPath),
        images: imageArtifacts,
        locator_path: path.relative(ROOT, path.join(packetDir, 'locator_index.json')).split(path.sep).join('/'),
        paragraph_count: locator.length,
        extractor: 'pdftotext -layout per physical PDF page',
        paragraph_granularity: 'blank-line text block after PDF footer removal'
      },
      risk_candidates_for_internal_review: spec.risk_candidates,
      generation: {
        script: 'scripts/build_case_packets.cjs',
        rendered_dpi: 144,
        created_at_utc: new Date().toISOString()
      },
      leakage_control: 'risk_candidates_for_internal_review is not included in packet.txt or model requests.'
    };
    fs.writeFileSync(path.join(packetDir, 'locator_index.json'), `${JSON.stringify({
      packet_id: packetManifest.packet_id,
      case_id: spec.case_id,
      paragraphs: locator
    }, null, 2)}\n`, 'utf8');
    packetManifest.model_input.locator_sha256 = sha256File(path.join(packetDir, 'locator_index.json'));
    fs.writeFileSync(path.join(packetDir, 'packet.json'), `${JSON.stringify(packetManifest, null, 2)}\n`, 'utf8');

    generated.push({
      packet_id: packetManifest.packet_id,
      case_id: spec.case_id,
      dataset_role: spec.dataset_role || specs.dataset_role,
      selected_pages: spec.selected_pages,
      packet_path: packetManifest.model_input.text_path,
      packet_sha256: packetManifest.model_input.text_sha256,
      packet_manifest_path: path.relative(ROOT, path.join(packetDir, 'packet.json')).split(path.sep).join('/'),
      locator_path: packetManifest.model_input.locator_path,
      image_count: imageArtifacts.length,
      risk_candidate_count: spec.risk_candidates.length
    });
    console.log(`${spec.case_id}: packet frozen; ${spec.selected_pages.length} pages; ${locator.length} paragraphs; ${imageArtifacts.length} images`);
  }

  fs.writeFileSync(
    path.join(ROOT, 'data', 'manifests', 'case_packets.json'),
    `${JSON.stringify({
      version: specs.version,
      generated_at_utc: new Date().toISOString(),
      cases: generated
    }, null, 2)}\n`,
    'utf8'
  );
}

try {
  main();
} catch (error) {
  process.stderr.write(`build_case_packets: ${error.message}\n`);
  process.exitCode = 1;
}
