// Total spend concept (Fun UI & Ideas page): a looping demo. Each loop: a
// "Checking spending, oh boy" loader, then the screen fades in piece by
// piece as the total counts up. A touch cursor then drags the screen up and
// lets go, so it carries on with some inertia down to the last cards, and
// later flicks it back to the top. Then it all fades and starts over. Plays
// only while on screen; reduced motion gets the finished screen. Styles are
// under "Total spend animation" in style.css; the stages are classes on
// .ts-app (is-loading, is-in, is-cursor, is-press, is-out).
(function () {
  var app = document.querySelector(".ts-app");
  if (!app) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var scroller = app.querySelector(".ts-scroll");
  var amount = app.querySelector(".ts-amount");
  var TOTAL = 12345.67;
  var MAX = 455; // how far the screen scrolls, in points

  var cursor = document.createElement("span");
  cursor.className = "mock-cursor";
  app.appendChild(cursor);
  function cursorTo(x, y) {
    cursor.style.setProperty("--cx", x.toFixed(1));
    cursor.style.setProperty("--cy", y.toFixed(1));
  }

  // What fades in, one after another
  var parts = [".ts-month", ".ts-total", ".ts-insight", ".ts-essential", ".ts-discretionary", ".ts-selfcare", ".ts-wildcards"];
  parts.forEach(function (sel, i) {
    var el = app.querySelector(sel);
    el.classList.add("ts-part");
    el.style.transitionDelay = (i * 90) + "ms";
  });

  function money(v) {
    return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // The total spins in like a slot machine (slot-counter.js)
  SlotCounter.mount(amount, money(TOTAL));

  var scrollY = 0;
  function scrollTo(y) {
    scrollY = y;
    scroller.style.setProperty("--sy", y.toFixed(2));
    // A thin line under the header once the screen has scrolled
    app.classList.toggle("is-scrolled", y > 2);
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutSine(t) { return -(Math.cos(Math.PI * t) - 1) / 2; }

  var run = 0;
  function tween(ms, id, fn) {
    return new Promise(function (resolve, reject) {
      var start = performance.now();
      function step(now) {
        if (id !== run) { reject("stopped"); return; }
        var t = Math.min(1, (now - start) / ms);
        fn(t);
        if (t < 1) requestAnimationFrame(step); else resolve();
      }
      requestAnimationFrame(step);
    });
  }
  function wait(ms, id) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
    });
  }

  // A drag by the cursor: the screen follows the finger from y0 to y1 (the
  // finger's own points), then keeps going after the release and eases to
  // a stop at `to`, its speed matching the drag's at the moment it let go
  async function fling(x, y0, y1, ms, to, id) {
    var from = scrollY, dragged = y0 - y1;
    cursorTo(x, y0);
    app.classList.add("is-cursor");
    await wait(450, id);
    app.classList.add("is-press", "is-drag");
    await wait(120, id);
    await tween(ms, id, function (t) {
      var e = easeInOutSine(t * 0.5) * 2; // speeding up, still moving at the end
      cursorTo(x, y0 - (y0 - y1) * e);
      scrollTo(from + dragged * e);
    });
    app.classList.remove("is-press", "is-drag");
    app.classList.remove("is-cursor");
    var start = scrollY, rest = to - start;
    var speed = Math.abs(dragged) * Math.PI / 2 / ms; // at release, points per ms
    var glide = Math.max(500, 3 * Math.abs(rest) / speed);
    await tween(glide, id, function (t) { scrollTo(start + rest * easeOutCubic(t)); });
  }

  // Back to the start with no transitions, while everything is faded out
  function reset() {
    app.classList.add("is-reset");
    app.classList.remove("is-loading", "is-in", "is-cursor", "is-press", "is-drag", "is-out");
    scrollTo(0);
    SlotCounter.reset(amount);
    void app.offsetWidth;
    app.classList.remove("is-reset");
  }

  async function loop(id) {
    while (true) {
      reset();
      await wait(200, id);

      // Checking spending, oh boy…
      app.classList.add("is-loading");
      await wait(1700, id);
      app.classList.remove("is-loading");
      await wait(350, id);

      // The screen fades in as the total spins in
      app.classList.add("is-in");
      SlotCounter.spin(amount);
      await wait(2600, id);

      // Drag up and let go: it glides down to the last cards
      await fling(200, 660, 420, 520, MAX, id);
      await wait(1800, id);

      // A flick back to the top
      await fling(200, 330, 470, 320, 0, id);
      await wait(1600, id);

      // Fade out before the next loop
      app.classList.add("is-out");
      await wait(700, id);
    }
  }

  function start() {
    run++;
    loop(run).catch(function () {});
  }

  if (reduced) {
    reset();
    SlotCounter.show(amount);
    app.classList.add("is-in");
    return;
  }

  reset();
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) start(); else run++;
    }, { threshold: 0.3 }).observe(app);
  } else {
    start();
  }
})();
