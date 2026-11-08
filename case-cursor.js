// Preview cursor: over a case study cover, a mouse pointer becomes a white
// circle with the "View project" button's cycling gradient border. Touch
// screens and the pause button keep their usual behaviour.
(function () {
  var cursor = document.createElement("div");
  cursor.className = "case-cursor";
  cursor.setAttribute("aria-hidden", "true");
  cursor.innerHTML = '<span class="glass-button-glow"></span>';
  document.body.appendChild(cursor);

  function moveTo(e) {
    cursor.style.translate = e.clientX + "px " + e.clientY + "px";
  }

  document.querySelectorAll(".case-image-link").forEach(function (link) {
    link.addEventListener("pointerenter", function (e) {
      if (e.pointerType !== "mouse") return;
      link.style.cursor = "none";
      moveTo(e);
      cursor.hidden = false;
      cursor.classList.add("is-visible");
    });
    link.addEventListener("pointermove", function (e) {
      if (e.pointerType === "mouse") moveTo(e);
    });
    link.addEventListener("pointerleave", function () {
      cursor.classList.remove("is-visible");
    });
  });

  // Keep it out of the picture the page transition takes of this page
  window.addEventListener("pageswap", function () {
    cursor.classList.remove("is-visible");
    cursor.hidden = true;
  });
})();
