window.JERWOO = { lineUrl: "https://line.me/R/ti/p/@yrh5443u" };

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-line]").forEach((link) => {
    link.href = window.JERWOO.lineUrl;
  });

  document.querySelectorAll("[data-quality-carousel]").forEach(initQualityCarousel);
});

function initQualityCarousel(root) {
  const track = root.querySelector("[data-quality-track]");
  if (!track) return;

  const slides = Array.from(track.children);
  const dots = Array.from(root.querySelectorAll("[data-quality-dot]"));
  const prev = root.querySelector("[data-quality-prev]");
  const next = root.querySelector("[data-quality-next]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let index = 0;
  let timer = null;

  const setIndex = (nextIndex) => {
    index = (nextIndex + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
  };

  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  const start = () => {
    if (reduceMotion || slides.length < 2 || timer) return;
    timer = window.setInterval(() => setIndex(index + 1), 4600);
  };

  prev?.addEventListener("click", () => {
    stop();
    setIndex(index - 1);
    start();
  });

  next?.addEventListener("click", () => {
    stop();
    setIndex(index + 1);
    start();
  });

  dots.forEach((dot) => {
    dot.addEventListener("click", () => {
      stop();
      setIndex(Number(dot.dataset.qualityDot || 0));
      start();
    });
  });

  root.addEventListener("mouseenter", stop);
  root.addEventListener("mouseleave", start);
  root.addEventListener("focusin", stop);
  root.addEventListener("focusout", start);
  root.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") setIndex(index - 1);
    if (event.key === "ArrowRight") setIndex(index + 1);
  });

  setIndex(0);
  start();
}
