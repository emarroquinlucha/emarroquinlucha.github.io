// Presentation deck: moves between slides with the Next button (and Back, if it's in the page) and the arrow keys.
// Each slide can have a controller in window.slideControllers (keyed by its data-slide):
//   enter({ from })  when the slide comes on (from: the data-slide it came from)   leave()  when it goes away
//   replay()  for the Replay button          key(e)   gets keys first; return true if it used one
//   connect(deck) to get { showReplay(bool) }
//   exit(done)  optional: plays a way out when moving forward, and calls done() to switch slides
(function () {
  var slides = Array.prototype.slice.call(document.querySelectorAll(".presentation .slide"));
  var nav = document.querySelector(".deck-nav");
  var back = nav.querySelector(".deck-back");
  var replay = nav.querySelector(".intro-replay");
  var next = nav.querySelector(".deck-next");
  var controllers = window.slideControllers || {};
  // The small "Questrade + Eddie" in the top-left corner: slides turn it on for their non-title steps
  var badge = document.querySelector(".deck-badge");
  window.presentationBadge = function (show) { if (badge) badge.classList.toggle("is-shown", !!show); };
  var current = 0;

  var deck = {
    showReplay: function (show) { if (replay) replay.hidden = !show; }
  };
  Object.keys(controllers).forEach(function (k) {
    if (controllers[k].connect) controllers[k].connect(deck);
  });

  function controller(i) { return controllers[slides[i].dataset.slide] || {}; }

  var exiting = false;
  function go(index) {
    if (exiting || index < 0 || index >= slides.length || index === current) return;
    var c = controller(current);
    if (c.exit && index > current) {
      exiting = true;
      c.exit(function () { exiting = false; swap(index); });
      return;
    }
    swap(index);
  }

  function swap(index) {
    var from = slides[current].dataset.slide;
    if (controller(current).leave) controller(current).leave();
    window.presentationBadge(false);
    slides[current].classList.remove("is-current");
    current = index;
    slides[current].classList.add("is-current");
    if (back) back.hidden = current === 0;
    next.hidden = current === slides.length - 1;
    if (replay) replay.hidden = true;
    nav.classList.add("is-visible");
    if (controller(current).enter) controller(current).enter({ from: from });
  }

  if (back) back.addEventListener("click", function () { go(current - 1); });
  next.addEventListener("click", function () { go(current + 1); });
  if (replay) replay.addEventListener("click", function () {
    if (controller(current).replay) controller(current).replay();
  });

  document.addEventListener("keydown", function (e) {
    if (!document.documentElement.classList.contains("is-unlocked")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest("input, textarea")) return;
    var onButton = e.target.closest && e.target.closest("button");
    if (e.key === " " && onButton && !onButton.closest(".slide")) return;  // Space already clicks a focused deck button
    var c = controller(current);
    if (c.key && c.key(e)) { e.preventDefault(); return; }
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(current + 1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(current - 1); }
  });
})();
