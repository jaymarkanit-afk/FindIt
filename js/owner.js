/* ═══════════════════════════════════════════════════════════════
   OWNER — sign-in gate, the dashboard (profile card, background and
   featured photos, posts, comments to answer) and the composer, which
   opens from "Post an update" or Edit and returns to the dashboard.
   ═══════════════════════════════════════════════════════════════ */

const OWNER_CAFE_ID = 1; // the demo owner posts as Paramount Coffee
const PHOTO_MAX_WIDTH = 1200; // post and featured photos
const BACKGROUND_MAX_WIDTH = 1600;
const PHOTO_QUALITY = 0.8;
const CAPTION_WARN_AT = CAPTION_MAX - 20; // counter turns to the warning colour

let draftPhotos = []; // [{ src (data URL), alt }] — first is the main photo
let editingId = null; // id of the post open in the composer, or null for a new one
let postsTab = "live"; // dashboard tab: live | draft | ended

const CAPTION_PLACEHOLDERS = {
  new: "Tell customers about it",
  photos: "Say something about these photos",
  promo: "Explain the offer",
  event: "What should people expect?",
  hiring: "Describe the role and who you are looking for",
};

const PHOTO_HINTS = {
  new: "Optional, up to 4. The first one shows on the card.",
  photos: "1 to 6 photos. The first one is the main photo.",
  promo: "Optional, 1 photo.",
  event: "Optional, 1 photo.",
};

const $id = (id) => document.getElementById(id);

function ownerLogin() {
  const e = $id("ow-email").value;
  const p = $id("ow-pass").value;
  if (!e || !p) {
    showToast("Please enter your credentials");
    return;
  }
  ownerSession = true;
  $id("owner-gate").style.display = "none";
  $id("owner-dash").style.display = "block";
  annType(document.querySelector(".ann-type.on"));
  showDashboard();
  showToast("Welcome back!");
}

function ownerLogout() {
  ownerSession = false;
  $id("owner-gate").style.display = "block";
  $id("owner-dash").style.display = "none";
  $id("owner-compose").hidden = true;
  $id("owner-home").hidden = false;
  $id("ow-email").value = "";
  $id("ow-pass").value = "";
  showToast("Signed out");
}

/* ── Inline messages (never alert popups) ─────────────────── */

function setFieldError(fieldId, message) {
  const field = $id(fieldId);
  const msg = $id(fieldId + "-error");
  if (msg) {
    msg.textContent = message || "";
    msg.hidden = !message;
  }
  if (field) {
    if (message) field.setAttribute("aria-invalid", "true");
    else field.removeAttribute("aria-invalid");
  }
}

function clearComposerErrors() {
  document
    .querySelectorAll("#owner-dash .field-error")
    .forEach((el) => setFieldError(el.id.replace(/-error$/, ""), ""));
  $id("ann-error").hidden = true;
}

function updateCounter(textarea, counter) {
  const len = textarea.value.length;
  counter.textContent = `${len} / ${CAPTION_MAX}`;
  counter.classList.toggle("warn", len >= CAPTION_WARN_AT);
}

/* ── Post type ────────────────────────────────────────────── */

function currentAnnType() {
  const on = document.querySelector(".ann-type.on");
  return on ? on.dataset.type : "new";
}

function annType(el) {
  if (!el) return;
  document.querySelectorAll(".ann-type").forEach((t) => {
    t.classList.toggle("on", t === el);
    t.setAttribute("aria-pressed", String(t === el));
  });
  const type = el.dataset.type;

  ["new", "promo", "event", "hiring"].forEach((t) => {
    const extra = $id("extra-" + t);
    if (extra) extra.hidden = t !== type;
  });

  // Hiring posts never carry photos
  $id("ann-photos-field").hidden = PHOTO_LIMITS[type].max === 0;
  $id("ann-photos-hint").textContent = PHOTO_HINTS[type] || "";

  const caption = $id("ann-text");
  caption.placeholder = CAPTION_PLACEHOLDERS[type];
  $id("ann-text-req").textContent = type === "photos" ? "(optional)" : "(required)";

  clearComposerErrors();
  renderThumbs();
  updateAnnPreview();
}

/* ── Photos: add, describe, reorder, remove ───────────────── */

