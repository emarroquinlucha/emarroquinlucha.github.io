// Caption fade (case studies): every caption pill (.proto-hint) changes
// calmly, like the hero's: the old words fade out, then the new ones fade in.
// The animation scripts just set the caption's text as usual; this catches
// the change, puts the old words back for a moment, fades them out, then
// shows the new ones. The hero and showcase fade their own captions the same
// way. Styles: "Caption fade" in style.css.
(function () {
  if (!("MutationObserver" in window)) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var OUT_MS = 300;

  document.querySelectorAll("p.proto-hint").forEach(function (caption) {
    var shown = caption.innerHTML;
    var pending = null;
    var timer = null;

    function swapIn() {
      timer = null;
      shown = pending;
      pending = null;
      caption.innerHTML = shown;
      caption.classList.remove("is-out");
    }

    new MutationObserver(function () {
      var now = caption.innerHTML;
      if (now === shown) return; // our own change, or nothing new
      if (reduced || !shown) { shown = now; return; }
      pending = now;
      caption.innerHTML = shown; // keep the old words up while they fade out
      if (!timer) {
        caption.classList.add("is-out");
        timer = setTimeout(swapIn, OUT_MS);
      }
    }).observe(caption, { childList: true, characterData: true, subtree: true });
  });
})();
