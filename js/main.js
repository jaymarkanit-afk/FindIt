/* ═══════════════════════════════════════════════════════════════
   MAIN — Application initialization and setup
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  // Restore last page on page load
  const lastPanel = localStorage.getItem("lastPanel");
  if (lastPanel) {
    showPanel(lastPanel);
  } else {
    showPanel("home"); // Default to home if no saved panel
  }

  // Wait for pages to load first
  setTimeout(() => {
    // Set up greeting based on time of day
    const h = new Date().getHours();
    let msg;

    if (h >= 5 && h < 11) {
      msg =
        "🌅 <strong>Brevi:</strong> Good morning! Breakfast cafés near you have fresh pastries ready. Top picks: Paramount Coffee &amp; Craft Coffee Roastery — both open now!";
      document.querySelectorAll("#smart-recs .rec-chip").forEach((c) => {
        c.className = "rec-chip chip-morn";
        c.textContent = "Morning Pick";
      });
      document.getElementById("smart-title").innerHTML =
        "🌅 Perfect for your <em>morning</em>";
    } else if (h >= 11 && h < 17) {
      msg =
        "☀️ <strong>Brevi:</strong> Afternoon focus! Paramount Coffee (J.C. Aquino Ave) &amp; Dodo Workspace are perfect for an afternoon study session!";
    } else if (h >= 17 && h < 20) {
      msg =
        "🌆 <strong>Brevi:</strong> Golden hour! These 3 cafés are buzzing right now — perfect for unwinding.";
      document.querySelectorAll("#smart-recs .rec-chip").forEach((c) => {
        c.className = "rec-chip chip-chill";
        c.textContent = "Evening Pick";
      });
    } else {
      msg =
        "🌙 <strong>Brevi:</strong> Night owl? Here are 3 cozy spots still open — perfect for a late-night session.";
      document.querySelectorAll("#smart-recs .rec-chip").forEach((c) => {
        c.className = "rec-chip chip-date";
        c.textContent = "Night Pick";
      });
      document.getElementById("smart-title").innerHTML =
        "🌙 Perfect for <em>tonight</em>";
    }

    const mascotMsg = document.getElementById("mascot-msg");
    if (mascotMsg) {
      mascotMsg.innerHTML = msg;
    }

    // Display initial cafés
    filterAndDisplayCafes();

    // Populate all cafes in trending and near you sections
    populateTrendingCafes();
    populateNearYouCafes();

    // Initialize carousel
    const strip = document.getElementById("carousel-strip");
    if (strip) {
      strip.style.display = "flex";
      strip.style.transition = "transform .45s cubic-bezier(.4,0,.2,1)";
    }
  }, 500); // Wait for pages to load
});

/* ════════════════════════════════════════════════════════════
   POPULATE ALL CAFÉS IN SECTIONS
   ════════════════════════════════════════════════════════════ */

function populateTrendingCafes() {
  const trendingReel = document.querySelector(".h-reel");
  if (!trendingReel) return;

  // Get trending cafes (sorted by rating)
  const trendingCafes = cafeDatabase
    .filter((c) => c.category.includes("trending"))
    .sort((a, b) => b.rating - a.rating);

  // Include all cafes if less than 3 are marked as trending
  const displayCafes =
    trendingCafes.length >= 3
      ? trendingCafes
      : cafeDatabase.sort((a, b) => b.rating - a.rating);

  trendingReel.innerHTML = displayCafes
    .map(
      (cafe) => `
    <div class="cafe-card" onclick="selectedCafeId=${cafe.id};showPanel('profile')">
      <div class="cc-img-wrap">
        <img class="cc-img" src="${cafe.img}" alt="${cafe.name}" />
        <span class="cc-badge b-hot">🔥 Trending</span>
        <button class="cc-save" id="sv${cafe.id}" onclick="doSave('sv${cafe.id}', event)">
          🔖
        </button>
      </div>
      <div class="cc-body">
        <div class="cc-name">${cafe.name}</div>
        <div class="cc-meta">${cafe.address} · ⭐ ${cafe.rating}</div>
        <div class="cc-tags">
          ${cafe.tags.map((tag) => `<span class="cc-tag">${tag}</span>`).join("")}
        </div>
        <div class="cc-rxns">
          <div class="rxn-btn" onclick="bumpRxn(this)">
            <span class="rxn-e">❤️</span><span class="rxn-n">${Math.floor(Math.random() * 300)}</span>
          </div>
          <div class="rxn-btn" onclick="bumpRxn(this)">
            <span class="rxn-e">☕</span><span class="rxn-n">${Math.floor(Math.random() * 200)}</span>
          </div>
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

function populateNearYouCafes() {
  const nearYouStack = document.querySelectorAll(".rec-stack")[0];
  if (!nearYouStack) return;

  // Get cafes sorted by distance
  const nearCafes = [...cafeDatabase].sort((a, b) => a.distance - b.distance);

  nearYouStack.innerHTML = nearCafes
    .map(
      (cafe) => `
    <div class="rec-row" onclick="selectedCafeId=${cafe.id};showPanel('profile')">
      <img class="rec-thumb" src="${cafe.img}" alt="${cafe.name}" />
      <div class="rec-info">
        <div class="rec-name">${cafe.name}</div>
        <div class="rec-sub">
          ${cafe.address} · ⭐ ${cafe.rating} · Open now · ${cafe.tags[0]}
        </div>
      </div>
      <span class="rec-chip chip-chill">${cafe.distance} km</span>
    </div>
  `,
    )
    .join("");
}
