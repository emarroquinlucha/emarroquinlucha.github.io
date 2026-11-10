// Posters (resume, Fun!): each poster drifts slowly in 3D on its own, with a
// soft glare sliding across it. On hover it leans toward the cursor instead,
// like the work stamps, with a stronger glare that follows the cursor; when
// the cursor leaves it eases back into the drift. Runs only while on screen.
// Styles are under "Posters" in style.css.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var DRIFT = 5;  // degrees, the idle sway
  var TILT = 14;  // degrees, the most a hover leans it

  document.querySelectorAll(".poster").forEach(function (poster, index) {
    var tilt = poster.querySelector(".poster-tilt");
    var hover = null;          // cursor position (0–1) while hovering
    var current = { x: 0.5, y: 0.5 };
    var frame = null;
    var inView = false;
    var phase = index * 1.7;   // so several posters don't sway in step
    var amp = DRIFT * 2;       // eases between the drift's and the hover's reach

    function set(x, y) {
      amp += ((hover ? TILT : DRIFT * 2) - amp) * 0.1;
      tilt.style.setProperty("--ry", ((x - 0.5) * 2 * amp).toFixed(2) + "deg");
      tilt.style.setProperty("--rx", ((0.5 - y) * 2 * amp).toFixed(2) + "deg");
      tilt.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
      tilt.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
    }

    function step(time) {
      var t = time / 1000;
      // The idle drift: a slow figure-of-eight, about a quarter of the way
      // out from the centre
      var target = hover || {
        x: 0.5 + 0.25 * Math.sin(t * 0.55 + phase),
        y: 0.5 + 0.25 * Math.sin(t * 0.8 + phase) * Math.cos(t * 0.3)
      };
      var ease = hover ? 0.18 : 0.06;
      current.x += (target.x - current.x) * ease;
      current.y += (target.y - current.y) * ease;
      set(current.x, current.y);
      frame = inView ? requestAnimationFrame(step) : null;
    }

    function start() {
      if (!frame && !reduced) frame = requestAnimationFrame(step);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) start();
      }).observe(poster);
    } else {
      inView = true;
      start();
    }

    if (!canHover || reduced) return;

    // Measured against the poster box, which doesn't tilt
    poster.addEventListener("pointermove", function (e) {
      var r = poster.getBoundingClientRect();
      hover = {
        x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
        y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))
      };
      poster.classList.add("is-tilting");
      start();
    });

    poster.addEventListener("pointerleave", function () {
      hover = null;
      poster.classList.remove("is-tilting");
    });
  });
})();
