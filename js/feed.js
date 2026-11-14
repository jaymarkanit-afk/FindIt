/* ═══════════════════════════════════════════════════════════════
   FEED — renders everything that comes from the posts array:
   home feed, "Fresh right now", alerts, saved page, sidebar
   ═══════════════════════════════════════════════════════════════ */

function sipLabel(count) {
  return count === 1 ? "sip" : "sips";
}

function sipCount(post) {
  return (post.sips || 0) + (inState("sips", post.id) ? 1 : 0);
}

function alertButtonHTML(cafe) {
  const on = inState("alerts", cafe.id);
  return `
    <button class="alert-btn${on ? " on" : ""}" data-cafe="${cafe.id}"
      aria-pressed="${on}" onclick="toggleFollow(this)">
      ${ico("bell", "sm")}<span class="alert-label">${on ? "Alerts on" : "Get alerts"}</span>
    </button>`;
}

// One feed card. `preview: true` renders a non-interactive copy for Owner.
function postCardHTML(post, opts) {
  const preview = opts && opts.preview;
  const cafe = getCafe(post.cafeId);
  if (!cafe) return "";
  const type = POST_TYPES[post.type] || POST_TYPES.new;
  const details = postDetails(post);
  const street = cafe.address.split(",")[0];
  const photo = post.photo || cafe.img;

  // Inset row with a dark button — events and jobs only
  let inset = "";
  if (post.type === "event" || post.type === "hiring") {
    const done = inState("cta", post.id);
    const isEvent = post.type === "event";
    const insetTitle = isEvent
      ? (post.event && post.event.title) || post.title
      : (post.job && post.job.role) || post.title;
    const label = isEvent
      ? done
        ? "Reminder set"
        : "Remind me"
      : done
        ? "Interest sent"
        : "Apply";
    inset = `
      <div class="post-inset">
        <div>
          <div class="inset-title">${esc(insetTitle)}</div>
          ${details ? `<div class="inset-info">${esc(details)}</div>` : ""}
        </div>
        <button class="btn btn-dark${done ? " done" : ""}" aria-pressed="${done}"
          onclick="postCta(this, '${post.id}')">${label}</button>
      </div>`;
  }

  const sipped = inState("sips", post.id);
  const kept = inState("keeps", post.id);
  const count = sipCount(post);

  return `
    <article class="post" data-post="${post.id}">
      <header class="post-head">
        <button class="post-cafe" onclick="openCafe(${cafe.id})"
          aria-label="Open ${esc(cafe.name)}">
          ${cafeTile(cafe)}
          <span class="post-cafe-text">
            <span class="post-name">${esc(cafe.name)}</span>
            <span class="post-street">${esc(street)}</span>
          </span>
        </button>
        ${alertButtonHTML(cafe)}
      </header>
      <div class="post-photo">
        <img src="${esc(photo)}" alt="${esc(type.label + " at " + cafe.name)}" loading="lazy" />
        <span class="tag-chip ${type.cls}">${type.label}<span class="dot">·</span>${agoHTML(post.time)}</span>
      </div>
      <p class="post-caption">${esc(post.caption)}${
        post.type === "promo" && details
          ? `<span class="muted">${esc(details)}</span>`
          : ""
      }</p>
      ${inset}
      <footer class="post-actions">
        <button class="pill sip${sipped ? " on" : ""}" aria-pressed="${sipped}" onclick="bumpRxn(this)">
          ${ico("cup", "sm")}<span><span class="rxn-n">${count}</span> <span class="rxn-l">${sipLabel(count)}</span></span>
        </button>
        <button class="pill keep${kept ? " on" : ""}" ${preview ? "" : `id="keep-${post.id}"`}
          aria-pressed="${kept}" onclick="doSave('keep-${post.id}', event)">
          ${ico("bookmark", "sm fillable")}<span class="keep-label">${kept ? "Kept" : "Keep"}</span>
        </button>
        <button class="round-btn" aria-label="Share this update" onclick="sharePost('${post.id}')">
          ${ico("share")}
        </button>
      </footer>
    </article>`;
}

/* ── Home feed ────────────────────────────────────────────── */

// Feed filter → post type. Other filters only narrow by café.
const FILTER_POST_TYPE = {
  findItNew: "new",
  findItEvents: "event",
  findItJob: "hiring",
};

function getFilteredPosts() {
  const cafeIds = new Set(getFilteredCafes().map((c) => c.id));
  const type = FILTER_POST_TYPE[currentFilter];
  return getAllPosts().filter(
    (p) => cafeIds.has(p.cafeId) && (!type || p.type === type),
  );
}

function renderFeed() {
  const feed = document.getElementById("feed");
  if (!feed) return;
  const list = getFilteredPosts();
  feed.innerHTML = list.length
    ? list.map((p) => postCardHTML(p)).join("")
    : '<div class="empty">No updates match this filter yet.</div>';
}

/* ── "Fresh right now" strip: latest post per café ────────── */

function renderFreshStrip() {
  const strip = document.getElementById("fresh-strip");
  if (!strip) return;
  const seen = new Set();
  const latest = getAllPosts().filter((p) => {
    if (seen.has(p.cafeId) || !getCafe(p.cafeId)) return false;
    seen.add(p.cafeId);
    return true;
  });
  strip.innerHTML = latest
    .slice(0, 8)
    .map((p) => {
      const cafe = getCafe(p.cafeId);
      return `
      <button class="fresh-card" onclick="openCafe(${cafe.id})">
        <span class="fresh-top">${cafeTile(cafe, "sm")}<span class="fresh-time">${agoHTML(p.time)}</span></span>
        <span class="fresh-what">${esc(p.title)}</span>
        <span class="fresh-name">${esc(cafe.name)}</span>
      </button>`;
    })
    .join("");
}

