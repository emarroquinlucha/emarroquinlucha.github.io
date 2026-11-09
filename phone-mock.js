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
    // Check again whenever the screen or its screenshot changes size: when a
    // lazy screenshot loads, or a hidden phone (Explore, another account)
    // comes into view. Otherwise it stays dimmed from measuring as empty.
    var shot = screen.querySelector("img");
    if (shot) shot.addEventListener("load", update);
    if ("ResizeObserver" in window) {
      var watch = new ResizeObserver(update);
      watch.observe(screen);
      if (shot) watch.observe(shot);
    }
    update();
  });

  document.querySelectorAll(".compare-slider").forEach(function (slider) {
    var track = slider.querySelector(".compare-slider-track");
    var slides = slider.querySelectorAll(".compare-slide");
    // The account switcher at the top, and the account's name in the caption
    var buttons = slider.querySelectorAll(".compare-accounts [data-slide]");
    var caption = slider.querySelector(".compare-explore-hint");
    var active = 0;

    // Replays the slide's reveal animation (see "Before/after slider" in style.css)
    function reveal(slide) {
      slide.classList.remove("is-revealed");
      void slide.offsetWidth;
      slide.classList.add("is-revealed");
    }

    var leaving = null;

    // Fades the current pair out, jumps to the new one, which then fades in
    function go(index) {
      if (index === active || index < 0 || index > slides.length - 1) return;
      var from = slides[active];
      clearTimeout(leaving);
      from.classList.add("is-leaving");
      leaving = setTimeout(function () {
        from.classList.remove("is-leaving", "is-revealed");
        show(index);
      }, reduced ? 0 : 250);
    }

    function show(index) {
      if (index < 0 || index > slides.length - 1) return;
      active = index;
      reveal(slides[active]);
      track.style.transform = "translateX(" + (-100 * active) + "%)";
      // Only the slide on screen can be tabbed into or read out
      slides.forEach(function (slide, i) { slide.inert = i !== active; });
      buttons.forEach(function (b, i) { b.setAttribute("aria-pressed", i === active); });
      if (caption) caption.textContent = slides[active].getAttribute("aria-label").split(",")[0];
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () { go(+b.dataset.slide); });
    });

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
