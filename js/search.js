/* ═══════════════════════════════════════════════════════════════
   SEARCH — Search functionality across café database
   ═══════════════════════════════════════════════════════════════ */

let currentSearchQuery = "";

// One place that decides whether a café matches a query
function cafeMatches(cafe, query) {
  return (
    cafe.name.toLowerCase().includes(query) ||
    cafe.address.toLowerCase().includes(query) ||
    cafe.tags.some((tag) => tag.toLowerCase().includes(query))
  );
}

function syncSearchInputs(value) {
  ["topbar-search", "home-search", "map-search"].forEach((id) => {
    const input = document.getElementById(id);
    if (input && input.value !== value) input.value = value;
  });
}

function handleSearch(query) {
  const cleaned = query.toLowerCase().trim();
  syncSearchInputs(query);

  // One-letter queries are ignored (too noisy)
  currentSearchQuery = cleaned.length >= 2 ? cleaned : "";

  // Searching always looks across every café and post type
  currentFilter = "all";
  syncFilterTabs();
  filterAndDisplayCafes();

  // Zoom to first result if the map is open
  if (currentSearchQuery && map) {
    const results = getFilteredCafes();
    if (results.length > 0) zoomToLocation(results[0]);
  }
}

function zoomToLocation(cafe) {
  if (!map) return;
  map.setView([cafe.lat, cafe.lng], 17);
  const marker = markers.find((m) => m.cafeId === cafe.id);
  if (marker) marker.openPopup();
}

function submitSearch(query) {
  const searchQuery = query.toLowerCase().trim();

  if (searchQuery.length === 0) {
    showToast("Enter a café name to search");
    return;
  }

  // Prefer a match in the selected place, then anywhere
  const all = cafeDatabase.filter((cafe) => cafeMatches(cafe, searchQuery));
  const here = getSelectedPlace().name;
  const results = [...all.filter((c) => c.city === here), ...all.filter((c) => c.city !== here)];

  if (results.length > 0) {
    openCafe(results[0].id);
  } else {
    showToast(`No café found matching "${searchQuery}"`);
  }
}

// Café rows shown above the home feed while a search is active
function displaySearchResults(results) {
  const wrap = document.getElementById("search-results");
  const smartRecs = document.getElementById("smart-recs");
  if (!wrap || !smartRecs) return;

  wrap.hidden = !currentSearchQuery;
  if (!currentSearchQuery) return;

  const smartTitle = document.getElementById("smart-title");
  if (smartTitle) {
    smartTitle.textContent = `${results.length} café${results.length !== 1 ? "s" : ""} matching "${currentSearchQuery}" · km ${distanceFrom()}`;
  }

  if (results.length) {
    smartRecs.innerHTML = results
      .map((cafe) => cafeRowHTML(cafe, cafe.distance + " km"))
      .join("");
    return;
  }

  // Nothing here: look in the other places and offer to switch
  const here = getSelectedPlace().name;
  const elsewhere = cafeDatabase.filter(
    (c) => c.city !== here && cafeMatches(c, currentSearchQuery),
  );
  if (!elsewhere.length) {
    smartRecs.innerHTML = `<div class="empty">No cafés found in ${esc(here)}. Try another search.</div>`;
    return;
  }
  const byPlace = [...new Set(elsewhere.map((c) => c.city))];
  smartRecs.innerHTML = byPlace
    .map(
      (name) => `
      <div class="found-elsewhere">
        <p class="found-label">Found in ${esc(name)}</p>
        ${elsewhere.filter((c) => c.city === name).map((c) => cafeRowHTML(c, c.city)).join("")}
        <button class="btn btn-dark" data-action="switch-place" data-place="${esc(name)}">Switch to ${esc(name)}</button>
      </div>`,
    )
    .join("");
}
