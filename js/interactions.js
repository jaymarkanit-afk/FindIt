/* ═══════════════════════════════════════════════════════════════
   INTERACTIONS — User interactions (reactions, follow, save)
   ═══════════════════════════════════════════════════════════════ */

function bumpRxn(el) {
  const n = el.querySelector(".rxn-n");
  n.textContent = parseInt(n.textContent) + 1;
  const e = el.querySelector(".rxn-e");
  e.style.transform = "scale(1.55)";
  setTimeout(() => (e.style.transform = ""), 200);
}

function fReact(el) {
  if (el.classList.contains("reacted")) return;
  el.classList.add("reacted");
  const n = el.querySelector(".f-rxn-n");
  n.textContent = parseInt(n.textContent) + 1;
  const e = el.querySelector(".f-rxn-e");
  e.style.transform = "scale(1.5)";
  setTimeout(() => (e.style.transform = ""), 180);
}

function toggleFollow(btn) {
  const on = btn.classList.contains("on");
  btn.classList.toggle("on");
  btn.textContent = on ? "Follow" : "Following";
  showToast(on ? "Unfollowed" : "Following this café ☕");
}

function doSave(id, e) {
  e.stopPropagation();
  const btn = document.getElementById(id);
  const saving = !btn.classList.contains("saved");
  btn.classList.toggle("saved");
  btn.textContent = saving ? "✓" : "🔖";
  if (saving) {
    btn.style.transform = "scale(1.45)";
    setTimeout(() => (btn.style.transform = ""), 350);
    showToast("Café saved! 🔖");
  }
}

function saveProfile(btn) {
  if (btn.classList.contains("saved-state")) {
    btn.classList.remove("saved-state", "primary");
    btn.textContent = "❤️ Save";
    showToast("Removed from saved");
  } else {
    btn.classList.add("saved-state", "primary");
    btn.textContent = "✓ Saved!";
    btn.style.transform = "scale(1.06)";
    setTimeout(() => (btn.style.transform = ""), 300);
    showToast("Café saved! 🔖");
  }
}

function followProfile(btn) {
  const on = btn.classList.contains("following");
  btn.classList.toggle("following");
  btn.textContent = on ? "🔔 Follow" : "🔔 Following";
  btn.style.background = on ? "" : "var(--accent-pale)";
  btn.style.borderColor = on ? "" : "var(--accent)";
  btn.style.color = on ? "" : "var(--accent)";
  showToast(on ? "Unfollowed" : "Now following 🔔");
}
