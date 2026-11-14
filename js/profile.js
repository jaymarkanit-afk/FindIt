/* ═══════════════════════════════════════════════════════════════
   PROFILE — Café profile page and photo viewer
   One scroll: info card, "On the board today", Photos, Info.
   Photos come from each café's `images` array (database.js) and appear
   only in the Photos section. The logo is only ever the info-card tile.
   ═══════════════════════════════════════════════════════════════ */

// Photos for a café, each listed once. The logo is never treated as a photo.
function getCafeImages(cafeId) {
  const cafe = getCafe(cafeId);
  if (!cafe || !Array.isArray(cafe.images)) return [];
  return [...new Set(cafe.images)].filter((src) => src && src !== cafe.logo);
}

function photoAlt(cafe, index) {
  return `${cafe.name} photo ${index + 1}`;
}

function loadCafeProfile(cafeId) {
  const cafe = getCafe(cafeId);
  if (!cafe) {
    console.error("Café not found:", cafeId);
    return;
  }
  selectedCafeId = cafe.id;

  renderInfoCard(cafe);
  renderBoard(cafe);
  renderPhotos(cafe);
  renderInfo(cafe);
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
      tile.removeAttribute("aria-hidden");
      tile.innerHTML = `<img src="${esc(cafe.logo)}" alt="${esc(cafe.name)} logo" loading="lazy" />`;
    } else {
      tile.className = "tile lg";
      tile.setAttribute("aria-hidden", "true");
      tile.textContent = cafeInitials(cafe);
    }
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

/* ── On the board today: updates, events and job openings ── */

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
              <span>${agoHTML(p.time)}</span>
            </div>
            <div class="board-title">${esc(title)}</div>
            <div class="board-info">${esc(info)}</div>
          </li>`;
        })
        .join("")
    : '<li class="board-empty">Nothing new today</li>';
}

/* ── Photos: one swipeable row; "See all" turns it into a grid ── */

// With more photos than this, the row gets a "See all" button
const PHOTO_ROW_LIMIT = 3;

function renderPhotos(cafe) {
  const box = document.getElementById("pf-photos");
  const count = document.getElementById("pf-photo-count");
  const toggle = document.getElementById("pf-photos-toggle");
  if (!box) return;
  const images = getCafeImages(cafe.id);

  if (count) count.textContent = images.length ? String(images.length) : "";

  if (!images.length) {
    box.className = "photo-empty";
    box.removeAttribute("role");
    box.removeAttribute("aria-label");
    box.innerHTML = `
      ${ico("camera")}
      <strong>No photos yet</strong>
      <span>Photos show here once the café adds them.</span>`;
    if (toggle) toggle.hidden = true;
    return;
  }

  // Clear the empty state left by a café with no photos
  box.className = "photo-row";
  box.setAttribute("role", "list");
  box.setAttribute("aria-label", `${cafe.name} photos`);
  box.innerHTML = images
    .map(
      (src, i) => `
      <div role="listitem" class="photo-item">
        <button class="photo-tile" data-action="open-photo" data-src="${esc(src)}"
          aria-label="Open ${esc(photoAlt(cafe, i))}">
          <img src="${esc(src)}" alt="${esc(photoAlt(cafe, i))}" loading="lazy" />
        </button>
      </div>`,
    )
    .join("");

  if (toggle) toggle.hidden = images.length <= PHOTO_ROW_LIMIT;
  setPhotosExpanded(false); // every café opens with the row collapsed
}

// Collapsed: one sideways row. Expanded: the same tiles as a grid, in place.
function setPhotosExpanded(expanded) {
  const box = document.getElementById("pf-photos");
  const toggle = document.getElementById("pf-photos-toggle");
  if (!box || box.classList.contains("photo-empty")) return;
  box.className = expanded ? "photo-grid" : "photo-row";
  if (!expanded) box.scrollLeft = 0;
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.textContent = expanded ? "Show less" : "See all";
  }
}

function togglePhotos() {
  const toggle = document.getElementById("pf-photos-toggle");
  const wasExpanded = toggle && toggle.getAttribute("aria-expanded") === "true";
  setPhotosExpanded(!wasExpanded);
  // Collapsing a long grid: bring the section heading back into view
  if (wasExpanded) {
    const head = document.getElementById("pf-photos-h");
    if (head && head.getBoundingClientRect().top < 70)
      head.scrollIntoView({ block: "start" });
  }
}

/* ── Info: rows without data are left out ─────────────────── */

function renderInfo(cafe) {
  const info = document.getElementById("pf-info");
  const section = document.getElementById("pf-info-section");
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

  // The address is already in the info card, so a card holding only the
  // address would just repeat it.
  if (section) section.hidden = !cafe.hours && !cafe.contact;
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
  modal.setAttribute("aria-modal", "true");
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
  // Escape and the Tab focus trap come from the shared overlay handler in
  // ui.js; on close, focus goes back to the photo that opened the viewer.
  const opener = document.activeElement;
  function close() {
    document.removeEventListener("keydown", onKey);
    modal.remove();
    if (activeOverlay && activeOverlay.el === modal) activeOverlay = null;
    if (opener && document.contains(opener) && opener.focus) opener.focus();
  }
  function onKey(e) {
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
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
  if (activeOverlay) activeOverlay.close(); // only one overlay at a time
  activeOverlay = { el: modal, close, opener };
  modal.querySelector(".pm-close").focus();
}
