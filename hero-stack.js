// One Structure, Every Account (accounts-architecture.html): the hero. The
// Credit account design (copied in from the showcase further down)
// faces you head on; two blueprints of the same screen, tucked behind it,
// fan out to its left and right when the page opens, drawing themselves in
// as they go: drafting zones measured from its own parts (gradient dashed
// outlines, hatching and corner crosses) over a gradient grid. They stay. They
// reuse the resume card's blueprint styles (.case-anim, .finale-zone,
// .phone-slab); the stack's own styles are under "Hero stack" in style.css.
(function () {
  var box = document.querySelector(".hero-stack");
  if (!box) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var layers = Array.prototype.slice.call(box.querySelectorAll(".hs-layer"));
  var top = box.querySelector(".hs-layer.is-credit");
  var screen = top.querySelector(".phone-mock-screen");

  // The credit screen, copied from the showcase without its animation parts
  var source = document.querySelector(".showcase .is-credit .phone-mock-screen");
  if (source) {
    screen.innerHTML = source.innerHTML;
    screen.querySelectorAll(".showcase-push, .showcase-press, .showcase-cursor, .na-target").forEach(function (el) { el.remove(); });
    screen.querySelectorAll("[role]").forEach(function (el) { el.removeAttribute("role"); el.removeAttribute("aria-label"); });
    screen.querySelectorAll("[id]").forEach(function (el) { el.removeAttribute("id"); });
  }

  // Each phone's thickness: thin slices stacked behind it in 3D
  var SLABS = "";
  for (var z = 1; z <= 6; z++) SLABS += '<span class="phone-slab" style="--z: ' + z + '" aria-hidden="true"></span>';
  layers.forEach(function (layer) {
    layer.querySelector(".case-anim-phone").insertAdjacentHTML("afterbegin", SLABS);
  });

  // The blueprint zones, measured face-on from the credit screen's parts (in
  // points on a 375-wide screen), then given to both blueprints
  function measure() {
    box.classList.add("is-measuring");
    var s = screen.getBoundingClientRect();
    var pt = s.width / 375;
    var bottom = s.height / pt - 34;
    function rect(el, t0, b0) {
      var r = el.getBoundingClientRect();
      var t = Math.max((r.top - s.top) / pt, t0 || 0);
      var b = Math.min((r.bottom - s.top) / pt, b0 || bottom);
      return [t, (r.left - s.left) / pt, r.width / pt, Math.max(0, b - t)];
    }
    var q = function (sel) { return screen.querySelector(sel); };
    var gears = screen.querySelectorAll(".na-nav .na-iconbtn");
    var actions = q(".na-actions");
    var sheetTop = (q(".na-sheet").getBoundingClientRect().top - s.top) / pt;
    var rest = [];
    for (var n = actions.nextElementSibling; n; n = n.nextElementSibling) rest.push(n);
    var last = rest[rest.length - 1].getBoundingClientRect();
    var details = rect(rest[0]);
    details[3] = Math.min((last.bottom - s.top) / pt, bottom) - details[0];
    var zones = {
      settings: rect(gears[gears.length - 1]),
      card: rect(q(".na-card"), 116, sheetTop),
      balance: rect(q(".na-account")),
      actions: rect(actions),
      details: details
    };
    box.classList.remove("is-measuring");
    layers.forEach(function (layer) {
      if (layer === top) return;
      var set = document.createElement("div");
      set.className = "finale-zones";
      Object.keys(zones).forEach(function (name) {
        var r = zones[name];
        var zone = document.createElement("span");
        zone.className = "finale-zone";
        zone.dataset.zone = name;
        zone.style.cssText = "--t: " + r[0] + "; --l: " + r[1] + "; --w: " + r[2] + "; --h: " + r[3];
        set.appendChild(zone);
      });
      layer.querySelector(".phone-mock-screen").appendChild(set);
    });
  }

  // The grid's current, which starts once the fan has settled (see "Grid
  // current" in style.css)
  box.insertAdjacentHTML("afterbegin", '<span class="grid-current" aria-hidden="true"></span>');

  function fanOut() {
    layers.forEach(function (layer) { if (layer !== top) layer.classList.add("is-skeleton"); });
    box.classList.add("is-fanned");
    if (!reduced) setTimeout(function () { box.classList.add("is-charged"); }, 3600);
  }

  function begin() {
    measure();
    if (reduced) { box.classList.add("no-motion"); fanOut(); return; }
    void box.offsetWidth;
    setTimeout(fanOut, 500);
  }

  // Once the page has finished coming in (after its page transition, if
  // there is one), then a beat later it fans out
  var started = false;
  function ready() {
    if (started) return;
    started = true;
    requestAnimationFrame(function () { requestAnimationFrame(begin); });
  }
  function whenLoaded() {
    if (document.readyState === "complete") ready();
    else window.addEventListener("load", ready, { once: true });
  }
  if ("onpagereveal" in window) {
    window.addEventListener("pagereveal", function (e) {
      if (e.viewTransition) e.viewTransition.finished.then(whenLoaded, whenLoaded);
      else whenLoaded();
    }, { once: true });
    setTimeout(whenLoaded, 3000);
  } else {
    whenLoaded();
  }
})();
