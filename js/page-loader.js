/* ═══════════════════════════════════════════════════════════════
   PAGE LOADER — Load HTML page modules into panels
═══════════════════════════════════════════════════════════════ */

const pageModules = {
  home: "pages/home.html",
  map: "pages/map.html",
  profile: "pages/profile.html",
  saved: "pages/saved.html",
  owner: "pages/owner.html",
};

async function loadPageModule(pageName) {
  try {
    const response = await fetch(pageModules[pageName]);
    if (!response.ok) throw new Error(`Failed to load ${pageName}`);

    const html = await response.text();
    const panelId = `panel-${pageName}`;
    const panel = document.getElementById(panelId);

    if (panel) {
      panel.innerHTML = html;
    }
  } catch (error) {
    console.error(`Error loading page module ${pageName}:`, error);
  }
}

// Load all page modules on page load
document.addEventListener("DOMContentLoaded", () => {
  Object.keys(pageModules).forEach((pageName) => {
    loadPageModule(pageName);
  });
});
