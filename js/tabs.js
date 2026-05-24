/* ═══════════════════════════════════════════════════════════════
   TABS — Tab switching functionality
   ═══════════════════════════════════════════════════════════════ */

function setPTab(el, tab) {
  document.querySelectorAll(".ptab").forEach((t) => t.classList.remove("on"));
  el.classList.add("on");
  ["photos", "menu", "updates", "events"].forEach((t) => {
    const tc = document.getElementById("tab-" + t);
    if (tc) tc.classList.toggle("on", t === tab);
  });
}

function mfClick(el) {
  document.querySelectorAll(".mf").forEach((m) => m.classList.remove("on"));
  el.classList.add("on");
}

function mtgClick(el, mode) {
  el.closest(".map-toggle-btn")
    .querySelectorAll(".mtg")
    .forEach((b) => b.classList.remove("on"));
  el.classList.add("on");
  showToast(mode === "list" ? "List view" : "Map view");
}
