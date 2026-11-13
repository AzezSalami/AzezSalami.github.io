(() => {
  "use strict";

  const { $ } = UI;

  const MS_PER_DAY = 86_400_000;

  const startInput = $("#startDate");
  const endInput = $("#endDate");

  // All date maths is done in UTC so daylight-saving changes and the viewer's
  // time zone can never shift a result by a day.
  function parseDate(value) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  function toInputValue(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  const formatDate = (date) =>
    date.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });

  /** `date` plus whole months, clamped to the end of the month (Jan 31 + 1 month = Feb 28/29). */
  function addMonths(date, months) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + months;
    const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
  }

  /** Calendar difference between two UTC dates where from <= to. */
  function calendarDiff(from, to) {
    let months = (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + to.getUTCMonth() - from.getUTCMonth();
    if (addMonths(from, months) > to) months--;
    const days = Math.round((to - addMonths(from, months)) / MS_PER_DAY);
    return { years: Math.floor(months / 12), months: months % 12, days };
  }

  function update() {
    if (!startInput.value || !endInput.value) {
      $("#totalDays").textContent = "";
      $("#resultDetails").textContent = "Select both dates.";
      return;
    }

    const start = parseDate(startInput.value);
    const end = parseDate(endInput.value);
    const [from, to] = start <= end ? [start, end] : [end, start];
    const { years, months, days } = calendarDiff(from, to);
    const totalDays = Math.round((to - from) / MS_PER_DAY);

    $("#years").textContent = years;
    $("#months").textContent = months;
    $("#days").textContent = days;
    $("#totalDays").textContent = `${totalDays.toLocaleString()} total ${totalDays === 1 ? "day" : "days"}`;
    $("#resultDetails").textContent =
      totalDays === 0
        ? "Both dates are the same."
        : `From ${formatDate(from)} to ${formatDate(to)}${start > end ? " (dates swapped)" : ""}`;
  }

  $("#swapBtn").addEventListener("click", () => {
    [startInput.value, endInput.value] = [endInput.value, startInput.value];
    update();
  });
  startInput.addEventListener("input", update);
  endInput.addEventListener("input", update);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  startInput.value = toInputValue(today);
  endInput.value = toInputValue(tomorrow);
  update();
})();
