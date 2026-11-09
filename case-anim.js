// Case study cover animations: a live HTML phone (the redesigned credit
// account) that loops between the screen and its skeleton, tipping into an
// isometric view as the screen gives way to coloured blocks sitting on its
// own parts, then back. Plays while on screen (unless the visitor asked for
// reduced motion or pressed pause) and holds until the page has finished
// transitioning in, like the cover videos. Styles are under "Cover
// animation" in style.css; the blocks reuse the case study's .finale-zone.
(function () {
  var pageIn = !("onpagereveal" in window);
  var waiting = [];
  if (!pageIn) {
    window.addEventListener("pagereveal", function (e) {
      function go() { pageIn = true; waiting.forEach(function (f) { f(); }); }
      if (e.viewTransition) e.viewTransition.finished.then(go, go);
      else go();
    }, { once: true });
  }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".case-anim").forEach(function (media) {
    var toggle = media.querySelector(".case-video-toggle");
    var screen = media.querySelector(".phone-mock-screen");
    var wantsPlay = !reduce;
    var visible = false;
    var run = 0;
    var zones = null;

    // The blocks, measured from the screen's own parts (in points on a
    // 375-wide screen), once, while the phone is flat
    function measure() {
      if (zones) return;
      var s = screen.getBoundingClientRect();
      var pt = s.width / 375;
      var bottom = s.height / pt - 34;
      function box(el, top, bot) {
        var r = el.getBoundingClientRect();
        var t = Math.max((r.top - s.top) / pt, top || 0);
        var b = Math.min((r.bottom - s.top) / pt, bot || bottom);
        return [t, (r.left - s.left) / pt, r.width / pt, Math.max(0, b - t)];
      }
      var q = function (sel) { return screen.querySelector(sel); };
      var gears = screen.querySelectorAll(".na-nav .na-iconbtn");
      var actions = q(".na-actions");
      var sheetTop = (q(".na-sheet").getBoundingClientRect().top - s.top) / pt;
      var rest = [];
      for (var n = actions.nextElementSibling; n; n = n.nextElementSibling) rest.push(n);
      var last = rest[rest.length - 1].getBoundingClientRect();
      var details = box(rest[0]);
      details[3] = Math.min((last.bottom - s.top) / pt, bottom) - details[0];
      zones = {
        settings: box(gears[gears.length - 1]),
        card: box(q(".na-card"), 116, sheetTop),
        balance: box(q(".na-account")),
        actions: box(actions),
        details: details
      };
      var layer = document.createElement("div");
      layer.className = "finale-zones";
      Object.keys(zones).forEach(function (name) {
        var z = zones[name];
        var zone = document.createElement("span");
        zone.className = "finale-zone";
        zone.dataset.zone = name;
        zone.style.cssText = "--t: " + z[0] + "; --l: " + z[1] + "; --w: " + z[2] + "; --h: " + z[3];
        layer.appendChild(zone);
      });
      screen.appendChild(layer);
    }

    function wait(ms, id) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
      });
    }

    function skeleton(on) { media.classList.toggle("is-skeleton", on); }

    async function loop(id) {
      while (true) {
        await wait(2600, id);
        skeleton(true);
        await wait(3400, id);
        skeleton(false);
        await wait(1000, id);
      }
    }

    function sync() {
      run++;
      if (wantsPlay && visible && pageIn) {
        measure();
        loop(run).catch(function () {});
      }
    }

    toggle.addEventListener("click", function () {
      wantsPlay = !wantsPlay;
      media.classList.toggle("is-paused", !wantsPlay);
      toggle.setAttribute("aria-label", wantsPlay ? "Pause the animation" : "Play the animation");
      sync();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        var now = entries[0].isIntersecting;
        if (now !== visible) { visible = now; sync(); }
      }, { threshold: 0.25 }).observe(media);
    } else {
      visible = true;
      sync();
    }
    if (!wantsPlay) media.classList.add("is-paused");
    waiting.push(sync);
  });
})();
