/* ═══════════════════════════════════════════════════════════════
   MAIN — Application initialization and setup
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener("DOMContentLoaded", () => {
  // Wait for pages to load first
  setTimeout(() => {
    // Set up greeting based on time of day
    const h = new Date().getHours();
    let msg;

    if (h >= 5 && h < 11) {
      msg =
        "🌅 <strong>Brevi:</strong> Good morning! Breakfast cafés near you have fresh pastries ready. Top picks: Paramount Coffee &amp; Craft Coffee Roastery — both open now!";
      document.querySelectorAll("#smart-recs .rec-chip").forEach((c) => {
        c.className = "rec-chip chip-morn";
        c.textContent = "Morning Pick";
      });
      document.getElementById("smart-title").innerHTML =
        "🌅 Perfect for your <em>morning</em>";
    } else if (h >= 11 && h < 17) {
      msg =
        "☀️ <strong>Brevi:</strong> Afternoon focus! Paramount Coffee (J.C. Aquino Ave) &amp; Dodo Workspace are perfect for an afternoon study session!";
    } else if (h >= 17 && h < 20) {
      msg =
        "🌆 <strong>Brevi:</strong> Golden hour! These 3 cafés are buzzing right now — perfect for unwinding.";
      document.querySelectorAll("#smart-recs .rec-chip").forEach((c) => {
        c.className = "rec-chip chip-chill";
        c.textContent = "Evening Pick";
      });
    } else {
      msg =
        "🌙 <strong>Brevi:</strong> Night owl? Here are 3 cozy spots still open — perfect for a late-night session.";
      document.querySelectorAll("#smart-recs .rec-chip").forEach((c) => {
        c.className = "rec-chip chip-date";
        c.textContent = "Night Pick";
      });
      document.getElementById("smart-title").innerHTML =
        "🌙 Perfect for <em>tonight</em>";
    }

    const mascotMsg = document.getElementById("mascot-msg");
    if (mascotMsg) {
      mascotMsg.innerHTML = msg;
    }

    // Display initial cafés
    filterAndDisplayCafes();

    // Initialize carousel
    const strip = document.getElementById("carousel-strip");
    if (strip) {
      strip.style.display = "flex";
      strip.style.transition = "transform .45s cubic-bezier(.4,0,.2,1)";
    }
  }, 500); // Wait for pages to load
});
