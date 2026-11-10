// Quick Actions framework (home-tab-refresh.html): the action pills fade up
// column by column (CSS, via .is-in), then the account mix dots pop in.
// board.reveal() replays that; board.expand(open) shows or hides every
// column's future rails, as the "+N Future Rails" toggles do. Both are used
// by framework-show.js. Styles are under "Quick Actions framework" in
// style.css.
(function () {
  var board = document.querySelector(".fw-board");
  if (!board) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var toggles = board.querySelectorAll(".fw-toggle");

  board.querySelectorAll(".fw-cell").forEach(function (cell) {
    cell.querySelectorAll(".fw-pill").forEach(function (pill) {
      pill.style.setProperty("--r", cell.style.getPropertyValue("--r"));
      pill.style.setProperty("--c", cell.style.getPropertyValue("--c"));
    });
    cell.querySelectorAll(".fw-rail").forEach(function (rail, i) { rail.style.setProperty("--i", i); });
  });

  board.expand = function (open) {
    board.classList.toggle("is-expanded", open);
    toggles.forEach(function (b) { b.setAttribute("aria-expanded", String(open)); });
  };

  toggles.forEach(function (btn) {
    btn.addEventListener("click", function () {
      board.expand(!board.classList.contains("is-expanded"));
    });
  });

  board.reveal = function () {
    if (reduced) return;
    board.classList.add("is-ready");
    board.classList.remove("is-in");
    void board.offsetWidth;
    board.classList.add("is-in");
  };
})();
