(() => {
  "use strict";

  const { $, copyText, formatBytes, readAsDataUrl, setupDropZone } = UI;

  const output = $("#output");
  const errorEl = $("#error");

  async function handleFile(file) {
    const isImage = file.type.startsWith("image/");
    errorEl.textContent = "Please select an image file.";
    errorEl.hidden = isImage;
    if (!isImage) return;

    const dataUrl = await readAsDataUrl(file);
    $("#preview").src = dataUrl;
    output.value = dataUrl;
    $("#outputSize").textContent = `(${formatBytes(dataUrl.length)})`;
    $("#dropLabel").textContent = `Selected: ${file.name}`;
    $("#result").hidden = false;
  }

  setupDropZone($("#dropZone"), ([file]) => handleFile(file));
  $("#copyBtn").addEventListener("click", () => copyText(output.value));
})();