// Resize in the browser: at most maxWidth wide (1200px for post and
// featured photos, 1600px for the background), JPEG ~80%
function resizePhoto(file, maxWidth = PHOTO_MAX_WIDTH) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(null);
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#fff"; // transparent PNGs become white, not black
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", PHOTO_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function annPhoto(input) {
  const type = currentAnnType();
  const max = PHOTO_LIMITS[type].max;
  const files = Array.from(input.files || []);
  input.value = ""; // lets the same file be picked again later
  if (!files.length) return;

  const room = Math.max(0, max - draftPhotos.length);
  const take = files.slice(0, room);
  const results = await Promise.all(take.map((f) => resizePhoto(f, PHOTO_MAX_WIDTH)));
  const added = results.filter(Boolean);
  added.forEach((src) => draftPhotos.push({ src, alt: "" }));

  const notes = [];
  if (files.length > room)
    notes.push(
      `A ${POST_TYPES[type].label.toLowerCase()} post can have up to ${max} photo${max === 1 ? "" : "s"}, so ${files.length - room} ${files.length - room === 1 ? "was" : "were"} not added.`,
    );
  if (added.length < take.length) notes.push("Some files could not be read as images.");
  setFieldError("ann-photo", "");
  $id("ann-photos-error").textContent = notes.join(" ");
  $id("ann-photos-error").hidden = !notes.length;

  renderThumbs();
  updateAnnPreview();
}

function renderThumbs() {
  const list = $id("ann-thumbs");
  if (!list) return;
  const max = PHOTO_LIMITS[currentAnnType()].max;
  list.replaceChildren();

  draftPhotos.forEach((photo, i) => {
    const n = i + 1;
    const li = document.createElement("li");
    li.className = "thumb" + (i >= max ? " unused" : "");
    li.innerHTML = `
      <img alt="" />
      ${i === 0 ? '<span class="thumb-main">Main</span>' : ""}
      <input class="fi thumb-alt" type="text" maxlength="120" data-index="${i}"
        placeholder="Describe photo ${n} (optional)" aria-label="Description for photo ${n} (optional)" />
      <span class="thumb-btns">
        <button class="mini-round" type="button" data-action="photo-earlier" data-index="${i}"
          aria-label="Move photo ${n} earlier" ${i === 0 ? "disabled" : ""}>${ico("chevron", "sm")}</button>
        <button class="mini-round flip" type="button" data-action="photo-later" data-index="${i}"
          aria-label="Move photo ${n} later" ${i === draftPhotos.length - 1 ? "disabled" : ""}>${ico("chevron", "sm")}</button>
        <button class="mini-round" type="button" data-action="photo-remove" data-index="${i}"
          aria-label="Remove photo ${n}">${ico("close", "sm")}</button>
      </span>
      ${i >= max ? `<span class="thumb-note">Not posted: this type takes ${max === 1 ? "1 photo" : max + " photos"}</span>` : ""}`;
    li.querySelector("img").src = photo.src;
    li.querySelector(".thumb-alt").value = photo.alt || "";
    list.append(li);
  });

  const full = draftPhotos.length >= max;
  $id("ann-photo-add").hidden = full;
  $id("ann-photo-add-label").textContent = draftPhotos.length ? "Add more photos" : max === 1 ? "Add a photo" : "Add photos";
}

function setPhotoAlt(input) {
  const photo = draftPhotos[Number(input.dataset.index)];
  if (photo) photo.alt = input.value;
}

function movePhoto(btn, dir) {
  const i = Number(btn.dataset.index);
  const j = i + dir;
  if (j < 0 || j >= draftPhotos.length) return;
  [draftPhotos[i], draftPhotos[j]] = [draftPhotos[j], draftPhotos[i]];
  renderThumbs();
  updateAnnPreview();
  // Keep focus on the same control of the photo that moved
  const action = dir < 0 ? "photo-earlier" : "photo-later";
  const next = document.querySelector(`#ann-thumbs [data-action="${action}"][data-index="${j}"]`);
  const fallback = document.querySelector(`#ann-thumbs [data-index="${j}"].mini-round:not([disabled])`);
  (next && !next.disabled ? next : fallback || $id("ann-photo")).focus();
}

function removePhoto(btn) {
  const i = Number(btn.dataset.index);
  draftPhotos.splice(i, 1);
  renderThumbs();
  updateAnnPreview();
  const next =
    document.querySelector(`#ann-thumbs [data-action="photo-remove"][data-index="${Math.min(i, draftPhotos.length - 1)}"]`) ||
    $id("ann-photo");
  next.focus();
}

/* ── Draft → post ─────────────────────────────────────────── */

function fieldValue(id) {
  const el = $id(id);
  return el ? el.value.trim() : "";
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const hour = h % 12 || 12;
  return `${hour}${m ? ":" + String(m).padStart(2, "0") : ""} ${h < 12 ? "AM" : "PM"}`;
}

