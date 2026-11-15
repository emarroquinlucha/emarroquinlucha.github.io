// Presentation, slide 4: Projects.
// Step 0: the "Projects" title blurs and fades in.
// Step 1 (right arrow / Space): the title blurs out; the "Project 01" pill, "One Structure, Every
//   Account" and its line blur in on the left, and the page enters from the right with the overview
//   and project details, each blurring in after the other. Left arrow plays it backwards.
// The deck calls enter / leave / replay / key / exit.
(function () {
  var slide = document.querySelector(".slide-projects");
  if (!slide) return;

  var title = slide.querySelector(".pj-title");
  var head = Array.prototype.slice.call(slide.querySelectorAll(".ph-pill, .ph-head-title, .ph-head-lede"));
  var page = slide.querySelector(".ph-page");
  var pageShadow = slide.querySelector(".ph-page-shadow");
  var pageParts = Array.prototype.slice.call(page.querySelectorAll(".pj-sub, .pj-overview, .pj-detail"));
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var SMOOTH = "cubic-bezier(0.2, 0.8, 0.2, 1)";
  var OUT = "cubic-bezier(0.5, 0, 0.75, 0)";
  var running = [];
  var timers = [];
  var step = 0;
  var resetTimer = null;

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
  // The page blurs as it moves; its shadow copy keeps its drop-shadow filter, so it only fades and slides
  function pageIn(delay) {
    anim(page, [
      { opacity: 0, transform: "translateX(60px)", filter: "blur(14px)" },
      { opacity: 1, transform: "none", filter: "none" }
    ], delay, 950, SMOOTH, "both");
    anim(pageShadow, [
      { opacity: 0, transform: "translateX(60px)" },
      { opacity: 1, transform: "none" }
    ], delay, 950, SMOOTH, "both");
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
    slide.classList.remove("is-detail");
    if (reduced.matches) return;
    blurIn(title, 150, 1100, "translateY(14px)");
  }

  function showProject() {
    step = 1;
    stop();
    badge(true);
    slide.classList.add("is-detail");
    blurOut(title, 0, 600, "translateY(-12px)");
    head.forEach(function (el, i) { blurIn(el, 480 + i * 160, 950, "translateY(14px)"); });
    pageIn(560);
    pageParts.forEach(function (el, i) { blurIn(el, 860 + i * 90, 800, "translateY(10px)"); });
  }

  function hideProject() {
    step = 0;
    stop();
    badge(false);
    pageOut(0);
    head.slice().reverse().forEach(function (el, i) { blurOut(el, i * 80, 550, "translateY(-10px)"); });
    blurIn(title, 520, 950, "translateY(14px)");
    timers.push(setTimeout(function () { slide.classList.remove("is-detail"); }, 750));
  }

  // Returns true when the slide used the key (otherwise the deck can use it)
  function key(e) {
    if ((e.key === "ArrowRight" || e.key === " ") && step === 0) { showProject(); return true; }
    if (e.key === "ArrowLeft" && step === 1) { hideProject(); return true; }
    return false;
  }

  // Leaving for a next slide: whatever is showing blurs and fades out, then done() switches
  function exit(done) {
    stop();
    if (reduced.matches) { done(); return; }
    if (step === 0) blurOut(title, 0, 600, "translateY(-12px)");
    else {
      head.forEach(function (el, i) { blurOut(el, i * 70, 550, "translateY(-10px)"); });
      pageOut(80);
    }
    timers.push(setTimeout(done, 780));
  }

  function reset() { stop(); step = 0; slide.classList.remove("is-detail"); }

  window.slideControllers = window.slideControllers || {};
  window.slideControllers.projects = {
    exit: exit,
    enter: function () { clearTimeout(resetTimer); play(); },
    leave: function () { resetTimer = setTimeout(reset, 600); },
    replay: play,
    key: key
  };
})();
