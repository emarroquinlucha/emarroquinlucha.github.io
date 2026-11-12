// Page transitions between the resume and the case studies, using the browser's
// cross-page View Transitions (browsers without them just open the page).
// Each case study page picks its transition here; the animations are under
// "Page transitions" in style.css. Load this in the <head> of every page.
(function () {
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
    document.querySelectorAll(".resume-frame, .pg").forEach(function (el) { el.style.clipPath = ""; });
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
  window.addEventListener("pageswap", function (e) {
    if (!e.viewTransition || !e.activation || !e.activation.entry) return;
    var from = pageName(location.href), to = pageName(e.activation.entry.url);
    var type = typeFor(from, to);
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
    trim(sheet());
    nameDocks("out");
  });

  // On the page arriving: choose the animation and hand it the measurements
  window.addEventListener("pagereveal", function (e) {
    if (!e.viewTransition || !window.navigation || !navigation.activation || !navigation.activation.from) return;
    var from = pageName(navigation.activation.from.url), to = pageName(location.href);
    var type = typeFor(from, to);
    if (!type) return;

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
    nameDocks("in");
    e.viewTransition.types.add(type);
    // A few pages tune their own: leaving the posters keeps its quick slide
    // out ("posters-back"); a case study opening fades itself in more slowly
    // ("case-forward"). See "Page transitions" in style.css.
    if (from === "posters" && type === "stack-back") e.viewTransition.types.add("posters-back");
    // Back on the resume, the pills and Connect menu rise in again, the way
    // they do as a case study opens
    if (type === "stack-back") {
      root.classList.remove("is-docking");
      void root.offsetWidth;
      root.classList.add("is-docking");
      setTimeout(function () { root.classList.remove("is-docking"); }, 2600);
    }
    if (root.classList.contains("page-case") && type === "stack-forward") e.viewTransition.types.add("case-forward");
    if (!transitions[to]) {
      root.classList.add("is-page-transition");
      root.classList.toggle("is-top-blurred", window.scrollY > 8);
    }
    e.viewTransition.finished.then(function () {
      clearCovers();
      untrim();
      nameDocks();
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
