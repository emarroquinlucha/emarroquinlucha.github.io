// Case study cover videos: play while on screen (unless the visitor asked
// for reduced motion or pressed pause); the button toggles play/pause.
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".case-media").forEach(function (media) {
    var video = media.querySelector("video");
    var toggle = media.querySelector(".case-video-toggle");
    var wantsPlay = !reduce;
    var visible = false;

    function sync() {
      if (wantsPlay && visible) {
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
  });
})();
