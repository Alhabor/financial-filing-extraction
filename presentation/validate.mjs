import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import vm from "node:vm";

const root = resolve(dirname(new URL(import.meta.url).pathname), "..");
const presentation = join(root, "presentation");
const context = { window: {} };
vm.runInNewContext(readFileSync(join(presentation, "slides.zh.js"), "utf8"), context);
const slides = context.window.FINANCIAL_FILING_SLIDES;
const failures = [];

if (!Array.isArray(slides) || slides.length !== 11) {
  failures.push(`expected 11 slides, found ${slides?.length ?? "none"}`);
}

const titles = new Set();
for (const [index, slide] of (slides || []).entries()) {
  const label = `slide ${index + 1}`;
  if (!slide.title || !slide.body || !slide.notes) failures.push(`${label} is missing title, body, or notes`);
  const plainTitle = slide.title.replace(/<[^>]+>/g, "");
  if (titles.has(plainTitle)) failures.push(`${label} duplicates title: ${plainTitle}`);
  titles.add(plainTitle);

  for (const match of slide.body.matchAll(/src="([^"]+)"/g)) {
    if (!existsSync(join(presentation, match[1]))) failures.push(`${label} missing asset: ${match[1]}`);
  }

  for (const source of slide.sources || []) {
    const path = source[1];
    if (path.startsWith("http")) continue;
    const localPath = path.split("#")[0];
    if (!existsSync(join(root, localPath))) failures.push(`${label} missing source: ${localPath}`);
  }
}

const html = readFileSync(join(presentation, "index.html"), "utf8");
for (const requirement of ["deck.css", "slides.zh.js", "deck.js", "fullscreen-btn", "theme-toggle"]) {
  if (!html.includes(requirement)) failures.push(`index.html is missing ${requirement}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Validated ${slides.length} Chinese slides, ${titles.size} unique titles, local assets, and source links.`);
