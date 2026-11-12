// Contents: marks the section being read. A section counts once its top
// passes 35% of the way down the window; at the very bottom of the page the
// last one is marked, since it may never get that far up.
(function () {
  var links = [].slice.call(document.querySelectorAll(".page-toc a"));
  var targets = links.map(function (a) { return document.getElementById(a.hash.slice(1)); });
  var list = links.length ? links[0].closest("ul") : null;
  var ticking = false;
  function update() {
    ticking = false;
    var line = window.innerHeight * 0.35;
    var current = 0;
    targets.forEach(function (t, i) {
      if (t.getBoundingClientRect().top <= line) current = i;
    });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
      current = targets.length - 1;
    }
    links.forEach(function (a, i) {
      a.classList.toggle("is-current", i === current);
      if (i === current) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
    // The dark stretch slides along the track to the current item
    var on = links[current];
    if (on && list) {
      list.style.setProperty("--toc-top", on.offsetTop + "px");
      list.style.setProperty("--toc-h", on.offsetHeight + "px");
      list.classList.add("has-indicator");
    }
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  window.addEventListener("resize", update);
  update();

  // On a case study, jumping to a section doesn't add to the browser's history,
  // so the Back button still goes straight to the resume
  if (document.documentElement.classList.contains("page-case")) {
    links.forEach(function (a, i) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        targets[i].scrollIntoView();
        history.replaceState(null, "", a.hash);
      });
    });
  }
})();
