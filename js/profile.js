/* ═══════════════════════════════════════════════════════════════
   PROFILE — Café profile page and photo viewer
   Photos come from each café's `images` array (database.js).
   The logo is only ever shown in the info-card tile, never as a cover.
   ═══════════════════════════════════════════════════════════════ */

function getCafeImages(cafeId) {
  const cafe = getCafe(cafeId);
  return cafe && Array.isArray(cafe.images) ? cafe.images : [];
}

function photoAlt(cafe, index) {
  return `${cafe.name} photo ${index + 1}`;
}

// A tappable photo that opens the photo viewer
function photoButtonHTML(cafe, index, cls) {
  const src = getCafeImages(cafe.id)[index];
  return `
    <button class="${cls}" onclick="openPhotoModal('${esc(src)}')"
      aria-label="Open ${esc(photoAlt(cafe, index))}">
      <img src="${esc(src)}" alt="${esc(photoAlt(cafe, index))}" loading="lazy" />
    </button>`;
}

function loadCafeProfile(cafeId) {
  const cafe = getCafe(cafeId);
  if (!cafe) {
    console.error("Café not found:", cafeId);
    return;
  }
  selectedCafeId = cafe.id;

  renderGallery(cafe);
  renderInfoCard(cafe);
  renderBoard(cafe);
  updatePhotosTab(cafe.id);
  renderInfo(cafe);

  // Always open on "Today"
  showProfileTab("today");
}

function showProfileTab(tab) {
  const btn = document.querySelector(`.pf-tabs .ptab[data-tab="${tab}"]`);
  if (btn) setPTab(btn, tab);
}

/* ── Featured gallery ─────────────────────────────────────── */

function renderGallery(cafe) {
  const gallery = document.getElementById("pf-gallery");
  if (!gallery) return;
  const images = getCafeImages(cafe.id);
  const n = images.length;

  if (n === 0) {
    gallery.className = "pf-gallery-empty";
    gallery.innerHTML = `
      ${ico("camera")}
      <strong>No photos yet</strong>
      <span>Photos show here once the café adds them.</span>`;
    return;
  }

  // 1 photo: full width. 2: side by side. 3+: featured + second + "+N" tile.
  gallery.className = "pf-gallery " + (n === 1 ? "g1" : n === 2 ? "g2" : "g3");
  let html = photoButtonHTML(cafe, 0, "g-cell g-main");
  if (n >= 2) html += photoButtonHTML(cafe, 1, "g-cell");
  if (n >= 3) {
    const rest = n - 2;
    html += `
      <button class="g-cell g-more" onclick="showProfileTab('photos')"
        aria-label="See all ${n} photos of ${esc(cafe.name)}">
        <span class="g-more-n">+${rest}</span>
        <span class="g-more-l">See all photos</span>
      </button>`;
  }
  gallery.innerHTML = html;
}

/* ── Info card ────────────────────────────────────────────── */

function renderInfoCard(cafe) {
  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  // Logo on a white tile, or initials on a dark tile
  const tile = document.getElementById("pf-tile");
  if (tile) {
    if (cafe.logo) {
      tile.className = "tile lg tile-logo";
      tile.innerHTML = `<img src="${esc(cafe.logo)}" alt="${esc(cafe.name)} logo" loading="lazy" />`;
    } else {
      tile.className = "tile lg";
      tile.setAttribute("aria-hidden", "true");
      tile.textContent = cafeInitials(cafe);
    }
    if (cafe.logo) tile.removeAttribute("aria-hidden");
  }

  const nameEl = document.querySelector(".profile-name");
  if (nameEl) nameEl.textContent = cafe.name;
  setText("pf-address", cafe.address);

  // Rating: star + numbers, or "No reviews yet" with no star
  const rating = document.getElementById("pf-rating");
  if (rating) {
    rating.innerHTML =
      cafe.reviews > 0 && cafe.rating
        ? `${ico("star", "sm")}${esc(cafe.rating)} · ${esc(cafe.reviews)} reviews`
        : '<span class="muted">No reviews yet</span>';
  }

  // Open status only when the data has hours
  const open = document.getElementById("pf-open");
  if (open) {
    open.hidden = !cafe.hours;
    open.innerHTML = cafe.hours ? `${ico("clock", "sm")}${esc(cafe.hours)}` : "";
  }

  const tags = document.getElementById("pf-tags");
  if (tags) {
    const list = cafe.tags || [];
    tags.hidden = list.length === 0;
    tags.innerHTML = list
      .map((t) => `<span class="chip">${esc(t)}</span>`)
      .join("");
  }

  // Action buttons reflect saved state
  const alertBtn = document.getElementById("pf-alert");
  if (alertBtn) {
    alertBtn.dataset.cafe = cafe.id;
    syncAlertButtons(cafe.id);
  }
  const saveBtn = document.getElementById("pf-save");
  if (saveBtn) setSaveButton(saveBtn, inState("savedCafes", cafe.id));
}

/* ── Today: the café's updates, events and job openings ───── */

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
    : '<li class="board-empty">Nothing new today</li>';
}

/* ── Photos tab: 2 columns, first photo spans both ────────── */

function updatePhotosTab(cafeId) {
  const photoTab = document.getElementById("tab-photos");
  const cafe = getCafe(cafeId);
  if (!photoTab || !cafe) return;
  const images = getCafeImages(cafeId);

  photoTab.innerHTML = images.length
    ? `<div class="photo-grid">${images
        .map((_, i) => photoButtonHTML(cafe, i, "photo-cell"))
        .join("")}</div>`
    : '<div class="empty">No photos yet</div>';
}

/* ── Info tab: rows without data are left out ─────────────── */

function renderInfo(cafe) {
  const info = document.getElementById("pf-info");
  if (!info) return;
  const row = (icon, label, value) =>
    value
      ? `<div class="info-row">
          ${ico(icon)}
          <div><dt>${label}</dt><dd>${esc(value)}</dd></div>
        </div>`
      : "";
  info.innerHTML =
    row("pin", "Address", cafe.address) +
    row("clock", "Hours", cafe.hours) +
    row("phone", "Contact", cafe.contact);
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
  if (!images.length || !cafe) return;
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
    img.alt = photoAlt(cafe, index);
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
