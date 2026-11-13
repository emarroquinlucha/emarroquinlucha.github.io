// Page transitions between the resume and the case studies, using the browser's
// cross-page View Transitions (browsers without them just open the page).
// Each case study page picks its transition here; the animations are under
// "Page transitions" in style.css. Load this in the <head> of every page.
(function () {
  // Safari (and every iPhone browser, which all run on WebKit) needs one
  // change: leaving a case study, it captures the whole very long sheet,
  // so there the sheet goes with the window-sized page snapshot instead
  // ("root-sink"). (.is-webkit / .is-chromium on <html>, set early.)
  var ua = navigator.userAgent;
  var webkit = /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua);
  document.documentElement.classList.add(webkit ? "is-webkit" : "is-chromium");

  var transitions = {
    "accounts-architecture": "stack",
    "final-final-v7": "stack",
    "quick-question": "stack",
    "make-the-logo-bigger": "stack",
    "home-tab-refresh": "stack",
    "posters": "stack",
    "fun-ui": "stack"
  };

  // A page's name from its address, with or without ".html" (the links use
  // clean addresses like /accounts-architecture; the home page is "index")
  function pageName(url) {
    var name = new URL(url).pathname.replace(/\/$/, "").split("/").pop().replace(/\.html$/, "");
    return name || "index";
  }

  // e.g. "slide-forward" going to a case study, "slide-back" coming home
  function typeFor(from, to) {
    if (transitions[to]) return transitions[to] + "-forward";
    if (transitions[from]) return transitions[from] + "-back";
    return null;
  }

  function box(el) {
    if (!el) return null;
    var r = el.getBoundingClientRect();
    return { top: r.top, right: r.right, bottom: r.bottom, left: r.left };
  }

  // The page's sheet of paper; the posters page has none, so its gallery
  // stands in for it
  function sheet() {
    return document.querySelector(".resume-frame, .pg");
  }

  // The "grow" cover: the card on the resume, the hero on the case study
  function cover(casePage) {
    return document.querySelector('[data-cover="' + casePage + '"]') ||
      document.querySelector(".case-hero");
  }

  // The sheets are long (the case studies' run past 10,000px), and the browser
  // snapshots the whole of a named element for the transition: on a sharp
  // screen that can be bigger than the graphics card holds, so the snapshot
  // fails and the page flashes white, and moving it is heavy. For the length
  // of a transition each sheet is trimmed to what's on screen (plus a margin,
  // and its full width so its shadow and folded corner stay).
  function trim(el) {
    if (!el) return;
    var r = el.getBoundingClientRect();
    var m = 160;
    var top = Math.max(0, -r.top - m);
    var bottom = Math.max(0, r.bottom - innerHeight - m);
    el.style.clipPath = "inset(" + top + "px -240px " + bottom + "px -240px)";
  }
  function untrim() {
    document.querySelectorAll(".resume-frame, .pg").forEach(function (el) { el.style.clipPath = ""; el.style.viewTransitionName = ""; });
    document.querySelectorAll(".page-toc, .case-back, .reading-progress").forEach(function (el) { el.style.viewTransitionName = ""; });
  }
  // Back to a page kept in memory (the browser's back button): no trim left
  window.addEventListener("pageshow", untrim);

  // The pills (bottom left) and the Connect menu (bottom right) get layers of
  // their own above the sheets, so the pages don't pass over them. The ones
  // leaving and the ones arriving get different names, so each simply fades
  // rather than stretching into the other page's. Only for the transition: a
  // named element stops the pills' glass from blurring the page behind it.
  function nameDocks(side) {
    [".floating-dock", ".quick-dock"].forEach(function (sel, i) {
      var el = document.querySelector(sel);
      if (el) el.style.viewTransitionName = side ? "dock-" + side + "-" + (i + 1) : "";
    });
  }
  window.addEventListener("pageshow", function () { nameDocks(); });

  function clearCovers() {
    document.querySelectorAll("[data-cover], .case-hero").forEach(function (el) {
      el.style.viewTransitionName = "";
    });
  }

  // On the page being left: measure what the next page needs to line up with
  // Browsers without the Navigation API (Safari) don't say which page the
  // visitor is going to or came from, so the page being left notes its own
  // name, and the next page reads it (see pagereveal)
  window.addEventListener("pageswap", function (e) {
    if (!e.viewTransition) return;
    var from = pageName(location.href);
    try { sessionStorage.setItem("page-transition-from", from); } catch (err) {}
    var known = e.activation && e.activation.entry;
    var to = known ? pageName(e.activation.entry.url) : null;
    // Without a destination, assume it's one of the site's own pages (the
    // arriving page decides the animation)
    var type = known ? typeFor(from, to) : (transitions[from] ? transitions[from] + "-back" : "stack-forward");
    if (!type) return;

    clearCovers();
    var card = null;
    if (type.indexOf("grow") === 0) {
      card = cover(transitions[to] ? to : from);
      if (card) card.style.viewTransitionName = "case-cover";
    }
    var frame = box(sheet());
    try {
      sessionStorage.setItem("page-transition", JSON.stringify({
        sheet: frame,
        cover: box(card),
        center: innerHeight / 2 - frame.top
      }));
    } catch (err) {}
    // Safari, leaving a case study for home: its sheet isn't captured on its
    // own (Safari captures the whole sheet, over 10,000px tall, whatever the
    // trim, and going home dropped to a few frames); it goes with the page's
    // window-sized snapshot instead, which sinks and fades the same way
    // ("root-sink" in style.css)
    if (webkit && /-back$/.test(type) && document.documentElement.classList.contains("page-case")) {
      sheet().style.viewTransitionName = "none";
      // ...but the page's fixed controls (the contents menu, the Back pill
      // and the progress bar) aren't part of the sinking page: each gets a
      // layer of its own, so it only fades out
      [[".page-toc", "toc-out"], [".case-back", "back-out"], [".reading-progress", "progress-out"]].forEach(function (p) {
        var el = document.querySelector(p[0]);
        if (el) el.style.viewTransitionName = p[1];
      });
    } else {
      trim(sheet());
      // The progress bar fades out slowly on its own layer, here too
      var bar = /-back$/.test(type) && document.documentElement.classList.contains("page-case") && document.querySelector(".reading-progress");
      if (bar) bar.style.viewTransitionName = "progress-out";
    }
    nameDocks("out");
  });

  // On the page arriving: choose the animation and hand it the measurements
  window.addEventListener("pagereveal", function (e) {
    if (!e.viewTransition) return;
    var noted = null;
    try {
      noted = sessionStorage.getItem("page-transition-from");
      sessionStorage.removeItem("page-transition-from");
    } catch (err) {}
    var activation = window.navigation && navigation.activation;
    var from = activation && activation.from ? pageName(activation.from.url) : noted;
    var to = pageName(location.href);
    var type = from ? typeFor(from, to) : null;
    // Nothing to go on: skip the animation rather than let the browser's
    // default morph the two sheets into each other
    if (!type) { e.viewTransition.skipTransition(); return; }

    var old = {};
    try { old = JSON.parse(sessionStorage.getItem("page-transition")) || {}; } catch (err) {}
    var root = document.documentElement;
    var frame = box(sheet());
    root.style.setProperty("--sheet-old-center", (old.center || 0) + "px");
    root.style.setProperty("--sheet-new-center", (innerHeight / 2 - frame.top) + "px");

    clearCovers();
    if (type.indexOf("grow") === 0) {
      var forward = type === "grow-forward";
      var el = cover(forward ? to : from);
      if (el) el.style.viewTransitionName = "case-cover";
      // The sheet is clipped to the card's box at the small end of the animation
      var card = forward ? old.cover : box(el);
      var page = forward ? frame : old.sheet;
      if (card && page) {
        root.style.setProperty("--grow-clip",
          "inset(" + (card.top - page.top) + "px " + (page.right - card.right) + "px " +
          (page.bottom - card.bottom) + "px " + (card.left - page.left) + "px round 20px)");
      }
    }

    trim(sheet());
    // Scrolling while the page arrives moves it past the trimmed part, which
    // showed as blank paper until the transition ended: re-trim as it scrolls
    var retrim = function () { trim(sheet()); };
    window.addEventListener("scroll", retrim, { passive: true });
    nameDocks("in");
    e.viewTransition.types.add(type);
    // A few pages tune their own: leaving the posters keeps its quick slide
    // out ("posters-back"); a case study opening fades itself in more slowly
    // ("case-forward"). See "Page transitions" in style.css.
    if (from === "posters" && type === "stack-back") e.viewTransition.types.add("posters-back");
    // Safari, home from a case study: the case study left as part of the
    // page's snapshot (see pageswap), so that snapshot sinks and fades
    if (webkit && type === "stack-back" && from !== "posters" && from !== "fun-ui") e.viewTransition.types.add("root-sink");
    // Back on the resume, the pills and Connect menu rise in again, the way
    // they do as a case study opens
    if (type === "stack-back") {
      root.classList.remove("is-docking");
      void root.offsetWidth;
      root.classList.add("is-docking");
      setTimeout(function () { root.classList.remove("is-docking"); }, 2600);
    }
    // The contents menu waits out the move, then fades in and rises into
    // place once the page has landed, coming or going (its own entrance in
    // style.css would play unseen while the pages move, and doesn't replay
    // coming back from the back-forward cache)
    var toc = document.querySelector(".page-toc");
    if (toc && toc.animate && getComputedStyle(toc).display !== "none") {
      toc.style.animation = "none";
      toc.style.opacity = "0";
      e.viewTransition.finished.then(function () {
        toc.style.opacity = "";
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        toc.animate([
          { opacity: 0, transform: "translateY(16px)", filter: "blur(8px)" },
          { opacity: 1, transform: "translateY(0)", filter: "blur(0)" }
        ], { duration: 600, delay: 100, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)", fill: "backwards" });
      });
    }
    if (root.classList.contains("page-case") && type === "stack-forward") e.viewTransition.types.add("case-forward");
    // The top blur, when the arriving page is scrolled far enough to show it:
    // only its tint shows while the pages move, and the blur fades in once
    // the page has landed (blurring the moving pages live is too costly)
    if (!transitions[to]) root.classList.add("is-page-transition");
    if (window.scrollY > 8) root.classList.add("is-top-blurred");
    // The arriving page's endless loops (the grid glow, drifting phones,
    // twinkling stars, the illustrations' builds) hold still until the
    // transition ends: while it runs, anything moving on the page has to be
    // captured again every frame
    var held = [];
    if (document.getAnimations) {
      document.getAnimations().forEach(function (a) {
        var t = a.effect && a.effect.getTiming && a.effect.getTiming();
        if (t && t.iterations === Infinity && a.playState === "running") { a.pause(); held.push(a); }
      });
    }
    e.viewTransition.finished.then(function () {
      held.forEach(function (a) { if (a.playState === "paused") a.play(); });
      window.removeEventListener("scroll", retrim);
      clearCovers();
      untrim();
      nameDocks();
      // The top blur, held back while the pages moved, fades in
      var blur = root.classList.contains("is-top-blurred") && document.querySelector(".top-blur");
      if (blur) {
        blur.classList.add("is-fading-in");
        setTimeout(function () { blur.classList.remove("is-fading-in"); }, 750);
      }
      root.classList.remove("is-page-transition", "is-top-blurred");
    });
  });

  // Coming home: go back through history when that's where the visitor came
  // from, so the resume opens where they left it
  document.addEventListener("click", function (e) {
    var back = e.target.closest && e.target.closest(".case-back");
    if (!back || !document.referrer) return;
    if (new URL(document.referrer).origin !== location.origin) return;
    e.preventDefault();
    history.back();
  });
})();
