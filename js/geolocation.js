/* ═══════════════════════════════════════════════════════════════
   GEOLOCATION — Location detection and distance calculations
   ═══════════════════════════════════════════════════════════════ */

let userLocation = null;
let locationInitialized = false;

// Set every café's `distance` (km) from the user once they share their
// location, otherwise from the centre of the selected place
function updateDistances() {
  const from = userLocation || getSelectedPlace();
  cafeDatabase.forEach((cafe) => {
    cafe.distance = calculateDistance(from.lat, from.lng, cafe.lat, cafe.lng);
  });
}

// "from you" once location is known, otherwise "from city centre"
function distanceFrom() {
  return userLocation ? "from you" : `from ${getSelectedPlace().name} centre`;
}

// Keep every "from …" label on the page in step with the distances
function updateDistanceLabels() {
  document.querySelectorAll(".dist-from").forEach((el) => {
    el.textContent = distanceFrom();
  });
}

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
      updateDistances();
      updateDistanceLabels();

      // Re-render everything that shows or sorts by distance
      filterAndDisplayCafes();
      renderNearYou();

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
  const place = getSelectedPlace();
  const inPlace = cafesInPlace(place);
  const nearest = [...inPlace].sort((a, b) => a.distance - b.distance)[0];

  const geoLocation = document.getElementById("geo-location");
  const geoCafeCount = document.getElementById("geo-cafe-count");
  const geoNearestDist = document.getElementById("geo-nearest-dist");

  if (geoLocation) {
    geoLocation.textContent = userLocation
      ? `${userLocation.lat.toFixed(4)}°N, ${userLocation.lng.toFixed(4)}°E`
      : place.name;
  }
  if (geoCafeCount) geoCafeCount.textContent = inPlace.length;
  if (geoNearestDist)
    geoNearestDist.textContent = nearest ? nearest.distance + " km" : "–";
}

// Distances from the city centre are available as soon as this file loads
updateDistances();
