// Off-screen pause: endless CSS animations (twinkles, drifts, spinners,
// blinking cursors and the like) stop while they're off screen, so they
// don't keep the browser busy where nobody can see them. Any element running
// an infinite CSS animation, now or later, is watched with one shared
// IntersectionObserver; while it's out of view it gets .is-offscreen, which
// pauses its animations (see "Off-screen pause" in style.css). Finite
// animations are left alone. Load it on any page; it needs nothing else.
(function () {
  if (!("IntersectionObserver" in window) || !document.getAnimations) return;
  var watched = new WeakSet();
  var seen = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      e.target.classList.toggle("is-offscreen", !e.isIntersecting);
    });
  }, { rootMargin: "100px" });

  function watch(el) {
    if (!el || el.nodeType !== 1 || watched.has(el)) return;
    watched.add(el);
    seen.observe(el);
  }

  function endless(a) {
    var timing = a.effect && a.effect.getComputedTiming && a.effect.getComputedTiming();
    return timing && timing.iterations === Infinity;
  }

  function scan() {
    document.getAnimations().forEach(function (a) {
      if (endless(a) && a.effect.target) watch(a.effect.target);
    });
  }

  // New ones as they start (a class change, a slide coming in)
  document.addEventListener("animationstart", function (e) {
    var el = e.target;
    if (watched.has(el)) return;
    // (with subtree, so a ::before or ::after's animation counts as its own)
    var endlessHere = el.getAnimations({ subtree: true }).some(function (a) {
      return a.effect.target === el && endless(a);
    });
    if (endlessHere) watch(el);
  }, true);

  if (document.readyState === "complete") scan();
  else window.addEventListener("load", scan);
})();
