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

function quickFilter(filterName) {
  // Clear search when using quick filter
  const heroSearch = document.getElementById("hero-search");
  const topbarSearch = document.getElementById("topbar-search");
  if (heroSearch) heroSearch.value = "";
  if (topbarSearch) topbarSearch.value = "";
  currentSearchQuery = "";

  // Update currentFilter
  if (filterName !== "all") {
    currentFilter = filterName;
  } else {
    currentFilter = "findItNearMe";
  }

  // Update active tab
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  event.target.classList.add("active");

  // Apply filter and display
  filterAndDisplayCafes();
  showToast("Showing: " + filterName + " ✓");
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

  // Update active tab in filter tabs
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  const filterName =
    currentFilter === "findItNearMe"
      ? "findItNearMe"
      : currentFilter === "findItTopRated"
        ? "findItTopRated"
        : currentFilter === "findItTrending"
          ? "findItTrending"
          : currentFilter === "finditJob"
            ? "finditJob"
            : currentFilter === "finditEvents"
              ? "finditEvents"
              : currentFilter === "findItNew"
                ? "findItNew"
                : "all";
  const matchingTab = Array.from(document.querySelectorAll(".filter-tab")).find(
    (tab) => tab.textContent.includes(filterName.replace("findit", "findit")),
  );
  if (matchingTab) matchingTab.classList.add("active");

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
