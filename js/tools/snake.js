(() => {
  "use strict";

  const { $, cssVar } = UI;

  const TILES = 20; // board is TILES x TILES
  const CELL = 20; // logical px per tile
  const SIZE = TILES * CELL;
  const TICK_MS = 110;
  const SWIPE_PX = 24;
  const BEST_KEY = "snake-best";

  const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };

  const KEYS = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
  };

  const canvas = $("#gameCanvas");
  const ctx = canvas.getContext("2d");
  const startBtn = $("#startBtn");
  const scoreEl = $("#score");
  const bestEl = $("#best");
  const overlay = $("#overlay");

  let snake, food, dir, turnQueue, score, timer;
  let status = "idle"; // idle | running | paused | over
  let best = Number(localStorage.getItem(BEST_KEY)) || 0;

  // Render at device resolution so the board stays crisp on phones.
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = canvas.height = SIZE * dpr;
  ctx.scale(dpr, dpr);

  function reset() {
    clearInterval(timer);
    snake = [{ x: 10, y: 10 }];
    dir = DIRS.right;
    turnQueue = [];
    score = 0;
    placeFood();
    setStatus("idle");
    draw();
  }

  function setStatus(next) {
    status = next;
    startBtn.textContent = { idle: "Start", running: "Pause", paused: "Resume", over: "Play again" }[status];
    overlay.hidden = status === "running";
    const [title, text] = {
      idle: ["Ready?", "Press Start, or pick a direction"],
      paused: ["Paused", "Press Resume to continue"],
      over: ["Game over", `Score: ${score}`],
      running: ["", ""],
    }[status];
    $("#overlayTitle").textContent = title;
    $("#overlayText").textContent = text;
    scoreEl.textContent = score;
    bestEl.textContent = best;
  }

  function start() {
    if (status === "over") reset();
    setStatus("running");
    timer = setInterval(tick, TICK_MS);
  }

  function pause() {
    clearInterval(timer);
    setStatus("paused");
  }

  function gameOver() {
    clearInterval(timer);
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, best);
    }
    setStatus("over");
  }

  function placeFood() {
    const free = [];
    for (let x = 0; x < TILES; x++) {
      for (let y = 0; y < TILES; y++) {
        if (!snake.some((s) => s.x === x && s.y === y)) free.push({ x, y });
      }
    }
    food = free[Math.floor(Math.random() * free.length)] ?? null;
  }

  /** Queue a turn. Queuing (max 2) lets quick double-taps register without ever reversing. */
  function turn(name) {
    const next = DIRS[name];
    if (status === "idle") {
      if (next !== DIRS.left) dir = next; // snake starts facing right
      start();
      return;
    }
    if (status !== "running") return;
    const last = turnQueue.at(-1) ?? dir;
    const isReverse = next.x === -last.x && next.y === -last.y;
    if (next !== last && !isReverse && turnQueue.length < 2) turnQueue.push(next);
  }

  function tick() {
    dir = turnQueue.shift() ?? dir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    const eating = food && head.x === food.x && head.y === food.y;

    const hitWall = head.x < 0 || head.x >= TILES || head.y < 0 || head.y >= TILES;
    // The tail moves out of the way this tick unless we're growing.
    const body = eating ? snake : snake.slice(0, -1);
    if (hitWall || body.some((s) => s.x === head.x && s.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head);
    if (eating) {
      score += 10;
      scoreEl.textContent = score;
      placeFood();
      if (!food) return gameOver(); // board is full — you win
    } else {
      snake.pop();
    }
    draw();
  }

  function cell({ x, y }, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2, 4);
    else ctx.rect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
    ctx.fill();
  }

  function draw() {
    ctx.fillStyle = cssVar("--surface-2");
    ctx.fillRect(0, 0, SIZE, SIZE);
    if (food) cell(food, cssVar("--danger"));
    snake.forEach((segment, i) => cell(segment, i === 0 ? cssVar("--accent") : cssVar("--success")));
  }

  // --- Input -----------------------------------------------------------------

  startBtn.addEventListener("click", () => (status === "running" ? pause() : start()));
  $("#resetBtn").addEventListener("click", reset);

  document.addEventListener("keydown", (event) => {
    if (event.target.closest("input, textarea, select")) return;
    const name = KEYS[event.key.length === 1 ? event.key.toLowerCase() : event.key];
    if (name) {
      event.preventDefault(); // keep arrow keys from scrolling the page
      turn(name);
    } else if (event.key === " " && event.target === document.body) {
      event.preventDefault();
      startBtn.click();
    }
  });

  $("#dpad").addEventListener("pointerdown", (event) => {
    const button = event.target.closest("[data-dir]");
    if (button) turn(button.dataset.dir);
  });

  // Swipe anywhere on the board; re-anchoring after each turn allows chained swipes.
  let swipeFrom = null;
  const board = $("#board");
  board.addEventListener("pointerdown", (event) => {
    swipeFrom = { x: event.clientX, y: event.clientY };
  });
  board.addEventListener("pointermove", (event) => {
    if (!swipeFrom) return;
    const dx = event.clientX - swipeFrom.x;
    const dy = event.clientY - swipeFrom.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return;
    turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
    swipeFrom = { x: event.clientX, y: event.clientY };
  });
  for (const type of ["pointerup", "pointercancel", "pointerleave"]) {
    board.addEventListener(type, () => (swipeFrom = null));
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && status === "running") pause();
  });
  document.addEventListener("themechange", draw);

  reset();
})();
