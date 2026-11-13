(() => {
  "use strict";

  const { $, cssVar, h } = UI;

  const DEFAULT_SCALE = 50; // px per unit
  const MIN_SCALE = 4;
  const MAX_SCALE = 800;
  const ZOOM_STEP = 1.5;
  const GRID_STEPS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
  const MIN_GRID_PX = 40;

  // Reference shown under "Symbols you can use": [text to insert, what it does].
  const SYMBOLS = {
    Operators: [
      ["+", "Add"],
      ["-", "Subtract, or negative: -x"],
      ["*", "Multiply"],
      ["/", "Divide"],
      ["^", "Power: x^2 is x squared"],
      ["%", "Remainder after division: x % 2"],
      ["±", "Plus and minus — draws both curves"],
      ["()", "Group part of a formula: (x + 1)^2"],
    ],
    Functions: [
      ["sqrt()", "Square root"],
      ["cbrt()", "Cube root"],
      ["abs()", "Absolute value (always positive)"],
      ["exp()", "e to the power of x"],
      ["log()", "Natural logarithm (ln)"],
      ["log10()", "Logarithm, base 10"],
      ["log2()", "Logarithm, base 2"],
      ["sin()", "Sine"],
      ["cos()", "Cosine"],
      ["tan()", "Tangent"],
      ["asin()", "Inverse sine (arcsin)"],
      ["acos()", "Inverse cosine (arccos)"],
      ["atan()", "Inverse tangent (arctan)"],
      ["floor()", "Round down"],
      ["ceil()", "Round up"],
      ["round()", "Round to the nearest whole number"],
      ["sign()", "Sign of x: -1, 0 or 1"],
      ["min(x, )", "Smaller of two values: min(x, 2)"],
      ["max(x, )", "Larger of two values: max(x, 0)"],
    ],
    Constants: [
      ["x", "The variable (horizontal axis)"],
      ["pi", "π ≈ 3.14159"],
      ["e", "Euler’s number ≈ 2.71828"],
      ["tau", "2π ≈ 6.28319"],
      ["phi", "Golden ratio ≈ 1.61803"],
    ],
  };

  const canvas = $("#graphCanvas");
  const ctx = canvas.getContext("2d");
  const input = $("#functionInput");
  const errorEl = $("#errorMessage");

  let scale = DEFAULT_SCALE;
  let width = 0;
  let height = 0;

  /** "x^2 ± 1" → one expression per branch. No ± → a single expression. */
  function branches(expression) {
    if (!expression.includes("±")) return [{ label: expression, expr: expression }];
    return [
      { label: "+ branch", expr: expression.replaceAll("±", "+") },
      { label: "− branch", expr: expression.replaceAll("±", "-") },
    ];
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = !message;
  }

  function drawGrid() {
    const cx = width / 2;
    const cy = height / 2;
    const step = GRID_STEPS.find((s) => s * scale >= MIN_GRID_PX) ?? GRID_STEPS.at(-1);
    const label = (n) => String(Number((n * step).toFixed(2)));

    ctx.fillStyle = cssVar("--surface");
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = cssVar("--border");
    ctx.fillStyle = cssVar("--muted");
    ctx.font = "11px system-ui, sans-serif";
    ctx.beginPath();
    for (let n = Math.ceil(-cx / (step * scale)); n * step * scale <= cx; n++) {
      const x = Math.round(cx + n * step * scale) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      if (n !== 0) ctx.fillText(label(n), x + 3, cy + 13);
    }
    for (let n = Math.ceil(-cy / (step * scale)); n * step * scale <= cy; n++) {
      const y = Math.round(cy - n * step * scale) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      if (n !== 0) ctx.fillText(label(n), cx + 4, y - 3);
    }
    ctx.stroke();

    ctx.strokeStyle = cssVar("--text");
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();
  }

  /** Plot one compiled expression. Returns how many points were drawable. */
  function plot(compiled, color) {
    const cx = width / 2;
    const cy = height / 2;
    let drawn = 0;
    let prevY = null;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    for (let px = 0; px <= width; px++) {
      const y = compiled.evaluate({ x: (px - cx) / scale });
      if (typeof y !== "number" || !Number.isFinite(y)) {
        prevY = null; // undefined here (e.g. sqrt of a negative): lift the pen
        continue;
      }
      const py = cy - y * scale;
      // Also lift the pen across asymptotes instead of drawing a vertical line.
      if (prevY === null || Math.abs(py - prevY) > height * 2) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
      prevY = py;
      drawn++;
    }
    ctx.stroke();
    return drawn;
  }

  function draw() {
    if (!width) return;
    drawGrid();
    showError("");

    if (!window.math) {
      showError("Couldn't load the math library. Check your connection and reload.");
      return;
    }
    const expression = input.value.trim();
    if (!expression) return;

    const colors = [cssVar("--accent"), cssVar("--danger")];
    const series = branches(expression);
    try {
      const drawn = series.reduce((total, { expr }, i) => total + plot(window.math.compile(expr), colors[i]), 0);
      if (!drawn) showError("That function has no real values in the visible range.");
    } catch (error) {
      showError(`Invalid function: ${error.message}`);
    }

    $("#legend").replaceChildren(
      ...(series.length > 1
        ? series.map(({ label }, i) => {
            const item = h("span", { textContent: label });
            item.style.setProperty("--swatch", colors[i]);
            return item;
          })
        : []),
    );
  }

  /** Match the canvas bitmap to its CSS size × device pixel ratio so lines stay sharp. */
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function zoom(factor) {
    scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
    draw();
  }

  $("#graphForm").addEventListener("submit", (event) => {
    event.preventDefault();
    draw();
  });

  /** Insert text at the cursor; for "sin()" style entries the cursor lands inside the brackets. */
  function insert(text) {
    input.setRangeText(text, input.selectionStart, input.selectionEnd, "end");
    if (text.endsWith(")")) input.selectionStart = input.selectionEnd = input.selectionEnd - 1;
    input.focus();
  }

  // Phone keyboards have no ± key.
  $("#plusMinusBtn").addEventListener("click", () => insert("±"));

  $("#symbolGroups").append(
    ...Object.entries(SYMBOLS).flatMap(([group, symbols]) => [
      h("h3", { textContent: group }),
      h(
        "ul",
        { className: "symbol-list" },
        ...symbols.map(([text, description]) => {
          const button = h("button", { className: "btn btn--small mono", type: "button", textContent: text });
          button.addEventListener("click", () => insert(text));
          return h("li", {}, button, h("span", { textContent: description }));
        }),
      ),
    ]),
  );

  $("#zoomInBtn").addEventListener("click", () => zoom(ZOOM_STEP));
  $("#zoomOutBtn").addEventListener("click", () => zoom(1 / ZOOM_STEP));
  $("#zoomResetBtn").addEventListener("click", () => zoom(DEFAULT_SCALE / scale));

  document.addEventListener("themechange", draw);
  new ResizeObserver(resize).observe(canvas);
})();
