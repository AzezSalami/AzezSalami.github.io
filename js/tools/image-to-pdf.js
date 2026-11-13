(() => {
  "use strict";

  const { $, canvasToBlob, h, loadImage, setupDropZone } = UI;

  const previews = $("#previews");
  const convertBtn = $("#convertBtn");
  const downloadLink = $("#downloadLink");
  const errorEl = $("#error");

  let files = [];
  let objectUrls = []; // previews + generated PDF, revoked when replaced

  function resetOutput() {
    objectUrls.forEach((url) => URL.revokeObjectURL(url));
    objectUrls = [];
    previews.replaceChildren();
    downloadLink.hidden = true;
    errorEl.hidden = true;
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  function trackedUrl(blob) {
    const url = URL.createObjectURL(blob);
    objectUrls.push(url);
    return url;
  }

  function selectFiles(selected) {
    resetOutput();
    files = selected.filter((file) => file.type.startsWith("image/"));
    if (files.length < selected.length) showError("Only image files can be added — the others were skipped.");

    previews.replaceChildren(...files.map((file) => h("img", { src: trackedUrl(file), alt: file.name })));
    $("#dropLabel").textContent = files.length
      ? `${files.length} image${files.length === 1 ? "" : "s"} selected`
      : "Tap to choose images, or drop them here";
    convertBtn.hidden = files.length === 0;
  }

  /** PDF can embed JPEG and PNG directly; anything else is re-encoded to PNG via a canvas. */
  async function embed(pdfDoc, file) {
    if (file.type === "image/jpeg") return pdfDoc.embedJpg(await file.arrayBuffer());
    if (file.type === "image/png") return pdfDoc.embedPng(await file.arrayBuffer());

    const img = await loadImage(file);
    const canvas = Object.assign(document.createElement("canvas"), { width: img.width, height: img.height });
    canvas.getContext("2d").drawImage(img, 0, 0);
    const png = await canvasToBlob(canvas);
    return pdfDoc.embedPng(await png.arrayBuffer());
  }

  async function convert() {
    if (!window.PDFLib) {
      showError("Couldn't load the PDF library. Check your connection and reload.");
      return;
    }

    convertBtn.disabled = true;
    convertBtn.textContent = "Converting…";
    try {
      const pdfDoc = await window.PDFLib.PDFDocument.create();

      for (const file of files) {
        const image = await embed(pdfDoc, file);
        const page = pdfDoc.addPage();
        const { width: pageWidth, height: pageHeight } = page.getSize();

        // Scale to fit the page, centred, keeping the aspect ratio.
        const scale = Math.min(pageWidth / image.width, pageHeight / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height });
      }

      const pdfBytes = await pdfDoc.save();
      downloadLink.href = trackedUrl(new Blob([pdfBytes], { type: "application/pdf" }));
      downloadLink.hidden = false;
      convertBtn.hidden = true;
      errorEl.hidden = true;
    } catch (error) {
      console.error(error);
      showError("Failed to convert to PDF. One of the images may be corrupt or unsupported.");
    } finally {
      convertBtn.disabled = false;
      convertBtn.textContent = "Convert to PDF";
    }
  }

  setupDropZone($("#dropZone"), selectFiles);
  convertBtn.addEventListener("click", convert);
})();
