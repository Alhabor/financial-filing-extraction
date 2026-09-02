(() => {
  const catalogs = {
    zh: window.FINANCIAL_FILING_SLIDES || [],
    en: window.FINANCIAL_FILING_SLIDES_EN || []
  };
  const copy = {
    zh: {
      documentTitle: "Financial filing extraction｜SHBI-GB 7343",
      description: "SHBI-GB 7343 AI in Finance 第七组 10-K 风险证据抽取实验演示",
      stage: "Financial filing extraction 演示文稿",
      preferences: "显示设置", navigation: "幻灯片导航", sources: "本页原始文件",
      sourceLabel: "原始文件", previous: "上一页", next: "下一页", fullscreen: "进入全屏",
      exitFullscreen: "退出全屏", dark: "切换至深色主题", light: "切换至浅色主题",
      language: "Switch to English", exit: "← 展示站", notes: "备注", slideRole: "幻灯片"
    },
    en: {
      documentTitle: "Financial filing extraction | SHBI-GB 7343",
      description: "SHBI-GB 7343 AI in Finance Group 7 presentation on extracting traceable risk evidence from 10-K filings",
      stage: "Financial filing extraction slide presentation",
      preferences: "Display settings", navigation: "Slide navigation", sources: "Source files for this slide",
      sourceLabel: "Source files", previous: "Previous slide", next: "Next slide", fullscreen: "Enter fullscreen",
      exitFullscreen: "Exit fullscreen", dark: "Switch to dark theme", light: "Switch to light theme",
      language: "切换至中文", exit: "← Show index", notes: "Notes", slideRole: "slide"
    }
  };
  const deck = document.getElementById("deck");
  const sourcebar = document.getElementById("sourcebar");
  const count = document.getElementById("count");
  const trace = document.getElementById("trace");
  const progress = document.getElementById("progress-bar");
  const languageButton = document.getElementById("language-toggle");
  const themeButton = document.getElementById("theme-toggle");
  const fullscreenButton = document.getElementById("fullscreen-btn");
  const stage = document.querySelector(".stage");
  const preferences = document.querySelector(".preferences");
  const navigation = document.querySelector(".navigation");
  const exitLink = document.getElementById("exit-link");
  const description = document.querySelector('meta[name="description"]');
  const repoBase = "https://github.com/Alhabor/financial-filing-extraction/blob/main/";
  let language = document.documentElement.dataset.language === "en" ? "en" : "zh";
  let slides = catalogs[language];
  let current = 0;
  let notesOn = false;
  let elements = [];

  function renderSlides() {
    deck.replaceChildren();
    slides.forEach((slide, index) => {
      const section = document.createElement("section");
      section.className = "slide";
      section.id = `slide-${index + 1}`;
      section.lang = language === "en" ? "en" : "zh-CN";
      section.dataset.layout = slide.layout || "default";
      section.setAttribute("role", "group");
      section.setAttribute("aria-roledescription", copy[language].slideRole);
      section.setAttribute("aria-label", `${index + 1} / ${slides.length}: ${slide.title.replace(/<[^>]+>/g, "")}`);
      section.innerHTML = `
        <p class="kicker">${slide.kicker || ""}</p>
        <h${index === 0 ? "1" : "2"}>${slide.title}</h${index === 0 ? "1" : "2"}>
        <div class="slide-body">${slide.body || ""}</div>
        <aside class="notes"><p>${slide.notes || ""}</p></aside>`;
      deck.append(section);
    });
    elements = [...deck.querySelectorAll(".slide")];
  }

  function updateSources() {
    sourcebar.replaceChildren();
    const label = document.createElement("span");
    label.className = "source-label";
    label.textContent = copy[language].sourceLabel;
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
    count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}${notesOn ? ` · ${copy[language].notes}` : ""}`;
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
    themeButton.setAttribute("aria-label", next === "dark" ? copy[language].light : copy[language].dark);
    themeButton.title = themeButton.getAttribute("aria-label");
    if (persist) try { localStorage.setItem("financial-filing-theme", next); } catch (_) {}
  }

  function updateChrome() {
    const labels = copy[language];
    document.documentElement.lang = language === "en" ? "en" : "zh-CN";
    document.documentElement.dataset.language = language;
    document.title = labels.documentTitle;
    if (description) description.content = labels.description;
    stage.setAttribute("aria-label", labels.stage);
    preferences.setAttribute("aria-label", labels.preferences);
    navigation.setAttribute("aria-label", labels.navigation);
    sourcebar.setAttribute("aria-label", labels.sources);
    document.getElementById("prev-btn").setAttribute("aria-label", labels.previous);
    document.getElementById("next-btn").setAttribute("aria-label", labels.next);
    fullscreenButton.setAttribute("aria-label", document.fullscreenElement ? labels.exitFullscreen : labels.fullscreen);
    languageButton.textContent = language === "zh" ? "EN" : "中";
    languageButton.setAttribute("aria-label", labels.language);
    languageButton.title = labels.language;
    exitLink.textContent = labels.exit;
    applyTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light", false);
  }

  function applyLanguage(next, persist = true) {
    language = next === "en" ? "en" : "zh";
    slides = catalogs[language];
    if (!Array.isArray(slides) || !slides.length) {
      language = "zh";
      slides = catalogs.zh;
    }
    current = Math.min(current, slides.length - 1);
    updateChrome();
    renderSlides();
    show(current);
    if (persist) try { localStorage.setItem("financial-filing-language", language); } catch (_) {}
  }

  document.getElementById("prev-btn").addEventListener("click", () => show(current - 1));
  document.getElementById("next-btn").addEventListener("click", () => show(current + 1));
  languageButton.addEventListener("click", () => applyLanguage(language === "zh" ? "en" : "zh"));
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
    else if (event.key.toLowerCase() === "l") applyLanguage(language === "zh" ? "en" : "zh");
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

  addEventListener("fullscreenchange", updateChrome);
  current = fromHash();
  applyLanguage(language, false);
})();
