// Presentation, slide 3: Design Philosophy.
// Step 0: the title blurs in, then the three avatars blur in one after another (they drift round
//   their small circles in CSS the whole time).
// Step 1 (right arrow / Space): the title and avatars blur and fade out; the "Design Philosophy" pill,
//   "Don't Reinvent the Wheel" and its line blur in on the left, and the page enters from the right
//   with Observe / Adapt / Innovate and an image container, each blurring in after the other.
// Steps 2 and 3: the pill flips to the next number, the heading and line swap (blur out, blur in)
//   to "Useful can be beautiful, too." / "Design for today. Think about tomorrow.", and a new page
//   comes in (both blank for now).
// Left arrow plays each step backwards. The deck calls enter / leave / replay / key.
(function () {
  var slide = document.querySelector(".slide-philosophy");
  if (!slide) return;

  var title = slide.querySelector(".ph-title");
  var cluster = slide.querySelector(".ph-cluster");
  var avatars = Array.prototype.slice.call(slide.querySelectorAll(".ph-avatar"));
  var pill = slide.querySelector(".ph-pill");
  var page = slide.querySelector(".ph-page");
  var pageShadow = slide.querySelector(".ph-page-shadow");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var SMOOTH = "cubic-bezier(0.2, 0.8, 0.2, 1)";
  var OUT = "cubic-bezier(0.5, 0, 0.75, 0)";
  var LAST = 3;
  var running = [];
  var timers = [];
  var step = 0;

  function list(sel) { return Array.prototype.slice.call(slide.querySelectorAll(sel)); }
  function headItem(n) { return slide.querySelector('.ph-head-item[data-step="' + n + '"]'); }
  function body(n) { return slide.querySelector('.ph-page-body[data-step="' + n + '"]'); }
  function headParts(n) { return list('.ph-head-item[data-step="' + n + '"] > *'); }
  function bodyParts(n) { return list('.ph-page-body[data-step="' + n + '"] .ph-step, .ph-page-body[data-step="' + n + '"] .ph-media'); }

  function setCurrent(n, sel) {
    list(sel || ".ph-head-item, .ph-page-body, .ph-pill-label").forEach(function (el) {
      el.classList.toggle("is-current", +el.dataset.step === n);
    });
  }
  function pillLabel(n) { return slide.querySelector('.ph-pill-label[data-step="' + n + '"]'); }

  // The pill's label flips: the old one turns up and away, the next turns up into place
  function flipPill(from, to) {
    var dir = to > from ? 1 : -1;
    anim(pillLabel(from), [
      { opacity: 1, transform: "rotateX(0deg)" },
      { opacity: 0, transform: "rotateX(" + (90 * dir) + "deg)" }
    ], 0, 320, "cubic-bezier(0.55, 0, 0.9, 0.5)", "forwards");
    anim(pillLabel(to), [
      { opacity: 0, transform: "rotateX(" + (-90 * dir) + "deg)" },
      { opacity: 1, transform: "rotateX(0deg)" }
    ], 260, 520, "cubic-bezier(0.15, 0.6, 0.3, 1)", "backwards");
  }

  function stop() {
    running.forEach(function (a) { a.cancel(); });
    running = [];
    timers.forEach(clearTimeout);
    timers = [];
  }
  function anim(el, frames, delay, duration, easing, fill) {
    var a = el.animate(frames, { delay: delay, duration: reduced.matches ? 1 : duration, easing: easing, fill: fill || "both" });
    running.push(a);
    return a;
  }

  // Blur-ins end on filter "none" (not blur(0)): any filter on a parent stops the glass frosting
  function blurIn(el, delay, duration, from) {
    return anim(el, [
      { opacity: 0, transform: from, filter: "blur(16px)" },
      { opacity: 1, transform: "none", filter: "none" }
    ], delay, duration, SMOOTH, "backwards");
  }
  function blurOut(el, delay, duration, to) {
    return anim(el, [
      { opacity: 1, transform: "none", filter: "blur(0)" },
      { opacity: 0, transform: to, filter: "blur(14px)" }
    ], delay, duration, OUT, "forwards");
  }
  // The page: the sheet blurs as it moves; its shadow copy keeps its drop-shadow filter, so it
  // only fades and slides
  // (fill "both" holds it hidden until it starts; after a pageOut on the same sheet pass "forwards",
  // so it doesn't jump in over the way out)
  function pageIn(delay, fill) {
    anim(page, [
      { opacity: 0, transform: "translateX(60px)", filter: "blur(14px)" },
      { opacity: 1, transform: "none", filter: "none" }
    ], delay, 950, SMOOTH, fill || "both");
    anim(pageShadow, [
      { opacity: 0, transform: "translateX(60px)" },
      { opacity: 1, transform: "none" }
    ], delay, 950, SMOOTH, fill || "both");
  }
  function pageOut(delay) {
    anim(page, [
      { opacity: 1, transform: "none", filter: "blur(0)" },
      { opacity: 0, transform: "translateX(60px)", filter: "blur(14px)" }
    ], delay, 650, OUT, "forwards");
    anim(pageShadow, [
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: "translateX(60px)" }
    ], delay, 650, OUT, "forwards");
  }

  function badge(show) { if (window.presentationBadge) window.presentationBadge(show); }

  function play() {
    stop();
    step = 0;
    badge(false);
    setCurrent(0);
    slide.classList.remove("is-detail");
    if (reduced.matches) return;
    blurIn(title, 150, 1100, "translateY(14px)");
    avatars.forEach(function (av, i) {
      blurIn(av, 650 + i * 220, 1000, "scale(0.82)");
    });
  }

  // 0 → 1: title and avatars out; pill, heading, line and the page in
  function showDetail() {
    step = 1;
    stop();
    badge(true);
    setCurrent(1);
    slide.classList.add("is-detail");
    blurOut(title, 0, 600, "translateX(-24px)");
    blurOut(cluster, 80, 600, "scale(0.94)");
    [pill].concat(headParts(1)).forEach(function (el, i) { blurIn(el, 480 + i * 160, 950, "translateY(14px)"); });
    pageIn(560);
    bodyParts(1).forEach(function (el, i) { blurIn(el, 860 + i * 120, 800, "translateY(10px)"); });
  }

  // 1 → 0
  function hideDetail() {
    step = 0;
    stop();
    badge(false);
    pageOut(0);
    [pill].concat(headParts(1)).reverse().forEach(function (el, i) { blurOut(el, i * 80, 550, "translateY(-10px)"); });
    blurIn(title, 520, 950, "translateX(-24px)");
    blurIn(cluster, 620, 950, "scale(0.94)");
    timers.push(setTimeout(function () { slide.classList.remove("is-detail"); setCurrent(0); }, 750));
  }

  // Between principles: the pill flips to the next number, the heading and line swap, and the page
  // leaves to the right while a new one comes in with the next principle's contents
  function swap(from, to) {
    step = to;
    stop();
    setCurrent(to, ".ph-head-item, .ph-pill-label");
    var dir = to > from ? 1 : -1;
    flipPill(from, to);
    headParts(from).forEach(function (el, i) {
      blurOut(el, i * 60, 500, "translateY(" + (-10 * dir) + "px)");
    });
    headParts(to).forEach(function (el, i) { blurIn(el, 420 + i * 160, 950, "translateY(" + (14 * dir) + "px)"); });
    pageOut(0);
    timers.push(setTimeout(function () { setCurrent(to, ".ph-page-body"); }, 660));
    pageIn(700, "forwards");
    bodyParts(to).forEach(function (el, i) { blurIn(el, 1000 + i * 120, 800, "translateY(10px)"); });
  }

  // Returns true when the slide used the key (otherwise the deck can use it)
  function key(e) {
    var fwd = e.key === "ArrowRight" || e.key === " ";
    if (fwd && step === 0) { showDetail(); return true; }
    if (fwd && step < LAST) { swap(step, step + 1); return true; }
    if (e.key === "ArrowLeft" && step > 1) { swap(step, step - 1); return true; }
    if (e.key === "ArrowLeft" && step === 1) { hideDetail(); return true; }
    return false;
  }

  // Leaving for the next slide: whatever is showing blurs and fades out, then done() switches.
  function exit(done) {
    stop();
    if (reduced.matches) { done(); return; }
    if (step === 0) {
      blurOut(title, 0, 600, "translateY(-12px)");
      blurOut(cluster, 60, 600, "scale(0.94)");
    } else {
      [pill].concat(headParts(step)).forEach(function (el, i) { blurOut(el, i * 70, 550, "translateY(-10px)"); });
      pageOut(80);
    }
    timers.push(setTimeout(done, 780));
  }

  // After the slide fades away (0.5s), reset to the start
  var resetTimer = null;
  function reset() { stop(); step = 0; setCurrent(0); slide.classList.remove("is-detail"); }

  window.slideControllers = window.slideControllers || {};
  window.slideControllers.philosophy = {
    exit: exit,
    enter: function () { clearTimeout(resetTimer); play(); },
    leave: function () { resetTimer = setTimeout(reset, 600); },
    replay: play,
    key: key
  };
})();
