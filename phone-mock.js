// iPhone mock: the two round buttons move the screenshot up and down inside the
// phone, and dim once there's nothing further to scroll that way.
// Before/after slider: the left and right buttons move between the pairs, and
// dim at the first and last.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".phone-mock").forEach(function (phone) {
    var screen = phone.querySelector(".phone-mock-scroll");
    var up = phone.querySelector('[data-scroll="up"]');
    var down = phone.querySelector('[data-scroll="down"]');

    function update() {
      up.setAttribute("aria-disabled", screen.scrollTop <= 1);
      down.setAttribute("aria-disabled", screen.scrollTop + screen.clientHeight >= screen.scrollHeight - 1);
    }

    function move(direction) {
      var step = screen.clientHeight * 0.7;
      var end = screen.scrollHeight - screen.clientHeight;
      var top = screen.scrollTop + direction * step;
      // Finish the trip rather than stopping just short of either end
      if (top < step * 0.25) top = 0;
      if (top > end - step * 0.25) top = end;
      screen.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    }

    up.addEventListener("click", function () { move(-1); });
    down.addEventListener("click", function () { move(1); });
    screen.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  });

  document.querySelectorAll(".compare-slider").forEach(function (slider) {
    var track = slider.querySelector(".compare-slider-track");
    var slides = slider.querySelectorAll(".compare-slide");
    var prev = slider.querySelector('[data-slide="prev"]');
    var next = slider.querySelector('[data-slide="next"]');
    var count = slider.querySelector(".compare-slider-count");
    var active = 0;

    // Replays the slide's reveal animation (see "Before/after slider" in style.css)
    function reveal(slide) {
      slide.classList.remove("is-revealed");
      void slide.offsetWidth;
      slide.classList.add("is-revealed");
    }

    function show(index) {
      if (index < 0 || index > slides.length - 1) return;
      active = index;
      reveal(slides[active]);
      track.style.transform = "translateX(" + (-100 * active) + "%)";
      // Only the slide on screen can be tabbed into or read out
      slides.forEach(function (slide, i) { slide.inert = i !== active; });
      prev.setAttribute("aria-disabled", active === 0);
      next.setAttribute("aria-disabled", active === slides.length - 1);
      count.textContent = (active + 1) + " / " + slides.length;
    }

    prev.addEventListener("click", function () { show(active - 1); });
    next.addEventListener("click", function () { show(active + 1); });

    // The first pair plays its reveal once the slider scrolls into view
    slider.classList.add("is-ready");
    if ("IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        seen.disconnect();
        reveal(slides[active]);
      }, { threshold: 0.4 });
      seen.observe(slider);
    } else {
      reveal(slides[active]);
    }
  });
})();
