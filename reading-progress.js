// Reading progress (case studies): fills the gradient line at the top of the
// window as the page is scrolled, like the resume's. Styles are under
// ".reading-progress" in style.css.
(function () {
  var line = document.querySelector(".reading-progress");
  if (!line) return;
  var ticking = false;
  function update() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    line.style.setProperty("--progress", progress.toFixed(4));
    ticking = false;
  }
  function request() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  window.addEventListener("load", request);
  update();
})();
