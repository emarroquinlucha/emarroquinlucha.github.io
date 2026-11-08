// Case study gradient words: splits each .gradient-text into letters, like the
// resume's headline, so the colors flow as one piece and the letters can move.
//   Default: letters near the cursor lift, grow and tilt, then spring back.
//   data-motion="dodge": letters scatter away as the cursor gets close. Touch
//   screens get one brief scatter when the words first scroll into view.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".gradient-text").forEach(function (phrase) {
    var text = phrase.textContent;
    phrase.setAttribute("aria-label", text);
    phrase.textContent = "";
    var letters = [];
    // Letters are grouped by word so the phrase only wraps between words
    text.split(" ").forEach(function (w, i) {
      if (i) phrase.appendChild(document.createTextNode(" "));
      var word = document.createElement("span");
      word.className = "word";
      w.split("").forEach(function (ch) {
        var span = document.createElement("span");
        span.className = "letter";
        span.setAttribute("aria-hidden", "true");
        span.textContent = ch;
        word.appendChild(span);
        letters.push(span);
      });
      phrase.appendChild(word);
    });

    // Where each letter's center rests, relative to the phrase, so a letter
    // that has moved away still reacts from its home position
    var rest = [];
    function measure() {
      var box = phrase.getBoundingClientRect();
      phrase.style.setProperty("--w", box.width + "px");
      rest = letters.map(function (l) {
        l.style.transform = "";
        var r = l.getBoundingClientRect();
        l.style.setProperty("--x", (r.left - box.left) + "px");
        return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
      });
    }
    phrase.classList.add("is-split");
    measure();
    // The web font can arrive after this runs and rewrap the title
    document.fonts.ready.then(measure);
    document.fonts.addEventListener("loadingdone", measure);
    window.addEventListener("load", measure);
    window.addEventListener("resize", measure);

    if (reduced) return;

    function release() {
      phrase.classList.remove("is-hovering");
      letters.forEach(function (l) { l.style.transform = ""; });
    }

    if (phrase.dataset.motion === "dodge") dodge(phrase, letters, function () { return rest; }, release);
    else wave(phrase, letters, release);
  });

  function wave(phrase, letters, release) {
    var reach = 70; // how far (px) from the cursor letters react
    phrase.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      phrase.classList.add("is-hovering");
      letters.forEach(function (l) {
        var r = l.getBoundingClientRect();
        var dx = r.left + r.width / 2 - e.clientX;
        var pull = Math.max(0, 1 - Math.abs(dx) / reach);
        pull = pull * pull;
        l.style.transform =
          "translateY(" + (-9 * pull).toFixed(2) + "px) " +
          "scale(" + (1 + 0.14 * pull).toFixed(3) + ") " +
          "rotate(" + (Math.sign(dx) * 7 * pull).toFixed(2) + "deg)";
      });
    });
    phrase.addEventListener("pointerleave", release);
  }

  function dodge(phrase, letters, getRest, release) {
    var reach = 90; // how close (px) the cursor gets before letters run
    var push = 26;  // how far (px) the nearest letters run

    // Listens on the whole page so letters run before the cursor reaches them
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var box = phrase.getBoundingClientRect();
      var near = false;
      var moves = getRest().map(function (home) {
        var dx = box.left + home.x - e.clientX;
        var dy = box.top + home.y - e.clientY;
        var distance = Math.sqrt(dx * dx + dy * dy) || 1;
        var pull = Math.max(0, 1 - distance / reach);
        if (pull > 0) near = true;
        return { dx: dx, dy: dy, distance: distance, pull: pull * pull };
      });
      if (!near) {
        if (phrase.classList.contains("is-hovering")) release();
        return;
      }
      phrase.classList.add("is-hovering");
      letters.forEach(function (l, i) {
        var m = moves[i];
        l.style.transform =
          "translate(" + (m.dx / m.distance * push * m.pull).toFixed(2) + "px, " +
          (m.dy / m.distance * push * m.pull).toFixed(2) + "px) " +
          "rotate(" + (Math.sign(m.dx) * 16 * m.pull).toFixed(2) + "deg)";
      });
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", release);

    // No cursor to run from on a touch screen: scatter once, then settle
    if (window.matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        seen.disconnect();
        letters.forEach(function (l, i) {
          var side = i % 2 ? 1 : -1;
          l.style.transform =
            "translate(" + (side * 5) + "px, " + (side * -7) + "px) rotate(" + (side * 10) + "deg)";
        });
        setTimeout(release, 450);
      }, { threshold: 1 });
      seen.observe(phrase);
    }
  }
})();