function buildAnnPost() {
  const type = currentAnnType();
  const max = PHOTO_LIMITS[type].max;
  const original = editingId ? getPost(editingId) : null;
  const post = {
    id: original ? original.id : "o" + Date.now(),
    cafeId: OWNER_CAFE_ID,
    type,
    time: original ? original.time : Date.now(),
    sips: original ? original.sips || 0 : 0,
    status: "live",
    pinned: original ? !!original.pinned : false,
    endedAt: null,
    // Keep line breaks; trim only the ends
    caption: $id("ann-text").value.replace(/^\s+|\s+$/g, ""),
    photos: draftPhotos.slice(0, max).map((p) =>
      p.alt && p.alt.trim() ? { src: p.src, alt: p.alt.trim() } : { src: p.src },
    ),
  };

  if (type === "new")
    post.new = {
      item: fieldValue("ann-item"),
      price: fieldValue("ann-new-price"),
      availability: fieldValue("ann-avail"),
    };
  if (type === "promo")
    post.promo = {
      title: fieldValue("ann-promo-title"),
      offer: fieldValue("ann-offer"),
      validUntil: fieldValue("ann-until"),
    };
  if (type === "event") {
    const date = fieldValue("ann-date");
    post.event = {
      title: fieldValue("ann-event-title"),
      date,
      day: date
        ? new Date(date + "T00:00").toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
        : (original && original.event && original.event.day) || "",
      time: formatTime(fieldValue("ann-time")),
      price: fieldValue("ann-price"),
    };
  }
  if (type === "hiring")
    post.hiring = {
      role: fieldValue("ann-role"),
      schedule: fieldValue("ann-schedule"),
      perks: fieldValue("ann-perks"),
    };
  return post;
}

// Returns [{ field, message }] for everything that blocks publishing
function validateAnn(post) {
  const errors = [];
  const d = postData(post);
  const need = (cond, field, message) => !cond && errors.push({ field, message });
  if (post.type === "new") need(d.item, "ann-item", "Add the item's name.");
  if (post.type === "promo") need(d.title, "ann-promo-title", "Add a title for the promo.");
  if (post.type === "event") {
    need(d.title, "ann-event-title", "Add a title for the event.");
    need(d.date || d.day, "ann-date", "Add the event date.");
  }
  if (post.type === "hiring") need(d.role, "ann-role", "Add the role you are hiring for.");
  if (post.type === "photos")
    need(post.photos.length >= 1, "ann-photo", "Add at least 1 photo.");
  else
    need(
      post.caption.length >= CAPTION_MIN,
      "ann-text",
      post.caption ? `The caption needs at least ${CAPTION_MIN} characters.` : "Add a caption.",
    );
  return errors;
}

function showAnnErrors(errors) {
  clearComposerErrors();
  errors.forEach((e) => {
    if (e.field === "ann-photo") {
      $id("ann-photos-error").textContent = e.message;
      $id("ann-photos-error").hidden = false;
    } else setFieldError(e.field, e.message);
  });
  if (errors.length) $id(errors[0].field).focus();
}

// Live preview: the same card the board will show
function updateAnnPreview() {
  const preview = $id("ann-preview");
  if (!preview) return;
  const nameEl = $id("ow-cafe-name");
  if (nameEl) nameEl.textContent = getCafe(OWNER_CAFE_ID).name;
  const counter = $id("ann-count");
  if (counter) updateCounter($id("ann-text"), counter);

  const post = buildAnnPost();
  post.id = "preview";
  const d = postData(post);
  if (post.type === "new" && !d.item) d.item = "Your item name";
  if ((post.type === "promo" || post.type === "event") && !d.title) d.title = "Your title";
  if (post.type === "hiring" && !d.role) d.role = "The role you are hiring for";
  preview.innerHTML = postCardHTML(post);
  preview.inert = true; // a picture of the card, not something to click
  hydrateCaptions(preview);
}

// Clear a field's error as soon as the owner types in it
function onComposerInput(target) {
  if (target.classList.contains("thumb-alt")) setPhotoAlt(target);
  if (target.id && $id(target.id + "-error")) setFieldError(target.id, "");
  updateAnnPreview();
}

/* ── Publish ──────────────────────────────────────────────── */

const STORAGE_FULL_MESSAGE =
  "This post could not be saved: FindIt's storage in this browser is full. Your draft is still here. Remove a photo, or delete an older post under \"Your posts\", then publish again.";

