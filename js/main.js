/* ═══════════════════════════════════════════════════════════════
   MAIN — Application initialization and setup
   ═══════════════════════════════════════════════════════════════ */

// Start only once every page module is in the DOM (see page-loader.js)
pagesReady.then(startApp);

function startApp() {
  applyThemeIcon();
  renderTodayHeading();
  setGreeting();

  // Render everything that comes from the data
  syncFilterTabs();
  filterAndDisplayCafes();
  renderPostViews();
  updateGeoInfoCard();
  updateDistanceLabels();

  // Keep "x min ago" labels current while the page stays open
  setInterval(refreshTimeLabels, 60 * 1000);

  // Restore the last page and café
  let lastPanel = "home";
  try {
    lastPanel = localStorage.getItem("lastPanel") || "home";
    const lastCafe = Number(localStorage.getItem("findit.cafe"));
    if (getCafe(lastCafe)) selectedCafeId = lastCafe;
  } catch (e) {}
  showPanel(lastPanel);
}

// Brevi's message changes with the time of day
function setGreeting() {
  const mascotMsg = document.getElementById("mascot-msg");
  if (!mascotMsg) return;

  const h = new Date().getHours();
  let msg;
  if (h >= 5 && h < 11) {
    msg =
      "Good morning! Breakfast cafés near you have fresh pastries ready. Top picks: Paramount Coffee and Craft Coffee Roastery.";
  } else if (h >= 11 && h < 17) {
    msg =
      "Afternoon focus! Paramount Coffee and Dodo Workspace are perfect for an afternoon study session.";
  } else if (h >= 17 && h < 20) {
    msg =
      "Golden hour! Cafés are buzzing right now — perfect for unwinding.";
  } else {
    msg =
      "Night owl? Check today's updates for cozy spots and late events.";
  }
  mascotMsg.textContent = msg;
}
