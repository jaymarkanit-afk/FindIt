/* ═══════════════════════════════════════════════════════════════
   FILTER — Filter functionality for café discovery
   Filters: all, findItNearMe, findItTrending, findItTopRated,
            findItNew, findItEvents, findItJob
   ═══════════════════════════════════════════════════════════════ */

let currentFilter = "all";

function openDrawer() {
  // Show the filter that is currently applied
  document
    .querySelectorAll(".drawer-card")
    .forEach((c) =>
      c.classList.toggle("active", c.dataset.filter === currentFilter),
    );
  document.getElementById("drawer-overlay").classList.add("open");
}

function closeDrawer() {
  document.getElementById("drawer-overlay").classList.remove("open");
}

function drawerClose(e) {
  if (e.target === document.getElementById("drawer-overlay")) closeDrawer();
}

// Highlight the home segmented control to match currentFilter
function syncFilterTabs() {
  document.querySelectorAll("#feed-filter .seg-btn").forEach((tab) => {
    const on = tab.dataset.filter === currentFilter;
    tab.classList.toggle("active", on);
    tab.setAttribute("aria-pressed", on);
  });
}

function clearSearch() {
  currentSearchQuery = "";
  syncSearchInputs("");
}

// Home segmented control: All / New / Events / Hiring
function quickFilter(filterName) {
  clearSearch();
  currentFilter = filterName;
  syncFilterTabs();
  filterAndDisplayCafes();
}

// Drawer: pick a card, then "Apply filter"
function pickFilter(el) {
  document
    .querySelectorAll(".drawer-card")
    .forEach((c) => c.classList.remove("active"));
  el.classList.add("active");
}

function applyFilter() {
  const active = document.querySelector(".drawer-card.active");
  if (!active) return;
  currentFilter = active.dataset.filter;
  closeDrawer();
  syncFilterTabs();
  filterAndDisplayCafes();
  showToast("Showing: " + active.textContent.trim());
}

function cafeHasPost(cafe, type) {
  return getAllPosts().some((p) => p.cafeId === cafe.id && p.type === type);
}

function getFilteredCafes() {
  let filtered = [...cafeDatabase];

  // Apply search filter first
  if (currentSearchQuery) {
    filtered = filtered.filter((cafe) => cafeMatches(cafe, currentSearchQuery));
  }

  // Apply category filter ("all" leaves every café in)
  switch (currentFilter) {
    case "findItNearMe":
      filtered = filtered
        .filter((c) => c.distance < 10)
        .sort((a, b) => a.distance - b.distance);
      break;
    case "findItTrending":
      filtered = filtered
        .filter((c) => c.category.includes("trending"))
        .sort((a, b) => b.rating - a.rating);
      break;
    case "findItTopRated":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case "findItNew":
      filtered = filtered.filter((c) => cafeHasPost(c, "new"));
      break;
    case "findItJob":
      filtered = filtered.filter((c) => c.hiring || cafeHasPost(c, "hiring"));
      break;
    case "findItEvents":
      filtered = filtered.filter((c) => c.events || cafeHasPost(c, "event"));
      break;
  }

  return filtered;
}

function filterAndDisplayCafes() {
  const filtered = getFilteredCafes();
  displaySearchResults(filtered);
  renderFeed();
  updateMap(filtered);
  displayNearbyCafesList();
}
