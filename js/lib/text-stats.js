// Text statistics shared by the word counter and character counter (UI.textStats).
(() => {
  "use strict";

  const WORDS_PER_MINUTE = 200;

  function textStats(text) {
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const charsNoSpaces = text.replace(/\s/g, "").length;

    return {
      chars: text.length,
      charsNoSpaces,
      words,
      lines: text.split("\n").length,
      paragraphs: trimmed ? trimmed.split(/\n\s*\n/).filter((p) => p.trim()).length : 0,
      sentences: text.split(/[.!?]+/).filter((s) => s.trim()).length,
      avgWordLength: words ? charsNoSpaces / words : 0,
      readingMinutes: Math.ceil(words / WORDS_PER_MINUTE),
    };
  }

  window.UI.textStats = textStats;
})();
