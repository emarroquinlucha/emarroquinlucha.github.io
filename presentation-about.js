// Presentation, the About slides (after the intro):
//   whois  "Who the Heck Is Eddie?" blurs in on its own.
//   about  "About Eddie" and the switcher blur in, with the floating cube on the right. Picking a fact
//          (click it, or right arrow / Space for the next and left arrow for the one before) glides the
//          caret's pill to it and swaps the asset on the right (old blurs out, new blurs in). Past the
//          last fact the arrows move the deck on.
//   bring  "What I Bring to the Table" blurs in; right arrow / Space blurs it out, the same title blurs
//          in on the left and the page comes in from the right (blank for now). Left arrow undoes it.
// The deck calls enter / leave / replay / key / exit.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var SMOOTH = "cubic-bezier(0.2, 0.8, 0.2, 1)";
  var OUT = "cubic-bezier(0.5, 0, 0.75, 0)";
  function badge(show) { if (window.presentationBadge) window.presentationBadge(show); }
  function all(root, sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }

  // A small animation kit per slide: stop() cancels everything it started
  function kit() {
    var running = [], timers = [];
    var k = {
      stop: function () {
        running.forEach(function (a) { a.cancel(); });
        running = [];
        timers.forEach(clearTimeout);
        timers = [];
      },
      later: function (fn, ms) { timers.push(setTimeout(fn, ms)); },
      anim: function (el, frames, delay, duration, easing, fill) {
        var a = el.animate(frames, { delay: delay, duration: reduced.matches ? 1 : duration, easing: easing, fill: fill || "both" });
        running.push(a);
        return a;
      },
      // Blur-ins end on filter "none" (not blur(0)): any filter on a parent stops glass frosting
      blurIn: function (el, delay, duration, from) {
        return k.anim(el, [
          { opacity: 0, transform: from, filter: "blur(16px)" },
          { opacity: 1, transform: "none", filter: "none" }
        ], delay, duration, SMOOTH, "backwards");
      },
      blurOut: function (el, delay, duration, to) {
        return k.anim(el, [
          { opacity: 1, transform: "none", filter: "blur(0)" },
          { opacity: 0, transform: to, filter: "blur(14px)" }
        ], delay, duration, OUT, "forwards");
      }
    };
    return k;
  }

  window.slideControllers = window.slideControllers || {};

  // ---------- Who the Heck Is Eddie? ----------
  (function () {
    var slide = document.querySelector(".slide-whois");
    if (!slide) return;
    var title = slide.querySelector(".wi-title");
    var k = kit();
    function play() {
      k.stop();
      badge(false);
      if (!reduced.matches) k.blurIn(title, 150, 1100, "translateY(14px)");
    }
    window.slideControllers.whois = {
      enter: play,
      replay: play,
      leave: function () { setTimeout(k.stop, 600); },
      exit: function (done) {
        k.stop();
        if (reduced.matches) { done(); return; }
        k.blurOut(title, 0, 600, "translateY(-12px)");
        k.later(done, 680);
      }
    };
  })();

  // ---------- About Eddie ----------
  (function () {
    var slide = document.querySelector(".slide-about");
    if (!slide) return;
    var title = slide.querySelector(".ab-title");
    var sw = slide.querySelector(".ab-switch");
    var hl = slide.querySelector(".ab-hl");
    var opts = all(slide, ".ab-opt");
    var assets = all(slide, ".ab-asset");
    var k = kit();
    var sel = 0;
    var resetTimer = null;

    // The pill takes the picked option's place and size
    function placePill(instant) {
      var b = opts[sel];
      hl.classList.toggle("no-anim", !!instant);
      sw.style.setProperty("--y", b.offsetTop + "px");
      sw.style.setProperty("--w", b.offsetWidth + "px");
      sw.style.setProperty("--h", b.offsetHeight + "px");
      if (instant) { void hl.offsetWidth; hl.classList.remove("no-anim"); }
    }
    function mark() {
      opts.forEach(function (b, i) {
        b.classList.toggle("is-current", i === sel);
        b.setAttribute("aria-selected", i === sel ? "true" : "false");
      });
    }

    function pick(i) {
      if (i === sel || i < 0 || i >= opts.length) return;
      var from = sel;
      var dir = i > from ? 1 : -1;
      sel = i;
      mark();
      placePill(false);
      k.stop();
      assets.forEach(function (a, n) { a.classList.toggle("is-current", n === i); });
      k.blurOut(assets[from], 0, 500, "translateY(" + (-24 * dir) + "px) scale(0.92)");
      k.blurIn(assets[i], 300, 900, "translateY(" + (32 * dir) + "px) scale(0.92)");
    }

    function play() {
      k.stop();
      badge(true);
      sel = 0;
      mark();
      assets.forEach(function (a, n) { a.classList.toggle("is-current", n === 0); });
      placePill(true);
      if (reduced.matches) return;
      k.blurIn(title, 150, 1100, "translateY(14px)");
      k.blurIn(sw, 500, 1000, "translateY(14px)");
      k.blurIn(assets[0], 700, 1200, "translateY(28px) scale(0.9)");
    }

    opts.forEach(function (b, i) { b.addEventListener("click", function () { pick(i); }); });
    window.addEventListener("resize", function () { placePill(true); });

    window.slideControllers.about = {
      enter: function () { clearTimeout(resetTimer); play(); },
      replay: play,
      leave: function () { resetTimer = setTimeout(k.stop, 600); },
      key: function (e) {
        // A focused option's own Space is a click; let the arrows do the stepping
        if ((e.key === "ArrowRight" || e.key === " ") && sel < opts.length - 1) { pick(sel + 1); return true; }
        if (e.key === "ArrowLeft" && sel > 0) { pick(sel - 1); return true; }
        return false;
      },
      exit: function (done) {
        k.stop();
        if (reduced.matches) { done(); return; }
        k.blurOut(title, 0, 600, "translateY(-12px)");
        k.blurOut(sw, 60, 600, "translateY(-12px)");
        k.blurOut(assets[sel], 100, 650, "scale(0.92)");
        k.later(done, 780);
      }
    };
  })();

  // ---------- A Little About My Journey ----------
  // The title blurs in, then the avatars one after another (they drift round small circles in CSS).
  // Going on, the title, Skip and Neo blur out; Red River stays, and the timeline takes it over with
  // window.presentationJourney.handoff() (its spot on screen; it's hidden here so the timeline's own
  // avatar can glide on from there).
  (function () {
    var slide = document.querySelector(".slide-journey");
    if (!slide) return;
    var title = slide.querySelector(".jn-title");
    var items = all(slide, ".ph-item");
    var lead = items[0].querySelector(".ph-avatar");
    var k = kit();
    var resetTimer = null;

    function reset() { k.stop(); lead.style.visibility = ""; }
    function play() {
      reset();
      badge(false);
      if (reduced.matches) return;
      k.blurIn(title, 150, 1100, "translateY(14px)");
      items.forEach(function (el, i) { k.blurIn(el, 650 + i * 220, 1000, "scale(0.82)"); });
    }

    window.presentationJourney = {
      handoff: function () {
        var r = lead.getBoundingClientRect();
        lead.style.visibility = "hidden";
        return r;
      }
    };
    window.slideControllers.journey = {
      enter: function () { clearTimeout(resetTimer); play(); },
      replay: play,
      leave: function () { resetTimer = setTimeout(reset, 600); },
      exit: function (done) {
        k.stop();
        if (reduced.matches) { done(); return; }
        k.blurOut(title, 0, 550, "translateX(-24px)");
        k.blurOut(items[1], 60, 500, "scale(0.9)");
        k.blurOut(items[2], 120, 500, "scale(0.9)");
        k.later(done, 520);
      }
    };
  })();

  // ---------- What I Bring to the Table ----------
  (function () {
    var slide = document.querySelector(".slide-bring");
    if (!slide) return;
    var title = slide.querySelector(".bg-title");
    var head = all(slide, ".ph-head-title");
    var page = slide.querySelector(".ph-page");
    var pageShadow = slide.querySelector(".ph-page-shadow");
    var k = kit();
    var step = 0;
    var resetTimer = null;

    // The page blurs as it moves; its shadow copy keeps its drop-shadow filter, so it only fades and slides
    function pageIn(delay) {
      k.anim(page, [
        { opacity: 0, transform: "translateX(60px)", filter: "blur(14px)" },
        { opacity: 1, transform: "none", filter: "none" }
      ], delay, 950, SMOOTH, "both");
      k.anim(pageShadow, [{ opacity: 0, transform: "translateX(60px)" }, { opacity: 1, transform: "none" }], delay, 950, SMOOTH, "both");
    }
    function pageOut(delay) {
      k.anim(page, [
        { opacity: 1, transform: "none", filter: "blur(0)" },
        { opacity: 0, transform: "translateX(60px)", filter: "blur(14px)" }
      ], delay, 650, OUT, "forwards");
      k.anim(pageShadow, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(60px)" }], delay, 650, OUT, "forwards");
    }

    function play() {
      k.stop();
      step = 0;
      badge(false);
      slide.classList.remove("is-detail");
      if (!reduced.matches) k.blurIn(title, 150, 1100, "translateY(14px)");
    }
    function show() {
      step = 1;
      k.stop();
      badge(true);
      slide.classList.add("is-detail");
      k.blurOut(title, 0, 600, "translateY(-12px)");
      head.forEach(function (el, i) { k.blurIn(el, 480 + i * 160, 950, "translateY(14px)"); });
      pageIn(560);
    }
    function hide() {
      step = 0;
      k.stop();
      badge(false);
      pageOut(0);
      head.forEach(function (el) { k.blurOut(el, 0, 550, "translateY(-10px)"); });
      k.blurIn(title, 520, 950, "translateY(14px)");
      k.later(function () { slide.classList.remove("is-detail"); }, 750);
    }
    function reset() { k.stop(); step = 0; slide.classList.remove("is-detail"); }

    window.slideControllers.bring = {
      enter: function () { clearTimeout(resetTimer); play(); },
      replay: play,
      leave: function () { resetTimer = setTimeout(reset, 600); },
      key: function (e) {
        if ((e.key === "ArrowRight" || e.key === " ") && step === 0) { show(); return true; }
        if (e.key === "ArrowLeft" && step === 1) { hide(); return true; }
        return false;
      },
      exit: function (done) {
        k.stop();
        if (reduced.matches) { done(); return; }
        if (step === 0) k.blurOut(title, 0, 600, "translateY(-12px)");
        else {
          head.forEach(function (el) { k.blurOut(el, 0, 550, "translateY(-10px)"); });
          pageOut(80);
        }
        k.later(done, 780);
      }
    };
  })();
})();
