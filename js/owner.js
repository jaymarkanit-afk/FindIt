/* ═══════════════════════════════════════════════════════════════
   OWNER — sign-in gate, the "Post an update" composer, and the
   owner's own posts (edit caption, delete)
   ═══════════════════════════════════════════════════════════════ */

const OWNER_CAFE_ID = 1; // the demo owner posts as Paramount Coffee
const PHOTO_MAX_WIDTH = 1200;
const PHOTO_QUALITY = 0.8;
const CAPTION_WARN_AT = CAPTION_MAX - 20; // counter turns to the warning colour

let draftPhotos = []; // [{ src (data URL), alt }] — first is the main photo

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
  $id("owner-gate").style.display = "none";
  $id("owner-dash").style.display = "block";
  annType(document.querySelector(".ann-type.on"));
  renderMyPosts();
  showToast("Welcome back!");
}

function ownerLogout() {
  $id("owner-gate").style.display = "block";
  $id("owner-dash").style.display = "none";
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

// Resize in the browser: at most 1200px wide, JPEG ~80%
function resizePhoto(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(null);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(null);
      img.onload = () => {
        const scale = Math.min(1, PHOTO_MAX_WIDTH / img.width);
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
  const results = await Promise.all(take.map(resizePhoto));
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
  const post = {
    id: "o" + Date.now(),
    cafeId: OWNER_CAFE_ID,
    type,
    time: Date.now(),
    sips: 0,
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
        : "",
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
    need(d.date, "ann-date", "Add the event date.");
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
  if (target.classList.contains("edit-cap")) {
    const box = target.closest(".my-post");
    updateCounter(target, box.querySelector(".char-count"));
    return;
  }
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

  userState.ownerPosts.unshift(post);
  if (!saveStore("ownerPosts", userState.ownerPosts)) {
    userState.ownerPosts.shift(); // undo; the draft stays untouched
    $id("ann-error").textContent = STORAGE_FULL_MESSAGE;
    $id("ann-error").hidden = false;
    $id("ann-error").scrollIntoView({ block: "center" });
    return;
  }

  // "Send alerts now" off → the post skips the Alerts badge
  const alertNow = $id("ann-alert").checked;
  if (!alertNow) {
    userState.seen.push(post.id);
    saveStore("seen", userState.seen);
  }

  resetDraft();
  renderPostViews();
  renderMyPosts();
  showPublishBar(
    alertNow
      ? "On the board. People with alerts on were notified."
      : "On the board.",
  );
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

/* ── Your posts: edit the caption, delete ─────────────────── */

function ownPosts() {
  return userState.ownerPosts
    .filter((p) => p.cafeId === OWNER_CAFE_ID)
    .sort((a, b) => b.time - a.time);
}

function renderMyPosts() {
  const box = $id("my-posts");
  if (!box) return;
  const list = ownPosts();
  if (!list.length) {
    box.innerHTML =
      '<div class="empty">Posts you publish show here, so you can edit their caption or delete them.</div>';
    return;
  }
  box.innerHTML = list
    .map((p) => {
      const type = POST_TYPES[p.type];
      return `
      <article class="card my-post" data-own="${esc(p.id)}">
        <div class="my-post-head">
          <span class="tag-chip ${type.cls}">${type.label}</span>
          <strong class="my-post-title">${esc(postHeadline(p))}</strong>
          <span class="my-post-time">${agoHTML(p.time)}${p.editedAt ? " · Edited" : ""}</span>
        </div>
        <div class="my-post-body">
          ${captionHTML(p, "mine") || '<p class="muted">No caption.</p>'}
        </div>
        <div class="my-post-acts">
          <button class="btn btn-ghost" data-action="edit-caption">Edit caption</button>
          <button class="btn btn-ghost danger" data-action="delete-post">Delete</button>
        </div>
      </article>`;
    })
    .join("");
  hydrateCaptions(box);
}

function ownPostFor(el) {
  const card = el.closest(".my-post");
  const post = card && userState.ownerPosts.find((p) => p.id === card.dataset.own);
  return { card, post };
}

function editCaption(btn) {
  const { card, post } = ownPostFor(btn);
  if (!post) return;
  const id = `edit-${post.id}`;
  card.querySelector(".my-post-body").innerHTML = `
    <div class="fg">
      <div class="fg-row">
        <label for="${id}">Caption ${post.type === "photos" ? '<span class="req">(optional)</span>' : ""}</label>
        <span class="char-count" id="${id}-count"></span>
      </div>
      <textarea class="fi caption-input edit-cap" id="${id}" maxlength="${CAPTION_MAX}"
        aria-describedby="${id}-count ${id}-error"></textarea>
      <p class="field-error" id="${id}-error" hidden></p>
    </div>`;
  card.querySelector(".my-post-acts").innerHTML = `
    <button class="btn btn-accent" data-action="save-caption">Save</button>
    <button class="btn btn-ghost" data-action="cancel-caption">Cancel</button>`;
  const area = $id(id);
  area.value = post.caption || "";
  updateCounter(area, $id(id + "-count"));
  area.focus();
}

function saveCaption(btn) {
  const { card, post } = ownPostFor(btn);
  if (!post) return;
  const area = card.querySelector(".edit-cap");
  const text = area.value.replace(/^\s+|\s+$/g, "");
  if (post.type !== "photos" && text.length < CAPTION_MIN) {
    setFieldError(area.id, text ? `The caption needs at least ${CAPTION_MIN} characters.` : "Add a caption.");
    area.focus();
    return;
  }
  const before = { caption: post.caption, editedAt: post.editedAt };
  post.caption = text;
  post.editedAt = Date.now();
  if (!saveStore("ownerPosts", userState.ownerPosts)) {
    Object.assign(post, before);
    setFieldError(area.id, "The change could not be saved: storage in this browser is full.");
    return;
  }
  renderPostViews();
  renderMyPosts();
  focusOwnPost(post.id, "edit-caption");
  showToast("Caption updated");
}

function focusOwnPost(postId, action) {
  const btn = document.querySelector(`.my-post[data-own="${postId}"] [data-action="${action}"]`);
  if (btn) btn.focus();
}

function cancelCaption(btn) {
  const { post } = ownPostFor(btn);
  renderMyPosts();
  if (post) focusOwnPost(post.id, "edit-caption");
}

function deletePost(btn) {
  const { card } = ownPostFor(btn);
  if (!card) return;
  card.querySelector(".my-post-acts").innerHTML = `
    <p class="confirm-text" id="confirm-${esc(card.dataset.own)}">Delete this post? It is removed from the board.</p>
    <button class="btn btn-dark danger-fill" data-action="confirm-delete"
      aria-describedby="confirm-${esc(card.dataset.own)}">Delete post</button>
    <button class="btn btn-ghost" data-action="cancel-delete">Keep it</button>`;
  card.querySelector('[data-action="cancel-delete"]').focus();
}

function confirmDelete(btn) {
  const { post } = ownPostFor(btn);
  if (!post) return;
  userState.ownerPosts = userState.ownerPosts.filter((p) => p.id !== post.id);
  saveStore("ownerPosts", userState.ownerPosts);
  // Forget everything tied to the deleted post
  ["keeps", "sips", "cta", "seen"].forEach((key) => {
    userState[key] = userState[key].filter((id) => id !== post.id);
    saveStore(key, userState[key]);
  });
  userState.comments = userState.comments.filter((c) => c.postId !== post.id);
  saveStore("comments", userState.comments);

  renderPostViews();
  renderMyPosts();
  $id("my-posts-h").focus();
  showToast("Post deleted");
}

function cancelDelete(btn) {
  const { post } = ownPostFor(btn);
  renderMyPosts();
  if (post) focusOwnPost(post.id, "delete-post");
}
