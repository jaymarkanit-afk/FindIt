/* ═══════════════════════════════════════════════════════════════
   BOARD — renders everything that comes from the posts array:
   the "Today in Butuan" board and its cards, the "Near you" row,
   alerts, the Saved page and the right rail.

   Each update type has its own card shape (menu board, ticket, coupon,
   job card) and they all share one small footer.
   ═══════════════════════════════════════════════════════════════ */

function sipCount(post) {
  return (post.sips || 0) + (inState("sips", post.id) ? 1 : 0);
}

function commentCount(post) {
  return getComments(post.id).length;
}

/* ── Shared footer: café on the left, sip / comment / keep on the right ── */

function cardFooterHTML(post, cafe) {
  const status = openStatus(cafe);
  const meta = [status && status.label.split(" · ")[0], cafeStreet(cafe), cafe.distance + " km"]
    .filter(Boolean)
    .join(" · ");
  const sipped = inState("sips", post.id);
  const kept = inState("keeps", post.id);
  const threadId = `thread-${post.id}`;

  return `
    <footer class="card-foot">
      <button class="card-cafe" data-action="open-cafe" data-cafe="${cafe.id}">
        ${cafeLogoTile(cafe, "sm")}
        <span class="card-cafe-text">
          <span class="card-cafe-name">${esc(cafe.name)}</span>
          <span class="card-cafe-meta">${status && status.open ? '<span class="open-dot" aria-hidden="true"></span>' : ""}${esc(meta)}</span>
        </span>
      </button>
      <div class="card-acts">
        <button class="mini-pill sip${sipped ? " on" : ""}" data-action="sip" aria-pressed="${sipped}">
          ${ico("cup", "sm fillable")}<span class="sr-only">Sip,</span>
          <span class="rxn-n">${sipCount(post)}</span><span class="sr-only"> sips</span>
        </button>
        <button class="mini-pill comment-pill" data-action="toggle-thread"
          aria-expanded="false" aria-controls="${threadId}">
          ${ico("comment", "sm")}<span class="sr-only">Comments,</span>
          <span class="cmt-n">${commentCount(post)}</span>
        </button>
        <button class="mini-round keep${kept ? " on" : ""}" data-action="keep"
          aria-pressed="${kept}" aria-label="Keep">
          ${ico("bookmark", "sm fillable")}
        </button>
      </div>
    </footer>
    <div class="thread" id="${threadId}" hidden>
      <ul class="thread-list" aria-label="Comments"></ul>
      <form class="thread-form" data-post="${post.id}">
        <label class="sr-only" for="${threadId}-input">Comment on ${esc(postHeadline(post))}</label>
        <input class="fi" id="${threadId}-input" name="text" type="text" autocomplete="off"
          maxlength="${COMMENT_MAX}" placeholder="Ask the café or say something" />
        <button class="btn btn-dark" type="submit">Send</button>
      </form>
    </div>`;
}

// Small uppercase label, e.g. "NEW ON THE MENU · 2 hr ago · Edited"
function cardTagHTML(text, cls, post) {
  return `<p class="card-tag ${cls}">${text}<span class="card-time"> · ${agoHTML(post.time)}${post.editedAt ? " · Edited" : ""}</span></p>`;
}

/* ── Captions ─────────────────────────────────────────────
   The caption travels in a data attribute (escaped) and is built into the
   page with textContent by hydrateCaptions(), never with innerHTML, so
   typed HTML shows as text. Links starting with http(s) become real links.
   Up to 3 lines show; "more" expands it in place.                      */

// prefix keeps ids unique when the same post shows in two places
function captionHTML(post, prefix = "cap") {
  const text = (post.caption || "").trim();
  if (!text) return "";
  const id = `${prefix}-${post.id}`;
  return `
    <div class="caption-wrap">
      <p class="caption" id="${esc(id)}" data-caption="${esc(text)}"></p>
      <button class="more-btn" type="button" data-action="toggle-caption"
        aria-expanded="false" aria-controls="${esc(id)}" hidden>more</button>
    </div>`;
}

const URL_RE = /https?:\/\/[^\s<>"']+/g;

// Fill one caption element from its data-caption text
function fillCaption(el) {
  const text = el.dataset.caption || "";
  el.replaceChildren();
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    let url = m[0];
    // Leave trailing punctuation outside the link ("…see https://x.com.")
    const trail = /[.,;:!?)\]]+$/.exec(url);
    if (trail && !(trail[0].includes(")") && url.includes("("))) url = url.slice(0, -trail[0].length);
    el.append(document.createTextNode(text.slice(last, m.index)));
    const a = document.createElement("a");
    a.href = url;
    a.textContent = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    el.append(a);
    last = m.index + url.length;
  }
  el.append(document.createTextNode(text.slice(last)));
}

