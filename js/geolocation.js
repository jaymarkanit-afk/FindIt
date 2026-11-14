/* ═══════════════════════════════════════════════════════════════
   GEOLOCATION — Location detection and distance calculations
   ═══════════════════════════════════════════════════════════════ */

let userLocation = null;
let locationInitialized = false;

const GEO_OPTIONS = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };

function initializeGeolocation() {
  if (locationInitialized) return; // Prevent duplicate calls
  locateMe();
  locationInitialized = true;
}

function locateMe() {
  if (!("geolocation" in navigator)) {
    showToast("Location is not supported on this device.");
    return;
  }

  showToast("Getting your location…");

  navigator.geolocation.getCurrentPosition(
    function (position) {
      userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      // Recalculate distances from the real position
      cafeDatabase.forEach((cafe) => {
        cafe.distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          cafe.lat,
          cafe.lng,
        );
      });

      // Re-render everything that shows or sorts by distance
      filterAndDisplayCafes();
      populateNearYouCafes();

      if (map) {
        setUserMarker(); // replaces any previous "you are here" marker
        map.setView([userLocation.lat, userLocation.lng], 15);
      }

      showToast("Location found. Showing cafés near you.");
      updateGeoInfoCard();
    },
    function (error) {
      let msg = "Unable to get your location.";
      switch (error.code) {
        case error.PERMISSION_DENIED:
          msg = "Location access denied. Enable it in your browser settings.";
          break;
        case error.POSITION_UNAVAILABLE:
          msg = "Location unavailable. Please try again.";
          break;
        case error.TIMEOUT:
          msg = "Location request timed out. Please try again.";
          break;
      }
      showToast(msg);
      console.log("Geolocation error:", error);
      updateGeoInfoCard();
    },
    GEO_OPTIONS,
  );
}

function zoomToUserLocation() {
  showPanel("map"); // initialises the map if needed
  if (!map) return;

  if (userLocation) {
    map.setView([userLocation.lat, userLocation.lng], 17);
    showToast("Zoomed to your location");
  } else {
    locateMe();
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
  return Number((R * c).toFixed(1));
}

function updateGeoInfoCard() {
  const nearest = [...cafeDatabase].sort((a, b) => a.distance - b.distance)[0];

  const geoLocation = document.getElementById("geo-location");
  const geoCafeCount = document.getElementById("geo-cafe-count");
  const geoNearestDist = document.getElementById("geo-nearest-dist");

  if (geoLocation) {
    geoLocation.textContent = userLocation
      ? `${userLocation.lat.toFixed(4)}°N, ${userLocation.lng.toFixed(4)}°E`
      : "Butuan City";
  }
  if (geoCafeCount) geoCafeCount.textContent = cafeDatabase.length;
  if (geoNearestDist)
    geoNearestDist.textContent = nearest ? nearest.distance + " km" : "–";
}
