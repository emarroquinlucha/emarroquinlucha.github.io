// Case study cover videos: play while on screen (unless the visitor asked
// for reduced motion or pressed pause); the button toggles play/pause. They
// hold on their poster until the page has finished transitioning in.
(function () {
  var pageIn = !("onpagereveal" in window);
  var waiting = [];
  function pageIsIn() {
    pageIn = true;
    waiting.forEach(function (sync) { sync(); });
  }
  if (!pageIn) {
    window.addEventListener("pagereveal", function (e) {
      if (e.viewTransition) e.viewTransition.finished.then(pageIsIn, pageIsIn);
      else pageIsIn();
    }, { once: true });
  }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".case-media").forEach(function (media) {
    var video = media.querySelector("video");
    if (!video) return; // animated covers run themselves (case-anim.js)
    var toggle = media.querySelector(".case-video-toggle");
    var wantsPlay = !reduce;
    var visible = false;

    function sync() {
      if (wantsPlay && visible && pageIn) {
        var playing = video.play();
        if (playing) playing.catch(function () {});
      } else {
        video.pause();
      }
    }

    function label() {
      var paused = !wantsPlay;
      media.classList.toggle("is-paused", paused);
      toggle.setAttribute("aria-label", paused ? "Play video" : "Pause video");
    }

    toggle.addEventListener("click", function () {
      wantsPlay = !wantsPlay;
      label();
      sync();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        sync();
      }, { threshold: 0.25 }).observe(media);
    } else {
      visible = true;
      sync();
    }
    label();
    waiting.push(sync);
  });
})();