function postAnn() {
  const post = buildAnnPost();
  const errors = validateAnn(post);
  if (errors.length) {
    showAnnErrors(errors);
    return;
  }
  clearComposerErrors();
  const wasEditing = !!editingId;
  if (wasEditing) post.editedAt = Date.now();
  if (!storePost(post)) return;

  // "Send alerts now" off → the post skips the Alerts badge
  const alertNow = $id("ann-alert").checked;
  if (!alertNow) {
    userState.seen.push(post.id);
    saveStore("seen", userState.seen);
  }

  renderPostViews();
  closeComposer("live", post.id);
  showPublishBar(
    wasEditing
      ? "Changes are on the board."
      : alertNow
        ? "On the board. People with alerts on were notified."
        : "On the board.",
  );
}

// Save a new post or the edited one; false (draft kept) if storage is full
function storePost(post) {
  let saved;
  if (editingId) {
    const { id, ...fields } = post;
    saved = updatePost(editingId, fields);
  } else {
    userState.ownerPosts.unshift(post);
    saved = saveStore("ownerPosts", userState.ownerPosts);
    if (!saved) userState.ownerPosts.shift(); // undo; the draft stays untouched
  }
  if (!saved) {
    $id("ann-error").textContent = STORAGE_FULL_MESSAGE;
    $id("ann-error").hidden = false;
    $id("ann-error").scrollIntoView({ block: "center" });
  }
  return saved;
}

// "Save draft": no checks; the post stays hidden from customers
function saveDraft() {
  const post = buildAnnPost();
  post.status = "draft";
  post.pinned = false;
  if (editingId) post.editedAt = Date.now();
  clearComposerErrors();
  if (!storePost(post)) return;
  renderPostViews();
  closeComposer("draft", post.id);
  showToast("Draft saved");
}

function resetDraft() {
  [
    "ann-text", "ann-item", "ann-new-price", "ann-avail", "ann-promo-title", "ann-offer",
    "ann-until", "ann-event-title", "ann-date", "ann-time", "ann-price", "ann-role",
    "ann-schedule", "ann-perks",
  ].forEach((id) => {
    const el = $id(id);
    if (el) el.value = "";
  });
  draftPhotos = [];
  renderThumbs();
  updateAnnPreview();
}

function showPublishBar(text) {
  const bar = $id("publish-bar");
  if (!bar) return;
  $id("publish-bar-text").textContent = text;
  bar.classList.add("show");
  clearTimeout(bar._t);
  bar._t = setTimeout(() => bar.classList.remove("show"), 5000);
}

function viewPublished() {
  $id("publish-bar").classList.remove("show");
  quickFilter("all");
  showPanel("home");
}

/* ════════════════════════════════════════════════════════════
   DASHBOARD
   ════════════════════════════════════════════════════════════ */

const PHOTO_FULL_MESSAGE =
  "This photo could not be saved: FindIt's storage in this browser is full. Your current photo is kept.";

function ownerCafe() {
  return getCafe(OWNER_CAFE_ID);
}

function showDashboard() {
  $id("owner-compose").hidden = true;
  $id("owner-home").hidden = false;
  renderDashboard();
}

function renderDashboard() {
  if (!$id("owner-home") || !ownerSession) return;
  renderDashProfile();
  renderFeatured();
  renderOwnerPosts();
  renderAnswerList();
}

/* ── A. Profile card ──────────────────────────────────────── */

function renderDashProfile() {
  const cafe = ownerCafe();
  const img = $id("dash-banner-img");
  const has = !!cafe.backgroundPhoto;
  img.hidden = !has;
  if (has) {
    img.src = cafe.backgroundPhoto;
    img.alt = `${cafe.name} background photo`;
  } else {
    img.removeAttribute("src");
    img.alt = "";
  }
  $id("dash-banner").classList.toggle("no-bg", !has);
  $id("bg-change-label").textContent = has ? "Change background" : "Add a background photo";
  $id("bg-remove").hidden = !has;

  const tile = $id("dash-tile");
  if (cafe.logo) {
    tile.className = "tile dash-logo tile-logo";
    tile.innerHTML = `<img src="${esc(cafe.logo)}" alt="${esc(cafe.name)} logo" />`;
  } else {
    tile.className = "tile dash-logo";
    tile.setAttribute("aria-hidden", "true");
    tile.textContent = cafeInitials(cafe);
  }
  $id("dash-name").textContent = cafe.name;
  $id("dash-kind").hidden = !cafe.kind;
  $id("dash-kind").textContent = cafe.kind || "";
  $id("dash-address").textContent = cafe.address;

  // Only tracked numbers. "People getting alerts" needs a backend that
  // counts every customer's alerts, so it is not shown yet.
  const live = getAnyPosts().filter((p) => p.cafeId === cafe.id && postStatus(p) === "live").length;
  const stats = [[String(live), live === 1 ? "live post" : "live posts"]];
  if (cafe.rating) stats.push([String(cafe.rating), cafe.reviews ? `rating · ${cafe.reviews} reviews` : "rating"]);
  $id("dash-stats").innerHTML = stats
    .map(([n, label]) => `<div class="dash-stat"><dt>${esc(label)}</dt><dd>${esc(n)}</dd></div>`)
    .join("");
}

