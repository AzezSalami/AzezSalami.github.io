(() => {
  "use strict";

  const { $, h } = UI;

  const words = (text) => text.split(/\s+/).filter(Boolean);

  /**
   * Word-level diff via longest common subsequence.
   * Returns [{ type: "same" | "added" | "removed", word }] in reading order.
   */
  function diffWords(a, b) {
    // lengths[i][j] = LCS length of a[i..] and b[j..]
    const lengths = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        lengths[i][j] = a[i] === b[j] ? lengths[i + 1][j + 1] + 1 : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
      }
    }

    const ops = [];
    let i = 0;
    let j = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) {
        ops.push({ type: "same", word: a[i] });
        i++;
        j++;
      } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
        ops.push({ type: "removed", word: a[i++] });
      } else {
        ops.push({ type: "added", word: b[j++] });
      }
    }
    while (i < a.length) ops.push({ type: "removed", word: a[i++] });
    while (j < b.length) ops.push({ type: "added", word: b[j++] });
    return ops;
  }

  const TAGS = { same: "span", added: "ins", removed: "del" };

  function compare() {
    const ops = diffWords(words($("#text1").value), words($("#text2").value));
    const additions = ops.filter((op) => op.type === "added").length;
    const deletions = ops.filter((op) => op.type === "removed").length;

    $("#diffCount").textContent = additions + deletions;
    $("#addCount").textContent = additions;
    $("#delCount").textContent = deletions;

    // textContent (not innerHTML) so pasted markup is shown, never executed.
    $("#result").replaceChildren(...ops.flatMap((op) => [h(TAGS[op.type], { textContent: op.word }), " "]));
    $("#resultCard").hidden = false;
  }

  $("#compareBtn").addEventListener("click", compare);
})();
