(() => {
  "use strict";

  const { $, copyText, textStats } = UI;

  const input = $("#textInput");

  function update() {
    const stats = textStats(input.value);
    $("#wordCount").textContent = stats.words.toLocaleString();
    $("#charCount").textContent = stats.chars.toLocaleString();
    $("#charNoSpaces").textContent = stats.charsNoSpaces.toLocaleString();
  }

  input.addEventListener("input", update);

  $("#removeBreaksBtn").addEventListener("click", () => {
    input.value = input.value.replace(/\r?\n/g, " ");
    update();
  });

  $("#copyBtn").addEventListener("click", () => copyText(input.value));

  $("#clearBtn").addEventListener("click", () => {
    input.value = "";
    input.focus();
    update();
  });

  update();
})();
