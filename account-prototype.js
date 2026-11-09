// Tappable account prototypes (case studies). Anything with data-go inside a
// .proto-set switches that set to the named screen: a screen that slides in
// (.proto-view) or a bottom sheet (.proto-sheet). A switcher, if there is one,
// picks which set is showing. The hint under the phone comes from the set's
// data-hint, or the prototype's data-hint-open once something is open.
//
// A prototype with data-mode also has a "Watch" mode that plays a loop on its
// own: open the balance, open utilization, scroll to the statement and open
// it, then zoom the whole phone in on its progress bar as it fills, and back out.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // A scrolled screen's sticky header shows its title (see "Sticky headers"
  // in style.css). The header sits next to whatever scrolls.
  function scrolled(target, on) {
    var header = target.parentNode.querySelector(":scope > .proto-header");
    if (header) header.classList.toggle("is-scrolled", on);
  }

  // Phone stages only crop while a phone zooms in or slides out, so zoomed
  // screens never spill over the caption. Uncropping waits for the phone to
  // finish moving back; "now" skips the wait.
  function crop(stage, on, now) {
    clearTimeout(stage.uncropTimer);
    if (on) stage.classList.add("is-cropped");
    else if (now) stage.classList.remove("is-cropped");
    else stage.uncropTimer = setTimeout(function () { stage.classList.remove("is-cropped"); }, 950);
  }

  // Switching mode on any Watch / Explore (or Try it) switch replays a short
  // fade-in on what's below it. This runs before the switch's own handler, so
  // a click on the mode that's already on does nothing.
  document.addEventListener("click", function (e) {
    var button = e.target.closest && e.target.closest(".approach-toggle-button[data-mode]");
    if (!button || button.getAttribute("aria-pressed") === "true") return;
    var box = button.closest(".approach-board, .proto, .combo, .joint, .compare-slider");
    if (!box) return;
    box.classList.remove("is-mode-switch");
    void box.offsetWidth;
    box.classList.add("is-mode-switch");
  }, true);

  document.querySelectorAll(".proto").forEach(function (proto) {
    var buttons = proto.querySelectorAll(".proto-switch button");
    var sets = proto.querySelectorAll(".proto-set");
    var hint = proto.querySelector(".proto-hint");

    function go(set, view) {
      set.dataset.view = view;
      // Only the screen on show can be tapped or tabbed into
      set.querySelectorAll(".proto-view, .proto-sheet").forEach(function (v) {
        v.inert = v.dataset.view !== view;
      });
      if (hint && proto.dataset.mode !== "watch") {
        hint.textContent = view === "home" ? set.dataset.hint : proto.dataset.hintOpen;
      }
    }

    sets.forEach(function (set) {
      set.addEventListener("click", function (e) {
        var target = e.target.closest("[data-go]");
        if (target) go(set, target.dataset.go);
      });
    });

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", b === button); });
        sets.forEach(function (set) {
          var on = set.dataset.account === button.dataset.account;
          set.hidden = !on;
          if (on) go(set, "home");
        });
      });
    });

    if (proto.classList.contains("proto-actions")) actions(proto, go, buttons);
    else if (proto.dataset.mode) autoplay(proto, sets[0], go);
  });

  // Everyday actions (section 01). "Watch" plays a loop on the redesigned
  // credit account: the quick actions are outlined, Manage card is outlined
  // and tapped, and the settings gear is outlined and tapped, with its screen
  // scrolled down and back. "Try it" is the account picker as before.
  function actions(proto, go, accountButtons) {
    var modes = proto.querySelectorAll(".proto-mode button");
    var hint = proto.querySelector(".proto-hint");
    var screen = proto.querySelector(".phone-mock-screen");
    var tapMark = proto.querySelector(".proto-tap");
    var stage = proto.querySelector(".proto-stage");
    var credit = proto.querySelector('.proto-set[data-account="credit"]');
    var manageImg = credit.querySelector('.proto-view[data-view="manage"] img');
    var creditButton = proto.querySelector('.proto-switch [data-account="credit"]');
    var run = 0;
    var inView = false;
    // One loop is 15.3s: the sum of the waits and taps in loop() below
    var LOOP_MS = 15300;
    var ring = window.modeRing ? window.modeRing(proto.querySelector(".proto-mode")) : null;
    var steps = ["is-actions", "is-card", "is-gear"];

    function el(selector) { return credit.querySelector(selector); }
    function step(name, on) { proto.classList.toggle(name, on); }

    function say(text) { hint.textContent = text; }

    function wait(ms, id) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
      });
    }

    function tap(target, id) {
      var r = target.getBoundingClientRect();
      var s = screen.getBoundingClientRect();
      tapMark.style.left = (r.left + r.width / 2 - s.left) + "px";
      tapMark.style.top = (r.top + r.height / 2 - s.top) + "px";
      tapMark.classList.remove("is-tapping");
      void tapMark.offsetWidth;
      tapMark.classList.add("is-tapping");
      return wait(350, id);
    }

    // Moves an element up by a number of points (the screens are 375 wide)
    function scroll(target, points, animate) {
      if (!animate) target.style.transition = "none";
      target.style.transform = points ? "translateY(" + (-points / 375 * screen.clientWidth) + "px)" : "";
      if (!animate) { void target.offsetWidth; target.style.transition = ""; }
      scrolled(target, points > 0);
    }

    // Back to the start: the credit account's home screen, nothing outlined
    function reset() {
      steps.forEach(function (name) { step(name, false); });
      crop(stage, false, true);
      scroll(manageImg, 0, false);
      if (creditButton.getAttribute("aria-pressed") !== "true") creditButton.click();
      go(credit, "home");
    }

    async function loop(id) {
      reset();
      while (true) {
        if (ring) ring.start(LOOP_MS);
        say("Quick Actions Sit Right Under the Balance");
        await wait(600, id);
        step("is-actions", true);
        await wait(2200, id);
        step("is-actions", false);

        say("Manage Card Is One Tap Away");
        step("is-card", true);
        await wait(1800, id);
        await tap(el('[data-target="manage-card"]'), id);
        step("is-card", false);
        go(credit, "card");
        await wait(1800, id);
        await tap(el('.proto-view[data-view="card"] [data-go="home"]'), id);
        go(credit, "home");
        await wait(800, id);

        say("Settings Live in a Gear in the Header");
        step("is-gear", true);
        await wait(1800, id);
        await tap(el('.proto-view[data-view="home"] [data-go="manage"]'), id);
        step("is-gear", false);
        go(credit, "manage");
        await wait(1100, id);
        scroll(manageImg, 520, true);
        await wait(1600, id);
        scroll(manageImg, 0, true);
        await wait(1300, id);
        await tap(el('.proto-view[data-view="manage"] [data-go="home"]'), id);
        go(credit, "home");
        await wait(900, id);
      }
    }

    function start() {
      run++;
      if (proto.dataset.mode === "watch" && inView) loop(run).catch(function () {});
    }

    function setMode(mode) {
      proto.dataset.mode = mode;
      modes.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.mode === mode); });
      run++;
      if (ring) ring.stop();
      reset();
      if (mode === "watch") {
        say("Quick Actions Sit Right Under the Balance");
        start();
      } else {
        hint.textContent = credit.dataset.hint;
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
      }, { threshold: 0.3 }).observe(proto.querySelector(".proto-stage"));
    } else {
      inView = true;
    }

    // Visitors who prefer less motion start on the tappable version
    setMode(reduced ? "try" : "watch");
  }

  function autoplay(proto, set, go) {
    var modes = proto.querySelectorAll(".proto-mode button");
    var hint = proto.querySelector(".proto-hint");
    var stage = proto.querySelector(".proto-stage");
    var body = proto.querySelector(".phone-mock-body");
    var screen = proto.querySelector(".phone-mock-screen");
    var scroller = proto.querySelector(".proto-scroll");
    var bar = proto.querySelector(".proto-bar");
    var fill = proto.querySelector(".proto-bar-fill");
    var tapMark = proto.querySelector(".proto-tap");
    var full = "50.1%"; // $500.50 of $1,000.50 paid, as drawn in the screenshot
    var run = 0;
    var inView = false;
    // One loop is 18.6s: the sum of the waits and taps in loop() below
    var LOOP_MS = 18600;
    var ring = window.modeRing ? window.modeRing(proto.querySelector(".proto-mode")) : null;

    function el(selector) { return proto.querySelector(selector); }

    // Resolves after ms, or rejects if the loop was stopped in the meantime
    function wait(ms, id) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
      });
    }

    function say(text) { hint.textContent = text; }

    function tap(target, id) {
      var r = target.getBoundingClientRect();
      var s = screen.getBoundingClientRect();
      tapMark.style.left = (r.left + r.width / 2 - s.left) + "px";
      tapMark.style.top = (r.top + r.height / 2 - s.top) + "px";
      tapMark.classList.remove("is-tapping");
      void tapMark.offsetWidth;
      tapMark.classList.add("is-tapping");
      return wait(350, id);
    }

    function scrollTo(points) {
      var shift = points / 375 * screen.clientWidth;
      scroller.style.transform = shift ? "translateY(" + (-shift) + "px)" : "";
      scrolled(scroller, shift > 0);
    }

    // Moves and scales the phone so the bar sits in the middle of the stage.
    // The zoom is capped so the statement tile (a bit wider than its bar)
    // still fits across the stage on narrow screens.
    function zoomTo(target, scale) {
      var t = target.getBoundingClientRect();
      var b = body.getBoundingClientRect();
      var st = stage.getBoundingClientRect();
      scale = Math.min(scale, st.width * 0.92 / (t.width * 1004 / 885));
      var px = t.left + t.width / 2 - b.left;
      var py = t.top + t.height / 2 - b.top;
      var tx = st.width / 2 - (b.left - st.left) - scale * px;
      var ty = st.height / 2 - (b.top - st.top) - scale * py;
      crop(stage, true);
      body.style.transform = "translate(" + tx + "px, " + ty + "px) scale(" + scale + ")";
    }

    function setFill(value, animate) {
      if (!animate) fill.style.transition = "none";
      fill.style.setProperty("--fill", value);
      if (!animate) { void fill.offsetWidth; fill.style.transition = ""; }
    }

    function reset() {
      go(set, "home");
      [body, scroller].forEach(function (e) { e.style.transition = "none"; });
      body.style.transform = "";
      scroller.style.transform = "";
      scrolled(scroller, false);
      crop(stage, false, true);
      void body.offsetWidth;
      [body, scroller].forEach(function (e) { e.style.transition = ""; });
      setFill(full, false);
    }

    async function loop(id) {
      reset();
      while (true) {
        if (ring) ring.start(LOOP_MS);
        say("Tapping the Current Balance");
        await wait(1000, id);
        await tap(el('[data-go="balance"]'), id);
        go(set, "balance");
        await wait(2400, id);
        await tap(el('.proto-sheet[data-view="balance"] [data-go="home"]'), id);
        go(set, "home");
        await wait(900, id);

        say("Tapping the Utilization Arrow");
        await tap(el('[data-go="utilization"]'), id);
        go(set, "utilization");
        await wait(2400, id);
        await tap(el('.proto-sheet[data-view="utilization"] [data-go="home"]'), id);
        go(set, "home");
        await wait(900, id);

        say("Opening the Statement");
        scrollTo(220);
        await wait(1100, id);
        await tap(el('[data-go="statement"]'), id);
        setFill("0%", false);
        go(set, "statement");
        await wait(1100, id);

        say("$500 Still to Pay on This Statement");
        zoomTo(bar, 2.4);
        await wait(1000, id);
        setFill(full, true);
        await wait(2600, id);
        body.style.transform = "";
        crop(stage, false);
        await wait(1100, id);
        await tap(el('.proto-sheet[data-view="statement"] [data-go="home"]'), id);
        go(set, "home");
        await wait(700, id);
        scrollTo(0);
        await wait(1300, id);
      }
    }

    function start() {
      run++;
      if (proto.dataset.mode === "watch" && inView) loop(run).catch(function () {});
    }

    function stop() {
      run++;
      if (ring) ring.stop();
      reset();
    }

    function setMode(mode) {
      proto.dataset.mode = mode;
      modes.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.mode === mode); });
      stop();
      if (mode === "watch") start();
      else hint.textContent = set.dataset.hint;
    }

    modes.forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.dataset.mode); });
    });

    // Plays only while on screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) start(); else stop();
      }, { threshold: 0.3 }).observe(stage);
    } else {
      inView = true;
    }

    // Visitors who prefer less motion start on the tappable version
    setMode(reduced ? "try" : "watch");
  }

  // Combo: one big phone with its color-coded zones. "Watch" plays a loop:
  // the three accounts one by one, then wireframes only, then all three side by
  // side, then their zones line up into one shared layout, and back. "explore" lets visitors pick an account (or All) and
  // switch between screens and wireframes.
  document.querySelectorAll(".combo").forEach(function (combo) {
    var phones = Array.prototype.slice.call(combo.querySelectorAll(".combo-phone"));
    var modeButtons = combo.querySelectorAll(".combo-mode button");
    var accountButtons = combo.querySelectorAll("[data-account]:not(.combo-phone)");
    var viewButtons = combo.querySelectorAll("[data-view]");
    var hint = combo.querySelector(".proto-hint");
    // The order Watch plays the accounts in
    var order = ["credit", "chequing", "savings"];
    var state = { account: order[0], wire: false };
    var run = 0;
    var inView = false;
    // One loop is 15.4s: the sum of the waits in loop() below
    var LOOP_MS = 15400;
    var ring = window.modeRing ? window.modeRing(combo.querySelector(".combo-mode")) : null;

    function name(key) {
      return key === "all" ? "all" : key.charAt(0).toUpperCase() + key.slice(1);
    }

    function apply() {
      var all = state.account === "all";
      combo.dataset.layout = all ? "all" : "one";
      phones.forEach(function (p) { p.classList.toggle("is-active", p.dataset.account === state.account); });
      combo.classList.toggle("is-wireframe", state.wire);
      accountButtons.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.account === state.account); });
      viewButtons.forEach(function (b) { b.setAttribute("aria-pressed", (b.dataset.view === "wireframes") === state.wire); });
      if (combo.dataset.mode === "explore") {
        hint.textContent = all ? "The Same Structure on Every Account" : name(state.account);
      }
    }

    function wait(ms, id) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
      });
    }

    async function loop(id) {
      while (true) {
        if (ring) ring.start(LOOP_MS);
        state.wire = false;
        for (var i = 0; i < order.length; i++) {
          state.account = order[i];
          apply();
          hint.textContent = name(state.account);
          await wait(2200, id);
        }
        hint.textContent = "Stripping Away the Visuals";
        state.wire = true;
        apply();
        await wait(1600, id);
        hint.textContent = "The Same Structure on Every Account";
        state.account = "all";
        apply();
        await wait(2400, id);
        // The caption stays on the line above until the loop starts over
        combo.classList.add("is-uniform");
        await wait(3200, id);
        state.account = order[0];
        apply();
        await wait(900, id);
        combo.classList.remove("is-uniform");
        await wait(700, id);
      }
    }

    // Watch plays the hero's animation (a .combo-finale, run by finale.js)
    // instead of this loop; the ring follows its loops
    var finale = combo.querySelector(".combo-finale");
    if (finale) {
      finale.addEventListener("finaleloop", function (e) {
        if (combo.dataset.mode === "watch" && ring) ring.start(e.detail);
      });
    }

    function start() {
      run++;
      if (finale) return;
      if (combo.dataset.mode === "watch" && inView) loop(run).catch(function () {});
    }

    function setMode(mode) {
      combo.dataset.mode = mode;
      modeButtons.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.mode === mode); });
      run++;
      if (ring) ring.stop();
      combo.classList.remove("is-uniform");
      if (finale) finale.dispatchEvent(new Event(mode === "watch" ? "finalerestart" : "finalestop"));
      if (mode === "watch") {
        state = { account: order[0], wire: false };
        apply();
        hint.textContent = name(state.account);
        start();
      } else {
        apply();
      }
    }

    modeButtons.forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.dataset.mode); });
    });
    accountButtons.forEach(function (b) {
      b.addEventListener("click", function () { state.account = b.dataset.account; apply(); });
    });
    viewButtons.forEach(function (b) {
      b.addEventListener("click", function () { state.wire = b.dataset.view === "wireframes"; apply(); });
    });

    // Plays only while on screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) start();
        else { run++; if (ring) ring.stop(); }
      }, { threshold: 0.3 }).observe(combo.querySelector(".combo-stage"));
    } else {
      inView = true;
    }

    // Visitors who prefer less motion start on Explore
    setMode(reduced ? "explore" : "watch");
  });
})();
