// Presentation, slide 1: "Questrade + Eddie".
// 1. The Questrade wordmark blurs in from below.
// 2. The letters leave one by one until only the Q is left.
// 3. The Q glides to the centre and grows into the green Q avatar.
// 4. The avatar shines and tilts in 3D.
// 5. It settles in the centre, then both avatars fan out: the Q left, Eddie from behind it, right.
// 6. Then "Questrade + Eddie" blurs in below.
// A camera zooms in and out over the whole scene. Reduced motion shows the final frame.
(function () {
  var slide = document.querySelector(".slide-intro");
  if (!slide) return;

  var camera = slide.querySelector(".intro-camera");
  var stage = slide.querySelector(".intro-stage");
  var wordmark = slide.querySelector(".wordmark");
  var letters = Array.prototype.slice.call(slide.querySelectorAll(".wm-letter"));
  var qSlot = slide.querySelector(".q-slot");
  var qAvatar = slide.querySelector(".q-avatar");
  var qTilt = slide.querySelector(".q-tilt");
  var qBg = slide.querySelector(".q-bg");
  var qShine = slide.querySelector(".q-shine");
  var eddie = slide.querySelector(".eddie-avatar");
  var title = slide.querySelector(".intro-title");
  var labelQ = slide.querySelector(".intro-label-q");
  var labelE = slide.querySelector(".intro-label-e");
  var plus = slide.querySelector(".intro-plus");
  var nav = document.querySelector(".deck-nav");      // Back / Replay / Next: shown once the intro ends

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  var running = [];
  var timers = [];

  var SMOOTH = "cubic-bezier(0.2, 0.8, 0.2, 1)";     // quick start, long soft landing
  var GLIDE = "cubic-bezier(0.65, 0, 0.3, 1)";       // slow in, slow out
  var CAMERA = "cubic-bezier(0.45, 0, 0.2, 1)";
  var FAN = "cubic-bezier(0.25, 0.7, 0.2, 1)";        // the fan-out: brisk start, soft landing
  var AVATAR_SCALE = 1.6;                             // the Q avatar's size for the shine, vs the wordmark Q
  var END_SCALE = AVATAR_SCALE * 0.7;                 // both avatars end at 70% of that size
  var TOTAL = 10000;

  // fill "both" holds the first frame during the delay; a second move on the same element
  // passes "forwards" so it doesn't override the first one before it starts
  function anim(el, keyframes, delay, duration, easing, fill) {
    var a = el.animate(keyframes, { delay: delay, duration: duration, easing: easing || SMOOTH, fill: fill || "both" });
    running.push(a);
    return a;
  }

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

  // Once a blur-in finishes, take the filter off entirely: even blur(0) on a parent
  // stops the avatars' frosted glass from seeing the page behind it
  function dropFilterWhenDone(a) {
    a.finished.then(function () {
      a.effect.setKeyframes(a.effect.getKeyframes().map(function (k) {
        return { offset: k.offset, easing: k.easing, opacity: k.opacity, transform: k.transform };
      }));
    }, function () {});
  }

  function reset() {
    running.forEach(function (a) { a.cancel(); });
    running = [];
    timers.forEach(clearTimeout);
    timers = [];
    qShine.classList.remove("is-shining");
    nav.classList.remove("is-visible");
    eddie.style.visibility = "";
    qAvatar.style.visibility = "";
  }

  // Going on to the timeline: the timeline takes over an avatar ("q" or "eddie") where it sits now,
  // so hide it here and say where it was
  function handoff(which) {
    var el = which === "eddie" ? eddie : qAvatar;
    var r = el.getBoundingClientRect();
    el.style.visibility = "hidden";
    return r;
  }

  // Where everything goes, measured without transforms (offsets ignore them)
  function layout() {
    var W = stage.clientWidth;
    var H = stage.clientHeight;
    var u = Math.min(window.innerWidth / 100, window.innerHeight * 0.017);
    var box = qAvatar.offsetWidth;
    var A = box * END_SCALE;                          // final avatar size
    var gap = 2.4 * u;
    var titleH = labelQ.offsetHeight;
    var offset = A * 0.85;                            // how far each avatar sits from the middle (room for the +)
    // Centre the avatars + title as one group
    var pairY = H / 2 - (gap + titleH) / 2;
    var qCenterX = wordmark.offsetLeft + qSlot.offsetLeft + qAvatar.offsetLeft + box / 2;
    var qCenterY = wordmark.offsetTop + qSlot.offsetTop + qAvatar.offsetTop + box / 2;
    title.style.top = (pairY + A / 2 + gap) + "px";
    labelQ.style.setProperty("--x", (W / 2 - offset) + "px");
    labelE.style.setProperty("--x", (W / 2 + offset) + "px");
    plus.style.setProperty("--plus", (A * 0.26) + "px");
    plus.style.left = (W / 2) + "px";
    plus.style.top = pairY + "px";
    return {
      u: u,
      dx: W / 2 - qCenterX,
      dy: pairY - qCenterY,
      eddieY: pairY - H / 2,                          // Eddie starts centred on the stage
      offset: offset
    };
  }

  function play() {
    reset();
    var L = layout();
    var u = L.u;
    var s = AVATAR_SCALE;

    // Camera: in close, ease out, push toward the Q, push in on the avatar, pull back for the reveal, settle
    anim(camera, [
      { offset: 0,    transform: "scale(1.22)", easing: CAMERA },
      { offset: 0.15, transform: "scale(1)",    easing: CAMERA },
      { offset: 0.32, transform: "scale(1.08)", easing: CAMERA },
      { offset: 0.47, transform: "scale(1.32)", easing: "ease-in-out" },
      { offset: 0.64, transform: "scale(1.36)", easing: CAMERA },
      { offset: 0.8,  transform: "scale(0.94)", easing: CAMERA },
      { offset: 1,    transform: "scale(1)" }
    ], 0, TOTAL, "linear");

    // 1. Wordmark blurs in from below
    dropFilterWhenDone(anim(wordmark, [
      { opacity: 0, transform: "translateY(" + 5 * u + "px) scale(0.96)", filter: "blur(18px)" },
      { opacity: 1, transform: "none", filter: "none" }   // "none", not blur(0): any filter stops the glass frost
    ], 200, 1300));

    // 2. Letters leave one by one, last letter first
    letters.slice().reverse().forEach(function (letter, i) {
      anim(letter, [
        { opacity: 1, transform: "none", filter: "blur(0)" },
        { opacity: 0, transform: "translateY(" + -u + "px) scale(0.92)", filter: "blur(10px)" }
      ], 1900 + i * 105, 520, "cubic-bezier(0.4, 0, 0.6, 1)");
    });

    // 3. The Q glides to the centre and grows; the green circle blooms behind it
    var qCentre = "translate(" + L.dx + "px, " + L.dy + "px) scale(" + s + ")";
    anim(qAvatar, [{ transform: "none" }, { transform: qCentre }], 3050, 1150, GLIDE);
    anim(qBg, [
      { opacity: 0, transform: "scale(0.55)" },
      { opacity: 1, transform: "scale(1)" }
    ], 3550, 950, "cubic-bezier(0.2, 0.9, 0.25, 1)");

    // 4. Shine and a 3D tilt
    // One smooth tilt out and back, no swing past centre
    anim(qTilt, [
      { transform: "rotateX(0) rotateY(0)", easing: "cubic-bezier(0.45, 0, 0.55, 1)" },
      { offset: 0.5, transform: "rotateX(8deg) rotateY(-18deg)", easing: "cubic-bezier(0.45, 0, 0.55, 1)" },
      { transform: "rotateX(0) rotateY(0)" }
    ], 4500, 2000, "linear");
    later(function () { qShine.classList.add("is-shining"); }, 4600);

    // 5. The Q settles to its final size in the centre, then both avatars fan out:
    //    the Q to the left, Eddie from behind it to the right.
    var e = END_SCALE;
    var qSmall = "translate(" + L.dx + "px, " + L.dy + "px) scale(" + e + ")";
    var qLeft = "translate(" + (L.dx - L.offset) + "px, " + L.dy + "px) scale(" + e + ")";
    anim(qAvatar, [{ transform: qCentre }, { transform: qSmall }], 6500, 900, GLIDE, "forwards");
    anim(qAvatar, [{ transform: qSmall }, { transform: qLeft }], 7450, 1050, FAN, "forwards");
    anim(eddie, [
      { opacity: 0, transform: "translate(0, " + L.eddieY + "px) scale(" + e + ")" },
      { offset: 0.15, opacity: 1 },
      { opacity: 1, transform: "translate(" + L.offset + "px, " + L.eddieY + "px) scale(" + e + ")" }
    ], 7450, 1050, FAN);

    // The + turns in between them as they part, like the Q's leg swinging into place
    anim(plus, [
      { opacity: 0, transform: "scale(0.4) rotate(-90deg)", filter: "blur(8px)" },
      { opacity: 1, transform: "none", filter: "none" }
    ], 7750, 900, SMOOTH);

    // 6. Then the labels blur in under the avatars, as Eddie settles
    anim(title, [
      { opacity: 0, transform: "translateY(" + 2 * u + "px)", filter: "blur(12px)" },
      { opacity: 1, transform: "none", filter: "blur(0)" }
    ], 8100, 1100);

    later(function () { nav.classList.add("is-visible"); }, 9450);

    if (reduced.matches) {
      running.forEach(function (a) { a.finish(); });
      timers.forEach(clearTimeout);
      timers = [];
      nav.classList.add("is-visible");
    }
  }

  // Jump straight to the last frame (used after a resize)
  function showEnd() {
    play();
    running.forEach(function (a) { a.finish(); });
    timers.forEach(clearTimeout);
    timers = [];
    nav.classList.add("is-visible");
  }

  function start() {
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(play);
  }


  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (slide.classList.contains("is-current")) showEnd();
    }, 150);
  });

  if (document.documentElement.classList.contains("is-unlocked")) start();
  else document.addEventListener("presentation:unlocked", start, { once: true });

  window.presentationIntro = { play: play, showEnd: showEnd, handoff: handoff };

  // For the deck: coming back to this slide shows the last frame; Replay plays it again
  var deck = null;
  window.slideControllers = window.slideControllers || {};
  window.slideControllers.intro = {
    connect: function (d) { deck = d; },
    enter: function () { showEnd(); if (deck) deck.showReplay(true); },
    replay: play
  };
})();
