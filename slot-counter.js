// Slot counters (the big Total savings and Total spend numbers): turns a
// number like "$12,345.67" into a row of digit reels, each a strip of 0–9.
// It starts on a nearby number (a few hundred dollars short) and rolls up to
// the real one: each digit that differs rolls up to its new value (always
// bottom to top, the new digit rising from below),
// the reels landing one after another from left to right, with a light
// vertical motion blur while they move. Digits keep a steady width. Each
// reel's window fades at the top and bottom, so digits fade in and out as
// they pass. Other characters ($ , .) stay put. Styles are under "Slot
// counters" in style.css.
//   SlotCounter.mount(el, "$12,345.67", "$12,027.67")  builds the reels on
//                                         the start number (or zeros)
//   SlotCounter.spin(el)                  rolls them to the number
//   SlotCounter.reset(el)                 back to the start number, at once
//   SlotCounter.show(el)                  the number, at once
window.SlotCounter = (function () {
  var LINE = 1.15;   // a digit's height, in em
  var PAD = 0.225;   // extra window above and below it, in em

  // The light vertical blur for digits in motion: one SVG filter per page
  function ensureBlur() {
    if (document.getElementById("slot-vblur")) return;
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.position = "absolute";
    svg.innerHTML = '<filter id="slot-vblur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="0 0.9"/></filter>';
    document.body.appendChild(svg);
  }

  function offset(d) {
    return "translateY(" + (PAD - d * LINE).toFixed(3) + "em)";
  }

  function mount(el, text, from) {
    ensureBlur();
    el.classList.add("slot");
    el.setAttribute("aria-label", text);
    el.innerHTML = "";
    var start = (from || text.replace(/\d/g, "0")).replace(/\D/g, "");
    // The start number lines up with the real one from the right
    var digits = text.replace(/\D/g, "");
    start = start.length > digits.length ? start.slice(-digits.length)
      : new Array(digits.length - start.length + 1).join("0") + start;
    var n = 0;
    text.split("").forEach(function (c) {
      if (/\d/.test(c)) {
        var reel = document.createElement("span");
        reel.className = "slot-reel";
        reel.dataset.digit = c;
        reel.dataset.from = start[n++];
        var strip = document.createElement("span");
        strip.className = "slot-strip";
        var html = "";
        // 0–9 twice, so a digit can always roll upward to the next one
        for (var s = 0; s < 2; s++) for (var d = 0; d < 10; d++) html += "<span>" + d + "</span>";
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
    reset(el);
  }

  function reels(el) {
    return Array.prototype.slice.call(el.querySelectorAll(".slot-reel"));
  }

  function jump(reel, d) {
    var s = reel.firstChild;
    s.style.transition = "none";
    s.style.transform = offset(d);
    reel.classList.remove("is-rolling");
    // The starting digit back in full
    Array.prototype.forEach.call(s.children, function (n) {
      n.style.transition = "none";
      n.style.opacity = "";
    });
  }

  function reset(el) {
    reels(el).forEach(function (r) { jump(r, +r.dataset.from); });
    void el.offsetWidth;
  }

  // Where a reel lands for its digit: the next one up from where it starts
  // (in the second set when it's lower, so it still rolls upward)
  function landing(r) {
    var f = +r.dataset.from, d = +r.dataset.digit;
    return d >= f ? d : d + 10;
  }

  function show(el) {
    reels(el).forEach(function (r) { jump(r, landing(r)); });
  }

  // ms: how long the first reel takes; each one after lands a little later
  function spin(el, ms) {
    ms = ms || 1400;
    reels(el).forEach(function (r, i) {
      if (+r.dataset.from === +r.dataset.digit) return;   // unchanged digits stay still
      var t = ms + i * 70;
      var s = r.firstChild;
      s.style.transition = "transform " + t + "ms cubic-bezier(0.3, 0.7, 0.25, 1)";
      // Always bottom to top: the new digit rises up from below
      s.style.transform = offset(landing(r));
      // The outgoing digit fades early, in the first part of the roll
      var out = s.children[+r.dataset.from];
      out.style.transition = "opacity " + Math.round(t * 0.12) + "ms ease-out";
      out.style.opacity = "0";
      // Blurred while it moves, sharp as it settles
      r.classList.add("is-rolling");
      clearTimeout(r.blurTimer);
      r.blurTimer = setTimeout(function () { r.classList.remove("is-rolling"); }, t * 0.6);
    });
  }

  return { mount: mount, spin: spin, reset: reset, show: show };
})();
