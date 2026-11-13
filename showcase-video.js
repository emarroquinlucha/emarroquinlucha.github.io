// One Structure's outcome showcase (accounts-architecture.html, .showcase) as
// a video: the account designs, recorded from their HTML build (showcase.js
// on the HTML version) so TT Commons shows in every browser. It plays only
// while on screen; the pause button pauses it; the caption stays text,
// switched at the loop's own moments. Reduced motion holds the poster.
(function () {
  var show = document.querySelector(".showcase");
  var video = show && show.querySelector(".showcase-video");
  if (!video) return;
  var caption = show.querySelector(".showcase-caption");
  var pauseButton = show.querySelector(".showcase-pause");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var inView = false, paused = false;
  var CAPTIONS = [
    [0, "Chequing, Credit and Savings"],
    [4.324, "Paying Off the Statement"],
    [8.035, "Paid in Full"],
    [12.265, "Manage Card, One Tap Away"],
    [17.202, "A Savings Goal, Reaching 100%"],
    [21.822, "Interest, Adding Up"]
  ];

  function say(text) {
    if (caption.textContent === text) return;
    caption.style.opacity = 0;
    setTimeout(function () { caption.textContent = text; caption.style.opacity = ""; }, 200);
  }
  function captionNow() {
    var t = video.currentTime, c = CAPTIONS[0];
    for (var i = 0; i < CAPTIONS.length; i++) if (t >= CAPTIONS[i][0]) c = CAPTIONS[i];
    say(c[1]);
  }
  (function tick() { if (!video.paused) captionNow(); requestAnimationFrame(tick); })();

  function sync() {
    if (inView && !paused && !reduced) video.play().catch(function () {});
    else video.pause();
  }

  if (pauseButton) {
    if (reduced) pauseButton.hidden = true;
    pauseButton.addEventListener("click", function () {
      paused = !paused;
      show.classList.toggle("is-paused", paused);
      pauseButton.setAttribute("aria-pressed", paused);
      pauseButton.setAttribute("aria-label", paused ? "Play the animation" : "Pause the animation");
      sync();
    });
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      sync();
    }, { threshold: 0.3 }).observe(show);
  } else {
    inView = true;
    sync();
  }
})();
