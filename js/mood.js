/* ═══════════════════════════════════════════════════════════════
   MOOD — Mood selection and personalization
   ═══════════════════════════════════════════════════════════════ */

const moodDB = {
  study: {
    msg: "📚 <strong>Brevi:</strong> Locking in? Found 3 cafés with super-fast WiFi & power outlets near you!",
    chips: ["chip-study", "chip-study", "chip-study"],
    tags: ["Study", "Study", "Study"],
    title: "☕ Perfect for <em>studying</em>",
  },
  chill: {
    msg: "😌 <strong>Brevi:</strong> Chill mode! Here are 3 laid-back spots with the softest seating in Butuan!",
    chips: ["chip-chill", "chip-chill", "chip-chill"],
    tags: ["Chill", "Chill", "Chill"],
    title: "🛋️ Perfect for <em>chilling out</em>",
  },
  date: {
    msg: "💕 <strong>Brevi:</strong> Date night? These 3 romantic cafés have the perfect candlelit ambiance!",
    chips: ["chip-date", "chip-date", "chip-date"],
    tags: ["Date Spot", "Date Spot", "Date Spot"],
    title: "💕 Perfect for a <em>date night</em>",
  },
  solo: {
    msg: "🎧 <strong>Brevi:</strong> Solo time is precious. 3 peaceful cafés where you can fully reset & recharge.",
    chips: ["chip-chill", "chip-study", "chip-chill"],
    tags: ["Solo", "Solo", "Solo"],
    title: "🎧 Perfect for <em>solo time</em>",
  },
};

function setMood(el, mood) {
  document
    .querySelectorAll(".mood-tile")
    .forEach((m) => m.classList.remove("on"));
  el.classList.add("on");
  const d = moodDB[mood];
  document.getElementById("mascot-msg").innerHTML = d.msg;
  document.getElementById("smart-title").innerHTML = d.title;
  document.querySelectorAll("#smart-recs .rec-chip").forEach((chip, i) => {
    chip.className = "rec-chip " + d.chips[i % d.chips.length];
    chip.textContent = d.tags[i % d.tags.length];
  });
}
