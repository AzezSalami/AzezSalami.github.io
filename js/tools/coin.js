(() => {
  "use strict";

  const { $, motionMs, wait } = UI;

  const FLIP_MS = 1200; // matches the .coin transition in styles.css
  const SPINS = 5;

  const coin = $("#coin");
  const toss = $("#coinToss");
  const flipBtn = $("#flipBtn");
  const resultEl = $("#result");
  const counts = { heads: 0, tails: 0 };

  let turn = 0; // degrees; heads faces the viewer at multiples of 360
  let flipping = false;

  async function flip() {
    if (flipping) return;
    flipping = true;
    flipBtn.disabled = true;
    resultEl.textContent = "";

    const side = Math.random() < 0.5 ? "heads" : "tails";
    turn += SPINS * 360;
    const showingHeads = (turn / 180) % 2 === 0;
    if (showingHeads !== (side === "heads")) turn += 180;

    coin.style.setProperty("--turn", `${turn}deg`);
    toss.classList.add("is-flipping");
    await wait(motionMs(FLIP_MS));
    toss.classList.remove("is-flipping");

    counts[side]++;
    resultEl.textContent = side === "heads" ? "Heads" : "Tails";
    $("#headsCount").textContent = counts.heads;
    $("#tailsCount").textContent = counts.tails;

    flipping = false;
    flipBtn.disabled = false;
  }

  coin.addEventListener("click", flip);
  flipBtn.addEventListener("click", flip);
})();
