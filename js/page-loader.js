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
    const panel = document.getElementById(`panel-${pageName}`);
    if (panel) panel.innerHTML = html;
  } catch (error) {
    console.error(`Error loading page module ${pageName}:`, error);
  }
}

// Resolves once every page has been inserted (or has failed to load).
// main.js waits on this instead of guessing with a timeout. The script tag
// sits at the end of <body>, so the panels already exist here.
const pagesReady = Promise.all(Object.keys(pageModules).map(loadPageModule));
