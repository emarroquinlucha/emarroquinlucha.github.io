// Page transitions between the resume and the case studies, using the browser's
// cross-page View Transitions (browsers without them just open the page).
// Each case study page picks its transition here; the animations are under
// "Page transitions" in style.css. Load this in the <head> of every page.
(function () {
  var transitions = {
    "accounts-architecture.html": "stack",
    "final-final-v7.html": "stack",
    "quick-question.html": "stack",
    "make-the-logo-bigger.html": "stack"
  };

  function pageName(url) {
    return new URL(url).pathname.split("/").pop();
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

  function sheet() {
    return document.querySelector(".resume-frame");
  }

  // The "grow" cover: the card on the resume, the hero on the case study
  function cover(casePage) {
    return document.querySelector('[data-cover="' + casePage + '"]') ||
      document.querySelector(".case-hero");
  }

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

    e.viewTransition.types.add(type);
    if (!transitions[to]) {
      root.classList.add("is-page-transition");
      root.classList.toggle("is-top-blurred", window.scrollY > 8);
    }
    e.viewTransition.finished.then(function () {
      clearCovers();
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
