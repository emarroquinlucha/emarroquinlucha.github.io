// Top blur: fades in once the page is scrolled, so it's not there at the very top
(function () {
  var blur = document.querySelector(".top-blur");
  function update() { blur.classList.toggle("is-visible", window.scrollY > 8); }
  window.addEventListener("scroll", update, { passive: true });
  update();
})();
