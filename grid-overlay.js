// Grid overlay (case studies): press G to show or hide the page's three
// columns, for checking alignment while designing. The columns match
// .case-details: three equal columns with 24px gaps inside the article's
// padding. Styles are under "Grid overlay" in style.css.
(function () {
  var article = document.querySelector("article#intro");
  if (!article) return;
  var overlay = null;

  function place() {
    var s = getComputedStyle(article);
    overlay.style.left = s.paddingLeft;
    overlay.style.right = s.paddingRight;
  }

  function toggle() {
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "grid-overlay";
      overlay.setAttribute("aria-hidden", "true");
      overlay.innerHTML = "<span></span><span></span><span></span>";
      article.appendChild(overlay);
      window.addEventListener("resize", function () { if (!overlay.hidden) place(); });
    } else {
      overlay.hidden = !overlay.hidden;
    }
    if (!overlay.hidden) place();
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "g" && e.key !== "G") return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    toggle();
  });
})();
