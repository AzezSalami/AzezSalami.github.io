// Small DOM helpers shared by every tool, exposed as the global `UI`.
// Plain (non-module) scripts so the site also works when opened straight from disk.
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  /** Create an element: h("button", { className: "btn", textContent: "Go" }, child, ...) */
  function h(tag, props = {}, ...children) {
    const el = Object.assign(document.createElement(tag), props);
    el.append(...children.filter((child) => child != null));
    return el;
  }

  function escapeHtml(value) {
    return String(value).replace(
      /[&<>"']/g,
      (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
    );
  }

  /** Read a design token (CSS custom property) — used by canvas-based tools. */
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /** Animation duration that collapses to 0 when the user prefers reduced motion. */
  function motionMs(ms) {
    return matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms;
  }

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  }

  let toastEl;
  let toastTimer;

  function toast(message) {
    toastEl ??= document.body.appendChild(h("div", { className: "toast", role: "status" }));
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("is-visible"), 2000);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied to clipboard");
    } catch {
      // Clipboard API needs a secure context; fall back for plain http / file previews.
      const helper = h("textarea", { value: text });
      helper.style.cssText = "position:fixed;opacity:0";
      document.body.append(helper);
      helper.select();
      const ok = document.execCommand("copy");
      helper.remove();
      toast(ok ? "Copied to clipboard" : "Couldn't copy — select and copy manually");
    }
  }

  /**
   * Wire a <label class="dropzone"> that wraps an <input type="file">.
   * Clicking and keyboard activation come for free from the label/input pair;
   * this adds drag & drop and normalises both paths into one callback.
   */
  function setupDropZone(zone, onFiles) {
    const input = $("input[type=file]", zone);

    for (const type of ["dragenter", "dragover"]) {
      zone.addEventListener(type, (event) => {
        event.preventDefault();
        zone.classList.add("is-dragover");
      });
    }
    zone.addEventListener("dragleave", () => zone.classList.remove("is-dragover"));
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("is-dragover");
      const files = [...event.dataTransfer.files];
      if (files.length) onFiles(files);
    });
    input.addEventListener("change", () => {
      const files = [...input.files];
      input.value = ""; // allow re-selecting the same file
      if (files.length) onFiles(files);
    });
  }

  /** Accessible tabs: buttons with role="tab" + aria-controls pointing at panels. */
  function setupTabs(tablist) {
    const tabs = $$("[role=tab]", tablist);

    const select = (active) => {
      for (const tab of tabs) {
        const selected = tab === active;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
      }
    };

    tablist.addEventListener("click", (event) => {
      const tab = event.target.closest("[role=tab]");
      if (tab) select(tab);
    });
    tablist.addEventListener("keydown", (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      const next = tabs[(tabs.indexOf(document.activeElement) + step + tabs.length) % tabs.length];
      next.focus();
      select(next);
    });

    select(tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs[0]);
  }

  /** Load a Blob/File as an HTMLImageElement. */
  function loadImage(blob) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read that image."));
      };
      img.src = url;
    });
  }

  function readAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  const canvasToBlob = (canvas, type = "image/png", quality) =>
    new Promise((resolve) => canvas.toBlob(resolve, type, quality));

  window.UI = { $, $$, h, escapeHtml, cssVar, motionMs, wait, formatBytes, toast, copyText, setupDropZone, setupTabs, loadImage, readAsDataUrl, canvasToBlob };
})();