// Show "more" only when the clamped caption actually hides text
const captionObserver =
  "ResizeObserver" in window
    ? new ResizeObserver((entries) => entries.forEach((e) => updateMoreButton(e.target)))
    : null;

function updateMoreButton(el) {
  const btn = el.parentElement && el.parentElement.querySelector(".more-btn");
  if (!btn || el.classList.contains("open")) return;
  btn.hidden = !(el.scrollHeight > el.clientHeight + 1);
}

function hydrateCaptions(root) {
  if (!root) return;
  root.querySelectorAll(".caption[data-caption]").forEach((el) => {
    fillCaption(el);
    if (captionObserver) captionObserver.observe(el);
    requestAnimationFrame(() => updateMoreButton(el));
  });
}

function toggleCaption(btn) {
  const el = document.getElementById(btn.getAttribute("aria-controls"));
  if (!el) return;
  const open = !el.classList.contains("open");
  el.classList.toggle("open", open);
  btn.setAttribute("aria-expanded", String(open));
  btn.textContent = open ? "less" : "more";
}

/* ── Photos inside cards ──────────────────────────────────── */

// A photo that opens the viewer at its place in this post's photos
function postPhotoHTML(post, index, cls, inner = "") {
  const photo = postPhotos(post)[index];
  const alt = postPhotoAlt(post, index);
  return `
    <button class="${cls}" type="button" data-action="open-post-photo" data-index="${index}"
      aria-label="Open ${esc(alt)}">
      <img src="${esc(photo.src)}" alt="${esc(alt)}" loading="lazy" />${inner}
    </button>`;
}

/* ── Card shapes ──────────────────────────────────────────── */

// PHOTOS — the photos lead, edge to edge; then tag and caption
function photosCardHTML(post) {
  const photos = postPhotos(post);
  const n = photos.length;
  const shown = Math.min(n, 4);
  const layout = n >= 4 ? 4 : n;
  let tiles = "";
  for (let i = 0; i < shown; i++) {
    const rest = i === 3 && n > 4 ? n - 4 : 0;
    tiles += postPhotoHTML(
      post,
      i,
      "pg-tile",
      rest ? `<span class="pg-more" aria-hidden="true">+${rest}</span>` : "",
    );
  }
  return `
    <div class="card-main photo-card">
      ${n ? `<div class="pg pg-${layout}"${n > 4 ? ` aria-label="${n} photos, 4 shown"` : ""}>${tiles}</div>` : ""}
      <div class="photo-body">
        ${cardTagHTML("Photos", "tag-text-photos", post)}
        ${captionHTML(post)}
      </div>
    </div>`;
}

// NEW ITEM — menu-board card: photo one third, content on the right
function newCardHTML(post, cafe) {
  const d = postData(post);
  const n = postPhotos(post).length;
  return `
    <div class="card-main menu-card${n ? "" : " no-photo"}">
      ${n ? `<div class="menu-photo">${postPhotoHTML(post, 0, "menu-photo-btn", n > 1 ? `<span class="count-chip" aria-hidden="true">1 / ${n}</span>` : "")}</div>` : ""}
      <div class="menu-body">
        ${cardTagHTML("New on the menu", "tag-text-new", post)}
        <h3 class="menu-item">${esc(d.item || "New on the menu")}</h3>
        ${captionHTML(post)}
        ${d.price || d.availability ? `
        <div class="menu-meta">
          ${d.price ? `<span class="menu-price">${esc(d.price)}</span>` : ""}
          ${d.availability ? `<span class="avail-chip">${esc(d.availability)}</span>` : ""}
        </div>` : ""}
      </div>
    </div>`;
}

// EVENT — ticket: dark day stub, dashed tear line, optional photo banner
function eventCardHTML(post) {
  const d = postData(post);
  const going = inState("cta", post.id);
  const hasPhoto = postPhotos(post).length > 0;
  return `
    <div class="card-main ticket">
      <div class="ticket-stub">
        ${d.day ? `<span class="stub-day">${esc(d.day)}</span>` : ""}
        ${d.time ? `<span class="stub-time">${esc(d.time)}</span>` : ""}
      </div>
      <div class="ticket-body">
        ${hasPhoto ? postPhotoHTML(post, 0, "ticket-banner") : ""}
        <div class="ticket-content">
          ${cardTagHTML("Event", "tag-text-event", post)}
          <h3 class="card-title">${esc(d.title || "Event")}</h3>
          ${captionHTML(post)}
          <div class="card-row">
            ${d.price ? `<span class="card-price">${esc(d.price)}</span>` : ""}
            <button class="btn btn-dark toggle-btn${going ? " done" : ""}" data-action="post-cta"
              aria-pressed="${going}">${going ? `${ico("check", "sm")}Going` : "I am going"}</button>
          </div>
        </div>
      </div>
    </div>`;
}

