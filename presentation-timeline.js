// Presentation, slide 2: career timeline.
// Steps through four stops when you press the right arrow or Space: the progress track fills
// toward the next stop in that stop's colour (it waits behind the frosted paper), then the reel
// pushes left and brings it out into focus, and its story swaps in on the paper. The last stretch
// (Questrade) is dashed and green, and the final state stays put.
// The left arrow steps back. Nothing plays on its own.
// The deck (presentation-deck.js) calls enter / leave / replay / key.
(function () {
  var slide = document.querySelector(".slide-timeline");
  if (!slide) return;

  var stops = Array.prototype.slice.call(slide.querySelectorAll(".ct-stop"));
  var blurbs = Array.prototype.slice.call(slide.querySelectorAll(".ct-blurb"));
  var media = Array.prototype.slice.call(slide.querySelectorAll(".ct-media"));
  var fills = Array.prototype.slice.call(slide.querySelectorAll(".ct-fill"));
  var status = slide.querySelector(".ct-status");
  var reel = slide.querySelector(".ct-reel");
  var paper = slide.querySelector(".ct-paper");
  var win = slide.querySelector(".ct-window");
  var rail = slide.querySelector(".ct-rail");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  var HOLD = 3200;                                    // how long each stop stays before moving on
  var LINE = 1100;                                    // how long the track takes to fill to the next stop
  var LINE_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
  var TEXT_OUT = 260;
  var TEXT_IN = 560;
  var LAST = stops.length - 1;

  var active = 0;
  var autoplay = false;                               // playing through on its own
  var paused = false;
  var holdTimer = null;
  var holdStarted = 0;
  var holdLeft = 0;
  var lineAnim = null;                                // the segment currently drawing
  var deck = null;                                    // set by the deck: { showReplay(bool) }

  // ---------- Springs (avatar scale and glow): settle with no visible bounce ----------
  var STIFFNESS = 170;
  var DAMPING = 2 * Math.sqrt(STIFFNESS) * 0.85;      // just under critical: soft, no overshoot you'd notice

  function Spring(apply) {
    this.x = 0; this.v = 0; this.target = 0; this.apply = apply; this.raf = 0; this.last = 0;
  }
  Spring.prototype.set = function (x) {
    cancelAnimationFrame(this.raf); this.raf = 0;
    this.x = this.target = x; this.v = 0; this.apply(x);
  };
  Spring.prototype.to = function (target) {
    if (reduced.matches) { this.set(target); return; }
    this.target = target;
    if (this.raf) return;
    var self = this;
    this.last = performance.now();
    function step(now) {
      var dt = Math.min(0.032, (now - self.last) / 1000);
      self.last = now;
      for (var i = 0; i < 4; i++) {                   // a few small steps per frame keep it stable
        var a = -STIFFNESS * (self.x - self.target) - DAMPING * self.v;
        self.v += a * dt / 4;
        self.x += self.v * dt / 4;
      }
      self.apply(self.x);
      if (Math.abs(self.x - self.target) < 0.0005 && Math.abs(self.v) < 0.0005) {
        self.x = self.target; self.apply(self.x); self.raf = 0; return;
      }
      self.raf = requestAnimationFrame(step);
    }
    this.raf = requestAnimationFrame(step);
  };

  var scaleSprings = stops.map(function (stop) {
    var avatar = stop.querySelector(".ct-avatar");
    return new Spring(function (s) { avatar.style.transform = "scale(" + s.toFixed(4) + ")"; });
  });
  var glowSprings = stops.map(function (stop) {
    var glow = stop.querySelector(".ct-glow");
    return new Spring(function (o) { glow.style.opacity = Math.max(0, o).toFixed(3); });
  });

  var SCALE = { active: 1, past: 0.86, upcoming: 0.86 };

  // ---------- Layout: where the focus sits, how far apart the stops are ----------
  // The active avatar sits centred in the open space left of the paper; the next stop sits behind
  // the middle of the paper. On narrow screens the paper is a sheet at the bottom instead.
  var gap = 0;
  // The active avatar sits centred in the open space left of the page; the next stop sits behind
  // the middle of the page, and the track ends inside it. On narrow screens the page is a sheet at the
  // bottom instead.
  function layout() {
    var W = slide.clientWidth;
    var H = slide.clientHeight;
    var p = paper.getBoundingClientRect();
    var s = slide.getBoundingClientRect();
    var left = p.left - s.left, right = p.right - s.left, top = p.top - s.top;
    var focusX, lineY, windowW;
    if (W <= 760) {
      focusX = W / 2;
      gap = W * 0.85;
      lineY = Math.max(140, top * 0.46);
      windowW = W;
    } else {
      focusX = left / 2;
      gap = (left + right) / 2 - focusX;
      lineY = H * 0.46;
      windowW = right - p.width * 0.18;              // the track ends inside the page
    }
    slide.style.setProperty("--focus-x", focusX + "px");
    slide.style.setProperty("--gap", gap + "px");
    slide.style.setProperty("--line-y", lineY + "px");
    slide.style.setProperty("--window-w", windowW + "px");
    reelSpring.apply(reelSpring.x);
  }


  // The reel's position, in stops (1 = moved left by one stop)
  var reelSpring = new Spring(function (x) { reel.style.transform = "translateX(" + (-x * gap).toFixed(2) + "px)"; });

  // ---------- Stops ----------
  function paintStops(instant) {
    stops.forEach(function (stop, i) {
      var state = i === active ? "active" : i < active ? "past" : "upcoming";
      stop.classList.toggle("is-active", state === "active");
      stop.classList.toggle("is-past", state === "past");
      stop.setAttribute("aria-current", state === "active" ? "step" : "false");
      if (instant) {
        scaleSprings[i].set(SCALE[state]);
        glowSprings[i].set(state === "active" ? 1 : 0);
      } else {
        scaleSprings[i].to(SCALE[state]);
        glowSprings[i].to(state === "active" ? 1 : 0);
      }
    });
  }

  // ---------- Story text: the old one fades up and out, the new one rises in, same spot ----------
  function showBlurb(index, instant) {
    media.forEach(function (m) { m.classList.toggle("is-shown", +m.dataset.index === index); });
    blurbs.forEach(function (b, i) {
      b.getAnimations().forEach(function (a) { a.cancel(); });
      if (i === index) return;
      if (b.classList.contains("is-shown") && !instant && !reduced.matches) {
        var out = b.animate([
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: "translateY(-10px)" }
        ], { duration: TEXT_OUT, easing: "cubic-bezier(0.4, 0, 1, 1)" });
        out.onfinish = function () { b.classList.remove("is-shown"); };
        out.oncancel = function () { b.classList.remove("is-shown"); };
      } else {
        b.classList.remove("is-shown");
      }
    });
    var next = blurbs[index];
    next.classList.add("is-shown");
    if (instant) return;
    if (reduced.matches) {
      next.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "ease" });
      return;
    }
    next.animate([
      { opacity: 0, transform: "translateY(12px)" },
      { opacity: 1, transform: "none" }
    ], { duration: TEXT_IN, delay: TEXT_OUT * 0.7, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "backwards" });
  }

  // ---------- The line ----------
  function fillScale(el) {
    var m = getComputedStyle(el).transform;
    if (!m || m === "none") return 0;
    return parseFloat(m.slice(7).split(",")[0]) || 0;
  }

  function stopLine() {
    if (lineAnim) { lineAnim.onfinish = null; lineAnim.cancel(); lineAnim = null; }
  }

  // Set every segment to match the active stop (filled up to it), easing from wherever it is
  function settleLine(instant) {
    fills.forEach(function (fill, i) {
      var target = i < active ? 1 : 0;
      var from = fillScale(fill);
      fill.getAnimations().forEach(function (a) { a.cancel(); });
      fill.style.transform = "scaleX(" + target + ")";
      if (instant || reduced.matches || Math.abs(from - target) < 0.001) return;
      fill.animate([{ transform: "scaleX(" + from + ")" }, { transform: "scaleX(" + target + ")" }],
        { duration: 500, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
    });
  }

  // ---------- Playing through ----------
  function clearHold() { clearTimeout(holdTimer); holdTimer = null; }

  function hold(ms) {
    clearHold();
    holdLeft = ms;
    holdStarted = performance.now();
    holdTimer = setTimeout(advance, ms);
  }

  function activate(index, instant) {
    active = index;
    if (instant) reelSpring.set(index); else reelSpring.to(index);
    paintStops(instant);
    showBlurb(index, instant);
    if (active === LAST && deck) deck.showReplay(true);
  }

  // Draw the line to the next stop, then light it up
  function advance() {
    holdTimer = null;
    if (active >= LAST) { finish(); return; }
    var fill = fills[active];
    var target = active + 1;
    if (reduced.matches) {
      fill.style.transform = "scaleX(1)";
      arrive(target);
      return;
    }
    stopLine();
    lineAnim = fill.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
      { duration: LINE, easing: LINE_EASE });
    lineAnim.onfinish = function () {
      fill.style.transform = "scaleX(1)";
      lineAnim = null;
      arrive(target);
    };
  }

  function arrive(index) {
    activate(index);
    if (index >= LAST) finish();
    else if (autoplay) hold(HOLD);
  }

  function finish() {
    autoplay = false;
    clearHold();
    if (deck) deck.showReplay(true);
  }

  function setPaused(p) {
    paused = p;
    status.classList.toggle("is-shown", p);
  }

  function pause() {
    if (!autoplay || paused) return;
    setPaused(true);
    if (holdTimer) {
      holdLeft = Math.max(0, holdLeft - (performance.now() - holdStarted));
      clearHold();
    }
    if (lineAnim) lineAnim.pause();
  }

  function resume() {
    if (!paused) return;
    setPaused(false);
    if (lineAnim) lineAnim.play();
    else hold(holdLeft);
  }

  // Jump straight to a stop (click or arrows): stops playing through, the presenter is driving
  function goTo(index) {
    index = Math.max(0, Math.min(LAST, index));
    autoplay = false;
    clearHold();
    stopLine();
    setPaused(false);
    if (index === active) { settleLine(); return; }
    activate(index);
    settleLine();
    if (index === LAST && deck) deck.showReplay(true);
  }

  // Coming onto the slide starts fresh; the Replay button rewinds the reel and track back to the start
  function replay(rewind) {
    clearHold();
    stopLine();
    setPaused(false);
    if (deck) deck.showReplay(false);
    var fromEnd = rewind === true && active > 0;
    active = 0;
    if (fromEnd) {
      settleLine();
      reelSpring.to(0);
      paintStops();
    } else {
      fills.forEach(function (f) { f.getAnimations().forEach(function (a) { a.cancel(); }); f.style.transform = "scaleX(0)"; });
      reelSpring.set(0);
      paintStops(true);
    }
    showBlurb(0, true);
    blurbs[0].animate([{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }],
      { duration: reduced.matches ? 200 : TEXT_IN, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" });
    glowSprings[0].set(0);
    glowSprings[0].to(1);
  }

  // ---------- Controls ----------
  stops.forEach(function (stop, i) {
    stop.addEventListener("click", function () { goTo(i); });
  });

  // Returns true when the timeline used the key (otherwise the deck can use it)
  function key(e) {
    if (arriving) return true;                           // let the arrival finish first
    // Forward: fill the track to the next stop and push it into focus (ignored while one is moving)
    if ((e.key === " " || e.key === "ArrowRight") && active < LAST) {
      if (!lineAnim) advance();
      return true;
    }
    if (e.key === "ArrowLeft" && active > 0) { goTo(active - 1); return true; }
    return false;
  }

  // ---------- Arriving from the intro ----------
  // 1. The Questrade avatar leads the way: it slides right to its spot at the end of the line, the
  //    track draws in from the left after it, and Red River rises into focus.
  // 2. The page slides in. (No camera move.)
  // 2. The camera pulls back to show the whole career line, all four stops.
  // 3. It pushes back in on Red River as the paper slides in.
  var GLIDE = "cubic-bezier(0.65, 0, 0.3, 1)";
  var SMOOTH = "cubic-bezier(0.2, 0.8, 0.2, 1)";
  var arriving = false;
  var arriveAnims = [];
  var arriveTimers = [];

  function endArrival() {
    arriveAnims.forEach(function (a) { a.cancel(); });
    arriveTimers.forEach(clearTimeout);
    arriveAnims = []; arriveTimers = [];
    win.style.transformOrigin = "";
    slide.classList.remove("is-arriving");
    arriving = false;
  }

  function arriveFromIntro() {
    var intro = window.presentationIntro;
    if (!intro || !intro.handoff || reduced.matches) return;
    var from = intro.handoff("q");
    if (!from.width) return;
    arriving = true;
    slide.classList.add("is-arriving");

    var W = slide.clientWidth, H = slide.clientHeight;
    var s = slide.getBoundingClientRect();
    var avatar = stops[0].querySelector(".ct-avatar");
    var to = avatar.getBoundingClientRect();
    var A = to.width;
    var focusX = to.left + A / 2 - s.left;
    var lineY = to.top + A / 2 - s.top;

    function anim(el, frames, delay, duration, easing, fill) {
      var a = el.animate(frames, { delay: delay, duration: duration, easing: easing, fill: fill || "both" });
      arriveAnims.push(a);
      return a;
    }

    // 1. The Q leads the way: it shrinks and slides right, to its own spot at the end of the line
    //    (off past where the paper will be), the track draws in from the left edge after it, and
    //    Red River rises into focus
    var q = stops[LAST];
    var qAvatar = q.querySelector(".ct-avatar");
    var qTo = qAvatar.getBoundingClientRect();         // includes its resting scale
    var qRest = SCALE.upcoming;
    var dx = (from.left + from.width / 2) - (qTo.left + qTo.width / 2);
    var dy = (from.top + from.height / 2) - (qTo.top + qTo.height / 2);
    anim(qAvatar, [
      { transform: "translate(" + dx + "px, " + dy + "px) scale(" + (qRest * from.width / qTo.width) + ")" },
      { transform: "scale(" + qRest + ")" }
    ], 0, 1250, "cubic-bezier(0.55, 0, 0.25, 1)");
    // (sweeps across the screen, done before the page arrives)
    anim(rail, [
      { offset: 0, clipPath: "inset(0 " + W + "px 0 -" + (W * 4) + "px)", easing: "cubic-bezier(0.5, 0, 0.3, 1)" },
      { offset: 0.99, clipPath: "inset(0 0px 0 -" + (W * 4) + "px)" },
      { offset: 1, clipPath: "inset(0 -" + (W * 4) + "px 0 -" + (W * 4) + "px)" }
    ], 200, 1000, "linear");
    anim(avatar, [
      { opacity: 0, transform: "translateY(" + A * 0.35 + "px) scale(0.7)" },
      { opacity: 1, transform: "scale(1)" }
    ], 750, 800, SMOOTH);

    // Questrade fades away as it reaches its spot past where the page will be
    anim(q, [
      { offset: 0, opacity: 1 },
      { offset: 0.75, opacity: 1 },
      { offset: 1, opacity: 0 }
    ], 0, 1400, "linear");

    // 2. The page slides in as Red River settles; then the name fades in
    var PAPER = 1250;
    [paper, slide.querySelector(".ct-paper-shadow")].forEach(function (el) {
      anim(el, [
        { opacity: 0, transform: "translateX(64px)" },
        { opacity: 1, transform: "none" }
      ], PAPER, 900, SMOOTH);
    });
    // ...and the track pulls back to end behind the paper again, as it does normally
    var windowW = parseFloat(slide.style.getPropertyValue("--window-w")) || W;   // (the rail's box is W wide while arriving)
    anim(rail, [
      { clipPath: "inset(0 -" + (W * 4) + "px 0 -" + (W * 4) + "px)" },
      { clipPath: "inset(0 " + (W - windowW) + "px 0 -" + (W * 4) + "px)" }
    ], PAPER, 700, "cubic-bezier(0.4, 0, 0.2, 1)", "forwards");
    arriveTimers.push(setTimeout(function () { slide.classList.remove("is-arriving"); }, PAPER + 500));
    arriveTimers.push(setTimeout(endArrival, PAPER + 1000));
  }

  // ---------- Leaving for the next slide ----------
  // The page blurs and fades out to the right, the timeline keeps moving along for a moment, then it
  // blurs and fades out too. done() switches the slide.
  var exitAnims = [];
  var exitTimer = null;
  function clearExit() {
    clearTimeout(exitTimer);
    exitAnims.forEach(function (a) { a.cancel(); });
    exitAnims = [];
  }
  function exit(done) {
    endArrival();
    clearHold();
    stopLine();
    if (reduced.matches) { done(); return; }
    clearExit();
    var shadow = slide.querySelector(".ct-paper-shadow");
    var opts = function (delay, duration, easing) { return { delay: delay, duration: duration, easing: easing, fill: "forwards" }; };
    exitAnims.push(paper.animate([
      { opacity: 1, transform: "none", filter: "blur(0)" },
      { opacity: 0, transform: "translateX(90px)", filter: "blur(14px)" }
    ], opts(0, 750, "cubic-bezier(0.5, 0, 0.75, 0)")));
    // (the shadow copy keeps its drop-shadow filter: it only fades and slides)
    exitAnims.push(shadow.animate([
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: "translateX(90px)" }
    ], opts(0, 600, "cubic-bezier(0.5, 0, 0.75, 0)")));
    // Labels go first, so only the line and the avatar travel on
    stops.forEach(function (stop) {
      stop.querySelectorAll(".ct-name, .ct-role").forEach(function (el) {
        exitAnims.push(el.animate([{ opacity: 1 }, { opacity: 0 }], opts(0, 400, "ease")));
      });
    });
    exitAnims.push(win.animate([
      { transform: "none" },
      { transform: "translateX(" + (-gap * 0.7) + "px)" }
    ], opts(250, 1600, "cubic-bezier(0.45, 0, 0.55, 1)")));
    exitAnims.push(win.animate([
      { opacity: 1, filter: "blur(0)" },
      { opacity: 0, filter: "blur(16px)" }
    ], opts(900, 850, "cubic-bezier(0.4, 0, 0.6, 1)")));
    exitTimer = setTimeout(done, 1750);
  }

  // After a slide change the timeline fades away (0.5s), then the exit's end state is cleared
  function clearExitLater() {
    clearTimeout(exitTimer);
    exitTimer = setTimeout(clearExit, 700);
  }

  // Coming back from the next slide: show the end of the line (Questrade), no replay
  function showEnd() {
    active = LAST;
    reelSpring.set(LAST);
    fills.forEach(function (f) { f.getAnimations().forEach(function (a) { a.cancel(); }); f.style.transform = "scaleX(1)"; });
    paintStops(true);
    showBlurb(LAST, true);
  }

  function leave() {
    clearExitLater();
    endArrival();
    clearHold();
    stopLine();
    setPaused(false);
    autoplay = false;
  }

  layout();
  paintStops(true);
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 100);
  });

  window.slideControllers = window.slideControllers || {};
  window.slideControllers.timeline = {
    connect: function (d) { deck = d; },
    exit: exit,
    enter: function (opts) {
      clearExit();
      endArrival();
      layout();
      window.presentationBadge && window.presentationBadge(true);
      if (opts && opts.from === "philosophy") { clearHold(); stopLine(); setPaused(false); showEnd(); return; }
      replay(false);
      if (opts && opts.from === "intro" && !reduced.matches) arriveFromIntro();
    },
    leave: leave,
    replay: function () { replay(true); },
    key: key
  };
})();
