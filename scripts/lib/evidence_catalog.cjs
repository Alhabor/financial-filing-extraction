const crypto = require('node:crypto');

function sha256Text(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function buildEvidenceCatalog(packetText, caseId) {
  let currentPage = null;
  let currentPrintedPage = null;
  let currentParagraph = null;
  const records = [];
  const pagePattern = /^\[PDF_PAGE\s+(\d+)\s*\|\s*PRINTED_PAGE\s+(\d+|unknown)\]$/;
  const paragraphPattern = /^\[PARAGRAPH\s+([^\]\s]+)\]$/;

  packetText.split(/\r?\n/).forEach((line, zeroBasedLine) => {
    const page = line.match(pagePattern);
    if (page) {
      currentPage = Number(page[1]);
      currentPrintedPage = page[2] === 'unknown' ? null : Number(page[2]);
      return;
    }
    const paragraph = line.match(paragraphPattern);
    if (paragraph) {
      currentParagraph = paragraph[1];
      return;
    }
    if (!currentParagraph || !line.trim()) return;
    const evidenceId = `${caseId}-E${String(records.length + 1).padStart(4, '0')}`;
    records.push({
      evidence_id: evidenceId,
      text: line,
      paragraph_id: currentParagraph,
      pdf_page: currentPage,
      printed_page: currentPrintedPage,
      source_line: zeroBasedLine + 1,
      text_sha256: sha256Text(line)
    });
  });

  if (!records.length) throw new Error(`No evidence records could be derived for ${caseId}.`);
  if (records.some((record) => !Number.isInteger(record.pdf_page))) {
    throw new Error(`At least one evidence record has no active PDF page in ${caseId}.`);
  }

  const modelInput = [
    `Case: ${caseId}`,
    'Input view: deterministic evidence catalog derived from the frozen packet.',
    'Every evidence record preserves one physical source line and its original locator.',
    '',
    ...records.flatMap((record) => [
      `[EVIDENCE ${record.evidence_id} | PDF_PAGE ${record.pdf_page} | PARAGRAPH ${record.paragraph_id}]`,
      record.text,
      ''
    ])
  ].join('\n');

  return {
    catalog: {
      catalog_version: 'evidence-catalog-v001',
      case_id: caseId,
      source_packet_sha256: sha256Text(packetText),
      record_count: records.length,
      records
    },
    modelInput
  };
}

function buildCompactLineEvidenceCatalog(packetText, caseId) {
  const verbose = buildEvidenceCatalog(packetText, caseId);
  const records = verbose.catalog.records.map((record, index) => ({
    ...record,
    evidence_id: `E${String(index + 1).padStart(4, '0')}`
  }));
  return {
    catalog: {
      ...verbose.catalog,
      catalog_version: 'evidence-catalog-v002',
      records
    },
    modelInput: [
      `Case: ${caseId}`,
      'Input view: compact deterministic evidence catalog derived from the frozen packet.',
      'Each ID maps to one exact physical source line; locator metadata remains in the archived catalog.',
      '',
      ...records.map((record) => `[${record.evidence_id}] ${record.text}`)
    ].join('\n')
  };
}

function buildSentenceEvidenceCatalog(packetText, caseId) {
  let currentPage = null;
  let currentPrintedPage = null;
  let currentParagraph = null;
  let paragraphStartLine = null;
  const paragraphs = [];
  const pagePattern = /^\[PDF_PAGE\s+(\d+)\s*\|\s*PRINTED_PAGE\s+(\d+|unknown)\]$/;
  const paragraphPattern = /^\[PARAGRAPH\s+([^\]\s]+)\]$/;

  packetText.split(/\r?\n/).forEach((line, zeroBasedLine) => {
    const page = line.match(pagePattern);
    if (page) {
      currentPage = Number(page[1]);
      currentPrintedPage = page[2] === 'unknown' ? null : Number(page[2]);
      return;
    }
    const paragraph = line.match(paragraphPattern);
    if (paragraph) {
      currentParagraph = paragraph[1];
      paragraphStartLine = zeroBasedLine + 1;
      paragraphs.push({
        paragraph_id: currentParagraph,
        pdf_page: currentPage,
        printed_page: currentPrintedPage,
        source_line: paragraphStartLine,
        lines: []
      });
      return;
    }
    if (currentParagraph && line.trim()) paragraphs.at(-1).lines.push(line.trim());
  });

  const segmenter = new Intl.Segmenter('en', { granularity: 'sentence' });
  const records = [];
  for (const paragraph of paragraphs) {
    const normalizedParagraph = paragraph.lines.join(' ').replace(/\s+/gu, ' ').trim();
    if (!normalizedParagraph) continue;
    for (const segmented of segmenter.segment(normalizedParagraph)) {
      const text = segmented.segment.trim();
      if (!text) continue;
      records.push({
        evidence_id: `E${String(records.length + 1).padStart(4, '0')}`,
        text,
        paragraph_id: paragraph.paragraph_id,
        pdf_page: paragraph.pdf_page,
        printed_page: paragraph.printed_page,
        source_line: paragraph.source_line,
        match_mode: 'whitespace-normalized',
        text_sha256: sha256Text(text)
      });
    }
  }

  if (!records.length) throw new Error(`No sentence evidence records could be derived for ${caseId}.`);
  if (records.some((record) => !Number.isInteger(record.pdf_page))) {
    throw new Error(`At least one sentence evidence record has no active PDF page in ${caseId}.`);
  }
  const modelInput = [
    `Case: ${caseId}`,
    'Input view: deterministic sentence evidence catalog derived from the frozen packet.',
    'Each ID maps to one complete sentence; only extraction-layout whitespace was normalized.',
    '',
    ...records.map((record) => `[${record.evidence_id}] ${record.text}`)
  ].join('\n');
  return {
    catalog: {
      catalog_version: 'evidence-catalog-v003',
      case_id: caseId,
      source_packet_sha256: sha256Text(packetText),
      record_count: records.length,
      records
    },
    modelInput
  };
}

module.exports = { buildEvidenceCatalog, buildCompactLineEvidenceCatalog, buildSentenceEvidenceCatalog, sha256Text };
