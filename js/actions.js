/* ═══════════════════════════════════════════════════════════════
   ACTIONS — every click and input in the app is wired here.

   Markup carries no inline handlers. A clickable element declares what it
   does with data-action (plus data-cafe, data-panel, data-src … for the
   details), and one delegated listener per container looks the action up
   in ACTIONS. This also works for markup rendered later (feed, pages).
   ═══════════════════════════════════════════════════════════════ */

const ACTIONS = {
  // Navigation
  "show-panel": (el) => showPanel(el.dataset.panel),
  "open-cafe": (el) => {
    if (el.closest("#notif-backdrop")) closeNotif();
    openCafe(el.dataset.cafe);
  },

  // Top bar, alerts panel, theme
  "toggle-alerts-panel": () => toggleNotif(),
  "close-alerts": () => closeNotif(),
  "toggle-theme": (el, e) => toggleTheme(e),

  // Filters
  "feed-filter": (el) => quickFilter(el.dataset.filter),
  "open-drawer": () => openDrawer(),
  "close-drawer": () => closeDrawer(),
  "pick-filter": (el) => pickFilter(el),
  "apply-filter": () => applyFilter(),

  // Board cards (the post id comes from the enclosing [data-post])
  "toggle-alerts": (el) => toggleFollow(el),
  sip: (el) => bumpRxn(el),
  keep: (el, e) => doSave(el, e),
  "toggle-thread": (el) => toggleThread(el),
  "post-cta": (el) => postCta(el, el.closest("[data-post]").dataset.post),

  // Café profile
  "open-photo": (el) => openPhotoModal(el.dataset.src),
  "toggle-photos": () => togglePhotos(),
  "share-cafe": () => shareCafe(),
  directions: () => showCafeOnMap(),
  "save-cafe": (el) => saveProfile(el),

  // Map
  locate: () => locateMe(),
  "zoom-to-me": () => zoomToUserLocation(),

  // Owner (the account button in the top bar opens the café sign-in)
  account: () => showPanel("owner"),
  "owner-login": () => ownerLogin(),
  "owner-logout": () => ownerLogout(),
  "ann-type": (el) => annType(el),
  publish: () => postAnn(),
  "view-published": () => viewPublished(),
};

function onActionClick(e) {
  const el = e.target.closest("[data-action]");
  if (!el || !e.currentTarget.contains(el)) return;
  const action = ACTIONS[el.dataset.action];
  if (!action) return;
  if (el.tagName === "A") e.preventDefault();
  action(el, e);
}

// Search fields are marked with data-search
function onSearchInput(e) {
  if (e.target.matches("[data-search]")) handleSearch(e.target.value);
}

function onSearchKeydown(e) {
  if (e.key === "Enter" && e.target.matches("[data-search]"))
    submitSearch(e.target.value);
}

(function bindActions() {
  const $ = (sel) => document.querySelector(sel);
  const drawer = $("#drawer-overlay");
  const alerts = $("#notif-backdrop");
  const pages = $("#pages-container");
  const topbar = $(".topbar");

  // One delegated click listener per container
  [topbar, drawer, alerts, pages, $(".side-col"), $(".bottom-nav"), $("#publish-bar")].forEach(
    (container) => container.addEventListener("click", onActionClick),
  );

  // Clicking the dimmed backdrop (not the panel inside it) closes it
  drawer.addEventListener("click", (e) => {
    if (e.target === drawer) closeDrawer();
  });
  alerts.addEventListener("click", (e) => {
    if (e.target === alerts) closeNotif();
  });

  // Search (top bar, home, map)
  [topbar, pages].forEach((container) => {
    container.addEventListener("input", onSearchInput);
    container.addEventListener("keydown", onSearchKeydown);
  });

  // Owner composer: any field change redraws the live preview
  pages.addEventListener("input", (e) => {
    if (e.target.closest("#owner-dash")) updateAnnPreview();
  });
  pages.addEventListener("change", (e) => {
    if (e.target.id === "ann-photo") annPhoto(e.target);
  });

  // Comment threads inside board cards
  pages.addEventListener("submit", (e) => {
    const form = e.target.closest(".thread-form");
    if (!form) return;
    e.preventDefault();
    sendComment(form);
  });
})();
