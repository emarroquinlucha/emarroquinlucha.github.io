// Mode ring (case studies): a gradient outline around a Watch / Explore switch
// that fills in as the Watch loop plays. One full lap is one loop.
//   var ring = modeRing(switchElement);
//   ring.start(loopMilliseconds);   // call at the start of every loop
//   ring.stop();
// Load it before the scripts that use it. Styles are under "Mode ring" in style.css.
(function () {
  var count = 0;
  var svgNS = "http://www.w3.org/2000/svg";

  window.modeRing = function (track) {
    var id = "mode-ring-gradient-" + (++count);
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "mode-ring");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML =
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="#f1842a"/><stop offset="0.35" stop-color="#f39980"/>' +
      '<stop offset="0.65" stop-color="#ee7dc9"/><stop offset="1" stop-color="#aa8ce3"/>' +
      '</linearGradient></defs>' +
      '<rect class="mode-ring-path" pathLength="100" fill="none" stroke="url(#' + id + ')"/>';
    track.appendChild(svg);
    var rect = svg.querySelector("rect");

    // The ring sits 3px outside the track, with fully rounded ends
    function size() {
      var w = track.offsetWidth + 6;
      var h = track.offsetHeight + 6;
      svg.setAttribute("width", w);
      svg.setAttribute("height", h);
      svg.setAttribute("viewBox", "0 0 " + w + " " + h);
      rect.setAttribute("x", 1);
      rect.setAttribute("y", 1);
      rect.setAttribute("width", w - 2);
      rect.setAttribute("height", h - 2);
      rect.setAttribute("rx", (h - 2) / 2);
    }

    size();
    window.addEventListener("resize", size);
    if (document.fonts) document.fonts.ready.then(size);

    return {
      // Restarting fades the old lap out softly while the new one draws
      // in from empty (also fading in), so there's no hard reset
      start: function (ms) {
        var drawn = parseFloat(getComputedStyle(rect).strokeDashoffset);
        if (rect.style.animation && rect.style.animation !== "none" && drawn < 99) {
          var ghost = rect.cloneNode();
          ghost.style.animation = "none";
          ghost.style.strokeDashoffset = drawn;
          ghost.classList.add("is-fading");
          svg.appendChild(ghost);
          setTimeout(function () { ghost.remove(); }, 900);
        }
        size();
        rect.style.animation = "none";
        void svg.getBoundingClientRect();
        rect.style.animation = "mode-ring " + ms + "ms linear forwards, mode-ring-in 0.9s ease";
      },
      stop: function () {
        rect.style.animation = "none";
      }
    };
  };
})();
