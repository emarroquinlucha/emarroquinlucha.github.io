// Presentation, slide 4: Projects.
// Step 0: the "Projects" title blurs and fades in.
// Step 1 (right arrow / Space): the title blurs out; the "Project 01" pill, "One Structure, Every
//   Account" and its line blur in on the left, and the page enters from the right with the overview
//   and project details, each blurring in after the other.
// Step 2: the pill, title and line blur out and the three new account screens (Credit, Chequing,
//   Savings) blur in on the left in iPhones, one after another; the page swaps for the Context page.
// Steps 3–9 (feedback, competitive analysis, information architecture, design exploration, the
//   redesign, scalability, outcome & reflection): the
//   page swaps on the left; the right side changes to that step's visual (swapSide).
// Left arrow plays each step backwards.
// The deck calls enter / leave / replay / key / exit.
(function () {
  var slide = document.querySelector(".slide-projects");
  if (!slide) return;

  var title = slide.querySelector(".pj-title");
  var head = Array.prototype.slice.call(slide.querySelectorAll(".ph-head .ph-pill, .ph-head-title, .ph-head-lede"));
  var page = slide.querySelector(".ph-page");
  var pageShadow = slide.querySelector(".ph-page-shadow");
  var phones = Array.prototype.slice.call(slide.querySelectorAll(".pj-phone"));
  var mock = slide.querySelector(".pj-mock .phone-mock");
  var comp = slide.querySelector(".pj-comp");
  var cols = Array.prototype.slice.call(slide.querySelectorAll(".pj-col"));
  function list(sel) { return Array.prototype.slice.call(slide.querySelectorAll(sel)); }
  function bodyParts(n) { return list('.ph-page-body[data-step="' + n + '"] > *:not(dl), .ph-page-body[data-step="' + n + '"] .pj-detail'); }
  function setBody(n) { list(".ph-page-body").forEach(function (el) { el.classList.toggle("is-current", +el.dataset.step === n); }); }
  var pageParts = bodyParts(1);
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
  // dx: which side it slides in from / out to (60 = the right, -60 = the left)
  function pageIn(delay, fill, dx) {
    var from = "translateX(" + (dx || 60) + "px)";
    anim(page, [
      { opacity: 0, transform: from, filter: "blur(14px)" },
      { opacity: 1, transform: "none", filter: "none" }
    ], delay, 950, SMOOTH, fill || "both");
    anim(pageShadow, [
      { opacity: 0, transform: from },
      { opacity: 1, transform: "none" }
    ], delay, 950, SMOOTH, fill || "both");
  }
  function pageOut(delay, dx) {
    var to = "translateX(" + (dx || 60) + "px)";
    anim(page, [
      { opacity: 1, transform: "none", filter: "blur(0)" },
      { opacity: 0, transform: to, filter: "blur(14px)" }
    ], delay, 650, OUT, "forwards");
    anim(pageShadow, [
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: to }
    ], delay, 650, OUT, "forwards");
  }

  function badge(show) { if (window.presentationBadge) window.presentationBadge(show); }

  function play() {
    stop();
    step = 0;
    badge(false);
    slide.classList.remove("is-detail", "is-context", "is-page-left", "is-pageless"); setVisual(null);
    setBody(1);
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

  // 1 → 2: the heading out, the phones in; the page leaves and comes back as the Context page
  function showContext() {
    step = 2;
    stop();
    slide.classList.add("is-context");
    setVisual("phones");
    head.forEach(function (el, i) { blurOut(el, i * 60, 500, "translateY(-10px)"); });
    phones.forEach(function (el, i) { blurIn(el, 380 + i * 140, 1000, "translateY(28px) scale(0.96)"); });
    pageOut(0);
    timers.push(setTimeout(function () { setBody(2); slide.classList.add("is-page-left"); }, 660));
    pageIn(700, "forwards", -60);
    bodyParts(2).forEach(function (el, i) { blurIn(el, 1000 + i * 120, 800, "translateY(10px)"); });
  }

  // 2 → 1
  function hideContext() {
    step = 1;
    stop();
    slide.classList.remove("is-context");
    setVisual(null);
    phones.slice().reverse().forEach(function (el, i) { blurOut(el, i * 70, 500, "translateY(20px) scale(0.96)"); });
    head.forEach(function (el, i) { blurIn(el, 420 + i * 160, 950, "translateY(-14px)"); });
    pageOut(0, -60);
    timers.push(setTimeout(function () { setBody(1); slide.classList.remove("is-page-left"); }, 660));
    pageIn(700, "forwards");
    pageParts.forEach(function (el, i) { blurIn(el, 1000 + i * 90, 800, "translateY(10px)"); });
  }

  // Steps 2 and on: the page stays on the left and swaps; the right side shows a visual per step
  // (the three phones, one placeholder phone, or the competitors' grid). When the visual changes,
  // the old one blurs out and the new one blurs in.
  // 5 and 6 are the competitive analysis's sub-slides: the old tabs, then the Big 6's (6 keeps 5's page)
  var VISUAL = { 2: "phones", 3: "mock", 4: "comp", 5: "oldtabs", 6: "big6", 7: "mock", 8: "mock", 9: "mock", 10: "mock", 11: "mock" };
  var BODY = { 6: 5 };
  var PAGELESS = { 6: true };                         // the Big 6 mocks take the whole screen
  function setPageless(on) { slide.classList.toggle("is-pageless", !!on); }
  var LAST = 11;
  function bodyOf(n) { return BODY[n] || n; }
  var oldtabs = slide.querySelector(".pj-oldtabs");
  var big6 = slide.querySelector(".pj-big6");
  var VIS_IN = {
    phones: phones,
    mock: [mock],
    comp: cols,
    oldtabs: list(".pj-oldtabs .ob-phone, .pj-oldtabs .pt-outline"),
    big6: list(".pj-b6-phone, .pj-caption")
  };
  var VIS_OUT = { phones: phones, mock: [mock], comp: [comp], oldtabs: [oldtabs], big6: [big6] };
  function visualIn(v) { return VIS_IN[v] || []; }
  function visualOut(v) { return VIS_OUT[v] || []; }
  function setVisual(v) { if (v) slide.dataset.visual = v; else delete slide.dataset.visual; }

  function swapSide(from, to) {
    step = to;
    stop();
    var dir = to > from ? 1 : -1;
    var a = VISUAL[from], b = VISUAL[to];
    if (a !== b) {
      setVisual(b);
      visualOut(a).forEach(function (el, i) { blurOut(el, i * 60, 500, "translateY(" + (-16 * dir) + "px) scale(0.96)"); });
      visualIn(b).forEach(function (el, i) { blurIn(el, 380 + i * 140, 1050, "translateY(" + (36 * dir) + "px) scale(0.96)"); });
    }
    setPageless(PAGELESS[to]);
    if (PAGELESS[to]) { if (!PAGELESS[from]) pageOut(0, -60); return; }   // the page steps aside
    if (PAGELESS[from]) {                              // the page comes back
      setBody(bodyOf(to));
      pageIn(300, "both", -60);
      bodyParts(bodyOf(to)).forEach(function (el, i) { blurIn(el, 600 + i * 110, 800, "translateY(10px)"); });
      return;
    }
    if (bodyOf(from) === bodyOf(to)) return;          // same page: only the visual changes
    pageOut(0, -60);
    timers.push(setTimeout(function () { setBody(bodyOf(to)); }, 660));
    pageIn(700, "forwards", -60);
    bodyParts(bodyOf(to)).forEach(function (el, i) { blurIn(el, 1000 + i * 110, 800, "translateY(10px)"); });
  }

  // Returns true when the slide used the key (otherwise the deck can use it)
  function key(e) {
    var fwd = e.key === "ArrowRight" || e.key === " ";
    if (fwd && step === 0) { showProject(); return true; }
    if (fwd && step === 1) { showContext(); return true; }
    if (fwd && step >= 2 && step < LAST) { swapSide(step, step + 1); return true; }
    if (e.key === "ArrowLeft" && step > 2) { swapSide(step, step - 1); return true; }
    if (e.key === "ArrowLeft" && step === 2) { hideContext(); return true; }
    if (e.key === "ArrowLeft" && step === 1) { hideProject(); return true; }
    return false;
  }

  // Leaving for a next slide: whatever is showing blurs and fades out, then done() switches
  function exit(done) {
    stop();
    if (reduced.matches) { done(); return; }
    if (step === 0) blurOut(title, 0, 600, "translateY(-12px)");
    else if (step >= 2) {
      visualOut(VISUAL[step]).forEach(function (el, i) { blurOut(el, i * 70, 550, "translateY(-10px)"); });
      if (!PAGELESS[step]) pageOut(80, -60);
    } else {
      head.forEach(function (el, i) { blurOut(el, i * 70, 550, "translateY(-10px)"); });
      pageOut(80);
    }
    timers.push(setTimeout(done, 780));
  }

  function reset() { stop(); step = 0; slide.classList.remove("is-detail", "is-context", "is-page-left", "is-pageless"); setVisual(null); setBody(1); }

  // Straight to a step (the menu's shortcuts): set that step's state, then its pieces blur in
  function jumpTo(n) {
    stop();
    step = n;
    badge(true);
    slide.classList.toggle("is-detail", n >= 1);
    slide.classList.toggle("is-context", n >= 2);
    slide.classList.toggle("is-page-left", n >= 2);
    setVisual(VISUAL[n] || null);
    setBody(n >= 1 ? bodyOf(n) : 1);
    setPageless(PAGELESS[n]);
    if (n === 0) { play(); return; }
    if (reduced.matches) return;
    if (n === 1) head.forEach(function (el, i) { blurIn(el, 150 + i * 140, 950, "translateY(14px)"); });
    else visualIn(VISUAL[n]).forEach(function (el, i) { blurIn(el, 250 + i * 140, 1050, "translateY(36px) scale(0.96)"); });
    if (PAGELESS[n]) return;
    pageIn(100, "both", n >= 2 ? -60 : 60);
    bodyParts(bodyOf(n)).forEach(function (el, i) { blurIn(el, 400 + i * 110, 800, "translateY(10px)"); });
  }

  window.slideControllers = window.slideControllers || {};
  window.slideControllers.projects = {
    exit: exit,
    jumpTo: jumpTo,
    getStep: function () { return step; },
    enter: function (opts) {
      clearTimeout(resetTimer);
      if (opts && opts.step != null) jumpTo(opts.step); else play();
    },
    leave: function () { resetTimer = setTimeout(reset, 600); },
    replay: play,
    key: key
  };
})();
