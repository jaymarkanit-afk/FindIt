/* ═══════════════════════════════════════════════════════════════
   OWNER — sign-in gate and the "Post an update" composer
   ═══════════════════════════════════════════════════════════════ */

const OWNER_CAFE_ID = 1; // the demo owner posts as Paramount Coffee
let annPhotoData = null; // downscaled photo (data URL) for the draft

function ownerLogin() {
  const e = document.getElementById("ow-email").value;
  const p = document.getElementById("ow-pass").value;
  if (!e || !p) {
    showToast("Please enter your credentials");
    return;
  }
  document.getElementById("owner-gate").style.display = "none";
  document.getElementById("owner-dash").style.display = "block";
  updateAnnPreview();
  showToast("Welcome back!");
}

function ownerLogout() {
  document.getElementById("owner-gate").style.display = "block";
  document.getElementById("owner-dash").style.display = "none";
  document.getElementById("ow-email").value = "";
  document.getElementById("ow-pass").value = "";
  showToast("Signed out");
}

/* ── Post type ────────────────────────────────────────────── */

function currentAnnType() {
  const on = document.querySelector(".ann-type.on");
  return on ? on.dataset.type : "new";
}

function annType(el) {
  document.querySelectorAll(".ann-type").forEach((t) => {
    t.classList.remove("on");
    t.setAttribute("aria-pressed", "false");
  });
  el.classList.add("on");
  el.setAttribute("aria-pressed", "true");

  // Show only the extra fields that belong to this type
  const type = el.dataset.type;
  ["promo", "event", "hiring"].forEach((t) => {
    const extra = document.getElementById("extra-" + t);
    if (extra) extra.hidden = t !== type;
  });
  updateAnnPreview();
}

/* ── Photo ────────────────────────────────────────────────── */

// Downscale so the photo fits comfortably in localStorage
function annPhoto(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 900 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      setAnnPhoto(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => showToast("That file is not an image we can read");
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function setAnnPhoto(dataUrl) {
  annPhotoData = dataUrl;
  const drop = document.getElementById("ann-photo-drop");
  if (!drop) return;
  const old = drop.querySelector("img");
  if (old) old.remove();
  drop.classList.toggle("has-photo", !!dataUrl);
  if (dataUrl) {
    const img = document.createElement("img");
    img.src = dataUrl;
    img.alt = "Selected photo";
    drop.insertBefore(img, drop.querySelector("input"));
  }
  updateAnnPreview();
}

/* ── Draft → post ─────────────────────────────────────────── */

function fieldValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function shortTitle(text) {
  const first = text.split(/[.!?\n]/)[0].trim();
  return first.length > 60 ? first.slice(0, 57).trim() + "…" : first;
}

function formatDay(dateStr, withWeekday) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00");
  if (isNaN(d)) return "";
  return d.toLocaleDateString(
    "en-US",
    withWeekday
      ? { weekday: "long", month: "short", day: "numeric" }
      : { month: "short", day: "numeric" },
  );
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map(Number);
  const hour = h % 12 || 12;
  return `${hour}${m ? ":" + String(m).padStart(2, "0") : ""} ${h < 12 ? "AM" : "PM"}`;
}

// The first sentence becomes the headline; the rest is the description.
function splitCaption(text) {
  const head = shortTitle(text);
  const rest = text.slice(text.indexOf(head.replace(/…$/, "")) + head.replace(/…$/, "").length)
    .replace(/^[.!?\s]+/, "")
    .trim();
  return { head, rest };
}

function buildAnnPost() {
  const type = currentAnnType();
  const caption = fieldValue("ann-text");
  const { head, rest } = splitCaption(caption);
  const post = {
    id: "o" + Date.now(),
    cafeId: OWNER_CAFE_ID,
    type,
    time: Date.now(),
    sips: 0,
    caption, // what the owner typed, kept as written
  };

  if (type === "new") {
    post.photo = annPhotoData || "";
    post.new = { item: head, description: rest, price: "", availability: "" };
  }
  if (type === "promo") {
    post.promo = { title: head, offer: rest, validUntil: fieldValue("ann-until") };
  }
  if (type === "event") {
    const date = fieldValue("ann-date");
    const day = date
      ? new Date(date + "T00:00").toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()
      : "";
    post.event = {
      title: head,
      date,
      day,
      time: formatTime(fieldValue("ann-time")),
      price: fieldValue("ann-price"),
      description: rest,
    };
  }
  if (type === "hiring") {
    post.hiring = {
      role: fieldValue("ann-role"),
      schedule: fieldValue("ann-schedule"),
      perks: "",
      description: caption,
    };
  }
  return post;
}

// Live preview of the post exactly as the feed will render it
function updateAnnPreview() {
  const preview = document.getElementById("ann-preview");
  if (!preview) return;
  const nameEl = document.getElementById("ow-cafe-name");
  if (nameEl) nameEl.textContent = getCafe(OWNER_CAFE_ID).name;

  const post = buildAnnPost();
  post.id = "preview";
  if (!post.caption) {
    const d = post[post.type];
    if ("item" in d) d.item = "Your new item";
    else if ("title" in d) d.title = "Your headline";
    if (post.type === "hiring" && !d.role) d.role = "The role you're hiring for";
  }
  preview.innerHTML = postCardHTML(post);
  preview.inert = true; // a picture of the card, not something to click
}

/* ── Publish ──────────────────────────────────────────────── */

function postAnn() {
  const post = buildAnnPost();
  if (!post.caption) {
    showToast("Write something first!");
    document.getElementById("ann-text").focus();
    return;
  }
  if (post.type === "event" && !fieldValue("ann-date")) {
    showToast("Add a date for the event");
    document.getElementById("ann-date").focus();
    return;
  }
  if (post.type === "hiring" && !fieldValue("ann-role")) {
    showToast("Add the role you're hiring for");
    document.getElementById("ann-role").focus();
    return;
  }

  userState.ownerPosts.unshift(post);
  if (!saveStore("ownerPosts", userState.ownerPosts)) {
    // Storage full: keep the post but drop the uploaded photo
    post.photo = "";
    if (!saveStore("ownerPosts", userState.ownerPosts))
      showToast("Posted, but it could not be saved for next time");
  }

  // "Send alerts now" off → the post skips the Alerts list badge
  const alertNow = document.getElementById("ann-alert").checked;
  if (!alertNow) {
    userState.seen.push(post.id);
    saveStore("seen", userState.seen);
  }

  // Reset the draft
  ["ann-text", "ann-until", "ann-date", "ann-time", "ann-price", "ann-role", "ann-schedule", "ann-photo"].forEach(
    (id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    },
  );
  setAnnPhoto(null);

  // New post goes to the top of the board (and everywhere else)
  renderPostViews();
  showPublishBar(
    alertNow
      ? "On the board. People with alerts on were notified."
      : "On the board.",
  );
}

function showPublishBar(text) {
  const bar = document.getElementById("publish-bar");
  if (!bar) return;
  document.getElementById("publish-bar-text").textContent = text;
  bar.classList.add("show");
  clearTimeout(bar._t);
  bar._t = setTimeout(() => bar.classList.remove("show"), 5000);
}

function viewPublished() {
  document.getElementById("publish-bar").classList.remove("show");
  quickFilter("all");
  showPanel("home");
}
