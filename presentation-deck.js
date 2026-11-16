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
  // It shows on every slide after the intro (slides still call this; the deck decides)
  var current = 0;
  window.presentationBadge = function () { if (badge) badge.classList.toggle("is-shown", current !== 0); };

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

  function swap(index, step) {
    var from = slides[current].dataset.slide;
    if (controller(current).leave) controller(current).leave();
    slides[current].classList.remove("is-current");
    current = index;
    slides[current].classList.add("is-current");
    if (back) back.hidden = current === 0;
    next.hidden = current === slides.length - 1;
    if (replay) replay.hidden = true;
    nav.classList.add("is-visible");
    window.presentationBadge();
    if (controller(current).enter) controller(current).enter({ from: from, step: step });
    markMenu();
  }

  // ---------- The side menu ----------
  // The Menu pill opens a frosted sheet from the left (the slides shift right); each item jumps
  // straight to its slide and the menu stays open. Escape, the pill again, or a click on the slides
  // closes it.
  var root = document.documentElement;
  var menu = document.querySelector(".deck-menu");
  var menuBtn = document.querySelector(".deck-menu-btn");
  var items = menu ? Array.prototype.slice.call(menu.querySelectorAll(".dm-item")) : [];
  function indexOf(name) {
    for (var i = 0; i < slides.length; i++) if (slides[i].dataset.slide === name) return i;
    return -1;
  }
  // The caret marks where you are: the slide, or for a project, the step you're on
  function markMenu() {
    var name = slides[current].dataset.slide;
    var c = controller(current);
    var step = c.getStep ? Math.max(1, c.getStep()) : null;
    items.forEach(function (b) {
      var on = b.dataset.go === name && (b.dataset.step == null || step == null || +b.dataset.step === step);
      b.setAttribute("aria-current", on ? "true" : "false");
    });
  }
  function menuOpen() { return root.classList.contains("menu-open"); }
  function setMenu(open) {
    root.classList.toggle("menu-open", open);
    if (menuBtn) {
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.textContent = open ? "Close" : "Menu";
    }
  }
  if (menuBtn) menuBtn.addEventListener("click", function () { if (!menuOpen()) markMenu(); setMenu(!menuOpen()); });
  items.forEach(function (b) {
    b.addEventListener("click", function () {
      var i = indexOf(b.dataset.go);
      var step = b.dataset.step != null ? +b.dataset.step : undefined;
      if (i < 0 || exiting) return;                    // (the menu stays open; the caret follows)
      if (i === current) {                             // a step of the project already showing
        if (step != null && controller(i).jumpTo) controller(i).jumpTo(step);
        markMenu();
        return;
      }
      swap(i, step);                                   // a shortcut jumps (no way-out animation)
    });
  });
  document.querySelector(".presentation").addEventListener("click", function () { if (menuOpen()) setMenu(false); });
  markMenu();

  if (back) back.addEventListener("click", function () { go(current - 1); });
  next.addEventListener("click", function () { go(current + 1); });
  if (replay) replay.addEventListener("click", function () {
    if (controller(current).replay) controller(current).replay();
  });

  document.addEventListener("keydown", function (e) {
    if (!document.documentElement.classList.contains("is-unlocked")) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target.closest && e.target.closest("input, textarea")) return;
    if (menuOpen()) {                                  // while the menu is open, only Escape (closes it)
      if (e.key === "Escape") { e.preventDefault(); setMenu(false); if (menuBtn) menuBtn.focus(); }
      return;
    }
    var onButton = e.target.closest && e.target.closest("button");
    if (e.key === " " && onButton && !onButton.closest(".slide")) return;  // Space already clicks a focused deck button
    var c = controller(current);
    if (c.key && c.key(e)) { e.preventDefault(); return; }
    if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") { e.preventDefault(); go(current + 1); }
    if (e.key === "ArrowLeft" || e.key === "PageUp") { e.preventDefault(); go(current - 1); }
  });
})();
