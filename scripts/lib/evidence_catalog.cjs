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

module.exports = { buildEvidenceCatalog, sha256Text };
