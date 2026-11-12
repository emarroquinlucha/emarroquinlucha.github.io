// The resume's Today's Home card (.case-ht): a blueprint build on a loop.
// The screen holds as the real mock; its content fades away to the
// drafting grid as the phone turns to a light outline; blueprint boxes
// (gradient dashed outlines, light gradient hatching, corner crosshairs,
// like card one's) draw in over each of its parts, top to bottom; then the
// real parts start rendering back one by one, each replacing its box, and
// before they're halfway down the full mock fades back in over the rest. Plays only while on screen; reduced motion
// keeps the still mock. Styles are under "Today's Home blueprint build" in
// style.css. The stages are classes on .case-ht: is-blueprint, is-drawn,
// is-render.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PARTS = [".ht-wallet", ".ht-header-row .ht-iconbtn", ".ht-greeting", ".ht-action",
    ".ht-group", ".ht-add", ".ht-refer", ".ht-tabbar"];

  document.querySelectorAll(".case-ht").forEach(function (box) {
    var screen = box.querySelector(".ht-phone .phone-mock-screen");
    if (!screen || reduced) return;
    var parts = Array.prototype.slice.call(screen.querySelectorAll(PARTS.join(", ")));
    var built = false, run = 0;

    // The boxes, measured once from the parts themselves (in points on a
    // 375-wide screen)
    function build() {
      if (built) return;
      built = true;
      var s = screen.getBoundingClientRect();
      var pt = s.width / 375;
      var layer = document.createElement("div");
      layer.className = "bp-zones";
      layer.setAttribute("aria-hidden", "true");
      parts.forEach(function (p, i) {
        var r = p.getBoundingClientRect();
        p.classList.add("ht-part");
        p.style.setProperty("--i", i);
        var z = document.createElement("span");
        z.className = "bp-zone";
        z.style.cssText = "--i: " + i + "; --t: " + (r.top - s.top) / pt + "; --l: " + (r.left - s.left) / pt +
          "; --w: " + r.width / pt + "; --h: " + r.height / pt;
        layer.appendChild(z);
      });
      screen.appendChild(layer);
      box.style.setProperty("--parts", parts.length);
    }

    function wait(ms, id) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
      });
    }
    function stage(name, on) { box.classList.toggle(name, on); }
    var timers = [];
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    async function loop(id) {
      var n = parts.length;
      while (true) {
        await wait(3000, id);
        stage("is-blueprint", true);           // content fades, the grid shows
        await wait(900, id);
        stage("is-drawn", true);                // the boxes draw in
        await wait(300 + n * 110 + 900, id);
        stage("is-render", true);               // the parts render back, one by one
        parts.forEach(function (p, i) {
          timers.push(setTimeout(function () { p.classList.add("is-in"); }, i * 130));
        });
        // Before the render is halfway down, the whole mock fades back in:
        // the parts still to come all ease in together, the grid and boxes
        // fade out, and the frame turns dark again
        await wait(Math.round(n * 130 * 0.4) + 500, id);
        clearTimers();
        stage("is-blueprint", false);           // back to the full mock, slowly
        await wait(2400, id);
        stage("is-drawn", false);
        stage("is-render", false);
        parts.forEach(function (p) { p.classList.remove("is-in"); });
      }
    }

    function reset() {
      clearTimers();
      parts.forEach(function (p) { p.classList.remove("is-in"); });
      stage("is-blueprint", false);
      stage("is-drawn", false);
      stage("is-render", false);
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        run++;
        if (entries[0].isIntersecting) {
          build();
          loop(run).catch(function () {});
        } else {
          reset();
        }
      }, { threshold: 0.3 }).observe(box);
    }
  });
})();
