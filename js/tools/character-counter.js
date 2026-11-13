(() => {
  "use strict";

  const { $, textStats } = UI;

  const input = $("#textInput");

  function update() {
    const stats = textStats(input.value);
    $("#charCount").textContent = stats.chars.toLocaleString();
    $("#charNoSpaces").textContent = stats.charsNoSpaces.toLocaleString();
    $("#wordCount").textContent = stats.words.toLocaleString();
    $("#lineCount").textContent = stats.lines.toLocaleString();
    $("#paragraphCount").textContent = stats.paragraphs.toLocaleString();
    $("#sentenceCount").textContent = stats.sentences.toLocaleString();
    $("#avgWordLength").textContent = stats.avgWordLength.toFixed(1);
    $("#readingTime").textContent = `${stats.readingMinutes} min`;
  }

  input.addEventListener("input", update);

  $("#clearBtn").addEventListener("click", () => {
    input.value = "";
    input.focus();
    update();
  });

  update();
})();
