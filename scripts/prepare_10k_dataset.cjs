#!/usr/bin/env node

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const dataRoot = path.join(root, "data");

// Public source registry. The local PDFs are downloaded separately so that
// this script remains a deterministic text-preparation step with no network
// dependency.
const cases = [
  {
    id: "NVDA-FY25",
    company: "NVIDIA Corporation",
    ticker: "NVDA",
    cik: "0001045810",
    accession: "0001045810-25-000023",
    fiscalYear: "FY2025",
    periodEnd: "2025-01-26",
    filingDate: "2025-02-26",
    sourceType: "SEC filing PDF",
    sourceUrl:
      "https://d18rn0p25nwr6d.cloudfront.net/CIK-0001045810/177440d5-3b32-4185-8cc8-95500a9dc783.pdf",
    secHtmlUrl:
      "https://www.sec.gov/Archives/edgar/data/1045810/000104581025000023/nvda-20250126.htm",
  },
  {
    id: "COIN-FY24",
    company: "Coinbase Global, Inc.",
    ticker: "COIN",
    cik: "0001679788",
    accession: "0001679788-25-000022",
    fiscalYear: "FY2024",
    periodEnd: "2024-12-31",
    filingDate: "2025-02-13",
    sourceType: "Issuer-hosted Form 10-K PDF",
    sourceUrl:
      "https://investor.coinbase.com/files/doc_financials/2024/q4/Coinbase-Global-Inc-2024-10K-for-IR.pdf",
    secHtmlUrl:
      "https://www.sec.gov/Archives/edgar/data/1679788/000167978825000022/coin-20241231.htm",
  },
  {
    id: "PYPL-FY24",
    company: "PayPal Holdings, Inc.",
    ticker: "PYPL",
    cik: "0001633917",
    accession: "0001633917-25-000019",
    fiscalYear: "FY2024",
    periodEnd: "2024-12-31",
    filingDate: "2025-02-04",
    sourceType: "SEC filing PDF",
    sourceUrl:
      "https://d18rn0p25nwr6d.cloudfront.net/CIK-0001633917/ce09b590-7f74-448a-9616-a9817693b50e.pdf",
    secHtmlUrl:
      "https://www.sec.gov/Archives/edgar/data/1633917/000163391725000019/pypl-20241231.htm",
  },
  {
    id: "BA-FY24",
    company: "The Boeing Company",
    ticker: "BA",
    cik: "0000012927",
    accession: "0000012927-25-000015",
    fiscalYear: "FY2024",
    periodEnd: "2024-12-31",
    filingDate: "2025-02-03",
    sourceType: "SEC-filed annual report PDF containing Form 10-K",
    sourceUrl:
      "https://www.sec.gov/Archives/edgar/data/12927/000119312525049918/d844315dars.pdf",
    secHtmlUrl:
      "https://www.sec.gov/Archives/edgar/data/12927/000001292725000015/ba-20241231.htm",
  },
  {
    id: "JPM-FY24",
    company: "JPMorgan Chase & Co.",
    ticker: "JPM",
    cik: "0000019617",
    accession: "0000019617-25-000270",
    fiscalYear: "FY2024",
    periodEnd: "2024-12-31",
    filingDate: "2025-02-14",
    sourceType: "Issuer-hosted Form 10-K PDF",
    sourceUrl:
      "https://www.jpmorganchase.com/content/dam/jpmc/jpmorgan-chase-and-co/investor-relations/documents/quarterly-earnings/2024/4th-quarter/corp-10k-2024.pdf",
    secHtmlUrl:
      "https://www.sec.gov/Archives/edgar/data/19617/000001961725000270/jpm-20241231.htm",
  },
  {
    id: "TSLA-FY24",
    company: "Tesla, Inc.",
    ticker: "TSLA",
    cik: "0001318605",
    accession: "0001628280-25-003063",
    fiscalYear: "FY2024",
    periodEnd: "2024-12-31",
    filingDate: "2025-01-30",
    sourceType: "Issuer-hosted Form 10-K PDF",
    sourceUrl:
      "https://ir.tesla.com/_flysystem/s3/sec/000162828025003063/tsla-20241231-gen.pdf",
    secHtmlUrl:
      "https://www.sec.gov/Archives/edgar/data/1318605/000162828025003063/tsla-20241231.htm",
  },
  {
    id: "PFE-FY24",
    company: "Pfizer Inc.",
    ticker: "PFE",
    cik: "0000078003",
    accession: "0000078003-25-000054",
    fiscalYear: "FY2024",
    periodEnd: "2024-12-31",
    filingDate: "2025-02-13",
    sourceType: "SEC filing PDF",
    sourceUrl:
      "https://d18rn0p25nwr6d.cloudfront.net/CIK-0000078003/58225110-35f3-46df-a207-d87bb30eaedd.pdf",
    secHtmlUrl:
      "https://www.sec.gov/Archives/edgar/data/78003/000007800325000054/pfe-20241231.htm",
  },
  {
    id: "META-FY24",
    company: "Meta Platforms, Inc.",
    ticker: "META",
    cik: "0001326801",
    accession: "0001326801-25-000017",
    fiscalYear: "FY2024",
    periodEnd: "2024-12-31",
    filingDate: "2025-01-30",
    sourceType: "Issuer-hosted annual report PDF containing Form 10-K",
    sourceUrl:
      "https://s21.q4cdn.com/399680738/files/doc_financials/2024/ar/Meta-12-31-2024-10K-ARS.pdf",
    secHtmlUrl:
      "https://www.sec.gov/Archives/edgar/data/1326801/000132680125000017/meta-20241231.htm",
  },
];

