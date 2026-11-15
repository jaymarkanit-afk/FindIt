/* ═══════════════════════════════════════════════════════════════
   STORE — localStorage-backed user state + small shared helpers
   ═══════════════════════════════════════════════════════════════ */

const STORE_PREFIX = "findit.";

function loadStore(key, fallback) {
  try {
    const raw = localStorage.getItem(STORE_PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function saveStore(key, value) {
  try {
    localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.warn("Could not save " + key, e);
    return false;
  }
}

// Everything the user (or the demo owner) does that must survive a reload
const userState = {
  alerts: loadStore("alerts", [1, 2]), // café ids with alerts on
  keeps: loadStore("keeps", []), // kept post ids
  savedCafes: loadStore("savedCafes", []), // saved café ids
  sips: loadStore("sips", []), // post ids the user sipped
  cta: loadStore("cta", []), // post ids with reminder / interest set
  seen: loadStore("seen", []), // post ids already seen in Alerts
  ownerPosts: loadStore("ownerPosts", []), // posts published from Owner
  // Comments on posts. Same shape a backend will use later:
  // { id, postId, authorName, text, createdAt (ISO string) }
  comments: loadStore("comments", []),
};

// There are no customer accounts yet, so local comments are signed "Guest".
const LOCAL_AUTHOR_NAME = "Guest";
const COMMENT_MAX = 280;

function getComments(postId) {
  return userState.comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

// Returns the new comment, or null if the text is empty
function addComment(postId, text) {
  const clean = String(text || "").trim().slice(0, COMMENT_MAX);
  if (!clean) return null;
  const comment = {
    id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    postId,
    authorName: LOCAL_AUTHOR_NAME,
    text: clean,
    createdAt: new Date().toISOString(),
  };
  userState.comments.push(comment);
  saveStore("comments", userState.comments);
  return comment;
}

// Add or remove `id` from userState[key]; returns true if it is now in.
function toggleInState(key, id) {
  const list = userState[key];
  const idx = list.indexOf(id);
  if (idx === -1) list.push(id);
  else list.splice(idx, 1);
  saveStore(key, list);
  return idx === -1;
}

function inState(key, id) {
  return userState[key].includes(id);
}

/* ── Data access ──────────────────────────────────────────── */

function getCafe(id) {
  return cafeDatabase.find((c) => c.id === Number(id));
}

/* ── Selected place: the one source of truth ──────────────────
   Everything place-specific (home board, Near you, rail, map, search,
   distances, Brevi) reads getSelectedPlace(). setSelectedPlace() saves
   the choice and re-renders all of it. Saved items and alerts are never
   filtered by place.                                                 */

function placeByName(name) {
  return places.find((p) => p.name === name) || null;
}

function getSelectedPlace() {
  return placeByName(loadStore("place", DEFAULT_PLACE)) || placeByName(DEFAULT_PLACE) || places[0];
}

// The one helper for "cafés in this place"; use it instead of filtering by city
function cafesInPlace(place = getSelectedPlace()) {
  return cafeDatabase.filter((c) => c.city === place.name);
}

function setSelectedPlace(name) {
  const place = placeByName(name);
  if (!place) return;
  saveStore("place", place.name);
  if (typeof refreshForPlace === "function") refreshForPlace(); // place.js
}

// Owner posts + seed posts, newest first
function getAllPosts() {
  return [...userState.ownerPosts, ...posts].sort((a, b) => b.time - a.time);
}

function getPost(id) {
  return getAllPosts().find((p) => p.id === id);
}

const POST_TYPES = {
  new: { label: "New", cls: "tag-new" },
  photos: { label: "Photos", cls: "tag-photos" },
  event: { label: "Event", cls: "tag-event" },
  hiring: { label: "Hiring", cls: "tag-hiring" },
  promo: { label: "Promo", cls: "tag-promo" },
};

// How many photos each type may carry (and how many it needs)
const PHOTO_LIMITS = {
  new: { max: 4, min: 0 },
  photos: { max: 6, min: 1 },
  promo: { max: 1, min: 0 },
  event: { max: 1, min: 0 },
  hiring: { max: 0, min: 0 },
};

// Captions: the café's own words, separate from the structured fields
const CAPTION_MAX = 500;
const CAPTION_MIN = 3; // required for every type except "photos"

// The type-specific part of a post ({ item, … } for "new", and so on).
// "photos" posts have none (post.photos is their photo list).
function postData(post) {
  if (!post || post.type === "photos") return {};
  const d = post[post.type];
  return d && typeof d === "object" && !Array.isArray(d) ? d : {};
}

// A post's photos as [{ src, alt }]
function postPhotos(post) {
  if (!post) return [];
  if (Array.isArray(post.photos))
    return post.photos
      .map((p) => (typeof p === "string" ? { src: p } : p))
      .filter((p) => p && p.src);
  return post.photo ? [{ src: post.photo }] : []; // older saved posts
}

// Alt text: what the owner typed, otherwise "<Café name> photo N"
function postPhotoAlt(post, index) {
  const photo = postPhotos(post)[index];
  if (photo && photo.alt && photo.alt.trim()) return photo.alt.trim();
  const cafe = getCafe(post.cafeId);
  return `${cafe ? cafe.name : "Café"} photo ${index + 1}`;
}

// One-line name for a post: the menu item, event or promo title, or role.
// Photos posts use the first line of the caption, or "3 photos".
function postHeadline(post) {
  const d = postData(post);
  if (d.item || d.title || d.role) return d.item || d.title || d.role;
  if (post && post.type === "photos") {
    const first = (post.caption || "").trim().split("\n")[0];
    if (first) return first.length > 60 ? first.slice(0, 57).trim() + "…" : first;
    const n = postPhotos(post).length;
    return n === 1 ? "1 photo" : `${n} photos`;
  }
  return "Update";
}

// Owner posts saved by earlier versions of the app use older field names.
// Bring them to the current shape; drop anything that cannot be shown.
function normalizePost(p) {
  if (!p || !POST_TYPES[p.type] || !p.cafeId) return null;
  const post = { ...p };
  if (!Array.isArray(post.photos)) post.photos = postPhotos(p);
  delete post.photo;
  if (post.type === "hiring" && !post.hiring && post.job) post.hiring = post.job;
  const d = post.type === "photos" ? null : post[post.type];
  if (post.type !== "photos" && (!d || typeof d !== "object")) return null;
  if (typeof post.caption !== "string") post.caption = (d && d.description) || "";
  if (d) delete d.description;
  return post;
}

// "Sat, 21 Nov" from "2026-11-21"; "" when the date is missing or invalid
function formatShortDate(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return "";
  const d = new Date(iso + "T00:00");
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// "FRI 7 PM · Free" style detail line for a post, or "".
function postDetails(post) {
  const d = postData(post);
  const parts = {
    new: [d.price, d.availability],
    photos: [],
    event: [[d.day, d.time].filter(Boolean).join(" "), d.price],
    promo: [d.offer, d.validUntil && "Valid until " + formatShortDate(d.validUntil)],
    hiring: [d.schedule, d.perks],
  }[post.type];
  return (parts || []).filter(Boolean).join(" · ");
}

/* ── Opening hours (only when the data has them) ──────────── */

function minutesOf(hhmm) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

function clockLabel(hhmm) {
  const mins = minutesOf(hhmm);
  if (mins === null) return "";
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""} ${h < 12 ? "AM" : "PM"}`;
}

// { open: true|false, label } or null when the café has no hours
function openStatus(cafe, now = new Date()) {
  const h = cafe && cafe.hours;
  const open = h && minutesOf(h.open);
  const close = h && minutesOf(h.close);
  if (open === null || close === null || open === undefined) return null;
  const t = now.getHours() * 60 + now.getMinutes();
  const isOpen = close > open ? t >= open && t < close : t >= open || t < close;
  return isOpen
    ? { open: true, label: "Open now · Closes " + clockLabel(h.close) }
    : { open: false, label: "Closed · Opens " + clockLabel(h.open) };
}

// "7 AM – 9 PM, every day" for the Info card, or ""
function hoursLabel(cafe) {
  const h = cafe && cafe.hours;
  if (!h || minutesOf(h.open) === null || minutesOf(h.close) === null) return "";
  return `${clockLabel(h.open)} – ${clockLabel(h.close)}, every day`;
}

function cafeStreet(cafe) {
  return cafe.address.split(",")[0];
}

/* ── Formatting helpers ───────────────────────────────────── */

function esc(value) {
  return String(value == null ? "" : value).replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
}

function timeAgo(ts) {
  const mins = Math.max(0, Math.round((Date.now() - ts) / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return mins + " min ago";
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs + " hr ago";
  const days = Math.round(hrs / 24);
  if (days < 7) return days + (days === 1 ? " day ago" : " days ago");
  // Older than a week: show the date instead ("Nov 14")
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// A relative-time label that refreshTimeLabels() keeps up to date
function agoHTML(ts) {
  return `<time class="ago" data-time="${ts}" datetime="${new Date(ts).toISOString()}">${timeAgo(ts)}</time>`;
}

// Re-compute every "x min ago" label on the page (called once a minute)
function refreshTimeLabels() {
  document.querySelectorAll("time.ago[data-time]").forEach((el) => {
    const label = timeAgo(Number(el.dataset.time));
    if (el.textContent !== label) el.textContent = label;
  });
}

// Inline stroke icon from the sprite in findit.html
function ico(name, extraClass) {
  return `<svg class="ico${extraClass ? " " + extraClass : ""}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
}

// Rounded-square café tile with initials
function cafeInitials(cafe) {
  return cafe.name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

function cafeTile(cafe, size) {
  return `<span class="tile${size ? " " + size : ""}" aria-hidden="true">${esc(cafeInitials(cafe))}</span>`;
}

// Logo on a white tile when the café has one, otherwise initials on dark
function cafeLogoTile(cafe, size) {
  const cls = "tile" + (size ? " " + size : "");
  return cafe.logo
    ? `<span class="${cls} tile-logo" aria-hidden="true"><img src="${esc(cafe.logo)}" alt="" loading="lazy" /></span>`
    : cafeTile(cafe, size);
}

function openCafe(cafeId) {
  selectedCafeId = Number(cafeId);
  showPanel("profile");
}

// Owner posts saved by older versions are converted once, on load.
// Kept at the end of the file: it needs POST_TYPES and the helpers above.
userState.ownerPosts = userState.ownerPosts.map(normalizePost).filter(Boolean);
