// Holographic lightbox (posters.html): clicking the Carousel poster opens it
// on its own, rebuilt from depth layers cut out of the poster (back to front:
// the poster with its moons and header/footer text painted out, the moons,
// the carousel with its title, the arch and curtains, then the header and
// footer text). Each layer sits at its own depth, so as the poster tilts
// toward the cursor the layers slide apart like a hologram, with a rainbow
// sheen and a glare on top. With the cursor still, it sways on its own.
// Esc, the close button or a click outside closes it. Layers: images/holo/.
// Styles are under "Holographic lightbox" in style.css.
(function () {
  var POSTERS = {
    carousel: {
      label: "Carousel",
      // [image, depth in px]
      layers: [
        ["images/holo/holo-base.jpg", 0],
        ["images/holo/holo-moons.png", 30],
        ["images/holo/holo-carousel.png", 55],
        ["images/holo/holo-frame.png", 85],
        ["images/holo/holo-text.png", 120]
      ]
    }
  };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PERSPECTIVE = 1400;
  var MAX = 16; // degrees

  var box = document.createElement("div");
  box.className = "holo-lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.innerHTML =
    '<button class="holo-close" type="button" aria-label="Close">' +
    '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>' +
    '<div class="holo-stage"><div class="holo-card"></div></div>' +
    '<p class="holo-hint">Move to look around</p>';
  document.body.appendChild(box);
  var card = box.querySelector(".holo-card");
  var closeBtn = box.querySelector(".holo-close");

  var target = { x: 0.5, y: 0.5 }, now = { x: 0.5, y: 0.5 };
  var lastMove = 0, raf = null, lastFocus = null;

  function build(name) {
    var p = POSTERS[name];
    card.innerHTML = "";
    card.setAttribute("aria-label", p.label + " poster");
    p.layers.forEach(function (l, i) {
      var img = document.createElement("img");
      img.src = l[0];
      img.alt = "";
      img.className = "holo-layer" + (i === 0 ? " is-base" : "");
      // Pushed forward, then scaled back so it lines up with the base face-on
      var z = l[1];
      img.style.transform = "translateZ(" + z + "px) scale(" + ((PERSPECTIVE - z) / PERSPECTIVE).toFixed(4) + ")";
      card.appendChild(img);
    });
    var sheen = document.createElement("span");
    sheen.className = "holo-sheen";
    card.appendChild(sheen);
    var glare = document.createElement("span");
    glare.className = "holo-glare";
    card.appendChild(glare);
  }

  function step(time) {
    // With the cursor still for a moment, a slow sway takes over
    if (time - lastMove > 1400 || reduced) {
      var t = time / 1000;
      target.x = 0.5 + (reduced ? 0 : 0.22 * Math.sin(t * 0.6));
      target.y = 0.5 + (reduced ? 0 : 0.16 * Math.sin(t * 0.85 + 1));
    }
    now.x += (target.x - now.x) * 0.08;
    now.y += (target.y - now.y) * 0.08;
    card.style.setProperty("--ry", ((now.x - 0.5) * 2 * MAX).toFixed(2) + "deg");
    card.style.setProperty("--rx", ((0.5 - now.y) * 2 * MAX).toFixed(2) + "deg");
    card.style.setProperty("--gx", (now.x * 100).toFixed(1) + "%");
    card.style.setProperty("--gy", (now.y * 100).toFixed(1) + "%");
    raf = box.classList.contains("is-open") ? requestAnimationFrame(step) : null;
  }

  function open(name) {
    build(name);
    lastFocus = document.activeElement;
    target.x = target.y = now.x = now.y = 0.5;
    lastMove = 0;
    box.classList.add("is-open");
    document.documentElement.classList.add("is-holo-open");
    closeBtn.focus({ preventScroll: true });
    if (!raf) raf = requestAnimationFrame(step);
  }

  function close() {
    if (!box.classList.contains("is-open")) return;
    box.classList.remove("is-open");
    document.documentElement.classList.remove("is-holo-open");
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  box.addEventListener("pointermove", function (e) {
    var r = card.getBoundingClientRect();
    // Measured against the card, eased, and kept within a little past its edges
    target.x = Math.min(1.15, Math.max(-0.15, (e.clientX - r.left) / r.width));
    target.y = Math.min(1.15, Math.max(-0.15, (e.clientY - r.top) / r.height));
    lastMove = performance.now();
  });

  box.addEventListener("click", function (e) {
    if (!e.target.closest(".holo-card")) close();
  });
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });

  document.querySelectorAll("[data-holo]").forEach(function (el) {
    el.addEventListener("click", function () { open(el.dataset.holo); });
    el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(el.dataset.holo); }
    });
  });
})();
