(() => {
  "use strict";

  const { $, canvasToBlob, formatBytes, loadImage, setupDropZone } = UI;

  const MAX_DIMENSION = 10_000;
  const EXTENSIONS = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };

  const convertBtn = $("#convertBtn");
  const errorEl = $("#error");
  const resultEl = $("#result");

  let selectedFile = null;
  let outputUrl = null;

  const isSvg = (file) => file.type === "image/svg+xml" || file.name.toLowerCase().endsWith(".svg");

  /**
   * An SVG with a viewBox but no width/height has no intrinsic size, so browsers
   * rasterise it at an arbitrary default. Give it the target size explicitly.
   */
  function sizeSvg(svgText, width, height) {
    const doc = new DOMParser().parseFromString(svgText, "image/svg+xml");
    const svg = doc.querySelector("svg");
    if (!svg) return svgText;
    if (svg.hasAttribute("viewBox") && !(svg.hasAttribute("width") && svg.hasAttribute("height"))) {
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
    }
    return new XMLSerializer().serializeToString(doc);
  }

  async function loadSource(file, width, height) {
    if (!isSvg(file)) return loadImage(file);
    const svgText = sizeSvg(await file.text(), width, height);
    return loadImage(new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }));
  }

  /** Source and destination rectangles for drawImage() for each resize mode. */
  function fitRects(mode, img, width, height) {
    const src = { x: 0, y: 0, w: img.width, h: img.height };
    const dest = { x: 0, y: 0, w: width, h: height };

    if (mode === "contain") {
      const scale = Math.min(width / img.width, height / img.height);
      dest.w = img.width * scale;
      dest.h = img.height * scale;
      dest.x = (width - dest.w) / 2;
      dest.y = (height - dest.h) / 2;
    } else if (mode === "cover") {
      const scale = Math.max(width / img.width, height / img.height);
      src.w = width / scale;
      src.h = height / scale;
      src.x = (img.width - src.w) / 2;
      src.y = (img.height - src.h) / 2;
    }
    return { src, dest };
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = !message;
    if (message) resultEl.hidden = true;
  }

  async function convert() {
    const width = Number.parseInt($("#width").value, 10);
    const height = Number.parseInt($("#height").value, 10);
    const mode = $("#resizeMode").value;
    const type = $("#format").value;

    const valid = (n) => Number.isInteger(n) && n >= 1 && n <= MAX_DIMENSION;
    if (!valid(width) || !valid(height)) {
      showError(`Width and height must be between 1 and ${MAX_DIMENSION.toLocaleString()} px.`);
      return;
    }

    convertBtn.disabled = true;
    try {
      const img = await loadSource(selectedFile, width, height);
      const canvas = Object.assign(document.createElement("canvas"), { width, height });
      const ctx = canvas.getContext("2d");
      if (type === "image/jpeg") {
        ctx.fillStyle = "#fff"; // JPEG has no transparency
        ctx.fillRect(0, 0, width, height);
      }
      const { src, dest } = fitRects(mode, img, width, height);
      ctx.drawImage(img, src.x, src.y, src.w, src.h, dest.x, dest.y, dest.w, dest.h);

      const blob = await canvasToBlob(canvas, type, 0.92);
      if (!blob) throw new Error("Your browser couldn't export that image.");
      // Browsers that can't encode a format (e.g. WebP on old Safari) fall back to PNG.
      const extension = EXTENSIONS[blob.type] ?? "png";

      if (outputUrl) URL.revokeObjectURL(outputUrl);
      outputUrl = URL.createObjectURL(blob);

      $("#previewImg").src = outputUrl;
      $("#info").textContent = `${width}×${height}px · ${extension.toUpperCase()} · ${formatBytes(blob.size)}`;
      const link = $("#downloadLink");
      link.href = outputUrl;
      link.download = `converted_${width}x${height}.${extension}`;
      link.textContent = `⬇️ Download ${extension.toUpperCase()}`;
      showError("");
      resultEl.hidden = false;
    } catch (error) {
      showError(error.message);
    } finally {
      convertBtn.disabled = false;
    }
  }

  setupDropZone($("#dropZone"), ([file]) => {
    if (!file.type.startsWith("image/") && !isSvg(file)) {
      showError("Please choose an image file.");
      return;
    }
    selectedFile = file;
    convertBtn.disabled = false;
    $("#dropLabel").textContent = `Selected: ${file.name}`;
    showError("");
  });

  convertBtn.addEventListener("click", convert);
})();
