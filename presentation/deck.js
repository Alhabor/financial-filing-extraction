(() => {
  const slides = window.FINANCIAL_FILING_SLIDES || [];
  const deck = document.getElementById("deck");
  const sourcebar = document.getElementById("sourcebar");
  const count = document.getElementById("count");
  const trace = document.getElementById("trace");
  const progress = document.getElementById("progress-bar");
  const themeButton = document.getElementById("theme-toggle");
  const fullscreenButton = document.getElementById("fullscreen-btn");
  const stage = document.querySelector(".stage");
  const repoBase = "https://github.com/Alhabor/financial-filing-extraction/blob/main/";
  let current = 0;
  let notesOn = false;

  try {
    const saved = new URLSearchParams(location.search).get("theme") || localStorage.getItem("financial-filing-theme");
    document.documentElement.dataset.theme = saved === "dark" ? "dark" : "light";
  } catch (_) {}

  slides.forEach((slide, index) => {
    const section = document.createElement("section");
    section.className = "slide";
    section.id = `slide-${index + 1}`;
    section.dataset.layout = slide.layout || "default";
    section.setAttribute("role", "group");
    section.setAttribute("aria-roledescription", "幻灯片");
    section.setAttribute("aria-label", `${index + 1} / ${slides.length}：${slide.title.replace(/<[^>]+>/g, "")}`);
    section.innerHTML = `
      <p class="kicker">${slide.kicker || ""}</p>
      <h${index === 0 ? "1" : "2"}>${slide.title}</h${index === 0 ? "1" : "2"}>
      <div class="slide-body">${slide.body || ""}</div>
      <aside class="notes"><p>${slide.notes || ""}</p></aside>`;
    deck.append(section);
  });

  const elements = [...deck.querySelectorAll(".slide")];

  function updateSources() {
    sourcebar.replaceChildren();
    const label = document.createElement("span");
    label.className = "source-label";
    label.textContent = "原始文件";
    sourcebar.append(label);
    for (const [name, path] of slides[current].sources || []) {
      const link = document.createElement("a");
      link.href = path.startsWith("http") ? path : repoBase + path;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = `${name} ↗`;
      sourcebar.append(link);
    }
  }

  function show(index) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    elements.forEach((element, i) => {
      element.classList.toggle("active", i === current);
      element.setAttribute("aria-hidden", i === current ? "false" : "true");
      element.querySelector(".notes")?.classList.toggle("show", notesOn && i === current);
    });
    count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}${notesOn ? " · 备注" : ""}`;
    trace.textContent = `EVIDENCE ${String(current + 1).padStart(2, "0")}`;
    progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    updateSources();
    if (location.hash !== `#/${current + 1}`) history.replaceState(null, "", `#/${current + 1}`);
  }

  function fromHash() {
    const match = location.hash.match(/^#\/(\d+)/);
    return match ? Number(match[1]) - 1 : 0;
  }

  function applyTheme(next, persist = true) {
    document.documentElement.dataset.theme = next;
    themeButton.textContent = next === "dark" ? "☀" : "☾";
    themeButton.setAttribute("aria-label", next === "dark" ? "切换至浅色主题" : "切换至深色主题");
    if (persist) try { localStorage.setItem("financial-filing-theme", next); } catch (_) {}
  }

  document.getElementById("prev-btn").addEventListener("click", () => show(current - 1));
  document.getElementById("next-btn").addEventListener("click", () => show(current + 1));
  themeButton.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
  fullscreenButton.addEventListener("click", () => document.fullscreenElement ? document.exitFullscreen?.() : stage.requestFullscreen?.());
  addEventListener("hashchange", () => { if (fromHash() !== current) show(fromHash()); });
  addEventListener("keydown", (event) => {
    if (["ArrowRight", "PageDown", " "].includes(event.key)) { event.preventDefault(); show(current + 1); }
    else if (["ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); show(current - 1); }
    else if (event.key === "Home") show(0);
    else if (event.key === "End") show(slides.length - 1);
    else if (event.key.toLowerCase() === "n") { notesOn = !notesOn; show(current); }
    else if (event.key.toLowerCase() === "t") applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    else if (event.key.toLowerCase() === "f") fullscreenButton.click();
  });
  addEventListener("click", (event) => {
    if (event.target.closest("a, button, .notes")) return;
    show(current + (event.clientX > innerWidth / 3 ? 1 : -1));
  });

  let touchStart = null;
  stage.addEventListener("pointerdown", (event) => { if (event.pointerType === "touch") touchStart = event.clientX; });
  stage.addEventListener("pointerup", (event) => {
    if (touchStart === null) return;
    const delta = event.clientX - touchStart;
    touchStart = null;
    if (Math.abs(delta) > 45) show(current + (delta < 0 ? 1 : -1));
  });

  applyTheme(document.documentElement.dataset.theme, false);
  show(fromHash());
})();
