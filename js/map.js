/* ═══════════════════════════════════════════════════════════════
   MAP — Interactive Leaflet map management
   ═══════════════════════════════════════════════════════════════ */

let map = null;
let markers = [];
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
    map = L.map("butuan-map").setView([8.9686, 125.5287], 15);

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Add user location marker
    const userIcon = L.divIcon({
      html: '<div style="width:20px;height:20px;background:var(--accent);border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>',
      iconSize: [20, 20],
      className: "user-marker",
    });
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
      .addTo(map)
      .bindPopup("📍 Your location");

    // Add café markers
    addCafeMarkers(cafeDatabase);

    // Update geolocation info card
    updateGeoInfoCard();

    // Auto-initialize geolocation to get user's actual position
    if (typeof initializeGeolocation === "function") {
      setTimeout(() => initializeGeolocation(), 500);
    }

    console.log("Map initialized successfully");
  } catch (e) {
    console.error("Map initialization failed:", e);
  }
}

function addCafeMarkers(cafes) {
  // Clear existing markers
  markers.forEach((marker) => map.removeLayer(marker));
  markers = [];

  cafes.forEach((cafe) => {
    const cafeIcon = L.divIcon({
      html: `<div style="font-size:24px;cursor:pointer" title="${cafe.name}">☕</div>`,
      iconSize: [24, 24],
      className: "cafe-marker",
    });

    const marker = L.marker([cafe.lat, cafe.lng], { icon: cafeIcon })
      .bindPopup(
        `
        <div style="width:180px;">
          <div style="font-weight:700;margin-bottom:4px">${cafe.name}</div>
          <div style="font-size:12px;margin-bottom:4px">⭐ ${cafe.rating} · ${cafe.distance} km away</div>
          <div style="font-size:11px;color:#666;margin-bottom:8px">${cafe.address}</div>
          <button onclick="selectedCafeId=${cafe.id};showPanel('profile');closePopup()" style="width:100%;padding:6px;background:var(--accent);color:white;border:none;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700">View Café</button>
        </div>
      `,
      )
      .addTo(map);

    markers.push(marker);
  });
}

function updateMap(cafes) {
  if (!map) return;
  addCafeMarkers(cafes);
}

function closePopup() {
  if (map) {
    map.closePopup();
  }
}

function loadCafeProfile(cafeId) {
  selectedCafeId = cafeId;
  const cafe = cafeDatabase.find((c) => c.id === cafeId);

  if (!cafe) {
    console.error("Café not found:", cafeId);
    return;
  }

  // Update profile hero section
  const nameEl = document.querySelector(".profile-name");
  if (nameEl) nameEl.textContent = cafe.name;

  const statsEl = document.querySelector(".profile-stats");
  if (statsEl) {
    statsEl.innerHTML = `
      <span class="ps">⭐ ${cafe.rating} (${cafe.reviews} reviews)</span>
      <span class="ps">📍 ${cafe.address}</span>
      <span class="ps">🕐 Open · Closes 9 PM</span>
    `;
  }

  // Update profile image carousel
  const carousel = document.getElementById("carousel-strip");
  if (carousel) {
    carousel.innerHTML = `
      <img class="profile-slide" src="${cafe.img}" alt="${cafe.name}"/>
      <img class="profile-slide" src="https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=900&q=80" alt=""/>
      <img class="profile-slide" src="https://images.unsplash.com/photo-1611174743420-3d7df880ce32?w=900&q=80" alt=""/>
    `;
  }

  // Reset carousel to first slide
  const dots = document.querySelectorAll(".cdot");
  dots.forEach((dot, idx) => {
    dot.classList.remove("on");
    if (idx === 0) dot.classList.add("on");
  });
}
