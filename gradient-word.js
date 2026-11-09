// Case study gradient words: splits each .gradient-text into letters, like the
// resume's headline, so the colors flow as one piece and the letters can move.
//   Default: letters near the cursor lift, grow and tilt, then spring back.
//   data-motion="dodge": letters scatter away as the cursor gets close. Touch
//   screens get one brief scatter when the words first scroll into view.
//   data-motion="echo": as the cursor gets close, faint copies of each word
//   fan out behind it (the same thing, again and again), then slide back in.
//   Touch screens get one echo when the words first scroll into view.
//   data-motion="mirror": as the cursor gets close, a soft reflection of each
//   word grows in beneath it, then fades away. Touch screens get it once.
//   data-motion="highlight": as the cursor gets close, a soft marker stroke
//   draws itself under the words, left to right, and wipes away when it
//   leaves. Touch screens draw it once when the words scroll into view.
//   data-motion="focus": the words sit slightly out of focus and sharpen as
//   the cursor gets close, then soften again as it leaves. Touch screens
//   sharpen them once when the words scroll into view.
//   data-motion="unscramble": when the cursor comes close, the letters flicker
//   through random characters and resolve back into the words, left to
//   right, like a message being decoded. Touch screens play it once.
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
    else if (phrase.dataset.motion === "echo") echo(phrase, "echo", 3);
    else if (phrase.dataset.motion === "mirror") echo(phrase, "mirror", 1);
    else if (phrase.dataset.motion === "highlight") highlight(phrase);
    else if (phrase.dataset.motion === "focus") focus(phrase);
    else if (phrase.dataset.motion === "unscramble") unscramble(phrase, letters);
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

  function unscramble(phrase, letters) {
    var near = 70;   // plays once the cursor is this close (px)
    var far = 130;   // and can play again once it has gone this far away
    var chars = "abcdefghijklmnopqrstuvwxyz";
    var real = letters.map(function (l) { return l.textContent; });
    var armed = true;
    var playing = false;

    function play() {
      if (playing) return;
      playing = true;
      // Each letter keeps its width while it flickers, so nothing reflows
      letters.forEach(function (l) {
        l.style.width = l.getBoundingClientRect().width + "px";
        l.classList.add("is-scrambling");
      });
      var start = performance.now();
      var duration = 750;
      var stagger = duration / letters.length;
      function frame(now) {
        var t = now - start;
        letters.forEach(function (l, i) {
          if (t >= 200 + i * stagger) l.textContent = real[i];
          else l.textContent = chars.charAt(Math.floor(Math.random() * chars.length));
        });
        if (t < 200 + duration) requestAnimationFrame(frame);
        else {
          letters.forEach(function (l, i) {
            l.textContent = real[i];
            l.style.width = "";
            l.classList.remove("is-scrambling");
          });
          playing = false;
        }
      }
      requestAnimationFrame(frame);
    }

    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var box = phrase.getBoundingClientRect();
      var dx = Math.max(box.left - e.clientX, 0, e.clientX - box.right);
      var dy = Math.max(box.top - e.clientY, 0, e.clientY - box.bottom);
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < near && armed) { armed = false; play(); }
      else if (distance > far) armed = true;
    }, { passive: true });

    // No cursor on a touch screen: decode once when the words come into view
    if (window.matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        seen.disconnect();
        play();
      }, { threshold: 1 });
      seen.observe(phrase);
    }
  }

  function focus(phrase) {
    var reach = 140; // how far (px) from the words the focus starts to sharpen
    phrase.classList.add("is-focusable");
    phrase.style.setProperty("--focus", 0);

    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var box = phrase.getBoundingClientRect();
      var dx = Math.max(box.left - e.clientX, 0, e.clientX - box.right);
      var dy = Math.max(box.top - e.clientY, 0, e.clientY - box.bottom);
      var pull = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / reach);
      phrase.style.setProperty("--focus", pull.toFixed(3));
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", function () {
      phrase.style.setProperty("--focus", 0);
    });

    // No cursor on a touch screen: bring it into focus once and leave it
    if (window.matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        seen.disconnect();
        setTimeout(function () { phrase.style.setProperty("--focus", 1); }, 300);
      }, { threshold: 1 });
      seen.observe(phrase);
    }
  }

  function highlight(phrase) {
    var near = 70;  // the stroke draws once the cursor is this close (px)
    var far = 130;  // and wipes away once it's this far, so it doesn't flicker

    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var box = phrase.getBoundingClientRect();
      var dx = Math.max(box.left - e.clientX, 0, e.clientX - box.right);
      var dy = Math.max(box.top - e.clientY, 0, e.clientY - box.bottom);
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < near) phrase.classList.add("is-highlighted");
      else if (distance > far) phrase.classList.remove("is-highlighted");
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", function () {
      phrase.classList.remove("is-highlighted");
    });

    // No cursor on a touch screen: draw it once and leave it
    if (window.matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        seen.disconnect();
        phrase.classList.add("is-highlighted");
      }, { threshold: 1 });
      seen.observe(phrase);
    }
  }

  // Echo and mirror both stack copies of each word behind it and move them by
  // how close the cursor is (--echo, 0 to 1); the CSS for each kind places them
  function echo(phrase, kind, copies) {
    var reach = 110;  // how close (px) the cursor gets before the copies move
    var words = phrase.querySelectorAll(".word");
    var built = false;
    var amount = 0;

    // Fresh copies of each word (with the letters' current color positions),
    // stacked behind the word. Rebuilt each time the echo starts, so they
    // match after the title rewraps.
    function build() {
      words.forEach(function (word) {
        word.querySelectorAll(".echo, .mirror").forEach(function (e) { e.remove(); });
        var source = word.cloneNode(true);
        for (var n = 1; n <= copies; n++) {
          var copy = document.createElement("span");
          copy.className = kind;
          copy.setAttribute("aria-hidden", "true");
          copy.style.setProperty("--n", n);
          copy.innerHTML = source.innerHTML;
          word.appendChild(copy);
        }
      });
      built = true;
    }

    // 0 = all copies tucked behind the word, 1 = fully fanned out
    function set(value) {
      if (value > 0 && amount === 0 && !built) build();
      amount = value;
      phrase.style.setProperty("--echo", value.toFixed(3));
      phrase.classList.toggle("is-echoing", value > 0);
      if (value === 0) built = false;
    }

    document.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      var box = phrase.getBoundingClientRect();
      var dx = Math.max(box.left - e.clientX, 0, e.clientX - box.right);
      var dy = Math.max(box.top - e.clientY, 0, e.clientY - box.bottom);
      var pull = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / reach);
      if (pull > 0 || amount > 0) set(pull);
    }, { passive: true });
    document.documentElement.addEventListener("pointerleave", function () { set(0); });

    // No cursor on a touch screen: echo once when the words come into view
    if (window.matchMedia("(hover: none)").matches && "IntersectionObserver" in window) {
      var seen = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        seen.disconnect();
        set(1);
        setTimeout(function () { set(0); }, 900);
      }, { threshold: 1 });
      seen.observe(phrase);
    }
  }
})();
