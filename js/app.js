// App shell: the single source of truth for navigation. Every page loads this
// script and gets the top bar, searchable sidebar and theme toggle injected —
// no copy-pasted nav markup.
(() => {
  "use strict";

  const { escapeHtml } = UI;

  const GROUPS = ["Games", "Text", "Images", "Developer", "Math & Dates"];

  /** To add a tool: create the page + js/tools/<name>.js and add one entry here. */
  const TOOLS = [
    { href: "index.html", title: "Snake", icon: "🐍", group: "Games", desc: "The classic — keyboard, swipe or D-pad." },
    { href: "dice.html", title: "Dice Roller", icon: "🎲", group: "Games", desc: "Roll up to ten 3D dice." },
    { href: "coin.html", title: "Coin Flip", icon: "🪙", group: "Games", desc: "Heads or tails?" },

    { href: "compare.html", title: "Text Compare", icon: "🔍", group: "Text", desc: "Word-level diff of two texts." },
    { href: "case-converter.html", title: "Case Converter", icon: "🔤", group: "Text", desc: "camelCase, snake_case, kebab-case and more." },
    { href: "word-counter.html", title: "Word Counter", icon: "📝", group: "Text", desc: "Count words and characters." },
    { href: "character_counter.html", title: "Character Counter", icon: "🔢", group: "Text", desc: "Detailed text statistics and reading time." },

    { href: "image_converter.html", title: "Image Converter", icon: "🖼️", group: "Images", desc: "Resize and convert to PNG, JPEG or WebP." },
    { href: "image-to-svg.html", title: "Image to SVG", icon: "✨", group: "Images", desc: "Posterize an image into SVG shapes." },
    { href: "image-to-base64.html", title: "Image to Base64", icon: "🧬", group: "Images", desc: "Encode an image as a data URL." },
    { href: "image-to-pdf.html", title: "Image to PDF", icon: "📄", group: "Images", desc: "Combine images into one PDF." },

    { href: "JWT-encoder-decoder.html", title: "JWT Encoder & Decoder", icon: "🔐", group: "Developer", desc: "Sign and inspect JSON Web Tokens." },
    { href: "random-generator.html", title: "Random Generator", icon: "🎰", group: "Developer", desc: "Random strings and integers." },

    { href: "advanced-function-grapher.html", title: "Function Grapher", icon: "📈", group: "Math & Dates", desc: "Plot functions, including ± branches." },
    { href: "days_calculator.html", title: "Days Calculator", icon: "📅", group: "Math & Dates", desc: "Time between two dates." },
  ];

  const ICONS = {
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    sun: '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  };

  const currentPage = location.pathname.split("/").pop() || "index.html";

  function navLink({ href, title, icon }) {
    const current = href === currentPage ? ' aria-current="page"' : "";
    return `<a class="nav-link" href="${href}"${current}><span class="nav-icon" aria-hidden="true">${icon}</span>${escapeHtml(title)}</a>`;
  }

  function buildShell() {
    const topbar = document.createElement("header");
    topbar.className = "topbar";
    topbar.innerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      <button class="icon-btn menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="sidebar">${ICONS.menu}</button>
      <a class="brand" href="index.html"><span aria-hidden="true">🧰</span> Tools</a>
      <button class="icon-btn theme-btn" type="button" aria-label="Toggle dark mode">${ICONS.sun}${ICONS.moon}</button>`;

    const sidebar = document.createElement("nav");
    sidebar.className = "sidebar";
    sidebar.id = "sidebar";
    sidebar.setAttribute("aria-label", "Tools");
    const section = (title, links) =>
      `<div class="nav-section"><div class="nav-group">${escapeHtml(title)}</div>${links.map(navLink).join("")}</div>`;
    sidebar.innerHTML =
      `<div class="nav-search"><input type="search" placeholder="Search tools…" aria-label="Search tools" autocomplete="off" /></div>` +
      GROUPS.map((group) => section(group, TOOLS.filter((tool) => tool.group === group))).join("") +
      section("Site", [{ href: "about.html", title: "About", icon: "ℹ️" }]) +
      `<p class="nav-empty" hidden>No tools match your search.</p>`;

    const backdrop = document.createElement("div");
    backdrop.className = "backdrop";

    document.body.prepend(topbar, sidebar, backdrop);
    return { topbar, sidebar, backdrop };
  }

  function setupDrawer({ topbar, sidebar, backdrop }) {
    const menuBtn = topbar.querySelector(".menu-btn");

    const setOpen = (open) => {
      document.body.classList.toggle("nav-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    };

    menuBtn.addEventListener("click", () => setOpen(!document.body.classList.contains("nav-open")));
    backdrop.addEventListener("click", () => setOpen(false));
    sidebar.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  /** Filter the sidebar as you type; Enter opens the first match. */
  function setupSearch(sidebar) {
    const input = sidebar.querySelector(".nav-search input");
    const links = [...sidebar.querySelectorAll(".nav-link")];
    const visibleLinks = () => links.filter((link) => !link.hidden);

    input.addEventListener("input", () => {
      const needle = input.value.trim().toLowerCase();
      for (const link of links) link.hidden = !link.textContent.toLowerCase().includes(needle);
      for (const section of sidebar.querySelectorAll(".nav-section")) {
        section.hidden = !section.querySelector(".nav-link:not([hidden])");
      }
      sidebar.querySelector(".nav-empty").hidden = visibleLinks().length > 0;
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && input.value.trim()) visibleLinks()[0]?.click();
    });
  }

  function setupTheme(topbar) {
    topbar.querySelector(".theme-btn").addEventListener("click", () => {
      const root = document.documentElement;
      const theme = root.dataset.theme === "dark" ? "light" : "dark";
      root.dataset.theme = theme;
      try {
        localStorage.setItem("theme", theme);
      } catch {
        // Not persisted; still applies for this page view.
      }
      // Canvas-based tools repaint with the new palette.
      document.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
    });
  }

  const shell = buildShell();
  setupDrawer(shell);
  setupSearch(shell.sidebar);
  setupTheme(shell.topbar);
})();