function showError(id, message) {
  const el = $id(id);
  el.textContent = message || "";
  el.hidden = !message;
}

async function onBackgroundFile(input) {
  const file = input.files && input.files[0];
  input.value = "";
  if (!file) return;
  const src = await resizePhoto(file, BACKGROUND_MAX_WIDTH);
  if (!src) {
    showError("bg-error", "That file could not be read as an image.");
    return;
  }
  if (!saveCafeEdit(OWNER_CAFE_ID, { backgroundPhoto: src })) {
    showError("bg-error", PHOTO_FULL_MESSAGE);
    return;
  }
  showError("bg-error", "");
  renderDashProfile();
  $id("bg-change").focus();
  showToast("Background photo updated");
}

function removeBackground() {
  if (!saveCafeEdit(OWNER_CAFE_ID, { backgroundPhoto: null })) return;
  showError("bg-error", "");
  renderDashProfile();
  $id("bg-change").focus();
  showToast("Background photo removed");
}

// "Edit page": the page's look is set by the background and featured photos
function editPage() {
  $id("dash-banner").scrollIntoView({ block: "start", behavior: "smooth" });
  $id("bg-change").focus({ preventScroll: true });
  showToast("Change your background here and your featured photos below.");
}

function viewAsCustomer() {
  openCafe(OWNER_CAFE_ID);
}

/* ── B. Featured photos ───────────────────────────────────── */

function featuredList() {
  return (ownerCafe().featuredPhotos || []).slice(0, FEATURED_MAX);
}

function renderFeatured() {
  const cafe = ownerCafe();
  const list = featuredList();
  $id("feat-count").textContent = `${list.length} of ${FEATURED_MAX} · shown at the top of your page`;
  const row = $id("feat-row");
  row.innerHTML =
    list
      .map((src, i) => {
        const n = i + 1;
        return `
      <li class="feat-tile" draggable="true" data-index="${i}">
        <img src="${esc(src)}" alt="${esc(cafe.name)} featured photo ${n}" draggable="false" />
        ${i === 0 ? '<span class="feat-first">Shown first</span>' : ""}
        <span class="feat-btns">
          <button class="mini-round" type="button" data-action="feat-left" data-index="${i}"
            aria-label="Move featured photo ${n} left" ${i === 0 ? "disabled" : ""}>${ico("chevron", "sm")}</button>
          <button class="mini-round flip" type="button" data-action="feat-right" data-index="${i}"
            aria-label="Move featured photo ${n} right" ${i === list.length - 1 ? "disabled" : ""}>${ico("chevron", "sm")}</button>
          <button class="mini-round" type="button" data-action="feat-remove" data-index="${i}"
            aria-label="Remove featured photo ${n}">${ico("close", "sm")}</button>
        </span>
      </li>`;
      })
      .join("") +
    (list.length < FEATURED_MAX
      ? `<li class="feat-add-item"><button class="feat-add" type="button" data-action="feat-add">
          ${ico("camera")}<span>Add featured photo</span></button></li>`
      : "");
}

function saveFeatured(list, focusSelector) {
  if (!saveCafeEdit(OWNER_CAFE_ID, { featuredPhotos: list })) {
    showError("feat-error", PHOTO_FULL_MESSAGE);
    return false;
  }
  showError("feat-error", "");
  renderFeatured();
  if (focusSelector) {
    const el = document.querySelector(focusSelector);
    if (el && !el.disabled) el.focus();
    else (document.querySelector("#feat-row button:not([disabled])") || $id("feat-h")).focus();
  }
  return true;
}

function moveFeatured(from, to, focusAction) {
  const list = featuredList();
  if (to < 0 || to >= list.length || from === to) return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
  saveFeatured(list, focusAction ? `#feat-row [data-action="${focusAction}"][data-index="${to}"]` : null);
}

