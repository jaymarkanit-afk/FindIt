/* ═══════════════════════════════════════════════════════════════
   TABS — Café profile tabs (Today / Photos / Info)
   ═══════════════════════════════════════════════════════════════ */

function setPTab(el, tab) {
  document.querySelectorAll(".ptab").forEach((t) => {
    t.classList.remove("on");
    t.setAttribute("aria-pressed", "false");
  });
  el.classList.add("on");
  el.setAttribute("aria-pressed", "true");
  ["today", "photos", "info"].forEach((t) => {
    const tc = document.getElementById("tab-" + t);
    if (tc) tc.classList.toggle("on", t === tab);
  });
}
