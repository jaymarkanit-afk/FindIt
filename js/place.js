/* ═══════════════════════════════════════════════════════════════
   PLACE PICKER — the location pill in the top bar
   A menu under the pill (a sheet from the bottom on phones) listing each
   place with its province and café count, plus "Use my location".
   Keyboard: arrows move, Home/End jump, Enter/Space select, Escape or Tab
   closes and returns focus to the pill. Closed = hidden (not reachable).
   ═══════════════════════════════════════════════════════════════ */

const placeBtn = () => document.getElementById("place-btn");
const placePop = () => document.getElementById("place-pop");
const placeMenu = () => document.getElementById("place-menu");
const placeBackdrop = () => document.getElementById("place-backdrop");

function isPhoneWidth() {
  return window.matchMedia("(max-width: 699px)").matches;
}

function placeItems() {
  return Array.from(placeMenu().querySelectorAll('[role^="menuitem"]'));
}

function renderPlaceMenu() {
  const current = getSelectedPlace().name;
  const options = places
    .map((p) => {
      const n = cafesInPlace(p).length;
      const on = p.name === current;
      return `
      <button class="place-opt" role="menuitemradio" aria-checked="${on}" tabindex="-1"
        data-action="pick-place" data-place="${esc(p.name)}">
        <span class="place-opt-text">
          <span class="place-name">${esc(p.name)}</span>
          <span class="place-meta"> · ${esc(p.province)} · ${n} ${n === 1 ? "café" : "cafés"}</span>
        </span>
        <span class="place-check" aria-hidden="true">${on ? ico("check") : ""}</span>
      </button>`;
    })
    .join("");
  placeMenu().innerHTML = `${options}
    <div class="place-sep" role="separator"></div>
    <button class="place-opt" role="menuitem" tabindex="-1" data-action="place-locate">
      ${ico("locate")}<span class="place-name">Use my location</span>
    </button>`;
}

function updatePlaceLabels() {
  const name = getSelectedPlace().name;
  const label = document.getElementById("place-label");
  if (label) label.textContent = name;
  const btn = placeBtn();
  if (btn) btn.setAttribute("aria-label", `Place: ${name}. Choose a place`);
}

function positionPlacePop() {
  const pop = placePop();
  if (isPhoneWidth()) {
    pop.classList.add("sheet");
    pop.style.top = pop.style.left = "";
    return;
  }
  pop.classList.remove("sheet");
  const r = placeBtn().getBoundingClientRect();
  pop.style.top = Math.round(r.bottom + 6) + "px";
  pop.style.left = Math.round(Math.max(8, r.left)) + "px";
}

function openPlaceMenu() {
  renderPlaceMenu();
  const pop = placePop();
  pop.hidden = false;
  placeBackdrop().hidden = !isPhoneWidth();
  positionPlacePop();
  placeBtn().setAttribute("aria-expanded", "true");
  const items = placeItems();
  (items.find((i) => i.getAttribute("aria-checked") === "true") || items[0]).focus();
  document.addEventListener("pointerdown", onPointerOutside, true);
}

function closePlaceMenu(returnFocus = true) {
  const pop = placePop();
  if (!pop || pop.hidden) return;
  pop.hidden = true;
  placeBackdrop().hidden = true;
  placeBtn().setAttribute("aria-expanded", "false");
  document.removeEventListener("pointerdown", onPointerOutside, true);
  if (returnFocus) placeBtn().focus();
}

function togglePlaceMenu() {
  if (placePop().hidden) openPlaceMenu();
  else closePlaceMenu();
}

// Clicking anywhere outside the menu (and the pill) closes it
function onPointerOutside(e) {
  if (placePop().contains(e.target) || placeBtn().contains(e.target)) return;
  closePlaceMenu(false);
}

function onPlaceMenuKey(e) {
  const items = placeItems();
  const i = items.indexOf(document.activeElement);
  const move = (j) => {
    e.preventDefault();
    items[(j + items.length) % items.length].focus();
  };
  if (e.key === "ArrowDown") move(i + 1);
  else if (e.key === "ArrowUp") move(i - 1);
  else if (e.key === "Home") move(0);
  else if (e.key === "End") move(items.length - 1);
  else if (e.key === "Escape" || e.key === "Tab") {
    e.preventDefault();
    closePlaceMenu();
  }
}

function pickPlace(el) {
  const name = el.dataset.place;
  closePlaceMenu();
  if (name !== getSelectedPlace().name) {
    setSelectedPlace(name);
    showToast(`Showing ${name}`);
  }
}

// "Use my location": pick the place whose centre is nearest
function useMyLocationForPlace() {
  const current = getSelectedPlace().name;
  closePlaceMenu();
  if (!("geolocation" in navigator)) {
    showToast(`Location isn't available here, so ${current} stays selected.`);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const nearest = [...places].sort(
        (a, b) =>
          calculateDistance(userLocation.lat, userLocation.lng, a.lat, a.lng) -
          calculateDistance(userLocation.lat, userLocation.lng, b.lat, b.lng),
      )[0];
      setSelectedPlace(nearest.name);
      if (typeof setUserMarker === "function") setUserMarker();
      showToast(`Showing ${nearest.name}, the nearest place to you`);
    },
    (err) => {
      showToast(
        err && err.code === 1
          ? `Location permission was denied, so ${current} stays selected.`
          : `Couldn't get your location, so ${current} stays selected.`,
      );
    },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
  );
}

// Re-render everything that depends on the selected place
function refreshForPlace() {
  updateDistances();
  updateDistanceLabels();
  updatePlaceLabels();
  renderTodayHeading();
  setGreeting();
  filterAndDisplayCafes(); // board, search results, map markers, nearby list
  renderNearYou();
  renderSidebar();
  updateGeoInfoCard();
  centreMapOnPlace();
}

(function bindPlacePicker() {
  const menu = placeMenu();
  if (!menu) return;
  menu.addEventListener("keydown", onPlaceMenuKey);
  placeBackdrop().addEventListener("click", () => closePlaceMenu(false));
  window.addEventListener("resize", () => {
    if (!placePop().hidden) positionPlacePop();
  });
  updatePlaceLabels();
})();