/* ── Alerts: posts from cafés the user gets alerts for ────── */

function getAlertPosts() {
  return getAllPosts().filter((p) => inState("alerts", p.cafeId));
}

function updateNotifBadge() {
  const badge = document.getElementById("notif-badge");
  if (!badge) return;
  const unread = getAlertPosts().filter((p) => !inState("seen", p.id)).length;
  badge.hidden = unread === 0;
  badge.textContent = unread > 9 ? "9+" : String(unread);
  const btn = badge.closest("button");
  if (btn)
    btn.setAttribute(
      "aria-label",
      unread ? `Alerts, ${unread} new` : "Alerts",
    );
}

function renderNotifications() {
  const list = document.getElementById("notif-list");
  if (!list) return;
  const items = getAlertPosts().slice(0, 8);
  if (!items.length) {
    list.innerHTML =
      '<div class="empty">Tap "Get alerts" on a café to see its updates here.</div>';
    return;
  }
  list.innerHTML = items
    .map((p) => {
      const cafe = getCafe(p.cafeId);
      const type = POST_TYPES[p.type] || POST_TYPES.new;
      const unread = !inState("seen", p.id);
      return `
      <button class="notif-row${unread ? " unread" : ""}" onclick="closeNotif(); openCafe(${cafe.id})">
        ${cafeTile(cafe, "sm")}
        <span class="notif-body">
          <span class="notif-n">${esc(cafe.name)}</span>
          <span class="notif-m">${esc(p.title)}</span>
          <span class="notif-t">${type.label} · ${agoHTML(p.time)}${unread ? " · New" : ""}</span>
        </span>
      </button>`;
    })
    .join("");
}

function markAlertsSeen() {
  getAlertPosts().forEach((p) => {
    if (!inState("seen", p.id)) userState.seen.push(p.id);
  });
  saveStore("seen", userState.seen);
  updateNotifBadge();
}

/* ── Saved page ───────────────────────────────────────────── */

function cafeRowHTML(cafe, chip) {
  return `
    <button class="rec-row" onclick="openCafe(${cafe.id})">
      <img class="rec-thumb" src="${esc(cafe.img)}" alt="" loading="lazy" />
      <span class="rec-info">
        <span class="rec-name">${esc(cafe.name)}</span>
        <span class="rec-sub">${esc(cafe.address)}</span>
      </span>
      ${chip ? `<span class="rec-chip">${esc(chip)}</span>` : ""}
    </button>`;
}

function renderSaved() {
  const cafesEl = document.getElementById("saved-cafes");
  const postsEl = document.getElementById("saved-posts");
  if (!cafesEl || !postsEl) return;

  const cafes = userState.savedCafes.map(getCafe).filter(Boolean);
  cafesEl.innerHTML = cafes.length
    ? cafes.map((c) => cafeRowHTML(c, c.rating + " rating")).join("")
    : '<div class="empty">No saved cafés yet. Tap the bookmark on a café\'s page.</div>';

  const kept = getAllPosts().filter((p) => inState("keeps", p.id));
  postsEl.innerHTML = kept.length
    ? kept
        .map((p) => {
          const cafe = getCafe(p.cafeId);
          const type = POST_TYPES[p.type] || POST_TYPES.new;
          return `
          <button class="rec-row" onclick="openCafe(${cafe.id})">
            <img class="rec-thumb" src="${esc(p.photo || cafe.img)}" alt="" loading="lazy" />
            <span class="rec-info">
              <span class="rec-name">${esc(p.title)}</span>
              <span class="rec-sub">${esc(cafe.name)} · ${agoHTML(p.time)}</span>
            </span>
            <span class="tag-chip ${type.cls}">${type.label}</span>
          </button>`;
        })
        .join("")
    : '<div class="empty">Nothing kept yet. Tap "Keep" on an update in the feed.</div>';
}

/* ── Desktop sidebar: events and jobs ─────────────────────── */

function renderSidebar() {
  const fill = (elId, type, emptyText) => {
    const el = document.getElementById(elId);
    if (!el) return;
    const items = getAllPosts()
      .filter((p) => p.type === type)
      .slice(0, 4);
    el.innerHTML = items.length
      ? items
          .map((p) => {
            const cafe = getCafe(p.cafeId);
            const heading =
              type === "event"
                ? (p.event && p.event.title) || p.title
                : (p.job && p.job.role) || p.title;
            const sub = [cafe.name, postDetails(p)].filter(Boolean).join(" · ");
            return `
            <button class="side-item" onclick="openCafe(${cafe.id})">
              <span class="side-item-title">${esc(heading)}</span>
              <span class="side-item-sub">${esc(sub)}</span>
            </button>`;
          })
          .join("")
      : `<div class="empty">${emptyText}</div>`;
  };
  fill("side-events", "event", "No events posted yet.");
  fill("side-jobs", "hiring", "No openings posted yet.");
}

// Re-render everything that depends on posts (after publish, on startup)
function renderPostViews() {
  renderFreshStrip();
  renderFeed();
  renderSidebar();
  renderSaved();
  renderNotifications();
  updateNotifBadge();
}
