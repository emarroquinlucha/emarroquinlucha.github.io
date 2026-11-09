// Approach board (case studies). "Screens / Wireframes" switches between the
// real screenshots and just their colored layout blocks, and the legend
// highlights one type of block across every phone: hover previews a type,
// clicking (or tapping) pins it until it's clicked again.
//
// A board with data-mode also has "Watch": all eight apps, looping between
// their real screens and their wireframes. "explore" is the board on its own.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".approach-board").forEach(function (board) {
    var views = board.querySelectorAll("[data-view]");
    var keys = board.querySelectorAll(".approach-key");
    var pinned = null;

    function setWire(on) {
      board.classList.toggle("is-wireframe", on);
      views.forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.view === "wireframes") === on); });
    }

    function focus(zone) {
      if (zone) board.dataset.focus = zone;
      else delete board.dataset.focus;
    }

    views.forEach(function (button) {
      button.addEventListener("click", function () { setWire(button.dataset.view === "wireframes"); });
    });

    keys.forEach(function (key) {
      if (key.tagName !== "BUTTON") return;
      key.setAttribute("aria-pressed", "false");
      key.addEventListener("mouseenter", function () { if (board.dataset.mode !== "watch") focus(key.dataset.zone); });
      key.addEventListener("mouseleave", function () { if (board.dataset.mode !== "watch") focus(pinned); });
      key.addEventListener("click", function () {
        if (board.dataset.mode === "watch") return;
        pinned = pinned === key.dataset.zone ? null : key.dataset.zone;
        keys.forEach(function (k) { k.setAttribute("aria-pressed", k.dataset.zone === pinned); });
        focus(pinned);
      });
    });

    if (board.dataset.mode) watch(board, setWire, focus, function () {
      pinned = null;
      keys.forEach(function (k) { k.setAttribute("aria-pressed", "false"); });
    });
  });

  function watch(board, setWire, focus, clearPinned) {
    var modes = board.querySelectorAll(".approach-mode button");
    var stage = board.querySelector(".approach-stage");
    var hint = board.querySelector(".approach-hint");
    var run = 0;
    var inView = false;
    // One loop is 7.2s: the sum of the waits in loop() below
    var LOOP_MS = 7200;
    var ring = window.modeRing ? window.modeRing(board.querySelector(".approach-mode")) : null;

    function wait(ms, id) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
      });
    }

    function reset() {
      focus(null);
      setWire(false);
      board.dataset.stage = "grid";
      hint.textContent = "Eight Banking Apps, Side by Side";
    }

    async function loop(id) {
      reset();
      while (true) {
        if (ring) ring.start(LOOP_MS);
        hint.textContent = "Eight Banking Apps, Side by Side";
        setWire(false);
        await wait(3600, id);
        hint.textContent = "Stripping Away the Visuals";
        setWire(true);
        await wait(3600, id);
      }
    }

    function start() {
      run++;
      if (board.dataset.mode === "watch" && inView) loop(run).catch(function () {});
    }

    function setMode(mode) {
      board.dataset.mode = mode;
      modes.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.mode === mode); });
      run++;
      if (ring) ring.stop();
      clearPinned();
      focus(null);
      if (mode === "watch") {
        reset();
        start();
      } else {
        board.dataset.stage = "grid";
        setWire(false);
      }
    }

    modes.forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.dataset.mode); });
    });

    // Plays only while on screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) start();
        else { run++; if (ring) ring.stop(); }
      }, { threshold: 0.3 }).observe(stage);
    } else {
      inView = true;
    }

    // Visitors who prefer less motion start on Explore
    setMode(reduced ? "explore" : "watch");
  }
})();
