(() => {
  "use strict";

  const { $, $$, copyText, setupTabs } = UI;

  const CHARSETS = {
    uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    lowercase: "abcdefghijklmnopqrstuvwxyz",
    numbers: "0123456789",
    symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?",
  };

  /** Uniform random integer in [min, max], using the crypto RNG where the range allows. */
  function randomInt(min, max) {
    const range = max - min + 1;
    if (range > 2 ** 32) return Math.floor(Math.random() * range) + min;

    // Rejection sampling avoids modulo bias.
    const limit = Math.floor(2 ** 32 / range) * range;
    const buffer = new Uint32Array(1);
    do crypto.getRandomValues(buffer);
    while (buffer[0] >= limit);
    return min + (buffer[0] % range);
  }

  const randomWithDigits = (digits) => randomInt(10 ** (digits - 1), 10 ** digits - 1);

  const intValue = (id) => Number.parseInt($(`#${id}`).value, 10);
  const inRange = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

  /** Run a generator; show its thrown message as an inline error instead of an alert(). */
  function run(generate, resultEl, errorEl) {
    try {
      resultEl.textContent = generate();
      errorEl.hidden = true;
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.hidden = false;
    }
  }

  function generateString() {
    const length = intValue("stringLength");
    if (!inRange(length, 1, 1000)) throw new Error("Length must be between 1 and 1000.");

    const charset = Object.entries(CHARSETS)
      .filter(([id]) => $(`#${id}`).checked)
      .map(([, chars]) => chars)
      .join("");
    if (!charset) throw new Error("Select at least one character type.");

    return Array.from({ length }, () => charset[randomInt(0, charset.length - 1)]).join("");
  }

  const INT_MODES = {
    single() {
      const digits = intValue("intDigits");
      if (!inRange(digits, 1, 15)) throw new Error("Digits must be between 1 and 15.");
      return randomWithDigits(digits);
    },
    range() {
      const min = intValue("minValue");
      const max = intValue("maxValue");
      if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)) throw new Error("Enter a minimum and a maximum.");
      if (min >= max) throw new Error("Maximum must be greater than minimum.");
      return randomInt(min, max);
    },
    multiple() {
      const count = intValue("count");
      const digits = intValue("multDigits");
      if (!inRange(count, 1, 100)) throw new Error("Count must be between 1 and 100.");
      if (!inRange(digits, 1, 10)) throw new Error("Digits must be between 1 and 10.");
      return Array.from({ length: count }, () => randomWithDigits(digits)).join(", ");
    },
  };

  const intType = $("#intType");

  function showIntMode() {
    for (const section of $$("[data-mode]")) section.hidden = section.dataset.mode !== intType.value;
  }

  const runString = () => run(generateString, $("#stringResult"), $("#stringError"));
  const runInt = () => run(INT_MODES[intType.value], $("#intResult"), $("#intError"));

  setupTabs($("[role=tablist]"));
  intType.addEventListener("change", showIntMode);
  $("#generateStringBtn").addEventListener("click", runString);
  $("#generateIntBtn").addEventListener("click", runInt);

  for (const button of $$("[data-copy]")) {
    button.addEventListener("click", () => {
      const text = document.getElementById(button.dataset.copy).textContent;
      if (text) copyText(text);
    });
  }

  showIntMode();
  runString();
})();
