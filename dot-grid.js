// Dot grid: darker dots glow around the mouse, and the grid drifts slightly toward it.
// Only reacts on the background, not over the paper or the menu. Its state carries
// over between pages, so the background doesn't change during a page transition.
(function () {
  var grid = document.querySelector(".dot-grid");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var target = { x: 0, y: 0 }, current = { x: 0, y: 0 };
  var drift = 0.02; // how far the grid follows the cursor (fraction of the distance from center)

  function place() {
    grid.style.setProperty("--shift-x", current.x.toFixed(2) + "px");
    grid.style.setProperty("--shift-y", current.y.toFixed(2) + "px");
  }

  // Pick up where the last page left off
  try {
    var saved = JSON.parse(sessionStorage.getItem("dot-grid"));
    if (saved) {
      target.x = current.x = saved.x;
      target.y = current.y = saved.y;
      place();
      grid.style.setProperty("--x", saved.cursorX);
      grid.style.setProperty("--y", saved.cursorY);
      grid.classList.toggle("is-active", saved.active);
    }
  } catch (e) {}

  window.addEventListener("pagehide", function () {
    try {
      sessionStorage.setItem("dot-grid", JSON.stringify({
        x: target.x,
        y: target.y,
        cursorX: grid.style.getPropertyValue("--x"),
        cursorY: grid.style.getPropertyValue("--y"),
        active: grid.classList.contains("is-active")
      }));
    } catch (e) {}
  });

  document.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    var overContent = e.target.closest(".resume, .site-header, .site-footer, .floating-dock, .quick-dock, .case-back");
    grid.classList.toggle("is-active", !overContent);
    grid.style.setProperty("--x", e.clientX + "px");
    grid.style.setProperty("--y", e.clientY + "px");
    target.x = (e.clientX - window.innerWidth / 2) * drift;
    target.y = (e.clientY - window.innerHeight / 2) * drift;
    startFollowing();
  });

  document.documentElement.addEventListener("mouseleave", function () {
    grid.classList.remove("is-active");
  });

  // Ease the grid toward the cursor; the loop stops once it has caught up,
  // so the grid isn't redrawn on every frame while the mouse is still
  var following = false;
  function follow() {
    current.x += (target.x - current.x) * 0.08;
    current.y += (target.y - current.y) * 0.08;
    place();
    if (Math.abs(target.x - current.x) > 0.05 || Math.abs(target.y - current.y) > 0.05) {
      requestAnimationFrame(follow);
    } else {
      following = false;
    }
  }
  function startFollowing() {
    if (reduceMotion || following) return;
    following = true;
    requestAnimationFrame(follow);
  }
})();
