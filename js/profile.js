/* ═══════════════════════════════════════════════════════════════
   PROFILE — Café profile page and photo viewer
   ═══════════════════════════════════════════════════════════════ */

function getCafeImages(cafeId) {
  const cafe = getCafe(cafeId);
  if (!cafe) return [];
  return cafe.images && cafe.images.length ? cafe.images : [cafe.img];
}

function loadCafeProfile(cafeId) {
  const cafe = getCafe(cafeId);
  if (!cafe) {
    console.error("Café not found:", cafeId);
    return;
  }
  selectedCafeId = cafe.id;

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  // Cover + info card
  const cover = document.getElementById("pf-cover-img");
  if (cover) {
    cover.src = getCafeImages(cafe.id)[0];
    cover.alt = cafe.name;
  }
  const nameEl = document.querySelector(".profile-name");
  if (nameEl) nameEl.textContent = cafe.name;
  setText("pf-tile", cafeInitials(cafe));
  setText("pf-address", cafe.address);
  setText("pf-rating", `${cafe.rating} · ${cafe.reviews} reviews`);
  setText("pf-open", "Open · Closes 9 PM");

  const tags = document.getElementById("pf-tags");
  if (tags)
    tags.innerHTML = cafe.tags
      .map((t) => `<span class="chip">${esc(t)}</span>`)
      .join("");

  // Action buttons reflect saved state
  const alertBtn = document.getElementById("pf-alert");
  if (alertBtn) {
    alertBtn.dataset.cafe = cafe.id;
    syncAlertButtons(cafe.id);
  }
  const saveBtn = document.getElementById("pf-save");
  if (saveBtn) setSaveButton(saveBtn, inState("savedCafes", cafe.id));

  renderBoard(cafe);
  updatePhotosTab(cafe.id);
  renderInfo(cafe);

  // Always open on "Today"
  const firstTab = document.querySelector(".pf-tabs .ptab");
  if (firstTab) setPTab(firstTab, "today");
}

// Today: the café's current posts, listed like a menu board
function renderBoard(cafe) {
  const board = document.getElementById("pf-board");
  if (!board) return;
  const items = getAllPosts().filter((p) => p.cafeId === cafe.id);

  board.innerHTML = items.length
    ? items
        .map((p) => {
          const type = POST_TYPES[p.type] || POST_TYPES.new;
          const title =
            (p.event && p.event.title) || (p.job && p.job.role) || p.title;
          const info = postDetails(p) || p.caption;
          return `
          <li>
            <div class="board-meta">
              <span class="tag-chip ${type.cls}">${type.label}</span>
              <span>${timeAgo(p.time)}</span>
            </div>
            <div class="board-title">${esc(title)}</div>
            <div class="board-info">${esc(info)}</div>
          </li>`;
        })
        .join("")
    : '<li class="board-empty">Nothing on the board yet. Turn on alerts to hear when this café posts.</li>';
}

// Photos: 2-column grid, first photo spans both columns
function updatePhotosTab(cafeId) {
  const photoTab = document.getElementById("tab-photos");
  const cafe = getCafe(cafeId);
  if (!photoTab || !cafe) return;

  photoTab.innerHTML = `<div class="photo-grid">${getCafeImages(cafeId)
    .map(
      (src, i) => `
      <button class="photo-cell" onclick="openPhotoModal('${esc(src)}')"
        aria-label="Open photo ${i + 1} of ${esc(cafe.name)}">
        <img src="${esc(src)}" alt="${esc(cafe.name)} photo ${i + 1}" loading="lazy" />
      </button>`,
    )
    .join("")}</div>`;
}

function renderInfo(cafe) {
  const info = document.getElementById("pf-info");
  if (!info) return;
  const row = (icon, label, value) => `
    <div class="info-row">
      ${ico(icon)}
      <div><dt>${label}</dt><dd>${esc(value)}</dd></div>
    </div>`;
  info.innerHTML =
    row("pin", "Address", cafe.address) +
    row("clock", "Hours", cafe.hours || DEFAULT_HOURS) +
    row("phone", "Contact", cafe.contact || "Not listed yet");
}

function shareCafe() {
  const cafe = getCafe(selectedCafeId);
  if (cafe) shareText(cafe.name, `${cafe.name} — ${cafe.address}`);
}

/* ════════════════════════════════════════════════════════════
   PHOTO VIEWER
   ════════════════════════════════════════════════════════════ */

function openPhotoModal(src) {
  const images = getCafeImages(selectedCafeId);
  const cafe = getCafe(selectedCafeId);
  let index = Math.max(0, images.indexOf(src));

  const modal = document.createElement("div");
  modal.className = "photo-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-label", "Photo viewer");
  const many = images.length > 1;
  modal.innerHTML = `
    <img alt="" />
    ${many ? `<button class="pm-btn pm-prev" aria-label="Previous photo">${ico("chevron")}</button>` : ""}
    ${many ? `<button class="pm-btn pm-next" aria-label="Next photo">${ico("chevron")}</button>` : ""}
    <button class="pm-btn pm-close" aria-label="Close photo viewer">${ico("close")}</button>
    <div class="pm-counter"></div>`;

  const img = modal.querySelector("img");
  const counter = modal.querySelector(".pm-counter");

  function show() {
    img.src = images[index];
    img.alt = `${cafe ? cafe.name : "Café"} photo ${index + 1}`;
    counter.textContent = `${index + 1} / ${images.length}`;
  }
  function step(dir) {
    index = (index + dir + images.length) % images.length;
    show();
  }
  function close() {
    document.removeEventListener("keydown", onKey);
    modal.remove();
  }
  function onKey(e) {
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "Escape") close();
  }

  if (many) {
    modal.querySelector(".pm-prev").addEventListener("click", () => step(-1));
    modal.querySelector(".pm-next").addEventListener("click", () => step(1));
  }
  modal.querySelector(".pm-close").addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", onKey);

  // Swipe left / right on touch screens
  let touchStartX = 0;
  modal.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });
  modal.addEventListener("touchend", (e) => {
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (many && Math.abs(diff) > 50) step(diff > 0 ? 1 : -1);
  });

  show();
  document.body.appendChild(modal);
  modal.querySelector(".pm-close").focus();
}