// PROMO — coupon with a dashed border; optional photo on the left third
function promoCardHTML(post) {
  const d = postData(post);
  const kept = inState("keeps", post.id);
  const until = d.validUntil ? formatShortDate(d.validUntil) : "";
  const hasPhoto = postPhotos(post).length > 0;
  return `
    <div class="card-main coupon${hasPhoto ? " has-photo" : ""}">
      ${hasPhoto ? postPhotoHTML(post, 0, "coupon-photo") : ""}
      <div class="coupon-body">
        ${cardTagHTML("Promo", "tag-text-promo", post)}
        <h3 class="card-title">${esc(d.title || "Promo")}</h3>
        ${d.offer ? `<p class="coupon-offer">${esc(d.offer)}</p>` : ""}
        ${until ? `<p class="coupon-valid">Valid until ${esc(until)}</p>` : ""}
        ${captionHTML(post)}
        <button class="btn coupon-keep${kept ? " done" : ""}" data-action="keep"
          aria-pressed="${kept}">${kept ? `${ico("check", "sm")}Promo kept` : "Keep this promo"}</button>
      </div>
    </div>`;
}

// HIRING — compact job card, never a photo
function hiringCardHTML(post) {
  const d = postData(post);
  const applied = inState("cta", post.id);
  const line = [d.schedule, d.perks].filter(Boolean).join(" · ");
  return `
    <div class="card-main job">
      <span class="job-icon" aria-hidden="true">${ico("briefcase")}</span>
      <div class="job-body">
        ${cardTagHTML("Hiring", "tag-text-hiring", post)}
        <h3 class="job-role">${esc(d.role || "Open role")}</h3>
        ${line ? `<p class="job-line">${esc(line)}</p>` : ""}
      </div>
      <button class="btn btn-dark toggle-btn${applied ? " done" : ""}" data-action="post-cta"
        aria-pressed="${applied}">${applied ? `${ico("check", "sm")}Applied` : "Apply"}</button>
      ${post.caption && post.caption.trim() ? `<div class="job-caption">${captionHTML(post)}</div>` : ""}
    </div>`;
}

const CARD_RENDERERS = {
  new: newCardHTML,
  photos: photosCardHTML,
  event: eventCardHTML,
  promo: promoCardHTML,
  hiring: hiringCardHTML,
};

// One board card. The Owner preview reuses it (made inert there).
// Call hydrateCaptions() on the container after inserting cards.
function postCardHTML(post) {
  const cafe = getCafe(post.cafeId);
  const render = CARD_RENDERERS[post.type];
  if (!cafe || !render) return "";
  return `
    <article class="post post-${post.type}" data-post="${esc(post.id)}"
      aria-label="${esc(POST_TYPES[post.type].label + ": " + postHeadline(post) + ", " + cafe.name)}">
      ${render(post, cafe)}
      ${cardFooterHTML(post, cafe)}
    </article>`;
}

/* ── Comment thread inside a card ─────────────────────────── */

// Comments are user text, so they are built with textContent, never innerHTML.
function renderThread(card) {
  const list = card.querySelector(".thread-list");
  if (!list) return;
  const comments = getComments(card.dataset.post);
  list.replaceChildren();
  if (!comments.length) {
    const li = document.createElement("li");
    li.className = "thread-empty";
    li.textContent = "No comments yet. Ask the café something.";
    list.append(li);
    return;
  }
  comments.forEach((c) => {
    const li = document.createElement("li");
    const name = document.createElement("strong");
    name.textContent = c.authorName;
    const text = document.createElement("span");
    text.textContent = " " + c.text;
    li.append(name, text);
    list.append(li);
  });
}

function toggleThread(pill) {
  const card = pill.closest("[data-post]");
  const thread = card && card.querySelector(".thread");
  if (!thread) return;
  const open = thread.hidden;
  thread.hidden = !open;
  pill.setAttribute("aria-expanded", String(open));
  if (open) {
    renderThread(card);
    card.querySelector(".thread-form input").focus();
  }
}

function sendComment(form) {
  const input = form.querySelector("input");
  const comment = addComment(form.dataset.post, input.value);
  if (!comment) {
    input.focus();
    return;
  }
  input.value = "";
  // .post, not [data-post]: the form carries data-post itself
  const card = form.closest(".post");
  renderThread(card);
  card.querySelector(".cmt-n").textContent = commentCount(getPost(form.dataset.post));
  input.focus();
}

/* ── The board ────────────────────────────────────────────── */

// Board filter → post type. Other filters only narrow by café.
const FILTER_POST_TYPE = {
  findItNew: "new",
  findItPhotos: "photos",
  findItPromo: "promo",
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
  const board = document.getElementById("feed");
  if (!board) return;
  const list = getFilteredPosts();
  board.innerHTML = list.length
    ? list.map((p) => postCardHTML(p)).join("")
    : '<div class="empty">Nothing on the board for this filter yet.</div>';
  hydrateCaptions(board);
}

