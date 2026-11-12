// Research to framework (home-tab-refresh.html): the pattern tally and the
// Quick Actions framework as cards in one container, one at a time.
//   Watch: the tally comes up and fills in, then the framework. Then it
//   starts over.
//   Explore: a switch picks the table; the future rails open on click.
// Plays only while on screen. Load after mode-ring.js, pattern-tally.js and
// framework-table.js. Styles are under "Research to framework" in style.css.
(function () {
  var show = document.querySelector(".fw-show");
  if (!show) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cards = {
    tally: show.querySelector('.fw-card[data-card="tally"]'),
    framework: show.querySelector('.fw-card[data-card="framework"]')
  };
  var stage = show.querySelector(".fw-stage");
  var hint = show.querySelector(".fw-hint");
  var modeButtons = show.querySelectorAll(".proto-mode button");
  var cardButtons = show.querySelectorAll(".fw-switch button");
  var ring = window.modeRing ? window.modeRing(show.querySelector(".proto-mode")) : null;

  var CAPTIONS = {
    tally: "Benchmarking Seven Apps' Move Money Screens",
    framework: "The Quick Actions Framework"
  };

  var run = 0;
  var inView = false;
  var current = null;

  // Holds while the demo is paused (watch-pause.js), if that's loaded
  function wait(ms, id) {
    if (window.watchPause) return watchPause.wait(show, ms, function () { return id === run; });
    return new Promise(function (resolve, reject) {
      setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
    });
  }

  function say(text) {
    if (hint.textContent === text) return;
    hint.style.opacity = 0;
    setTimeout(function () { hint.textContent = text; hint.style.opacity = ""; }, 200);
  }

  // The stage takes the height of the card that's showing, so the container
  // grows and shrinks with it (and with the future rails opening)
  function fit() {
    if (current) stage.style.height = cards[current].offsetHeight + "px";
  }
  if ("ResizeObserver" in window) {
    var ro = new ResizeObserver(fit);
    ro.observe(cards.tally);
    ro.observe(cards.framework);
  }
  window.addEventListener("resize", fit);

  // Brings a card up (the other fades away) and replays its fill-in
  function showCard(name) {
    Object.keys(cards).forEach(function (key) {
      var on = key === name;
      cards[key].classList.toggle("is-active", on);
      cards[key].inert = !on;
    });
    cardButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.card === name)); });
    if (current !== name && cards[name].reveal) setTimeout(cards[name].reveal, 150);
    current = name;
    fit();
    say(CAPTIONS[name]);
  }

  // One loop is 11.2s: the sum of the waits below
  var LOOP_MS = 11200;

  async function loop(id) {
    while (true) {
      if (ring) ring.start(LOOP_MS);
      cards.framework.expand(false);
      showCard("tally");
      await wait(5200, id);
      showCard("framework");
      await wait(5000, id);
      current = null; // so the tally fills in again
      await wait(1000, id);
    }
  }

  function start() {
    run++;
    if (ring) ring.stop();
    if (show.dataset.mode === "watch") {
      current = null;
      if (reduced) { showCard("framework"); return; }
      if (inView) loop(run).catch(function () {});
    } else {
      cards.framework.expand(false);
      current = null;
      showCard("tally");
    }
  }

  modeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (show.dataset.mode === btn.dataset.mode) return;
      show.dataset.mode = btn.dataset.mode;
      modeButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      start();
    });
  });

  cardButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (show.dataset.mode !== "explore") return;
      showCard(btn.dataset.card);
    });
  });

  cards.framework.inert = true;

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (show.dataset.mode === "watch") {
        if (inView) start();
        else { run++; if (ring) ring.stop(); }
      }
    }, { threshold: 0.3 }).observe(show);
  } else {
    inView = true;
    start();
  }
})();
