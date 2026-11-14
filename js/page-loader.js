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

/* Icons in pages/*.html are written as placeholders:
     <i class="ico sm" data-icon="search"></i>
   and expanded here into the sprite icon from findit.html.

   Why not write the <svg> directly? VS Code's Live Server injects its
   reload script before every "</svg>" in a file that has no "</body>",
   but only counts one copy in Content-Length, so the browser receives a
   truncated page. Keeping "</svg>" out of the fragments means Live Server
   leaves them untouched. Do not add a literal </svg> to pages/*.html. */
function expandIcons(html) {
  return html.replace(
    /<i class="(ico(?: [\w-]+)*)" data-icon="([\w-]+)"><\/i>/g,
    '<svg class="$1" aria-hidden="true"><use href="#i-$2" /></svg>',
  );
}

async function loadPageModule(pageName) {
  try {
    const response = await fetch(pageModules[pageName]);
    if (!response.ok) throw new Error(`Failed to load ${pageName}`);

    const html = expandIcons(await response.text());
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
