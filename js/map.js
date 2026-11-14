/* ═══════════════════════════════════════════════════════════════
   MAP — Interactive Leaflet map management
   ═══════════════════════════════════════════════════════════════ */

let map = null;
let markers = [];
let userMarker = null;
let selectedCafeId = 1; // Store the selected café ID globally

function initializeMap() {
  const mapElement = document.getElementById("butuan-map");
  if (!mapElement) {
    console.error("Map container not found");
    return;
  }

  // Check if map already exists
  if (map) {
    map.invalidateSize();
    return;
  }

  try {
    // Initialize map centered on Butuan City
    map = L.map("butuan-map").setView([8.9686, 125.5287], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    setUserMarker();
    addCafeMarkers(getFilteredCafes());
    updateGeoInfoCard();

    // Ask for the user's actual position once
    initializeGeolocation();
  } catch (e) {
    console.error("Map initialization failed:", e);
  }
}

// Show the "you are here" marker, replacing the previous one if any.
function setUserMarker() {
  if (!map) return;
  if (userMarker) {
    map.removeLayer(userMarker);
    userMarker = null;
  }
  if (!userLocation) return;

  const userIcon = L.divIcon({
    html: '<div class="map-user-dot"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    className: "user-marker",
  });
  userMarker = L.marker([userLocation.lat, userLocation.lng], {
    icon: userIcon,
    title: "Your location",
  })
    .addTo(map)
    .bindPopup("Your location");
}

function addCafeMarkers(cafes) {
  // Clear existing café markers
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];

  cafes.forEach((cafe) => {
    const cafeIcon = L.divIcon({
      html: `<div class="map-pin">${ico("cup")}</div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -16],
      className: "cafe-marker",
    });

    const marker = L.marker([cafe.lat, cafe.lng], {
      icon: cafeIcon,
      title: cafe.name,
      alt: cafe.name,
    })
      .bindPopup(
        `<div class="map-pop">
          <div class="map-pop-name">${esc(cafe.name)}</div>
          <div class="map-pop-meta">${cafe.rating} rating · ${cafe.distance} km away<br>${esc(cafe.address)}</div>
          <button class="btn" onclick="closePopup(); openCafe(${cafe.id})">View café</button>
        </div>`,
      )
      .addTo(map);

    marker.cafeId = cafe.id; // lets search open the right popup
    markers.push(marker);
  });
}

function updateMap(cafes) {
  if (!map) return;
  addCafeMarkers(cafes);
}

function closePopup() {
  if (map) map.closePopup();
}

// "Directions" on the profile: open the map centred on the café.
function showCafeOnMap(cafeId) {
  const cafe = getCafe(cafeId || selectedCafeId);
  if (!cafe) return;
  showPanel("map");
  if (!map) return;
  map.setView([cafe.lat, cafe.lng], 17);
  const marker = markers.find((m) => m.cafeId === cafe.id);
  if (marker) marker.openPopup();
}

// Nearby cafés list below the map (within 5 km, nearest first)
function displayNearbyCafesList() {
  const list = document.getElementById("nearby-cafes-list");
  if (!list) return;

  const nearbyCafes = cafeDatabase
    .filter((c) => c.distance < 5)
    .sort((a, b) => a.distance - b.distance);

  list.innerHTML = nearbyCafes.length
    ? nearbyCafes.map((c) => cafeRowHTML(c, c.distance + " km")).join("")
    : '<div class="empty">No cafés within 5 km of you.</div>';
}
