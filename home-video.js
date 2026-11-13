// The Design 03 animation (home-tab-refresh.html, .ac-show) as a video: the
// Home refresh camera move, recorded from its HTML build so its typeface
// shows in every browser. It plays only while on screen, and the round
// pause button (watch-pause.js) pauses and plays it. Reduced motion holds
// its first frame.
(function () {
  var box = document.querySelector(".ac-show");
  var video = box && box.querySelector(".ac-video");
  if (!video) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var visible = false;
  var hint = box.querySelector(".ac-hint");

  // The caption stays text (so the video can be cropped to the box at any
  // size without losing it), switched at the loop's own moments, in seconds
  var CAPTIONS = [
    [0, "Plain Account Rows", "Before"],
    [2.2, "Accounts With Their Cards", "After"],
    [4.4, "The New Home Tab"],
    [6.4, "A Greeting for Every Time of Day"],
    [10.0, "Inline Messages, When They Matter"],
    [14.8, "Rewards Pill Concept. Unreleased."]
  ];
  function say(text, tag) {
    var key = (tag || "") + "|" + text;
    if (hint.dataset.key === key) return;
    hint.dataset.key = key;
    hint.style.opacity = 0;
    setTimeout(function () {
      hint.textContent = text;
      if (tag) {
        var chip = document.createElement("span");
        chip.className = "hint-tag" + (tag === "After" ? " is-after" : "");
        chip.textContent = tag;
        hint.insertBefore(chip, hint.firstChild);
      }
      hint.style.opacity = "";
    }, 200);
  }
  function caption() {
    var t = video.currentTime, c = CAPTIONS[0];
    for (var i = 0; i < CAPTIONS.length; i++) if (t >= CAPTIONS[i][0]) c = CAPTIONS[i];
    say(c[1], c[2]);
  }
  if (hint) {
    // timeupdate only fires a few times a second; a frame loop keeps it close
    (function tick() { if (!video.paused) caption(); requestAnimationFrame(tick); })();
    video.addEventListener("seeked", caption);
    caption();
  }

  function sync() {
    var play = visible && !reduced && !box.classList.contains("is-paused");
    if (play) video.play().catch(function () {});
    else video.pause();
  }

  if (window.watchPause && !reduced) watchPause.attach(box);
  // The pause button toggles .is-paused on the box
  new MutationObserver(sync).observe(box, { attributes: true, attributeFilter: ["class"] });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      sync();
    }, { threshold: 0.3 }).observe(box);
  } else {
    visible = true;
    sync();
  }
})();
