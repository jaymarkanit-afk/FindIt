/* ═══════════════════════════════════════════════════════════════
   SEARCH — Search functionality across café database
   ═══════════════════════════════════════════════════════════════ */

let currentSearchQuery = "";

function handleSearch(query) {
  currentSearchQuery = query.toLowerCase().trim();

  if (currentSearchQuery.length === 0) {
    showToast("Showing all cafés");
    filterAndDisplayCafes();
  } else if (currentSearchQuery.length >= 2) {
    const results = cafeDatabase.filter(
      (cafe) =>
        cafe.name.toLowerCase().includes(currentSearchQuery) ||
        cafe.address.toLowerCase().includes(currentSearchQuery) ||
        cafe.tags.some((tag) => tag.toLowerCase().includes(currentSearchQuery)),
    );

    showToast(
      `Found ${results.length} café${results.length !== 1 ? "s" : ""} matching "${currentSearchQuery}"`,
    );
    displaySearchResults(results);
  }
}

function displaySearchResults(results) {
  const smartRecs = document.getElementById("smart-recs");
  if (!smartRecs) return;

  smartRecs.innerHTML =
    results.length > 0
      ? results
          .map(
            (cafe, idx) => `
      <div class="rec-row" onclick="selectedCafeId=${cafe.id};showPanel('profile')">
        <img class="rec-thumb" src="${cafe.img}" alt="${cafe.name}"/>
        <div class="rec-info">
          <div class="rec-name">${cafe.name}</div>
          <div class="rec-sub">${cafe.address} · ⭐ ${cafe.rating} · ${cafe.tags.join(" · ")}</div>
        </div>
        <span class="rec-chip chip-study">${cafe.distance} km</span>
      </div>
    `,
          )
          .join("")
      : '<div style="padding:20px;text-align:center;color:var(--ink3)">No cafés found. Try another search!</div>';
}
