// Credit wellness concept (Fun UI & Ideas page): a looping demo. Each loop:
// a "Checking your wellness" loader, then the score fades in mid-screen and
// its checks pop in one by one, the score rises to the top, and the four
// cards fade in one after another, each with its own small animation
// (utilization fills its bar, credit score draws its line, the payment
// streak ticks off its months, savings rate grows its bars) while their
// numbers count up. Then it all fades and starts over. Plays only while on
// screen; reduced motion gets the finished screen. Styles are under
// "Credit wellness animation" in style.css; the stages are classes on
// .cw-app (is-loading, is-score, is-up, is-cards, is-out).
(function () {
  var app = document.querySelector(".cw-app");
  if (!app) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var STAGES = ["is-loading", "is-score", "is-up", "is-cards", "is-out"];

  // The numbers that count up as their cards come in: [element, from, to, suffix]
  function counter(sel) { return app.querySelector(sel + " .cw-value span"); }
  var COUNTS = [
    [counter(".cw-util"), 0, 30, "%"],
    [counter(".cw-credit"), 560, 625, ""],
    [counter(".cw-streak"), 0, 4, " mo"]
  ];

  function countUp(delay) {
    COUNTS.forEach(function (c, i) {
      var el = c[0], start = null;
      el.textContent = c[1] + c[3];
      timers.push(setTimeout(function () {
        function tick(now) {
          if (!start) start = now;
          var t = Math.min(1, (now - start) / 900);
          var e = 1 - Math.pow(1 - t, 3);
          el.textContent = Math.round(c[1] + (c[2] - c[1]) * e) + c[3];
          if (t < 1 && running) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }, delay + i * 110));
    });
  }

  function set(stage) { app.classList.add(stage); }

  // Back to the start with no transitions, while everything is faded out
  function reset() {
    app.classList.add("is-reset");
    STAGES.forEach(function (s) { app.classList.remove(s); });
    void app.offsetWidth;
    app.classList.remove("is-reset");
  }

  var timers = [], running = false;
  function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

  function loop() {
    reset();
    at(60, function () { set("is-loading"); });
    at(1900, function () { app.classList.remove("is-loading"); });
    at(2200, function () { set("is-score"); });
    at(3700, function () { set("is-up"); });
    at(4300, function () { set("is-cards"); countUp(350); });
    at(9300, function () { set("is-out"); });
    at(9900, loop);
  }

  function start() {
    if (running) return;
    running = true;
    loop();
  }

  function stop() {
    running = false;
    timers.forEach(clearTimeout);
    timers = [];
  }

  if (reduced) {
    app.classList.add("is-reset", "is-score", "is-up", "is-cards");
    return;
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      entries[0].isIntersecting ? start() : stop();
    }, { threshold: 0.3 }).observe(app);
  } else {
    start();
  }
})();