/* ── Heading: "SATURDAY, 14 NOVEMBER" ─────────────────────── */

function renderTodayHeading(now = new Date()) {
  const el = document.getElementById("today-date");
  if (!el) return;
  const weekday = now.toLocaleDateString("en-GB", { weekday: "long" });
  const dayMonth = now.toLocaleDateString("en-GB", { day: "numeric", month: "long" });
  el.textContent = `${weekday}, ${dayMonth}`.toUpperCase();
  el.setAttribute("datetime", now.toISOString().slice(0, 10));
}

/* ── "Open now near you" / "Near you" row ─────────────────── */

const NEAR_MAX = 8;

function renderNearYou() {
  const row = document.getElementById("near-row");
  const title = document.getElementById("near-title");
  if (!row) return;

  // Only filter by open status when the data actually has hours
  const anyHours = cafeDatabase.some((c) => openStatus(c));
  const cafes = [...cafeDatabase]
    .filter((c) => !anyHours || (openStatus(c) || {}).open)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, NEAR_MAX);

  if (title) {
    title.innerHTML = anyHours
      ? '<span class="open-dot" aria-hidden="true"></span>Open now near you'
      : "Near you";
  }

  row.innerHTML = cafes.length
    ? cafes
        .map(
          (cafe) => `
      <div role="listitem" class="near-item">
        <button class="near-tile" data-action="open-cafe" data-cafe="${cafe.id}">
          <span class="near-top">
            ${cafeLogoTile(cafe)}
            <span class="dist-chip">${cafe.distance} km</span>
          </span>
          <span class="near-name">${esc(cafe.name)}</span>
          <span class="near-street">${esc(cafeStreet(cafe))}</span>
        </button>
      </div>`,
        )
        .join("")
    : '<div class="empty">No cafés are open right now.</div>';
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
      <button class="notif-row${unread ? " unread" : ""}" data-action="open-cafe" data-cafe="${cafe.id}">
        ${cafeLogoTile(cafe, "sm")}
        <span class="notif-body">
          <span class="notif-n">${esc(cafe.name)}</span>
          <span class="notif-m">${esc(postHeadline(p))}</span>
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
    <button class="rec-row" data-action="open-cafe" data-cafe="${cafe.id}">
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
          <button class="rec-row" data-action="open-cafe" data-cafe="${cafe.id}">
            ${cafeLogoTile(cafe)}
            <span class="rec-info">
              <span class="rec-name">${esc(postHeadline(p))}</span>
              <span class="rec-sub">${esc(cafe.name)} · ${agoHTML(p.time)}</span>
            </span>
            <span class="tag-chip ${type.cls}">${type.label}</span>
          </button>`;
        })
        .join("")
    : '<div class="empty">Nothing kept yet. Tap Keep on anything on the board.</div>';
}

/* ── Right rail: "This week" mini tickets and "Now hiring" ─ */

function renderSidebar() {
  const events = document.getElementById("side-events");
  if (events) {
    const items = getAllPosts().filter((p) => p.type === "event").slice(0, 4);
    events.innerHTML = items.length
      ? items
          .map((p) => {
            const d = postData(p);
            const cafe = getCafe(p.cafeId);
            return `
            <button class="mini-ticket" data-action="open-cafe" data-cafe="${cafe.id}">
              <span class="mini-stub">
                <span class="stub-day">${esc(d.day || "—")}</span>
                ${d.time ? `<span class="stub-time">${esc(d.time)}</span>` : ""}
              </span>
              <span class="mini-body">
                <span class="mini-title">${esc(d.title || "Event")}</span>
                <span class="mini-sub">${esc([cafe.name, d.price].filter(Boolean).join(" · "))}</span>
              </span>
            </button>`;
          })
          .join("")
      : '<div class="empty">No events on the board this week.</div>';
  }

  const jobs = document.getElementById("side-jobs");
  if (jobs) {
    const items = getAllPosts().filter((p) => p.type === "hiring").slice(0, 4);
    jobs.innerHTML = items.length
      ? items
          .map((p) => {
            const d = postData(p);
            const cafe = getCafe(p.cafeId);
            return `
            <button class="rail-job" data-action="open-cafe" data-cafe="${cafe.id}">
              <span class="mini-title">${esc(d.role || "Open role")}</span>
              <span class="mini-sub">${esc([cafe.name, d.schedule].filter(Boolean).join(" · "))}</span>
            </button>`;
          })
          .join("")
      : '<div class="empty">No openings right now.</div>';
  }
}

// Re-render everything that depends on posts (after publish, on startup)
function renderPostViews() {
  renderNearYou();
  renderFeed();
  renderSidebar();
  renderSaved();
  renderNotifications();
  updateNotifBadge();
}
