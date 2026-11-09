// Title wrapping (case studies): a title that wraps to exactly two lines keeps
// its last three words together on the second line, e.g. "Making everyday
// actions / easier to find", instead of leaving one word alone. Titles of
// three or more lines keep filling their full width, short last line and all.
// See "Titles fill their full width" in style.css.
(function () {
  var KEEP = 3;
  var titles = document.querySelectorAll(".case-page-title, .case-page-section h2, .case-page-section .case-step");

  // How many lines a title takes with its normal wrapping
  function lines(title) {
    var height = title.getBoundingClientRect().height;
    var before = title.style.whiteSpace;
    title.style.whiteSpace = "nowrap";
    var one = title.getBoundingClientRect().height;
    title.style.whiteSpace = before;
    return one ? Math.round(height / one) : 1;
  }

  // Wraps the last few words of the title's final text in a no-wrap span
  function keepEnd(title) {
    var last = title.lastChild;
    if (!last || last.nodeType !== 3) return;
    var words = last.textContent.replace(/\s+$/, "").split(" ");
    if (words.length <= KEEP) return;
    var keep = document.createElement("span");
    keep.className = "title-keep";
    keep.textContent = words.slice(-KEEP).join(" ");
    last.textContent = words.slice(0, -KEEP).join(" ") + " ";
    title.appendChild(keep);
  }

  // Puts the kept words back as plain text. Only that span is touched, so
  // other markup in a title (like an animated gradient word) is left alone.
  function release(title) {
    var keep = title.querySelector(":scope > .title-keep");
    if (!keep) return;
    keep.replaceWith(document.createTextNode(keep.textContent));
    title.normalize();
  }

  function update() {
    titles.forEach(function (title) {
      release(title);
      if (lines(title) === 2) keepEnd(title);
    });
  }

  var timer;
  window.addEventListener("resize", function () {
    clearTimeout(timer);
    timer = setTimeout(update, 100);
  });
  if (document.fonts) document.fonts.ready.then(update);
  update();
})();
