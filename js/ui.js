/* ═══════════════════════════════════════════════════════════════
   UI — Theme, toast, notifications, and panel management
   ═══════════════════════════════════════════════════════════════ */

function toggleTheme(e) {
  const html = document.documentElement,
    dark = html.getAttribute("data-theme") === "dark";
  const flash = document.getElementById("theme-flash");
  const x = e ? (e.clientX / window.innerWidth) * 100 : 50,
    y = e ? (e.clientY / window.innerHeight) * 100 : 50;
  flash.style.setProperty("--fx", x + "%");
  flash.style.setProperty("--fy", y + "%");
  flash.style.opacity = ".18";
  setTimeout(() => {
    html.setAttribute("data-theme", dark ? "light" : "dark");
    document.getElementById("theme-knob").textContent = dark ? "☀️" : "🌙";
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

function toggleNotif() {
  document.getElementById("notif-backdrop").classList.toggle("open");
  document.getElementById("notif-badge").style.display = "none";
}

function closeNotif(e) {
  if (!e || e.target === document.getElementById("notif-backdrop"))
    document.getElementById("notif-backdrop").classList.remove("open");
}

function showPanel(name) {
  document
    .querySelectorAll(".panel")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("panel-" + name).classList.add("active");
  document.querySelectorAll(".nav-it").forEach((n) => n.classList.remove("on"));
  const ni = document.getElementById("nav-" + name);
  if (ni) ni.classList.add("on");
  window.scrollTo({ top: 0, behavior: "smooth" });
  // Save current panel to localStorage for persistence
  localStorage.setItem("lastPanel", name);

  // Initialize map when map panel is shown
  if (name === "map" && !map) {
    setTimeout(() => {
      try {
        initializeMap();
        // Ensure all cafes are displayed on map
        if (typeof updateMap === "function") {
          updateMap(cafeDatabase);
        }
      } catch (e) {
        console.error("Map initialization error:", e);
        showToast("Map failed to load. Try again.");
      }
    }, 150);
  }

  // Load café profile when profile panel is shown
  if (name === "profile" && typeof loadCafeProfile === "function") {
    setTimeout(() => {
      try {
        loadCafeProfile(selectedCafeId || 1);
      } catch (e) {
        console.error("Profile loading error:", e);
      }
    }, 150);
  }
}
