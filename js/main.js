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

// Brevi's message changes with the time of day and only suggests
// cafés in the selected place (best rated first)
function setGreeting() {
  const mascotMsg = document.getElementById("mascot-msg");
  if (!mascotMsg) return;

  const place = getSelectedPlace().name;
  const picks = cafesInPlace()
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 2)
    .map((c) => c.name);
  if (!picks.length) {
    mascotMsg.textContent = `No cafés listed in ${place} yet. Try another place from the location pill.`;
    return;
  }
  const both = picks.length === 2 ? `${picks[0]} and ${picks[1]}` : picks[0];
  const h = new Date().getHours();
  let msg;
  if (h >= 5 && h < 11) msg = `Good morning! In ${place}, start with ${both}.`;
  else if (h >= 11 && h < 17) msg = `Afternoon break? ${both} ${picks.length === 2 ? "are" : "is"} worth a visit in ${place}.`;
  else if (h >= 17 && h < 20) msg = `Golden hour in ${place}: ${both} ${picks.length === 2 ? "are" : "is"} good for unwinding.`;
  else msg = `Night owl? See what ${both} posted today in ${place}.`;
  mascotMsg.textContent = msg;
}
