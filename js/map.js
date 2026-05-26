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

function updatePhotosTab(cafeId) {
  const photoTab = document.getElementById("tab-photos");
  if (!photoTab) return;

  if (cafeId === 1) {
    // Paramount coffee - show Paramount images
    photoTab.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; padding: 0 0 20px 0;">
        <!-- Featured large image -->
        <div
          style="
            grid-column: 1/-1;
            height: 240px;
            border-radius: 14px;
            overflow: hidden;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            position: relative;
          "
          onclick="openPhotoModal('Images/paramount/paramount1.jpg')"
        >
          <img
            src="Images/paramount/paramount1.jpg"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
              transition: transform 0.3s ease;
            "
            onmouseover="this.style.transform = 'scale(1.05)'"
            onmouseout="this.style.transform = 'scale(1)'"
            alt="Coffee"
          />
        </div>
        
        <!-- Grid of 6 clickable images -->
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/paramount/paramount2.jpg')">
          <img src="Images/paramount/paramount2.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/paramount/paramount3.jpg')">
          <img src="Images/paramount/paramount3.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/paramount/paramount4.jpg')">
          <img src="Images/paramount/paramount4.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/paramount/paramount5.jpg')">
          <img src="Images/paramount/paramount5.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/paramount/paramount6.jpg')">
          <img src="Images/paramount/paramount6.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
      </div>
    `;
  } else if (cafeId === 2) {
    // Craft Coffee Roastery - show Craft Coffee images
    photoTab.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; padding: 0 0 20px 0;">
        <!-- Featured large image -->
        <div
          style="
            grid-column: 1/-1;
            height: 240px;
            border-radius: 14px;
            overflow: hidden;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            position: relative;
          "
          onclick="openPhotoModal('Images/craftcoffee/craftcoffe1.jpg')"
        >
          <img
            src="Images/craftcoffee/craftcoffe1.jpg"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
              transition: transform 0.3s ease;
            "
            onmouseover="this.style.transform = 'scale(1.05)'"
            onmouseout="this.style.transform = 'scale(1)'"
            alt="Coffee"
          />
        </div>
        
        <!-- Grid of 6 clickable images -->
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/craftcoffee/craftcoffe1.jpg')">
          <img src="Images/craftcoffee/craftcoffe1.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/craftcoffee/craftcoffe2.jpg')">
          <img src="Images/craftcoffee/craftcoffe2.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/craftcoffee/craftcoffe3.jpg')">
          <img src="Images/craftcoffee/craftcoffe3.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/craftcoffee/craftcoffe4.jpg')">
          <img src="Images/craftcoffee/craftcoffe4.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/craftcoffee/craftcoffe5.jpg')">
          <img src="Images/craftcoffee/craftcoffe5.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/craftcoffee/craftcoffe6.jpg')">
          <img src="Images/craftcoffee/craftcoffe6.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
      </div>
    `;
  } else if (cafeId === 9) {
    // Coffee Capital - show Coffee Capital images
    photoTab.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; padding: 0 0 20px 0;">
        <!-- Featured large image -->
        <div
          style="
            grid-column: 1/-1;
            height: 240px;
            border-radius: 14px;
            overflow: hidden;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            position: relative;
          "
          onclick="openPhotoModal('Images/coffeecapital/coffeecapital_main_image.jpg')"
        >
          <img
            src="Images/coffeecapital/coffeecapital_main_image.jpg"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
              transition: transform 0.3s ease;
            "
            onmouseover="this.style.transform = 'scale(1.05)'"
            onmouseout="this.style.transform = 'scale(1)'"
            alt="Coffee"
          />
        </div>
        
        <!-- Grid of 6 clickable images -->
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/coffeecapital/coffecapital1.jpg')">
          <img src="Images/coffeecapital/coffecapital1.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/coffeecapital/coffeecapital2.jpg')">
          <img src="Images/coffeecapital/coffeecapital2.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/coffeecapital/coffeecapital3.jpg')">
          <img src="Images/coffeecapital/coffeecapital3.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/coffeecapital/coffeecapital4.jpg')">
          <img src="Images/coffeecapital/coffeecapital4.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/coffeecapital/coffeecapital5.jpg')">
          <img src="Images/coffeecapital/coffeecapital5.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/coffeecapital/coffeecapital6.jpg')">
          <img src="Images/coffeecapital/coffeecapital6.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
      </div>
    `;
  } else if (cafeId === 10) {
    // Lakbai Coffee - show Lakbai images
    photoTab.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; padding: 0 0 20px 0;">
        <!-- Featured large image -->
        <div
          style="
            grid-column: 1/-1;
            height: 240px;
            border-radius: 14px;
            overflow: hidden;
            cursor: pointer;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
            position: relative;
          "
          onclick="openPhotoModal('Images/Lakbai/lakbai1.jpg')"
        >
          <img
            src="Images/Lakbai/lakbai1.jpg"
            style="
              width: 100%;
              height: 100%;
              object-fit: cover;
              transition: transform 0.3s ease;
            "
            onmouseover="this.style.transform = 'scale(1.05)'"
            onmouseout="this.style.transform = 'scale(1)'"
            alt="Coffee"
          />
        </div>
        
        <!-- Grid of 6 clickable images -->
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/Lakbai/lakbai2.jpg')">
          <img src="Images/Lakbai/lakbai2.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/Lakbai/Lakbai3.jpg')">
          <img src="Images/Lakbai/Lakbai3.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/Lakbai/lakbai4.jpg')">
          <img src="Images/Lakbai/lakbai4.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/Lakbai/lakbai5.jpg')">
          <img src="Images/Lakbai/lakbai5.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/Lakbai/Lakbai6.jpg')">
          <img src="Images/Lakbai/Lakbai6.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
        <div style="height: 150px; border-radius: 12px; overflow: hidden; cursor: pointer; box-shadow: 0 2px 10px rgba(0,0,0,0.12); position: relative;" onclick="openPhotoModal('Images/Lakbai/lakbai7.jpg')">
          <img src="Images/Lakbai/lakbai7.jpg" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" onmouseover="this.style.transform = 'scale(1.08)'" onmouseout="this.style.transform = 'scale(1)'" alt="Coffee"/>
        </div>
      </div>
    `;
  } else {
    // Original photos for other cafes
    photoTab.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">
        <div style="grid-column: 1/-1; height: 160px; border-radius: var(--r); overflow: hidden;">
          <img src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=900&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt=""/>
        </div>
        <div style="height: 110px; border-radius: var(--r); overflow: hidden;">
          <img src="https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt=""/>
        </div>
        <div style="height: 110px; border-radius: var(--r); overflow: hidden;">
          <img src="https://images.unsplash.com/photo-1611174743420-3d7df880ce32?w=400&q=80" style="width: 100%; height: 100%; object-fit: cover;" alt=""/>
        </div>
      </div>
    `;
  }
}

// Get images for a cafe
function getCafeImages(cafeId) {
  if (cafeId === 1) {
    return [
      "Images/paramount/paramount1.jpg",
      "Images/paramount/paramount2.jpg",
      "Images/paramount/paramount3.jpg",
      "Images/paramount/paramount4.jpg",
      "Images/paramount/paramount5.jpg",
      "Images/paramount/paramount6.jpg",
    ];
  } else if (cafeId === 2) {
    return [
      "Images/craftcoffee/craftcoffe1.jpg",
      "Images/craftcoffee/craftcoffe2.jpg",
      "Images/craftcoffee/craftcoffe3.jpg",
      "Images/craftcoffee/craftcoffe4.jpg",
      "Images/craftcoffee/craftcoffe5.jpg",
      "Images/craftcoffee/craftcoffe6.jpg",
    ];
  } else if (cafeId === 9) {
    return [
      "Images/coffeecapital/coffeecapital_main_image.jpg",
      "Images/coffeecapital/coffecapital1.jpg",
      "Images/coffeecapital/coffeecapital2.jpg",
      "Images/coffeecapital/coffeecapital3.jpg",
      "Images/coffeecapital/coffeecapital4.jpg",
      "Images/coffeecapital/coffeecapital5.jpg",
      "Images/coffeecapital/coffeecapital6.jpg",
    ];
  } else if (cafeId === 10) {
    return [
      "Images/Lakbai/lakbai1.jpg",
      "Images/Lakbai/lakbai2.jpg",
      "Images/Lakbai/Lakbai3.jpg",
      "Images/Lakbai/lakbai4.jpg",
      "Images/Lakbai/lakbai5.jpg",
      "Images/Lakbai/Lakbai6.jpg",
      "Images/Lakbai/lakbai7.jpg",
    ];
  }
  return [];
}

// Global variables for photo modal
let currentPhotoIndex = 0;
let photoModalImages = [];
let photoModal = null;

function openPhotoModal(src) {
  // Get all images for current cafe
  const cafeId = selectedCafeId || 1;
  photoModalImages = getCafeImages(cafeId);

  // Find index of clicked image
  currentPhotoIndex = photoModalImages.indexOf(src);
  if (currentPhotoIndex === -1) currentPhotoIndex = 0;

  photoModal = document.createElement("div");
  photoModal.id = "photoModal";
  photoModal.style.cssText =
    "display: flex; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.92); z-index: 10000; align-items: center; justify-content: center; padding: 20px; touch-action: none;";

  photoModal.innerHTML = `
    <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;" id="photoContainer">
      <img id="photoImage" src="${photoModalImages[currentPhotoIndex]}" style="max-width: 90vw; max-height: 85vh; object-fit: contain; border-radius: 8px; user-select: none;" alt=""/>
      
      <!-- Navigation arrows -->
      <button id="photoPrev" style="position: absolute; left: 20px; background: rgba(255,255,255,0.3); border: none; color: white; font-size: 40px; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; transition: all 0.3s; display: ${photoModalImages.length > 1 ? "flex" : "none"}; align-items: center; justify-content: center;" onmouseover="this.style.background = 'rgba(255,255,255,0.5)'; this.style.transform = 'scale(1.1)';" onmouseout="this.style.background = 'rgba(255,255,255,0.3)'; this.style.transform = 'scale(1)';">‹</button>
      
      <button id="photoNext" style="position: absolute; right: 20px; background: rgba(255,255,255,0.3); border: none; color: white; font-size: 40px; width: 50px; height: 50px; border-radius: 50%; cursor: pointer; transition: all 0.3s; display: ${photoModalImages.length > 1 ? "flex" : "none"}; align-items: center; justify-content: center;" onmouseover="this.style.background = 'rgba(255,255,255,0.5)'; this.style.transform = 'scale(1.1)';" onmouseout="this.style.background = 'rgba(255,255,255,0.3)'; this.style.transform = 'scale(1)';">›</button>
      
      <!-- Close button -->
      <button id="photoClose" style="position: absolute; top: 20px; right: 20px; background: rgba(255,255,255,0.3); border: none; color: white; font-size: 32px; width: 45px; height: 45px; border-radius: 50%; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; justify-content: center;" onmouseover="this.style.background = 'rgba(255,255,255,0.5)'; this.style.transform = 'scale(1.1)';" onmouseout="this.style.background = 'rgba(255,255,255,0.3)'; this.style.transform = 'scale(1)';">✕</button>
      
      <!-- Image counter -->
      <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); color: white; font-size: 14px; background: rgba(0,0,0,0.5); padding: 8px 16px; border-radius: 20px;" id="photoCounter"></div>
    </div>
  `;

  // Add event listeners
  const prevBtn = photoModal.querySelector("#photoPrev");
  const nextBtn = photoModal.querySelector("#photoNext");
  const closeBtn = photoModal.querySelector("#photoClose");
  const counter = photoModal.querySelector("#photoCounter");
  const img = photoModal.querySelector("#photoImage");
  const container = photoModal.querySelector("#photoContainer");

  function updatePhoto() {
    img.src = photoModalImages[currentPhotoIndex];
    counter.textContent = `${currentPhotoIndex + 1} / ${photoModalImages.length}`;
  }

  function nextPhoto() {
    currentPhotoIndex = (currentPhotoIndex + 1) % photoModalImages.length;
    updatePhoto();
  }

  function prevPhoto() {
    currentPhotoIndex =
      (currentPhotoIndex - 1 + photoModalImages.length) %
      photoModalImages.length;
    updatePhoto();
  }

  // Button click handlers
  if (nextBtn) nextBtn.addEventListener("click", nextPhoto);
  if (prevBtn) prevBtn.addEventListener("click", prevPhoto);
  if (closeBtn) closeBtn.addEventListener("click", () => photoModal.remove());

  // Keyboard navigation
  const keyHandler = (e) => {
    if (e.key === "ArrowRight") nextPhoto();
    if (e.key === "ArrowLeft") prevPhoto();
    if (e.key === "Escape") photoModal.remove();
  };
  document.addEventListener("keydown", keyHandler);

  // Swipe handling for mobile
  let touchStartX = 0;
  let touchEndX = 0;

  container.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    false,
  );

  container.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    },
    false,
  );

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left - show next photo
        nextPhoto();
      } else {
        // Swiped right - show previous photo
        prevPhoto();
      }
    }
  }

  // Close on background click
  photoModal.addEventListener("click", function (e) {
    if (e.target === photoModal) {
      photoModal.remove();
      document.removeEventListener("keydown", keyHandler);
    }
  });

  // Cleanup on remove
  const observer = new MutationObserver((mutations) => {
    if (!document.body.contains(photoModal)) {
      document.removeEventListener("keydown", keyHandler);
      observer.disconnect();
    }
  });

  observer.observe(document.body, { childList: true });

  // Update counter
  updatePhoto();

  document.body.appendChild(photoModal);
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
    let carouselHTML = "";

    // Use Paramount coffee images for Paramount (ID 1)
    if (cafeId === 1) {
      carouselHTML = `
        <img class="profile-slide" src="Images/paramount/paramount1.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/paramount/paramount2.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/paramount/paramount3.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/paramount/paramount4.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/paramount/paramount5.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/paramount/paramount6.jpg" alt="${cafe.name}"/>
      `;
    } else if (cafeId === 9) {
      // Use Coffee Capital images for Coffee Capital (ID 9)
      carouselHTML = `
        <img class="profile-slide" src="Images/coffeecapital/coffeecapital_main_image.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/coffeecapital/coffecapital1.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/coffeecapital/coffeecapital2.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/coffeecapital/coffeecapital3.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/coffeecapital/coffeecapital4.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/coffeecapital/coffeecapital5.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/coffeecapital/coffeecapital6.jpg" alt="${cafe.name}"/>
      `;    } else if (cafeId === 2) {
      // Use Craft Coffee Roastery images for Craft Coffee Roastery (ID 2)
      carouselHTML = `
        <img class="profile-slide" src="Images/craftcoffee/craftcoffe1.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/craftcoffee/craftcoffe2.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/craftcoffee/craftcoffe3.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/craftcoffee/craftcoffe4.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/craftcoffee/craftcoffe5.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/craftcoffee/craftcoffe6.jpg" alt="${cafe.name}"/>
      `;    } else if (cafeId === 10) {
      // Use Lakbai Coffee images for Lakbai Coffee (ID 10)
      carouselHTML = `
        <img class="profile-slide" src="Images/Lakbai/lakbai1.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/Lakbai/lakbai2.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/Lakbai/Lakbai3.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/Lakbai/lakbai4.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/Lakbai/lakbai5.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/Lakbai/Lakbai6.jpg" alt="${cafe.name}"/>
        <img class="profile-slide" src="Images/Lakbai/lakbai7.jpg" alt="${cafe.name}"/>
      `;
    } else {
      // Original images for other cafes
      carouselHTML = `
        <img class="profile-slide" src="${cafe.img}" alt="${cafe.name}"/>
        <img class="profile-slide" src="https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=900&q=80" alt=""/>
        <img class="profile-slide" src="https://images.unsplash.com/photo-1611174743420-3d7df880ce32?w=900&q=80" alt=""/>
      `;
    }
    carousel.innerHTML = carouselHTML;
  }

  // Reset carousel to first slide and update dots
  const dots = document.querySelectorAll(".cdot");
  const numSlides = carousel
    ? carousel.querySelectorAll(".profile-slide").length
    : 3;
  dots.forEach((dot, idx) => {
    dot.style.display = idx < numSlides ? "block" : "none";
    dot.classList.remove("on");
    if (idx === 0) dot.classList.add("on");
  });

  // Update photos tab based on cafe ID
  updatePhotosTab(cafeId);
}
