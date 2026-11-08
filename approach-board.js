// Approach board (case studies): "Screens / Wireframes" switches between the
// real screenshots and just their colored layout blocks, and the legend
// highlights one type of block across every phone. Hover previews a type;
// clicking (or tapping) pins it until it's clicked again.
(function () {
  document.querySelectorAll(".approach-board").forEach(function (board) {
    var toggles = board.querySelectorAll(".approach-toggle-button");
    var keys = board.querySelectorAll(".approach-key");
    var pinned = null;

    toggles.forEach(function (button) {
      button.addEventListener("click", function () {
        toggles.forEach(function (b) { b.setAttribute("aria-pressed", b === button); });
        board.classList.toggle("is-wireframe", button.dataset.view === "wireframes");
      });
    });

    function focus(zone) {
      if (zone) board.dataset.focus = zone;
      else delete board.dataset.focus;
    }

    keys.forEach(function (key) {
      key.setAttribute("aria-pressed", "false");
      key.addEventListener("mouseenter", function () { focus(key.dataset.zone); });
      key.addEventListener("mouseleave", function () { focus(pinned); });
      key.addEventListener("click", function () {
        pinned = pinned === key.dataset.zone ? null : key.dataset.zone;
        keys.forEach(function (k) { k.setAttribute("aria-pressed", k.dataset.zone === pinned); });
        focus(pinned);
      });
    });
  });
})();
