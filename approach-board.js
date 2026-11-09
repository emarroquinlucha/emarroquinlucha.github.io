// Approach board (case studies). "Screens / Wireframes" switches between the
// real screenshots and just their colored layout blocks, and the legend
// highlights one type of block across every phone: hover previews a type,
// clicking (or tapping) pins it until it's clicked again.
//
// A board with data-mode also has "Watch": the apps show two at a time, big,
// then fade to wireframes and slide back into the grid, then the first pair
// zooms back in as wireframes and turns back into screens, and it carries on.
// "Explore" is the board on its own.
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
    var phones = Array.prototype.slice.call(board.querySelectorAll(".approach-grid .approach-phone"));
    var names = phones.map(function (phone) { return phone.querySelector("figcaption").textContent; });
    var pairs = [];
    for (var i = 0; i < phones.length; i += 2) pairs.push([i, i + 1]);
    var run = 0;
    var inView = false;
    var current = 0;
    // One loop is 14.5s: the sum of the waits in loop() below
    var LOOP_MS = 14500;
    var ring = window.modeRing ? window.modeRing(board.querySelector(".approach-mode")) : null;

    function wait(ms, id) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
      });
    }

    // Applies changes with transitions switched off
    function instantly(fn) {
      phones.forEach(function (p) { p.style.transition = "none"; });
      fn();
      void stage.offsetWidth;
      phones.forEach(function (p) { p.style.transition = ""; });
    }

    // The transform that moves a grid phone into the left or right big slot.
    // offsetLeft/Top ignore transforms, so this is from its place in the grid.
    function bigSlot(phone, side) {
      var gap = Math.min(40, stage.clientWidth * 0.06);
      var width = Math.min(parseFloat(getComputedStyle(stage).getPropertyValue("--spot")),
        (stage.clientWidth - gap) / 2);
      var scale = width / phone.offsetWidth;
      var height = phone.querySelector(".phone-mock-body").offsetHeight * scale;
      var left = stage.clientWidth / 2 + (side ? gap / 2 : -gap / 2 - width);
      var top = (stage.clientHeight - height) / 2;
      return "translate(" + (left - phone.offsetLeft) + "px, " + (top - phone.offsetTop) + "px) scale(" + scale + ")";
    }

    function showPair(k, fade) {
      current = k;
      var on = pairs[k];
      var apply = function () {
        phones.forEach(function (p, i) {
          var side = on.indexOf(i);
          if (side < 0) return;
          p.style.transform = bigSlot(p, side);
        });
      };
      if (fade) {
        // Place the incoming pair while it's invisible, then cross-fade
        instantly(apply);
        phones.forEach(function (p, i) { p.classList.toggle("is-off", on.indexOf(i) < 0); });
      } else {
        instantly(function () {
          apply();
          phones.forEach(function (p, i) { p.classList.toggle("is-off", on.indexOf(i) < 0); });
        });
      }
      hint.textContent = names[on[0]] + " and " + names[on[1]];
    }

    // Phones that faded out go back to their grid spots, out of sight
    function parkHidden() {
      instantly(function () {
        phones.forEach(function (p) { if (p.classList.contains("is-off")) p.style.transform = ""; });
      });
    }

    function reset() {
      focus(null);
      setWire(false);
      board.dataset.stage = "spot";
      instantly(function () { phones.forEach(function (p) { p.style.transform = ""; }); });
      showPair(0, false);
    }

    // From the grid, the first pair grows back into the big slots (still as
    // wireframes) while the others fade away
    function zoomToPair(k) {
      current = k;
      var on = pairs[k];
      board.dataset.stage = "spot";
      phones.forEach(function (p, i) {
        var side = on.indexOf(i);
        p.classList.toggle("is-off", side < 0);
        if (side >= 0) p.style.transform = bigSlot(p, side);
      });
      hint.textContent = names[on[0]] + " and " + names[on[1]];
    }

    async function loop(id) {
      reset();
      while (true) {
        if (ring) ring.start(LOOP_MS);
        for (var k = 0; k < pairs.length; k++) {
          if (k > 0) {
            showPair(k, true);
            await wait(550, id);
            parkHidden();
            await wait(1850, id);
          } else {
            hint.textContent = names[pairs[0][0]] + " and " + names[pairs[0][1]];
            await wait(2400, id);
          }
        }
        hint.textContent = "Stripping away the visuals";
        setWire(true);
        await wait(1500, id);

        // The last pair slides back into the grid while the rest fade in
        hint.textContent = "All eight, side by side";
        board.dataset.stage = "grid";
        phones.forEach(function (p) {
          p.style.transform = "";
          p.classList.remove("is-off");
        });
        await wait(2000, id);

        // Back in on the first pair's wireframes, then the real screens
        // return and the loop carries on from there
        zoomToPair(0);
        await wait(1400, id);
        setWire(false);
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
        instantly(function () {
          phones.forEach(function (p) { p.style.transform = ""; p.classList.remove("is-off"); });
        });
        setWire(false);
      }
    }

    modes.forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.dataset.mode); });
    });

    // Keeps the big pair in place if the window changes size
    window.addEventListener("resize", function () {
      if (board.dataset.mode === "watch" && board.dataset.stage === "spot") {
        instantly(function () {
          pairs[current].forEach(function (i, side) { phones[i].style.transform = bigSlot(phones[i], side); });
        });
      }
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
