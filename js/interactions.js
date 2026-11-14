/* ═══════════════════════════════════════════════════════════════
   INTERACTIONS — sips, alerts (follow), keep/save, share
   All of these persist through store.js.
   ═══════════════════════════════════════════════════════════════ */

// "N sips" pill: toggles the user's sip on a post
function bumpRxn(el) {
  const card = el.closest("[data-post]");
  const post = card && getPost(card.dataset.post);
  if (!post) return;

  const on = toggleInState("sips", post.id);
  const count = sipCount(post);
  el.classList.toggle("on", on);
  el.setAttribute("aria-pressed", on);
  el.querySelector(".rxn-n").textContent = count;
  el.querySelector(".rxn-l").textContent = sipLabel(count);
}

// Make every "Get alerts" button for a café show the same state
function syncAlertButtons(cafeId) {
  const on = inState("alerts", Number(cafeId));
  document
    .querySelectorAll(`.alert-btn[data-cafe="${cafeId}"]`)
    .forEach((btn) => {
      btn.classList.toggle("on", on);
      btn.setAttribute("aria-pressed", on);
      const label = btn.querySelector(".alert-label");
      if (label) label.textContent = on ? "Alerts on" : "Get alerts";
    });
}

// "Get alerts" pill (feed cards and the café profile)
function toggleFollow(btn) {
  const cafeId = Number(btn.dataset.cafe);
  const cafe = getCafe(cafeId);
  if (!cafe) return;

  const on = toggleInState("alerts", cafeId);
  syncAlertButtons(cafeId);
  updateNotifBadge();
  showToast(on ? `Alerts on for ${cafe.name}` : `Alerts off for ${cafe.name}`);
}

// "Keep" pill on a post. Takes the button; the post is its [data-post] card.
function doSave(btn, e) {
  if (e) e.stopPropagation();
  const card = btn && btn.closest("[data-post]");
  if (!card) return;

  const kept = toggleInState("keeps", card.dataset.post);
  btn.classList.toggle("on", kept);
  btn.setAttribute("aria-pressed", kept);
  btn.querySelector(".keep-label").textContent = kept ? "Kept" : "Keep";
  renderSaved();
  showToast(kept ? "Kept. Find it under Saved." : "Removed from Saved");
}

// Bookmark button on the café profile
function setSaveButton(btn, saved) {
  btn.classList.toggle("saved-state", saved);
  btn.setAttribute("aria-pressed", saved);
  btn.setAttribute(
    "aria-label",
    saved ? "Remove this café from Saved" : "Save this café",
  );
}

function saveProfile(btn) {
  const saved = toggleInState("savedCafes", selectedCafeId);
  setSaveButton(btn, saved);
  renderSaved();
  showToast(saved ? "Café saved" : "Removed from Saved");
}

// "Remind me" (events) and "Apply" (jobs) — demo only, stored locally
function postCta(btn, postId) {
  const post = getPost(postId);
  if (!post) return;
  const cafe = getCafe(post.cafeId);
  const done = toggleInState("cta", postId);
  const isEvent = post.type === "event";

  btn.classList.toggle("done", done);
  btn.setAttribute("aria-pressed", done);
  btn.textContent = isEvent
    ? done
      ? "Reminder set"
      : "Remind me"
    : done
      ? "Interest sent"
      : "Apply";

  if (isEvent) showToast(done ? "Reminder set" : "Reminder removed");
  else
    showToast(
      done ? `${cafe.name} will see you're interested` : "Interest withdrawn",
    );
}

// Share via the system share sheet, or copy to the clipboard
function shareText(title, text) {
  if (navigator.share) {
    navigator.share({ title, text }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => showToast("Copied to clipboard"))
      .catch(() => showToast("Could not copy"));
  } else {
    showToast("Sharing is not supported on this browser");
  }
}

function sharePost(postId) {
  const post = getPost(postId);
  if (!post) return;
  const cafe = getCafe(post.cafeId);
  shareText(cafe.name, `${cafe.name}: ${post.title} — on FindIt`);
}