function run(command, args) {
  return execFileSync(command, args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
}

function parsePdfInfo(pdfPath) {
  const output = run("pdfinfo", [pdfPath]);
  const fields = {};
  for (const line of output.split(/\r?\n/)) {
    const match = line.match(/^([^:]+):\s*(.*)$/);
    if (match) fields[match[1].trim()] = match[2].trim();
  }
  return fields;
}

function sha256(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function allMatches(text, regex) {
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) matches.push(match);
  return matches;
}

function nextSectionBoundary(text, start) {
  const boundaryRegex = /^\s*ITEM\s+(?:1B|1C|2)\b[^\n]*/gim;
  boundaryRegex.lastIndex = start + 10;
  return boundaryRegex.exec(text);
}

function extractItem1A(fullText) {
  // Requiring a line-start heading excludes ordinary cross-references such as
  // "see Item 1A. Risk Factors" in MD&A and the notes.
  const headingRegex = /^\s*ITEM\s+1A\s*[.\-:\u2013]?\s*RISK\s+FACTORS\b/gim;
  const candidates = [];
  for (const heading of allMatches(fullText, headingRegex)) {
    const boundary = nextSectionBoundary(fullText, heading.index);
    const end = boundary ? boundary.index : fullText.length;
    const body = fullText.slice(heading.index, end);
    // The table of contents is usually a short false positive. Actual Item
    // 1A sections are materially longer and contain prose paragraphs.
    if (body.length >= 1200 && /\n\s*[^\n]{80,}/.test(body)) {
      candidates.push({ start: heading.index, end, boundary: boundary?.[0] ?? null });
    }
  }
  if (!candidates.length) {
    throw new Error("could not locate a substantive Item 1A. Risk Factors section");
  }
  // After the short table-of-contents hit, the first substantive candidate is
  // the filed Item 1A section. Later references can occur in exhibits or
  // incorporated disclosures, so selecting the last candidate is unsafe.
  const selected = candidates[0];
  const raw = fullText.slice(selected.start, selected.end).trim();
  const roughStartPage = fullText.slice(0, selected.start).split("\f").length;
  return {
    text: raw,
    roughStartPage,
    candidateCount: candidates.length,
    boundary: selected.boundary,
  };
}

function readPdfPage(pdfPath, pageNumber) {
  // Raw object ordering is easier for a language model to follow than
  // visually faithful two-column coordinates (especially for JPM), while
  // preserving the source's line-level wording.
  return run("pdftotext", [
    "-raw",
    "-f",
    String(pageNumber),
    "-l",
    String(pageNumber),
    pdfPath,
    "-",
  ]);
}

function firstRegexMatch(text, regex) {
  regex.lastIndex = 0;
  return regex.exec(text);
}

function removePageScaffolding(text) {
  const lines = text.split(/\r?\n/).filter((line) => !/^\s*Table of Contents\s*$/i.test(line));
  const clean = lines.join("\n").trim();
  return /^\d+$/.test(clean) ? "" : clean;
}

function extractPhysicalItem1A(pdfPath, pdfPages, roughStartPage) {
  const headingRegex = /^\s*ITEM\s+1A\s*[.\-:\u2013]?\s*RISK\s+FACTORS\b/im;
  const boundaryRegex = /^\s*ITEM\s+(?:1B|1C|2)\b[^\n]*/im;
  const searchStart = Math.max(1, roughStartPage - 3);
  let startPage = null;
  let firstPageText = null;
  for (let page = searchStart; page <= pdfPages; page += 1) {
    const pageText = readPdfPage(pdfPath, page);
    if (firstRegexMatch(pageText, headingRegex)) {
      startPage = page;
      firstPageText = pageText;
      break;
    }
  }
  if (!startPage) throw new Error("could not map Item 1A to a physical PDF page");

  const pages = [];
  let endPage = startPage;
  for (let page = startPage; page <= pdfPages; page += 1) {
    const pageText = page === startPage ? firstPageText : readPdfPage(pdfPath, page);
    let content = pageText;
    if (page === startPage) {
      const heading = firstRegexMatch(content, headingRegex);
      content = content.slice(heading.index);
    }
    const boundary = firstRegexMatch(content, boundaryRegex);
    if (boundary) {
      const beforeBoundary = removePageScaffolding(content.slice(0, boundary.index));
      // If the next item begins on a page containing only a repeated viewer
      // header/footer, do not include that page in the Item 1A input.
      if (beforeBoundary.length < 30) {
        endPage = Math.max(startPage, page - 1);
        break;
      }
      content = content.slice(0, boundary.index);
      endPage = page;
    } else {
      endPage = page;
    }
    content = removePageScaffolding(content);
    if (content) pages.push(`[PAGE ${page}]\n${content}`);
    if (boundary) break;
  }
  if (!pages.length) throw new Error("Item 1A page extraction produced no text");
  return {
    text: pages.join("\n\n"),
    startPage,
    endPage,
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function main() {
  const retrievedAt = new Date().toISOString();
  const manifestRows = [];

  for (const item of cases) {
    const caseRoot = path.join(dataRoot, "raw", "sec", item.id);
    const pdfPath = path.join(caseRoot, "filing.pdf");
    if (!fs.existsSync(pdfPath)) throw new Error(`${item.id}: missing ${pdfPath}`);

    const fullTextPath = path.join(caseRoot, "filing.txt");
    const fullText = run("pdftotext", ["-layout", pdfPath, "-"]);
    fs.writeFileSync(fullTextPath, fullText, "utf8");

    const section = extractItem1A(fullText);
    const info = parsePdfInfo(pdfPath);
    const physicalSection = extractPhysicalItem1A(
      pdfPath,
      Number(info.Pages),
      section.roughStartPage,
    );
    const itemPath = path.join(dataRoot, "processed", "item_1a", `${item.id}.txt`);
    const modelInputPath = path.join(
      dataRoot,
      "processed",
      "model_inputs",
      `${item.id}.txt`,
    );
    const modelText = physicalSection.text;
    const sourceHeader = [
      `Case: ${item.id}`,
      `Company: ${item.company}`,
      `Form: 10-K`,
      `Fiscal period end: ${item.periodEnd}`,
      `SEC accession: ${item.accession}`,
      `Source PDF: ${item.sourceUrl}`,
      `Section: Item 1A. Risk Factors`,
      `PDF page range: ${physicalSection.startPage}-${physicalSection.endPage}`,
      "",
    ].join("\n");
    fs.writeFileSync(itemPath, `${sourceHeader}${modelText}\n`, "utf8");
    fs.writeFileSync(modelInputPath, `${modelText}\n`, "utf8");

    const metadata = {
      ...item,
      retrievedAt,
      localFiles: {
        pdf: path.relative(root, pdfPath),
        fullText: path.relative(root, fullTextPath),
        item1a: path.relative(root, itemPath),
        modelInput: path.relative(root, modelInputPath),
      },
      pdf: {
        pages: Number(info.Pages),
        fileSizeBytes: fs.statSync(pdfPath).size,
        sha256: sha256(pdfPath),
        title: info.Title || null,
        producer: info.Producer || null,
      },
      item1a: {
        pdfPageStart: physicalSection.startPage,
        pdfPageEnd: physicalSection.endPage,
        substantiveHeadingCandidates: section.candidateCount,
        nextBoundary: section.boundary,
        extractedCharacters: modelText.length,
      },
    };
    fs.writeFileSync(
      path.join(caseRoot, "source.json"),
      `${JSON.stringify(metadata, null, 2)}\n`,
      "utf8",
    );

    manifestRows.push({
      id: item.id,
      company: item.company,
      ticker: item.ticker,
      fiscalYear: item.fiscalYear,
      periodEnd: item.periodEnd,
      filingDate: item.filingDate,
      accession: item.accession,
      sourceType: item.sourceType,
      sourceUrl: item.sourceUrl,
      secHtmlUrl: item.secHtmlUrl,
      pdfPages: info.Pages,
      pdfPageStart: physicalSection.startPage,
      pdfPageEnd: physicalSection.endPage,
      pdfSha256: metadata.pdf.sha256,
      item1aCharacters: modelText.length,
    });
    console.log(
      `${item.id}: ${info.Pages} pages; Item 1A pages ${physicalSection.startPage}-${physicalSection.endPage}; ${modelText.length} chars`,
    );
  }

  const columns = Object.keys(manifestRows[0]);
  const csv = [
    columns.join(","),
    ...manifestRows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n");
  fs.writeFileSync(path.join(dataRoot, "manifests", "filings.csv"), `${csv}\n`, "utf8");
}

try {
  main();
} catch (error) {
  console.error(`Dataset preparation failed: ${error.message}`);
  process.exitCode = 1;
}
