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
};

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

// Owner posts + seed posts, newest first
function getAllPosts() {
  return [...userState.ownerPosts, ...posts].sort((a, b) => b.time - a.time);
}

function getPost(id) {
  return getAllPosts().find((p) => p.id === id);
}

const POST_TYPES = {
  new: { label: "New", cls: "tag-new" },
  event: { label: "Event", cls: "tag-event" },
  hiring: { label: "Hiring", cls: "tag-hiring" },
  promo: { label: "Promo", cls: "tag-promo" },
};

// "Friday, 7 PM · Free" style detail line for a post, or "".
function postDetails(post) {
  if (post.type === "event" && post.event)
    return [post.event.when, post.event.price].filter(Boolean).join(" · ");
  if (post.type === "hiring" && post.job) return post.job.schedule || "";
  if (post.type === "promo" && post.promo) return post.promo.until || "";
  return "";
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
  return days + (days === 1 ? " day ago" : " days ago");
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

function openCafe(cafeId) {
  selectedCafeId = Number(cafeId);
  showPanel("profile");
}
