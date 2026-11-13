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
    if (slot.dataset.sheet === "send") addRails(copy);
    slot.appendChild(copy);
  });

  // Next's Send sheet: just the Interac send row (no "add" badge), then the
  // future payment rails as rows under it
  function addRails(copy) {
    // The prototype's sheets are images: Next gets its own Send sheet image
    // (just the Interac send row), with each rail row its own image so they
    // still ease in one after another
    var baked = copy.querySelector('.qa-sheet[data-sheet="send"] .qa-baked-sheet');
    if (baked) {
      var RAILS = [[156.53, 19.98, 335.03, 101.05], [257.57, 19.98, 335.03, 101.05],
        [358.62, 19.98, 335.03, 101.05], [459.66, 19.98, 335.03, 98.93]];
      var html = '<img src="images/home-qa/tl-send.avif" alt="">' +
        '<button class="qa-close" type="button" tabindex="-1" aria-label="Close" style="--t: 20.51; --l: 16.01; --w: 31.99; --h: 31.99"></button>';
      RAILS.forEach(function (r, i) {
        html += '<img class="tl-rail-row qa-baked-rail" src="images/home-qa/tl-rail-' + i + '.avif" alt="" style="--i: ' + i +
          '; --t: ' + r[0] + '; --l: ' + r[1] + '; --w: ' + r[2] + '; --h: ' + r[3] + '">';
      });
      baked.style.setProperty("--h", 598.56);
      baked.innerHTML = html;
      return;
    }
    var list = copy.querySelector('.qa-sheet[data-sheet="send"] .qa-list');
    if (!list) return;
    var rows = list.querySelectorAll(".qa-row");
    if (rows[1]) rows[1].remove();
    if (rows[0]) {
      var badge = rows[0].querySelector(".qa-badge");
      if (badge) badge.remove();
      var note = rows[0].querySelector(".qa-row-text small");
      if (note) note.textContent = "Send up to $3,000.";
    }
    [
      ["internal-transfer", "Neo P2P Transfer", "Send money to other Neo members instantly."],
      ["link", "Wire Transfer", "Send larger amounts straight to any bank."],
      ["globe", "International Transfer", "Send money abroad, in their currency."],
      ["bill", "Bill Split", "Split a bill with friends, then settle up."]
    ].forEach(function (r, i) {
      var row = document.createElement("div");
      row.className = "qa-row tl-rail-row";
      row.style.setProperty("--i", i);
      row.innerHTML = '<span class="qa-avatar"><img src="images/neo-ui/sheets/' + r[0] + '.svg" width="24" height="24" alt=""></span>' +
        '<div class="qa-row-body"><span class="qa-row-text"><span>' + r[1] + '</span><small>' + r[2] + '</small></span>' +
        '<img class="qa-chev" src="images/neo-ui/sheets/chevron.svg" width="24" height="24" alt=""></div>';
      list.appendChild(row);
    });
  }

  var run = 0;
  var inView = false;

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
