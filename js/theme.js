// Loaded as a blocking script in <head> so the right theme is applied before
// first paint. Everything else lives in ES modules (see app.js).
(() => {
  let theme = null;
  try {
    theme = localStorage.getItem("theme");
  } catch {
    // Storage can be unavailable (private mode); fall back to the system setting.
  }
  if (theme !== "light" && theme !== "dark") {
    theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  document.documentElement.dataset.theme = theme;
})();
