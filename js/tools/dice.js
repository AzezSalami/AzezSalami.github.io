(() => {
  "use strict";

  const { $, $$, h, motionMs, wait } = UI;

  const ROLL_MS = 1500; // matches the die-roll animation in styles.css

  // Face order on the cube; index + 1 is the value shown on that face.
  const FACES = ["front", "back", "right", "left", "top", "bottom"];

  // Rotation that brings each value's face to the front.
  const ROTATIONS = [
    "rotateX(0) rotateY(0) rotateZ(0)",
    "rotateX(0) rotateY(180deg) rotateZ(0)",
    "rotateX(0) rotateY(-90deg) rotateZ(0)",
    "rotateX(0) rotateY(90deg) rotateZ(0)",
    "rotateX(-90deg) rotateY(0) rotateZ(0)",
    "rotateX(90deg) rotateY(0) rotateZ(0)",
  ];

  // [row, column] of each pip on a 3x3 grid.
  const PIPS = {
    1: [[2, 2]],
    2: [[1, 1], [3, 3]],
    3: [[1, 1], [2, 2], [3, 3]],
    4: [[1, 1], [1, 3], [3, 1], [3, 3]],
    5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]],
    6: [[1, 1], [1, 3], [2, 1], [2, 3], [3, 1], [3, 3]],
  };

  const container = $("#diceContainer");
  const rollButton = $("#rollButton");
  const countSelect = $("#diceCount");
  const totalEl = $("#total");

  let rollingAll = false;

  function createFace(name, value) {
    const face = h("span", { className: `die-face die-face--${name}` });
    for (const [row, column] of PIPS[value]) {
      const dot = h("span", { className: "die-dot" });
      dot.style.gridArea = `${row} / ${column}`;
      face.append(dot);
    }
    return face;
  }

  function createDie() {
    // A <div>, not a <button>: several browsers flatten 3D transforms inside buttons,
    // which hides every face but one and makes rolls look like nothing happened.
    const die = h("div", { className: "die", role: "button", tabIndex: 0 }, ...FACES.map((name, i) => createFace(name, i + 1)));
    setValue(die, 1);
    const reroll = async () => {
      if (rollingAll || die.classList.contains("is-rolling")) return;
      await rollDie(die);
      updateTotal();
    };
    die.addEventListener("click", reroll);
    die.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      reroll();
    });
    return die;
  }

  function setValue(die, value) {
    die.dataset.value = value;
    die.setAttribute("aria-label", `Die showing ${value}. Tap to re-roll.`);
    die.style.setProperty("--final-state", ROTATIONS[value - 1]);
  }

  async function rollDie(die) {
    setValue(die, Math.floor(Math.random() * 6) + 1);
    die.classList.remove("is-rolling");
    void die.offsetWidth; // restart the CSS animation
    die.classList.add("is-rolling");
    await wait(motionMs(ROLL_MS));
    die.classList.remove("is-rolling");
  }

  async function rollAll() {
    if (rollingAll) return;
    rollingAll = true;
    rollButton.disabled = countSelect.disabled = true;
    await Promise.all($$(".die", container).map(rollDie));
    updateTotal();
    rollingAll = false;
    rollButton.disabled = countSelect.disabled = false;
  }

  function updateTotal() {
    totalEl.textContent = $$(".die", container).reduce((sum, die) => sum + Number(die.dataset.value), 0);
  }

  function setDiceCount() {
    container.replaceChildren(...Array.from({ length: Number(countSelect.value) }, createDie));
    updateTotal();
  }

  rollButton.addEventListener("click", rollAll);
  countSelect.addEventListener("change", setDiceCount);
  setDiceCount();
})();
