const drawer = document.getElementById("drawer");
const toggleBtn = document.getElementById("toggle-btn");

// Toggle drawer
toggleBtn.addEventListener("click", () => {
  drawer.classList.toggle("open");
});

// Close drawer when clicking outside on mobile
document.addEventListener("click", (e) => {
  if (
    window.innerWidth <= 768 &&
    !drawer.contains(e.target) &&
    e.target !== toggleBtn
  ) {
    drawer.classList.remove("open");
  }
});

// Set active link based on current page
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    }
  });
});
