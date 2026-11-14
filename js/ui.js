/* ═══════════════════════════════════════════════════════════════
   UI — Theme, toast, alerts panel, and panel management
   ═══════════════════════════════════════════════════════════════ */

function applyThemeIcon() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  const icon = document.getElementById("theme-ico");
  if (icon) icon.setAttribute("href", dark ? "#i-sun" : "#i-moon");
  const btn = document.getElementById("theme-btn");
  if (btn)
    btn.setAttribute(
      "aria-label",
      dark ? "Switch to light theme" : "Switch to dark theme",
    );
}

function toggleTheme(e) {
  const html = document.documentElement;
  const dark = html.getAttribute("data-theme") === "dark";
  const flash = document.getElementById("theme-flash");
  const x = e ? (e.clientX / window.innerWidth) * 100 : 50;
  const y = e ? (e.clientY / window.innerHeight) * 100 : 50;
  flash.style.setProperty("--fx", x + "%");
  flash.style.setProperty("--fy", y + "%");
  flash.style.opacity = ".18";
  setTimeout(() => {
    const next = dark ? "light" : "dark";
    html.setAttribute("data-theme", next);
    try {
      localStorage.setItem("findit.theme", next);
    } catch (err) {}
    applyThemeIcon();
    flash.style.opacity = "0";
  }, 130);
}

function showToast(msg, dur = 2200) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove("show"), dur);
}

/* ── Overlays (filter drawer, alerts panel) ────────────────
   While open: focus stays inside, Escape closes.
   On close: focus goes back to the control that opened it.
   While closed they are visibility:hidden (see the CSS).      */

let activeOverlay = null; // { el, close, opener }

function overlayFocusables(el) {
  return Array.from(
    el.querySelectorAll(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((n) => !n.disabled && n.offsetParent !== null);
}

function openOverlay(el, close) {
  if (activeOverlay && activeOverlay.el !== el) activeOverlay.close();
  activeOverlay = { el, close, opener: document.activeElement };
  el.classList.add("open");
  const first = overlayFocusables(el)[0];
  if (first) first.focus();
}

function closeOverlay(el) {
  if (!el.classList.contains("open")) return;
  el.classList.remove("open");
  if (activeOverlay && activeOverlay.el === el) {
    const opener = activeOverlay.opener;
    activeOverlay = null;
    if (opener && document.contains(opener) && opener.focus) opener.focus();
  }
}

document.addEventListener("keydown", (e) => {
  if (!activeOverlay) return;

  if (e.key === "Escape") {
    e.preventDefault();
    activeOverlay.close();
    return;
  }

  if (e.key === "Tab") {
    const items = overlayFocusables(activeOverlay.el);
    if (!items.length) {
      e.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const inside = activeOverlay.el.contains(document.activeElement);
    if (e.shiftKey && (!inside || document.activeElement === first)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (!inside || document.activeElement === last)) {
      e.preventDefault();
      first.focus();
    }
  }
});

function toggleNotif() {
  const backdrop = document.getElementById("notif-backdrop");
  if (backdrop.classList.contains("open")) {
    closeNotif();
    return;
  }
  renderNotifications(); // new items are still marked "New" in this render
  markAlertsSeen(); // …and the badge clears
  openOverlay(backdrop, closeNotif);
}

function closeNotif(e) {
  const backdrop = document.getElementById("notif-backdrop");
  if (!e || e.target === backdrop) closeOverlay(backdrop);
}

function showPanel(name) {
  if (!document.getElementById("panel-" + name)) name = "home";

  document
    .querySelectorAll(".panel")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("panel-" + name).classList.add("active");

  document.querySelectorAll(".nav-it").forEach((n) => {
    n.classList.remove("on");
    n.removeAttribute("aria-current");
  });
  const ni = document.getElementById("nav-" + name);
  if (ni) {
    ni.classList.add("on");
    ni.setAttribute("aria-current", "page");
  }

  window.scrollTo({ top: 0 });

  // Remember where the user was for the next visit
  try {
    localStorage.setItem("lastPanel", name);
    localStorage.setItem("findit.cafe", String(selectedCafeId));
  } catch (err) {}

  // Pages are already in the DOM (main.js waits for page-loader),
  // so each panel can be set up straight away.
  if (name === "map") {
    try {
      initializeMap(); // creates the map, or just fixes its size
    } catch (e) {
      console.error("Map initialization error:", e);
      showToast("Map failed to load. Try again.");
    }
  }
  if (name === "profile") loadCafeProfile(selectedCafeId || 1);
  if (name === "saved") renderSaved();
  if (name === "owner") updateAnnPreview();
}
