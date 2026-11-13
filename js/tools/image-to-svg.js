(() => {
  "use strict";

  const { $, copyText, formatBytes, loadImage, setupDropZone } = UI;

  const MAX_SIZE = 400; // longest side of the working canvas, in px
  const ALPHA_CUTOFF = 128; // more transparent pixels are left out of the SVG

  const originalCanvas = $("#originalCanvas");
  const processedCanvas = $("#processedCanvas");
  const originalCtx = originalCanvas.getContext("2d");
  const processedCtx = processedCanvas.getContext("2d", { willReadFrequently: true });
  const levelsInput = $("#levels");
  const blurInput = $("#blur");
  const convertBtn = $("#convertBtn");
  const errorEl = $("#error");

  let image = null;
  let downloadUrl = null;

  /** Snap each RGB channel to one of `levels` evenly spaced values. */
  function quantize(data, levels) {
    const step = 255 / (levels - 1);
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.round(Math.round(data[i] / step) * step);
      data[i + 1] = Math.round(Math.round(data[i + 1] / step) * step);
      data[i + 2] = Math.round(Math.round(data[i + 2] / step) * step);
    }
  }

  function updateLabels() {
    const levels = Number(levelsInput.value);
    $("#levelsLabel").textContent = `${levels} levels per channel (up to ${(levels ** 3).toLocaleString()} colours)`;
    $("#blurLabel").textContent = `${blurInput.value}px`;
  }

  function process() {
    updateLabels();
    if (!image) return;

    const scale = Math.min(1, MAX_SIZE / image.width, MAX_SIZE / image.height);
    const width = Math.max(1, Math.floor(image.width * scale));
    const height = Math.max(1, Math.floor(image.height * scale));
    originalCanvas.width = processedCanvas.width = width;
    originalCanvas.height = processedCanvas.height = height;

    originalCtx.drawImage(image, 0, 0, width, height);
    processedCtx.drawImage(image, 0, 0, width, height);

    const blur = Number(blurInput.value);
    if (blur > 0 && window.StackBlur) {
      window.StackBlur.canvasRGBA(processedCanvas, 0, 0, width, height, blur);
    }

    const imageData = processedCtx.getImageData(0, 0, width, height);
    quantize(imageData.data, Number(levelsInput.value));
    processedCtx.putImageData(imageData, 0, 0);

    $("#result").hidden = true; // output no longer matches the preview
  }

  /**
   * Build the SVG: every horizontal run of same-coloured pixels becomes a 1px-tall
   * rectangle, and all rectangles of one colour share a single <path>.
   */
  function toSvg() {
    const { width, height } = processedCanvas;
    const { data } = processedCtx.getImageData(0, 0, width, height);
    const pathsByColor = new Map();

    const colorAt = (x, y) => {
      const i = (y * width + x) * 4;
      if (data[i + 3] < ALPHA_CUTOFF) return null;
      return "#" + ((1 << 24) | (data[i] << 16) | (data[i + 1] << 8) | data[i + 2]).toString(16).slice(1);
    };

    for (let y = 0; y < height; y++) {
      let x = 0;
      while (x < width) {
        const color = colorAt(x, y);
        let end = x + 1;
        while (end < width && colorAt(end, y) === color) end++;
        if (color) {
          const run = end - x;
          const segment = `M${x} ${y}h${run}v1h${-run}z`;
          pathsByColor.set(color, (pathsByColor.get(color) ?? "") + segment);
        }
        x = end;
      }
    }

    const paths = [...pathsByColor].map(([color, d]) => `  <path fill="${color}" d="${d}"/>`);
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges">`,
      ...paths,
      "</svg>",
    ].join("\n");
  }

  function convert() {
    const svg = toSvg();
    $("#svgOutput").value = svg;
    $("#svgSize").textContent = `(${formatBytes(new Blob([svg]).size)})`;

    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    $("#downloadLink").href = downloadUrl;
    $("#result").hidden = false;
  }

  setupDropZone($("#dropZone"), async ([file]) => {
    try {
      if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
      image = await loadImage(file);
      $("#dropLabel").textContent = `Selected: ${file.name}`;
      errorEl.hidden = true;
      convertBtn.disabled = false;
      process();
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.hidden = false;
    }
  });

  levelsInput.addEventListener("input", process);
  blurInput.addEventListener("input", process);
  convertBtn.addEventListener("click", convert);
  $("#copyBtn").addEventListener("click", () => copyText($("#svgOutput").value));

  updateLabels();
})();
