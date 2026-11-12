// Pause / play for the case studies' Watch animations. Every demo with a
// Watch / Explore (or Try it) switch gets a round button in its bottom-right
// corner (styled like the hero's, see "Watch pause" in style.css). Pausing
// adds .is-paused to the demo: its loop's clock stands still (the scripts
// wait with watchPause.wait) and its mode ring stops filling. Switching mode
// plays again. Load it before the scripts that use it.
//   watchPause.wait(box, ms, isStillRunning)  // a wait that holds while paused
//   watchPause.set(box, paused)
(function () {
  var ICONS =
    '<svg class="finale-icon-pause" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2.5" y="2" width="2.4" height="8" rx="0.8" fill="currentColor"/><rect x="7.1" y="2" width="2.4" height="8" rx="0.8" fill="currentColor"/></svg>' +
    '<svg class="finale-icon-play" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3.2 2.1v7.8a.6.6 0 0 0 .9.5l6-3.9a.6.6 0 0 0 0-1l-6-3.9a.6.6 0 0 0-.9.5Z" fill="currentColor"/></svg>';

  function button(box) {
    return box.querySelector(":scope > .watch-pause");
  }

  function set(box, paused) {
    box.classList.toggle("is-paused", paused);
    var b = button(box);
    if (!b) return;
    b.setAttribute("aria-pressed", paused);
    b.setAttribute("aria-label", paused ? "Play the animation" : "Pause the animation");
  }

  function attach(box) {
    if (button(box)) return;
    var b = document.createElement("button");
    b.className = "finale-pause watch-pause";
    b.type = "button";
    b.setAttribute("aria-pressed", "false");
    b.setAttribute("aria-label", "Pause the animation");
    b.innerHTML = ICONS;
    box.appendChild(b);
    b.addEventListener("click", function () { set(box, !box.classList.contains("is-paused")); });
    // Switching mode always plays again
    box.addEventListener("click", function (e) {
      if (e.target.closest && e.target.closest(".approach-toggle-button[data-mode]")) set(box, false);
    });
  }

  // Waits ms of playing time; rejects ("stopped") once alive() is false
  function wait(box, ms, alive) {
    return new Promise(function (resolve, reject) {
      var left = ms, last = performance.now();
      (function tick() {
        if (!alive()) { reject("stopped"); return; }
        var now = performance.now();
        if (!box.classList.contains("is-paused")) left -= now - last;
        last = now;
        if (left <= 0) resolve(); else setTimeout(tick, Math.min(50, left));
      })();
    });
  }

  document.querySelectorAll(
    ".compare-slider[data-mode], .approach-board[data-mode], .proto[data-mode], .combo[data-mode], .joint[data-mode]"
  ).forEach(attach);

  window.watchPause = { wait: wait, set: set, attach: attach };
})();
