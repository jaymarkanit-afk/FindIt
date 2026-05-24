/* ═══════════════════════════════════════════════════════════════
   CAROUSEL — Image carousel management
   ═══════════════════════════════════════════════════════════════ */

let carIdx = 0;
const carTotal = 3;

function carouselGo(idx) {
  carIdx = idx;
  const strip = document.getElementById("carousel-strip");
  strip.style.transform = `translateX(-${idx * 100}%)`;
  strip.style.transition = "transform .45s cubic-bezier(.4,0,.2,1)";
  document
    .querySelectorAll(".cdot")
    .forEach((d, i) => d.classList.toggle("on", i === idx));
}

function carouselMove(dir) {
  carouselGo((carIdx + dir + carTotal) % carTotal);
}
