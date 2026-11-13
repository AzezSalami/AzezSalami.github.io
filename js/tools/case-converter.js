(() => {
  "use strict";

  const { $, copyText, h } = UI;

  const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

  // Each converter receives lowercase words.
  const CASES = [
    { name: "camelCase", convert: (w) => w.map((word, i) => (i ? capitalize(word) : word)).join("") },
    { name: "PascalCase", convert: (w) => w.map(capitalize).join("") },
    { name: "snake_case", convert: (w) => w.join("_") },
    { name: "kebab-case", convert: (w) => w.join("-") },
    { name: "SCREAMING_SNAKE_CASE / MACRO_CASE", convert: (w) => w.join("_").toUpperCase() },
    { name: "Train-Case", convert: (w) => w.map(capitalize).join("-") },
    { name: "flatcase", convert: (w) => w.join("") },
    { name: "Pascal_Snake_Case", convert: (w) => w.map(capitalize).join("_") },
  ];

  // First match wins.
  const DETECTORS = [
    ["Space-separated text", /\s/],
    ["camelCase", /^(?=.*[A-Z])[a-z][a-zA-Z0-9]*$/],
    ["PascalCase", /^(?=.*[a-z])[A-Z][a-zA-Z0-9]*$/],
    ["snake_case", /^[a-z][a-z0-9]*(_[a-z0-9]+)+$/],
    ["kebab-case", /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/],
    ["SCREAMING_SNAKE_CASE / MACRO_CASE", /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/],
    ["Train-Case", /^[A-Z][a-z0-9]*(-[A-Z][a-z0-9]*)+$/],
    ["flatcase", /^[a-z]+$/],
    ["Pascal_Snake_Case", /^[A-Z][a-z0-9]*(_[A-Z][a-z0-9]*)+$/],
  ];

  /** Split any supported format into lowercase words: "fooBar_baz-qux" → [foo, bar, baz, qux]. */
  function splitWords(text) {
    return text
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // fooBar → foo Bar
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2") // HTMLParser → HTML Parser
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((word) => word.toLowerCase());
  }

  function detectCase(text) {
    if (!text) return "None";
    return DETECTORS.find(([, pattern]) => pattern.test(text))?.[0] ?? "Unknown or mixed format";
  }

  const input = $("#inputText");

  const rows = CASES.map(({ name, convert }) => {
    const value = h("output", { className: "case-value" });
    const button = h("button", { className: "btn btn--small", type: "button", textContent: "Copy" });
    button.addEventListener("click", () => value.textContent && copyText(value.textContent));
    $("#caseList").append(
      h("div", { className: "case-row" }, h("span", { className: "case-name", textContent: name }), value, button),
    );
    return { value, convert };
  });

  function update() {
    const text = input.value.trim();
    const words = splitWords(text);
    $("#detectedCase").textContent = detectCase(text);
    for (const { value, convert } of rows) value.textContent = convert(words);
  }

  input.addEventListener("input", update);
  update();
})();