function removeFeatured(i) {
  const list = featuredList();
  list.splice(i, 1);
  saveFeatured(
    list,
    `#feat-row [data-action="feat-remove"][data-index="${Math.min(i, list.length - 1)}"], #feat-row .feat-add`,
  );
}

async function onFeaturedFiles(input) {
  const files = Array.from(input.files || []);
  input.value = "";
  const list = featuredList();
  const room = FEATURED_MAX - list.length;
  const results = (await Promise.all(files.slice(0, room).map((f) => resizePhoto(f, PHOTO_MAX_WIDTH)))).filter(Boolean);
  if (!results.length) {
    if (files.length) showError("feat-error", "Those files could not be read as images.");
    return;
  }
  if (!saveFeatured([...list, ...results], "#feat-row .feat-add")) return;
  if (files.length > room)
    showError("feat-error", `You can feature up to ${FEATURED_MAX} photos, so ${files.length - room} ${files.length - room === 1 ? "was" : "were"} not added.`);
  showToast(results.length === 1 ? "Featured photo added" : `${results.length} featured photos added`);
}

// Drag to reorder (the Move buttons do the same for keyboard users)
let dragFrom = null;
function bindFeaturedDrag(root) {
  root.addEventListener("dragstart", (e) => {
    const tile = e.target.closest && e.target.closest(".feat-tile");
    if (!tile) return;
    dragFrom = Number(tile.dataset.index);
    tile.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(dragFrom));
  });
  root.addEventListener("dragover", (e) => {
    if (dragFrom !== null && e.target.closest && e.target.closest(".feat-tile")) e.preventDefault();
  });
  root.addEventListener("drop", (e) => {
    const tile = e.target.closest && e.target.closest(".feat-tile");
    if (!tile || dragFrom === null) return;
    e.preventDefault();
    const to = Number(tile.dataset.index);
    const from = dragFrom;
    dragFrom = null;
    moveFeatured(from, to);
  });
  root.addEventListener("dragend", () => {
    dragFrom = null;
    root.querySelectorAll(".feat-tile.dragging").forEach((t) => t.classList.remove("dragging"));
  });
}

/* ── C. Your posts ────────────────────────────────────────── */

function ownerPostsByStatus() {
  const groups = { live: [], draft: [], ended: [] };
  getAnyPosts()
    .filter((p) => p.cafeId === OWNER_CAFE_ID)
    .forEach((p) => groups[postStatus(p)].push(p));
  groups.live.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)); // pinned first
  return groups;
}

function keepCount(post) {
  return (post.keeps || 0) + (inState("keeps", post.id) ? 1 : 0);
}

function setPostsTab(tab, focus = false) {
  postsTab = tab;
  document.querySelectorAll(".posts-tabs [role=tab]").forEach((t) => {
    const on = t.dataset.tab === tab;
    t.classList.toggle("on", on);
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    if (on && focus) t.focus();
  });
  $id("posts-panel").setAttribute("aria-labelledby", `tab-${tab}`);
  renderOwnerPosts();
}

