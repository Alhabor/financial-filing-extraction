#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const cases = [
  "NVDA-FY25",
  "COIN-FY24",
  "PYPL-FY24",
  "BA-FY24",
  "JPM-FY24",
  "TSLA-FY24",
  "PFE-FY24",
  "META-FY24",
];

function pdfPages(pdfPath) {
  const output = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const match = output.match(/^Pages:\s+(\d+)$/m);
  return match ? Number(match[1]) : null;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

for (const id of cases) {
  const rawRoot = path.join(root, "data", "raw", "sec", id);
  const pdfPath = path.join(rawRoot, "filing.pdf");
  const fullTextPath = path.join(rawRoot, "filing.txt");
  const sourcePath = path.join(rawRoot, "source.json");
  const itemPath = path.join(root, "data", "processed", "item_1a", `${id}.txt`);
  const modelInputPath = path.join(root, "data", "processed", "model_inputs", `${id}.txt`);

  assert(fs.existsSync(pdfPath), `${id}: missing filing.pdf`);
  assert(fs.readFileSync(pdfPath, "utf8").startsWith("%PDF-"), `${id}: invalid PDF header`);
  assert(fs.statSync(fullTextPath).size > 0, `${id}: empty filing.txt`);
  const metadata = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
  assert(metadata.id === id, `${id}: source.json id mismatch`);
  assert(metadata.pdf.pages === pdfPages(pdfPath), `${id}: page count mismatch`);
  assert(fs.statSync(itemPath).size > 0, `${id}: empty item_1a output`);
  const modelInput = fs.readFileSync(modelInputPath, "utf8");
  assert(/^\[PAGE \d+\]\nITEM\s+1A[.:\s]+RISK\s+FACTORS/im.test(modelInput), `${id}: Item 1A heading missing`);
  assert(!/^\s*ITEM\s+(?:1B|1C|2)\b/im.test(modelInput), `${id}: later Item heading leaked into model input`);
  assert(metadata.item1a.extractedCharacters === modelInput.trimEnd().length, `${id}: character count mismatch`);
  console.log(`${id}: verified`);
}

console.log(`${cases.length} cases verified`);
