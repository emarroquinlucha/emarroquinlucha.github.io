// Finale (case studies): the three redesigned accounts on the hero's light
// grid. They fade in; the stage tips into an isometric view while each screen
// turns into its skeleton (blocks that sit exactly on that screen's own parts,
// with a grey block for the card savings doesn't have); the blocks resize so
// all three skeletons match; they go back to each screen's own layout; the
// stage tilts back and the real screens return; then they fade out and it
// repeats. The phones are copies of the hero's live HTML screens (made here,
// so there's only one copy in the page). Plays only while on screen; the
// pause button stops it. The hero ("is-pair") is simpler: the credit screen
// beside its skeleton, fading in once. Styles are under "Finale" in
// style.css.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The matched layout: one set of blocks for every account, in points on a
  // 375-wide screen (top, left, width, height)
  var SHARED = {
    settings: [60, 315, 40, 40],
    card: [124, 20, 335, 38],
    balance: [186, 20, 335, 170],
    actions: [380, 20, 335, 100],
    details: [504, 20, 335, 250]
  };
  var NAMES = ["settings", "card", "balance", "actions", "details"];

  document.querySelectorAll(".finale").forEach(function (finale) {
    var caption = finale.querySelector(".finale-caption");
    var pauseButton = finale.querySelector(".finale-pause");
    var phones = Array.prototype.slice.call(finale.querySelectorAll(".finale-phone"));
    var run = 0;
    var inView = false;
    var paused = false;
    var measured = false;

    // Copy each hero screen in, without its animation-only parts, and add an
    // empty block for each part of the skeleton
    phones.forEach(function (phone) {
      var source = document.querySelector(".showcase .is-" + phone.dataset.account + " .phone-mock-screen");
      var screen = phone.querySelector(".phone-mock-screen");
      if (source) {
        screen.innerHTML = source.innerHTML;
        screen.querySelectorAll(".showcase-push, .showcase-press, .showcase-cursor, .na-target").forEach(function (el) { el.remove(); });
        screen.querySelectorAll("[role]").forEach(function (el) { el.removeAttribute("role"); el.removeAttribute("aria-label"); });
      }
      var box = document.createElement("div");
      box.className = "finale-zones";
      NAMES.forEach(function (name) {
        var zone = document.createElement("span");
        zone.className = "finale-zone";
        zone.dataset.zone = name;
        box.appendChild(zone);
      });
      screen.appendChild(box);
      phone.zones = {};
    });

    // Where each part of a screen really is, in points (measured once, flat,
    // from the copied screen itself so the skeleton sits on its parts)
    function measure() {
      if (measured) return;
      measured = true;
      phones.forEach(function (phone) {
        var screen = phone.querySelector(".phone-mock-screen");
        var s = screen.getBoundingClientRect();
        var pt = s.width / 375;
        var bottom = s.height / pt - 34; // stop above the home indicator
        function rect(el, clipTop, clipBottom) {
          if (!el) return null;
          var r = el.getBoundingClientRect();
          var t = (r.top - s.top) / pt, b = (r.bottom - s.top) / pt;
          if (clipTop != null) t = Math.max(t, clipTop);
          b = Math.min(b, clipBottom != null ? clipBottom : bottom);
          return [t, (r.left - s.left) / pt, r.width / pt, Math.max(0, b - t)];
        }
        function union(els) {
          var rs = els.map(function (el) { return el.getBoundingClientRect(); });
          var top = Math.min.apply(null, rs.map(function (r) { return r.top; }));
          var bot = Math.max.apply(null, rs.map(function (r) { return r.bottom; }));
          var t = (top - s.top) / pt;
          return [t, (rs[0].left - s.left) / pt, rs[0].width / pt, Math.min((bot - s.top) / pt, bottom) - t];
        }
        var q = function (sel) { return screen.querySelector(sel); };
        var gear = screen.querySelectorAll(".na-nav .na-iconbtn");
        var sheet = q(".na-sheet");
        var actions = q(".na-actions");
        var after = [];
        for (var n = actions.nextElementSibling; n; n = n.nextElementSibling) after.push(n);
        var z = phone.zones;
        z.settings = rect(gear[gear.length - 1]);
        // The card shows between the header and the sheet; savings has none,
        // so its grey block starts as a sliver where the card would be
        z.card = sheet ? rect(q(".na-card"), 116, (sheet.getBoundingClientRect().top - s.top) / pt)
          : [118, 20, 335, 6];
        z.balance = rect(q(".na-account"));
        z.actions = rect(actions);
        z.details = union(after);
        if (!sheet) phone.querySelector('[data-zone="card"]').classList.add("is-missing");
      });
    }

    // Places every block: "own" (on each screen's parts) or "shared"
    function layout(mode) {
      phones.forEach(function (phone) {
        NAMES.forEach(function (name) {
          var r = mode === "shared" ? SHARED[name] : phone.zones[name];
          var zone = phone.querySelector('[data-zone="' + name + '"]');
          zone.style.cssText = "--t: " + r[0] + "; --l: " + r[1] + "; --w: " + r[2] + "; --h: " + r[3];
        });
      });
    }

    function wait(ms, id) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
      });
    }

    function say(text) {
      caption.classList.add("is-changing");
      setTimeout(function () {
        caption.textContent = text;
        caption.classList.remove("is-changing");
      }, 350);
    }

    function show(on) { finale.classList.toggle("is-shown", on); }
    function skeleton(on) { finale.classList.toggle("is-skeleton", on); }
    function tilt(on) { finale.dataset.scene = on ? "blueprint" : "trio"; }
    function shared(on) { finale.classList.toggle("is-shared", on); layout(on ? "shared" : "own"); }

    function reset() {
      measure();
      finale.classList.add("no-motion");
      show(false);
      skeleton(false);
      tilt(false);
      shared(false);
      void finale.offsetWidth;
      finale.classList.remove("no-motion");
    }

    // The hero's pair: the credit screen beside its own skeleton (the right
    // phone is always a skeleton, by its styles); they fade in together the
    // first time it's seen, and stay
    async function pairLoop(id) {
      if (finale.classList.contains("is-shown")) return;
      reset();
      await wait(300, id);
      show(true);
    }

    // Section 03's Watch ("is-flip"): the three accounts fade in once, then
    // go back and forth between the screens and their tilted skeletons
    async function flipLoop(id) {
      reset();
      await wait(300, id);
      show(true);
      while (true) {
        // Tells the Watch switch a loop has started: the sum of the waits
        finale.dispatchEvent(new CustomEvent("finaleloop", { detail: 10000 }));
        say("Chequing, Credit and Savings");
        await wait(3000, id);

        say("The Building Blocks Underneath");
        tilt(true);
        skeleton(true);
        await wait(3400, id);

        say("Chequing, Credit and Savings");
        tilt(false);
        await wait(900, id);
        skeleton(false);
        await wait(2700, id);
      }
    }

    async function loop(id) {
      if (finale.classList.contains("is-pair")) return pairLoop(id);
      if (finale.classList.contains("is-flip")) return flipLoop(id);
      while (true) {
        reset();
        // Tells a surrounding Watch switch a loop has started (its ring fills
        // over one loop): the sum of the waits below
        finale.dispatchEvent(new CustomEvent("finaleloop", { detail: 17800 }));
        await wait(300, id);

        // The three accounts fade in
        say("Chequing, Credit and Savings");
        show(true);
        await wait(3600, id);

        // Tip into the isometric view; each screen becomes its own skeleton
        say("The Building Blocks Underneath");
        tilt(true);
        skeleton(true);
        await wait(3000, id);

        // The blocks resize so all three skeletons match
        say("One Architecture, Every Account");
        shared(true);
        await wait(3200, id);

        // Back to each account's own layout
        say("Room for Each Account to Be Its Own");
        shared(false);
        await wait(2600, id);

        // Tilt back, and the real screens return
        say("Chequing, Credit and Savings");
        tilt(false);
        await wait(900, id);
        skeleton(false);
        await wait(3200, id);

        // Fade out before the next loop
        show(false);
        await wait(1000, id);
      }
    }

    function start() {
      run++;
      if (inView && !paused && !reduced) loop(run).catch(function () {});
    }

    function stop() { run++; }

    // A surrounding Watch / Explore switch can stop it, or start it over
    finale.addEventListener("finalestop", stop);
    finale.addEventListener("finalerestart", start);

    pauseButton.addEventListener("click", function () {
      paused = !paused;
      finale.classList.toggle("is-paused", paused);
      pauseButton.setAttribute("aria-pressed", paused);
      pauseButton.setAttribute("aria-label", paused ? "Play the animation" : "Pause the animation");
      if (paused) stop(); else start();
    });

    // Plays only while on screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) start(); else stop();
      }, { threshold: 0.35 }).observe(finale);
    } else {
      inView = true;
      start();
    }

    // Visitors who prefer less motion get the still trio
    if (reduced) {
      requestAnimationFrame(function () { reset(); show(true); });
      pauseButton.hidden = true;
    }
  });
})();