// Arrow keys move between the tabs
function onTabsKey(e) {
  const tabs = Array.from(document.querySelectorAll(".posts-tabs [role=tab]"));
  const i = tabs.indexOf(document.activeElement);
  if (i < 0) return;
  let j = null;
  if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
  if (e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
  if (e.key === "Home") j = 0;
  if (e.key === "End") j = tabs.length - 1;
  if (j === null) return;
  e.preventDefault();
  setPostsTab(tabs[j].dataset.tab, true);
}

const STATUS_LABEL = { live: "Live", draft: "Draft", ended: "Ended" };

function postThumbHTML(post) {
  const photo = postPhotos(post)[0];
  if (photo)
    return `<span class="dpost-thumb"><img src="${esc(photo.src)}" alt="" loading="lazy" /></span>`;
  if (post.type === "event") {
    const d = postData(post);
    return `<span class="dpost-thumb stub"><span class="stub-day">${esc(d.day || "—")}</span>${d.time ? `<span class="stub-time">${esc(d.time)}</span>` : ""}</span>`;
  }
  const icon = { hiring: "briefcase", promo: "tag", photos: "camera", new: "spark" }[post.type] || "spark";
  return `<span class="dpost-thumb icon">${ico(icon)}</span>`;
}

function renderOwnerPosts() {
  const groups = ownerPostsByStatus();
  ["live", "draft", "ended"].forEach((k) => ($id("n-" + k).textContent = groups[k].length));
  const list = groups[postsTab];
  const panel = $id("posts-panel");
  if (!list.length) {
    panel.innerHTML = '<div class="empty">Nothing here yet. Posts you publish show up in this list.</div>';
    return;
  }
  panel.innerHTML = list
    .map((p) => {
      const type = POST_TYPES[p.type];
      const status = postStatus(p);
      const live = status === "live";
      return `
      <article class="card dpost" data-own="${esc(p.id)}">
        ${postThumbHTML(p)}
        <div class="dpost-body">
          <div class="dpost-tags">
            ${p.pinned && live ? '<span class="pin-chip">Pinned</span>' : ""}
            <span class="tag-chip ${type.cls}">${type.label}</span>
            <span class="status-chip status-${status}">${STATUS_LABEL[status]}</span>
            <span class="dpost-time">${agoHTML(p.time)}${p.editedAt ? " · Edited" : ""}</span>
          </div>
          <h3 class="dpost-title">${esc(postHeadline(p))}</h3>
          ${p.caption ? `<p class="dpost-cap" data-caption="${esc(p.caption)}"></p>` : ""}
          <dl class="dpost-nums">
            <div><dt>Sips</dt><dd>${sipCount(p)}</dd></div>
            <div><dt>Comments</dt><dd>${commentCount(p)}</dd></div>
            <div><dt>Keeps</dt><dd>${keepCount(p)}</dd></div>
          </dl>
          <div class="dpost-acts">
            <button class="btn btn-ghost" data-action="post-edit">Edit</button>
            ${live ? `<button class="btn btn-ghost pin-btn${p.pinned ? " on" : ""}" data-action="post-pin" aria-pressed="${!!p.pinned}">${p.pinned ? "Pinned to top" : "Pin to top"}</button>` : ""}
            ${live ? '<button class="btn btn-ghost" data-action="post-end">End post</button>' : ""}
            <button class="btn btn-ghost danger" data-action="post-delete">Delete</button>
          </div>
        </div>
      </article>`;
    })
    .join("");
  // Captions are user text: textContent only (links stay plain here)
  panel.querySelectorAll(".dpost-cap").forEach((el) => fillCaption(el));
}

function ownPostFrom(el) {
  const card = el.closest(".dpost");
  return { card, post: card && getPost(card.dataset.own) };
}

function focusPostAction(postId, action) {
  const el = document.querySelector(`.dpost[data-own="${postId}"] [data-action="${action}"]`);
  if (el) el.focus();
  else $id("posts-h").focus();
}

function pinPost(btn) {
  const { post } = ownPostFrom(btn);
  if (!post) return;
  const on = !post.pinned;
  if (!setPinned(post.id, on)) return;
  renderOwnerPosts();
  renderPostViews();
  focusPostAction(post.id, "post-pin");
  showToast(on ? "Pinned to the top of your page" : "Unpinned");
}

function endPost(btn) {
  const { post } = ownPostFrom(btn);
  if (!post) return;
  if (!updatePost(post.id, { status: "ended", endedAt: Date.now(), pinned: false })) return;
  renderPostViews();
  renderDashboard();
  $id("posts-h").focus();
  showToast("Post ended. Find it under Ended.");
}

function askDeletePost(btn) {
  const { card } = ownPostFrom(btn);
  if (!card) return;
  const id = card.dataset.own;
  card.querySelector(".dpost-acts").innerHTML = `
    <p class="confirm-text" id="confirm-${esc(id)}">Delete this post?</p>
    <button class="btn btn-ghost" data-action="post-cancel-delete">Keep it</button>
    <button class="btn danger-fill" data-action="post-confirm-delete" aria-describedby="confirm-${esc(id)}">Delete</button>`;
  card.querySelector('[data-action="post-cancel-delete"]').focus();
}

function confirmDeletePost(btn) {
  const { post } = ownPostFrom(btn);
  if (!post) return;
  removePost(post.id);
  renderPostViews();
  renderDashboard();
  $id("posts-h").focus();
  showToast("Post deleted");
}

function cancelDeletePost(btn) {
  const { post } = ownPostFrom(btn);
  renderOwnerPosts();
  if (post) focusPostAction(post.id, "post-delete");
}

/* ── D. Comments to answer ────────────────────────────────── */

// Customer comments on this café's posts with no café reply after them
function commentsToAnswer() {
  const cafe = ownerCafe();
  const own = new Map(getAnyPosts().filter((p) => p.cafeId === cafe.id).map((p) => [p.id, p]));
  return userState.comments
    .filter((c) => own.has(c.postId) && c.authorName !== cafe.name)
    .filter(
      (c) =>
        !userState.comments.some(
          (r) => r.postId === c.postId && r.authorName === cafe.name && r.createdAt > c.createdAt,
        ),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8)
    .map((c) => ({ comment: c, post: own.get(c.postId) }));
}

function renderAnswerList() {
  const list = $id("answer-list");
  const items = commentsToAnswer();
  list.replaceChildren();
  if (!items.length) {
    const li = document.createElement("li");
    li.className = "answer-empty";
    li.textContent = "No comments waiting for a reply.";
    list.append(li);
    return;
  }
  items.forEach(({ comment, post }) => {
    // Comments are user text: built with textContent only
    const li = document.createElement("li");
    li.className = "answer-item";
    const who = document.createElement("strong");
    who.textContent = comment.authorName;
    const text = document.createElement("span");
    text.className = "answer-text";
    text.textContent = " " + comment.text;
    const on = document.createElement("span");
    on.className = "answer-on";
    on.textContent = "On " + postHeadline(post);
    const btn = document.createElement("button");
    btn.className = "btn btn-ghost";
    btn.dataset.action = "reply-comment";
    btn.dataset.post = post.id;
    btn.textContent = "Reply";
    btn.setAttribute("aria-label", `Reply to ${comment.authorName} on ${postHeadline(post)}`);
    const p = document.createElement("p");
    p.append(who, text);
    li.append(p, on, btn);
    list.append(li);
  });
}

// Open that post's comment thread on the board
function replyToComment(btn) {
  const post = getPost(btn.dataset.post);
  if (!post || postStatus(post) !== "live") {
    showToast("That post is no longer on the board.");
    return;
  }
  const cafe = getCafe(post.cafeId);
  if (getSelectedPlace().name !== cafe.city) setSelectedPlace(cafe.city);
  quickFilter("all");
  showPanel("home");
  const card = document.querySelector(`#feed .post[data-post="${post.id}"]`);
  if (!card) return;
  card.scrollIntoView({ block: "center" });
  const pill = card.querySelector(".comment-pill");
  if (pill.getAttribute("aria-expanded") !== "true") toggleThread(pill);
  else card.querySelector(".thread-form input").focus();
}

/* ── Composer: open, fill for editing, close ──────────────── */

function to24h(label) {
  const m = /^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i.exec((label || "").trim());
  if (!m) return "";
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${m[2] || "00"}`;
}

function openComposer(postId) {
  const post = postId ? getPost(postId) : null;
  editingId = post ? post.id : null;
  resetDraft();
  if (post) {
    annType(document.querySelector(`.ann-type[data-type="${post.type}"]`));
    const d = postData(post);
    const set = (id, v) => ($id(id).value = v || "");
    if (post.type === "new") {
      set("ann-item", d.item);
      set("ann-new-price", d.price);
      set("ann-avail", d.availability);
    }
    if (post.type === "promo") {
      set("ann-promo-title", d.title);
      set("ann-offer", d.offer);
      set("ann-until", d.validUntil);
    }
    if (post.type === "event") {
      set("ann-event-title", d.title);
      set("ann-date", d.date);
      set("ann-time", to24h(d.time));
      set("ann-price", d.price);
    }
    if (post.type === "hiring") {
      set("ann-role", d.role);
      set("ann-schedule", d.schedule);
      set("ann-perks", d.perks);
    }
    set("ann-text", post.caption);
    draftPhotos = postPhotos(post).map((ph) => ({ src: ph.src, alt: ph.alt || "" }));
  } else {
    annType(document.querySelector('.ann-type[data-type="new"]'));
  }
  clearComposerErrors();
  renderThumbs();
  updateAnnPreview();
  $id("compose-title").textContent = post ? (post.status === "draft" ? "Edit draft" : "Edit post") : "Post an update";
  $id("owner-home").hidden = true;
  $id("owner-compose").hidden = false;
  window.scrollTo({ top: 0 });
  $id("compose-title").focus();
}

function editOwnPost(btn) {
  const { post } = ownPostFrom(btn);
  if (post) openComposer(post.id);
}

// Back to the dashboard, on the right tab, focused on the post
function closeComposer(tab, postId) {
  const editedId = editingId;
  editingId = null;
  resetDraft();
  clearComposerErrors();
  showDashboard();
  if (tab) setPostsTab(tab);
  window.scrollTo({ top: 0 });
  const focusId = postId || editedId;
  if (focusId) focusPostAction(focusId, "post-edit");
  else $id("compose-new").focus();
}

function cancelComposer() {
  closeComposer(null, null);
}
