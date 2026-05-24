/* ═══════════════════════════════════════════════════════════════
   OWNER — Owner dashboard management
   ═══════════════════════════════════════════════════════════════ */

function ownerLogin() {
  const e = document.getElementById("ow-email").value;
  const p = document.getElementById("ow-pass").value;
  if (!e || !p) {
    showToast("Please enter your credentials");
    return;
  }
  document.getElementById("owner-gate").style.display = "none";
  document.getElementById("owner-dash").style.display = "block";
  showToast("Welcome back! 🏪");
}

function ownerLogout() {
  document.getElementById("owner-gate").style.display = "block";
  document.getElementById("owner-dash").style.display = "none";
  document.getElementById("ow-email").value = "";
  document.getElementById("ow-pass").value = "";
  showToast("Signed out");
}

function setInv(btn, status) {
  const grp = btn.closest(".inv-btns");
  grp.querySelectorAll(".ivb").forEach((b) => {
    b.classList.remove("active");
    const s = b.getAttribute("onclick").match(/'(\w+)'/)?.[1] || "in";
    b.textContent = { in: "In", low: "Low", out: "Out" }[s];
  });
  btn.classList.add("active");
  btn.textContent = { in: "✓ In", low: "⚠ Low", out: "✕ Out" }[status];
  showToast(
    {
      in: "Marked In Stock ✓",
      low: "Marked Low Stock ⚠",
      out: "Marked Out of Stock",
    }[status],
  );
}

function annType(el) {
  document
    .querySelectorAll(".ann-type")
    .forEach((t) => t.classList.remove("on"));
  el.classList.add("on");
}

function postAnn() {
  const txt = document.getElementById("ann-text").value.trim();
  if (!txt) {
    showToast("Write something first!");
    return;
  }
  document.getElementById("ann-text").value = "";
  showToast("Posted to FindIt feed 📤");
}
