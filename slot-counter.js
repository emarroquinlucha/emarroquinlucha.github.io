// Slot counters (the savings and spend mocks): turns a number like
// "$12,345.67" into a row of reels. Each digit is a strip of 0–9 twice
// over; spinning it slides the strip calmly down to its digit in the second
// set, the reels landing one after another from left to right. Each reel's
// window is a little taller than its digit and fades at the top and bottom,
// so the digits fade in and out as they pass instead of being cut off.
// Other characters ($ , . % and words) stay put. Styles are under "Slot
// counters" in style.css.
//   SlotCounter.mount(el, "$12,345.67")  builds the reels (showing zeros)
//   SlotCounter.spin(el)                 spins them to the number
//   SlotCounter.reset(el)                back to zeros, at once
window.SlotCounter = (function () {
  var SETS = 2;
  var LINE = 1.15;   // a digit's height, in em
  var PAD = 0.225;   // extra window above and below it, in em

  function offset(index) {
    return "translateY(" + (PAD - index * LINE).toFixed(3) + "em)";
  }

  function mount(el, text) {
    el.classList.add("slot");
    el.setAttribute("aria-label", text);
    el.innerHTML = "";
    text.split("").forEach(function (c) {
      if (/\d/.test(c)) {
        var reel = document.createElement("span");
        reel.className = "slot-reel";
        reel.dataset.digit = c;
        var strip = document.createElement("span");
        strip.className = "slot-strip";
        var html = "";
        for (var s = 0; s < SETS; s++) for (var d = 0; d < 10; d++) html += "<span>" + d + "</span>";
        strip.innerHTML = html;
        reel.appendChild(strip);
        el.appendChild(reel);
      } else {
        var ch = document.createElement("span");
        ch.className = "slot-char";
        ch.textContent = c;
        el.appendChild(ch);
      }
    });
  }

  function strips(el) {
    return Array.prototype.slice.call(el.querySelectorAll(".slot-strip"));
  }

  function reset(el) {
    strips(el).forEach(function (s) {
      s.style.transition = "none";
      s.style.transform = offset(0);
    });
    void el.offsetWidth;
  }

  // ms: how long the first reel takes; each one after lands a little later
  function spin(el, ms) {
    ms = ms || 1500;
    strips(el).forEach(function (s, i) {
      var d = +s.parentNode.dataset.digit;
      s.style.transition = "transform " + (ms + i * 70) + "ms cubic-bezier(0.3, 0.7, 0.25, 1)";
      s.style.transform = offset((SETS - 1) * 10 + d);
    });
  }

  // The finished number, with no spin
  function show(el) {
    strips(el).forEach(function (s) {
      var d = +s.parentNode.dataset.digit;
      s.style.transition = "none";
      s.style.transform = offset((SETS - 1) * 10 + d);
    });
  }

  return { mount: mount, spin: spin, reset: reset, show: show };
})();
