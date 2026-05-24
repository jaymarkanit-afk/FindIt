/* ═══════════════════════════════════════════════════════════════
   FILTER — Filter functionality for café discovery
   ═══════════════════════════════════════════════════════════════ */

let currentFilter = "findItNearMe";

function openDrawer() {
  document.getElementById("drawer-overlay").classList.add("open");
}

function closeDrawer() {
  document.getElementById("drawer-overlay").classList.remove("open");
}

function drawerClose(e) {
  if (e.target === document.getElementById("drawer-overlay")) closeDrawer();
}

function pickFilter(el, label) {
  document
    .querySelectorAll(".drawer-card")
    .forEach((c) => c.classList.remove("active"));
  el.classList.add("active");
  currentFilter = label;
}

function applyFilter() {
  const active = document.querySelector(".drawer-card.active");
  if (!active) return;
  currentFilter = active.getAttribute("onclick").match(/'(\w+)'/)[1];
  closeDrawer();
  filterAndDisplayCafes();
  showToast("Showing: " + active.querySelector(".dc-label").textContent + " ✓");
}

function getFilteredCafes() {
  let filtered = [...cafeDatabase];

  // Apply search filter first
  if (currentSearchQuery) {
    filtered = filtered.filter(
      (cafe) =>
        cafe.name.toLowerCase().includes(currentSearchQuery) ||
        cafe.address.toLowerCase().includes(currentSearchQuery) ||
        cafe.tags.some((tag) => tag.toLowerCase().includes(currentSearchQuery)),
    );
  }

  // Apply category filter
  switch (currentFilter) {
    case "findItNearMe":
      filtered.sort((a, b) => a.distance - b.distance);
      break;
    case "findItTrending":
      filtered = filtered
        .filter((c) => c.category.includes("trending"))
        .sort((a, b) => b.rating - a.rating);
      break;
    case "findItNew":
      filtered = filtered.slice(0, 3);
      break;
    case "findItJob":
      filtered = filtered.filter((c) => c.hiring);
      break;
    case "findItEvents":
      filtered = filtered.filter((c) => c.events);
      break;
    case "findItTopRated":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
  }

  return filtered;
}

function filterAndDisplayCafes() {
  const filtered = getFilteredCafes();
  displaySearchResults(filtered);
  updateMap(filtered);
}
