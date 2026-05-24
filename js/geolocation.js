/* ═══════════════════════════════════════════════════════════════
   GEOLOCATION — Location detection and distance calculations
   ═══════════════════════════════════════════════════════════════ */

let userLocation = { lat: 8.9686, lng: 125.5287 };
let locationInitialized = false;

function initializeGeolocation() {
  if (locationInitialized) return; // Prevent duplicate calls
  locateMe();
  locationInitialized = true;
}

function locateMe() {
  showToast("📍 Getting your location...");

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Recalculate distances
        cafeDatabase.forEach((cafe) => {
          cafe.distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            cafe.lat,
            cafe.lng,
          );
        });

        // Re-sort by distance
        const filtered = getFilteredCafes();
        displaySearchResults(filtered);
        updateMap(filtered);

        if (map) {
          map.setView([userLocation.lat, userLocation.lng], 15);
          // Update user marker
          const userIcon = L.divIcon({
            html: '<div style="width:20px;height:20px;background:var(--accent);border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.3)"></div>',
            iconSize: [20, 20],
            className: "user-marker",
          });
          // Remove old markers and readd
          markers.forEach((m) => map.removeLayer(m));
          markers = [];
          L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
            .addTo(map)
            .bindPopup("📍 Your location");
          addCafeMarkers(cafeDatabase);
        }

        showToast("📍 Location found! Showing cafés near you.");
        updateGeoInfoCard();
      },
      function (error) {
        let msg = "Unable to get location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            msg = "📍 Location access denied. Please enable location in settings to see cafés near you.";
            break;
          case error.POSITION_UNAVAILABLE:
            msg = "📍 Location service unavailable. Using default location.";
            break;
          case error.TIMEOUT:
            msg = "📍 Location request timed out. Using default location.";
            break;
        }
        showToast(msg);
        console.log("Geolocation error:", error);
        
        // Use default Butuan City location as fallback
        updateGeoInfoCard();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  } else {
    showToast("❌ Geolocation not supported. Using default location.");
    console.log("Geolocation API not available");
  }
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(1);
}

function updateGeoInfoCard() {
  // This updates any UI that shows location info
  const geoCard = document.querySelector("[data-geo]");
  if (geoCard) {
    geoCard.textContent = `📍 ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`;
  }
}

function updateGeoInfoCard() {
  // Get nearest cafe distance
  const sortedByCafe = [...cafeDatabase].sort(
    (a, b) => a.distance - b.distance,
  );
  const nearestDistance = sortedByCafe[0]?.distance || "N/A";

  // Update card elements
  const geoLocation = document.getElementById("geo-location");
  const geoCafeCount = document.getElementById("geo-cafe-count");
  const geoNearestDist = document.getElementById("geo-nearest-dist");

  if (geoLocation) {
    geoLocation.textContent = `${userLocation.lat.toFixed(4)}°N, ${userLocation.lng.toFixed(4)}°E`;
  }

  if (geoCafeCount) {
    geoCafeCount.textContent = cafeDatabase.length;
  }

  if (geoNearestDist) {
    geoNearestDist.textContent = nearestDistance + " km";
  }
}
