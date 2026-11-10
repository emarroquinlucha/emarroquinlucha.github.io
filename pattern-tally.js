// Pattern tally (home-tab-refresh.html): its dots pop in column by column
// (CSS, via .is-in) and each column's total counts up as its dots land.
// board.reveal() replays it; framework-show.js calls it each time the tally
// card comes up. Styles are under "Pattern tally" in style.css.
(function () {
  var board = document.querySelector(".pt-board");
  if (!board) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var totals = board.querySelectorAll(".pt-total b");
  var timers = [];

  board.reveal = function () {
    if (reduced) return;
    timers.forEach(clearTimeout);
    timers = [];
    board.classList.add("is-ready");
    board.classList.remove("is-in");
    totals.forEach(function (b) { b.textContent = "0"; });
    void board.offsetWidth;
    board.classList.add("is-in");
    totals.forEach(function (b, c) {
      var end = Number(b.dataset.count);
      var n = 0;
      // Counts along with the column's dots (160ms per column)
      function tick() {
        b.textContent = String(++n);
        if (n < end) timers.push(setTimeout(tick, 70));
      }
      if (end) timers.push(setTimeout(tick, c * 160 + 120));
    });
  };
})();
