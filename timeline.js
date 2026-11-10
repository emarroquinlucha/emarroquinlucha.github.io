// Now / Next / Future (home-tab-refresh.html): the closing timeline. Clones
// the hero's new Home phone into Now and the quick actions phone (with its
// Send sheet open) into Next, then:
//   Watch: steps Now, Next, Future, holding on each, and loops.
//   Explore: the Now / Next / Future switch picks the stage.
// The track's fill and playhead move to the current stop. Plays only while on
// screen. Load after mode-ring.js and the scripts that build the phones it
// clones. Styles are under "Now / Next / Future" in style.css.
(function () {
  var show = document.querySelector(".tl-show");
  if (!show) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var STAGES = ["now", "next", "future"];
  var CAPTIONS = {
    now: "Now: The Refreshed Home, Shipped",
    next: "Next: Room for Future Payment Rails",
    future: "Future: A Broader App Structure"
  };
  var track = show.querySelector(".tl-track");
  var hint = show.querySelector(".tl-hint");
  var modeButtons = show.querySelectorAll(".proto-mode button");
  var stageButtons = show.querySelectorAll(".tl-switch button");
  var stops = show.querySelectorAll(".tl-stops li");
  var ring = window.modeRing ? window.modeRing(show.querySelector(".proto-mode")) : null;

  // Fill the slots with copies of phones built elsewhere on the page
  show.querySelectorAll(".tl-slot").forEach(function (slot) {
    var source = document.querySelector(slot.dataset.clone);
    if (!source) return;
    var copy = source.cloneNode(true);
    copy.removeAttribute("role");
    copy.removeAttribute("aria-label");
    copy.setAttribute("aria-hidden", "true");
    copy.querySelectorAll("[tabindex], button").forEach(function (el) { el.tabIndex = -1; });
    copy.querySelectorAll(".is-open, .is-lit, .is-bouncing, .is-tapping").forEach(function (el) {
      el.classList.remove("is-open", "is-lit", "is-bouncing", "is-tapping");
    });
    copy.classList.remove("is-open");
    var mockBody = copy.querySelector(".phone-mock-body");
    if (mockBody) mockBody.removeAttribute("style");
    if (slot.dataset.sheet) {
      var sheet = copy.querySelector('.qa-sheet[data-sheet="' + slot.dataset.sheet + '"]');
      if (sheet) { sheet.classList.add("is-open"); copy.classList.add("is-open"); }
    }
    slot.appendChild(copy);
  });

  var run = 0;
  var inView = false;

  function wait(ms, id) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
    });
  }

  function say(text) {
    if (hint.textContent === text) return;
    hint.style.opacity = 0;
    setTimeout(function () { hint.textContent = text; hint.style.opacity = ""; }, 200);
  }

  function go(name) {
    var i = STAGES.indexOf(name);
    show.querySelectorAll(".tl-scene").forEach(function (scene) {
      var on = scene.dataset.stage === name;
      scene.classList.toggle("is-active", on);
      scene.inert = !on;
    });
    track.style.setProperty("--p", i * 50);
    stops.forEach(function (stop, j) {
      stop.classList.toggle("is-on", j === i);
    });
    stageButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.stage === name)); });
    say(CAPTIONS[name]);
  }

  // One loop is 13.5s: the sum of the waits below
  var LOOP_MS = 13500;

  async function loop(id) {
    while (true) {
      if (ring) ring.start(LOOP_MS);
      go("now");
      await wait(4000, id);
      go("next");
      await wait(4500, id);
      go("future");
      await wait(5000, id);
    }
  }

  function start() {
    run++;
    if (ring) ring.stop();
    if (show.dataset.mode === "watch") {
      if (reduced) { go("now"); return; }
      if (inView) loop(run).catch(function () {});
    } else {
      go("now");
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

  stageButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (show.dataset.mode !== "explore") return;
      go(btn.dataset.stage);
    });
  });

  go("now");

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
