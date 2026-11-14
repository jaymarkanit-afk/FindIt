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
  openOverlay(document.getElementById("drawer-overlay"), closeDrawer);
}

function closeDrawer() {
  closeOverlay(document.getElementById("drawer-overlay"));
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

/* Trending is derived from activity, not stored: each post from the last
   week counts 1 plus its sips. If nothing was posted in the last week, the
   same score over all posts is used so the list is never empty. */
const TRENDING_DAYS = 7;
const TRENDING_MAX = 5;

function trendingScores() {
  const all = getAllPosts();
  const cutoff = Date.now() - TRENDING_DAYS * 24 * 60 * 60 * 1000;
  const recent = all.filter((p) => p.time >= cutoff);
  const scores = new Map();
  (recent.length ? recent : all).forEach((p) => {
    scores.set(p.cafeId, (scores.get(p.cafeId) || 0) + 1 + sipCount(p));
  });
  return scores;
}

// Cafés ordered by trending score, highest first (top TRENDING_MAX)
function getTrendingCafes(cafes) {
  const scores = trendingScores();
  return cafes
    .filter((c) => scores.has(c.id))
    .sort((a, b) => scores.get(b.id) - scores.get(a.id))
    .slice(0, TRENDING_MAX);
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
      filtered = getTrendingCafes(filtered);
      break;
    case "findItTopRated":
      filtered.sort((a, b) => b.rating - a.rating);
      break;
    case "findItNew":
      filtered = filtered.filter((c) => cafeHasPost(c, "new"));
      break;
    case "findItJob":
      filtered = filtered.filter((c) => cafeHasPost(c, "hiring"));
      break;
    case "findItEvents":
      filtered = filtered.filter((c) => cafeHasPost(c, "event"));
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
