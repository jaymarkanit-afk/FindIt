/* ═══════════════════════════════════════════════════════════════
   SEARCH — Search functionality across café database
   ═══════════════════════════════════════════════════════════════ */

let currentSearchQuery = "";

function handleSearch(query) {
  currentSearchQuery = query.toLowerCase().trim();

  // Sync both search bars
  const heroSearch = document.getElementById("hero-search");
  const topbarSearch = document.getElementById("topbar-search");
  if (heroSearch && heroSearch.value !== query) {
    heroSearch.value = query;
  }
  if (topbarSearch && topbarSearch.value !== query) {
    topbarSearch.value = query;
  }

  // Reset filter to "all" when searching
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.classList.remove("active");
  });
  const allTab = Array.from(document.querySelectorAll(".filter-tab")).find(
    (tab) => tab.textContent.includes("All"),
  );
  if (allTab) allTab.classList.add("active");

  if (currentSearchQuery.length === 0) {
    // Restore original title
    const smartTitle = document.getElementById("smart-title");
    if (smartTitle) {
      smartTitle.innerHTML = "☕ Perfect for you <em>right now</em>";
    }
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
    updateMap(results);

    // Zoom to first result if available and map exists
    if (results.length > 0 && map) {
      zoomToLocation(results[0]);
    }
  }
}

function zoomToLocation(cafe) {
  // Zoom map to cafe location
  if (map) {
    map.setView([cafe.lat, cafe.lng], 17);
    // Flash the marker
    setTimeout(() => {
      const marker = markers.find((m) => m.cafeId === cafe.id);
      if (marker) {
        marker.openPopup();
      }
    }, 500);
  }
}

function submitSearch(query) {
  const searchQuery = query.toLowerCase().trim();

  if (searchQuery.length === 0) {
    showToast("Please enter a café name to search");
    return;
  }

  const results = cafeDatabase.filter(
    (cafe) =>
      cafe.name.toLowerCase().includes(searchQuery) ||
      cafe.address.toLowerCase().includes(searchQuery) ||
      cafe.tags.some((tag) => tag.toLowerCase().includes(searchQuery)),
  );

  if (results.length > 0) {
    // Navigate to the first matching café
    selectedCafeId = results[0].id;
    showPanel("profile");
    // Zoom map to the location
    zoomToLocation(results[0]);
    showToast(`Navigating to ${results[0].name}...`);
  } else {
    showToast(`No café found matching "${searchQuery}"`);
  }
}

function displaySearchResults(results) {
  const smartRecs = document.getElementById("smart-recs");
  if (!smartRecs) return;

  // Update the section title
  const smartTitle = document.getElementById("smart-title");
  if (smartTitle && currentSearchQuery) {
    smartTitle.innerHTML = `🔍 Search results for <em>"${currentSearchQuery}"</em>`;
  }

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
