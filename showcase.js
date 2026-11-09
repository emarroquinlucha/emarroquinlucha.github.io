// Hero showcase (case studies): the redesigned accounts, flat on a light
// grid. All three fade in upward from a blur (chequing, credit, savings);
// chequing and savings leave, and the camera zooms into credit's statement,
// which fills, turns green and collapses to its paid state. Credit leaves
// upward; chequing comes back, its Manage card action gets tapped and the
// card screen slides in, then it leaves to the left; savings comes back, its
// goal fills to 100%, then it scrolls to its interest, which counts up, and
// leaves upward. Then it repeats. Plays only while on screen; the pause
// button stops it. Styles are under "Hero showcase" in style.css.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".showcase").forEach(function (show) {
    var stage = show.querySelector(".showcase-stage");
    var credit = show.querySelector(".is-credit");
    var savings = show.querySelector(".is-savings");
    var chequing = show.querySelector(".is-chequing");
    var phones = [credit, savings, chequing];
    var caption = show.querySelector(".showcase-caption");
    var pauseButton = show.querySelector(".showcase-pause");
    var run = 0;
    var inView = false;
    var paused = false;
    // Every wait and camera move below is scaled by this (lower = faster)
    var SPEED = 0.65;
    // Phones are drawn K times bigger than they appear (see style.css), so
    // every camera transform ends by scaling back down
    var K = parseFloat(getComputedStyle(show).getPropertyValue("--k")) || 1;
    // A phone's width as it appears at the wide shot
    function pw(phone) { return phone.offsetWidth / K; }

    function q(phone, selector) { return phone.querySelector(selector); }
    function target(phone, name) { return q(phone, '[data-target="' + name + '"]'); }

    function wait(ms, id) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms * SPEED);
      });
    }

    // Captions fade out, change, and fade back in
    function say(text) {
      caption.classList.add("is-changing");
      setTimeout(function () {
        caption.textContent = text;
        caption.classList.remove("is-changing");
      }, 350);
    }

    // How far a node sits from the top-left of box, ignoring transforms
    function offsetIn(node, box) {
      var x = 0, y = 0;
      while (node && node !== box) {
        x += node.offsetLeft;
        y += node.offsetTop;
        node = node.offsetParent;
      }
      return { x: x, y: y };
    }

    // Points (375 wide) to pixels for this phone's screen
    function pts(phone, n) { return n / 375 * phone.offsetWidth * 0.932; }

    // Moves a phone's camera to x, y (pixels) and scale s over ms (0 =
    // instantly). Every position is written as the same translate() scale()
    // pair, so the browser animates straight between them (mismatched
    // transform lists get paired up item by item and overshoot). Moves
    // overshoot a little on purpose unless smooth is set.
    function move(phone, x, y, s, ms, smooth) {
      phone.style.transitionDuration = ms * SPEED + "ms";
      phone.style.transitionTimingFunction = smooth ? "cubic-bezier(0.45, 0, 0.2, 1)" : "";
      phone.style.transform = "translate(" + x + "px, " + y + "px) scale(" + s / K + ")";
      if (!ms) void phone.offsetWidth;
    }

    function wide(phone, ms, smooth) { move(phone, 0, 0, 1, ms, smooth); }

    // Scrolls a phone's screen content up by n points (the camera follows)
    function scroll(phone, n, ms, smooth) {
      var content = q(phone, ".showcase-scroll");
      content.style.transitionDuration = ms * SPEED + "ms";
      content.style.transitionTimingFunction = smooth ? "cubic-bezier(0.45, 0, 0.2, 1)" : "";
      content.style.transform = n ? "translateY(" + -pts(phone, n) + "px)" : "";
      phone.dataset.scroll = n;
      var header = q(phone, ".proto-header");
      if (header) header.classList.toggle("is-scrolled", n > 0);
      if (!ms) void content.offsetWidth;
    }

    // A close-up: scales the phone so the target lands in the middle of the
    // stage, allowing for how far its screen is scrolled. The scale is capped
    // so a tile still fits across the stage.
    function closeup(phone, name, scale, ms, smooth) {
      var p = offsetIn(target(phone, name), phone);
      p.y -= pts(phone, +phone.dataset.scroll || 0);
      p.x /= K;
      p.y /= K;
      scale = Math.min(scale, stage.clientWidth * 0.95 / (pw(phone) * 0.92));
      var tx = stage.clientWidth / 2 - (phone.offsetLeft + scale * p.x);
      var ty = stage.clientHeight / 2 - (phone.offsetTop + scale * p.y);
      move(phone, tx, ty, scale, ms, smooth);
    }

    // Hidden straight away, ready to fade in from below
    function hide(phone) {
      var layer = q(phone, ".showcase-enter");
      layer.style.transition = "none";
      phone.classList.remove("is-in");
      delete phone.dataset.exit;
      void layer.offsetWidth;
      layer.style.transition = "";
    }

    // Fades a phone in upward from a blur, starting from below each time
    function enter(phone) {
      hide(phone);
      phone.classList.add("is-in");
    }

    // Fades a phone out toward "up", "left" or "right"
    function exit(phone, direction) {
      phone.dataset.exit = direction;
      phone.classList.remove("is-in");
    }

    function setFill(phone, value, animate) {
      var bar = q(phone, ".showcase-bar-fill");
      if (!bar) return;
      if (!animate) bar.style.transition = "none";
      bar.style.width = value;
      if (!animate) { void bar.offsetWidth; bar.style.transition = ""; }
    }

    // The statement's bar turns green once it's full
    function green(phone, on) {
      var bar = q(phone, '[data-bar="statement"]');
      if (bar) bar.classList.toggle("is-green", on);
    }

    // Toggles a state class on a phone; instant ones skip their transitions
    function state(phone, name, on, instant) {
      if (instant) phone.classList.add("no-motion");
      phone.classList.toggle(name, on);
      if (instant) { void phone.offsetWidth; phone.classList.remove("no-motion"); }
    }

    // Numbers that count up (data-from to data-to), in their format
    function format(el, value) {
      var f = el.dataset.format;
      if (f === "pct") return Math.round(value) + "%";
      // data-step rounds to that step (the goal's Saved moves $100 per 1%,
      // so it lands at the same moment as the percentage)
      var step = +el.dataset.step || 1;
      if (f === "dollars") return "$" + (Math.round(value / step) * step).toLocaleString("en-US");
      return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    // Counts a phone's numbers (those matching selector) up over ms
    function count(phone, selector, ms, id) {
      phone.querySelectorAll(selector).forEach(function (el) {
        var from = +el.dataset.from, to = +el.dataset.to;
        var start = performance.now();
        (function frame(now) {
          if (id !== run) return;
          var t = Math.min(1, (now - start) / (ms * SPEED));
          el.textContent = format(el, from + (to - from) * (1 - Math.pow(1 - t, 3)));
          if (t < 1) requestAnimationFrame(frame);
        })(start);
      });
    }

    function resetCounts(phone) {
      phone.querySelectorAll("[data-from]").forEach(function (el) {
        el.textContent = format(el, +el.dataset.from);
      });
    }

    // The touch cursor: "show" (low on the screen), "move" (up to its
    // target), "press", or "hide" (and back to the start)
    function cursor(phone, step) {
      var c = q(phone, ".showcase-cursor");
      if (!c) return;
      if (step === "show") c.classList.add("is-showing");
      if (step === "move") c.classList.add("is-there");
      if (step === "press") {
        c.classList.add("is-pressing");
        setTimeout(function () { c.classList.remove("is-pressing"); }, 160);
      }
      if (step === "hide") c.classList.remove("is-showing");
      if (step === "reset") {
        c.style.transition = "none";
        c.classList.remove("is-showing", "is-there", "is-pressing");
        void c.offsetWidth;
        c.style.transition = "";
      }
    }

    function tap(phone) {
      var press = q(phone, ".showcase-press");
      press.classList.add("is-pressed");
      setTimeout(function () { press.classList.remove("is-pressed"); }, 320);
    }

    // How far the outer phones sit from the middle one in the line-up
    function side() {
      return Math.min(pw(credit) * 1.15, (stage.clientWidth - pw(credit) * 0.92) / 2);
    }

    function lineUp() {
      move(chequing, -side(), 0, 0.92, 0);
      move(credit, 0, 0, 0.92, 0);
      move(savings, side(), 0, 0.92, 0);
    }

    // Everything back to the start, instantly and out of sight
    function reset() {
      phones.forEach(function (phone) {
        hide(phone);
        scroll(phone, 0, 0);
        setFill(phone, "", false);
        green(phone, false);
        state(phone, "is-paid", false, true);
        state(phone, "is-pushed", false, true);
        resetCounts(phone);
        cursor(phone, "reset");
      });
      lineUp();
    }

    async function loop(id) {
      while (true) {
        reset();

        // All three fade in, one after another
        say("Chequing, Credit and Savings");
        await wait(300, id);
        enter(chequing);
        await wait(220, id);
        enter(credit);
        await wait(220, id);
        enter(savings);
        await wait(2800, id);
        // One more beat on all three before the next transition
        await wait(1300, id);

        // Chequing and savings leave; credit takes the stage
        exit(chequing, "left");
        exit(savings, "right");
        await wait(300, id);
        wide(credit, 1500, true);
        await wait(1500, id);

        // Credit: zoom into the statement, which gets paid off (credit's
        // camera moves are smooth, without the overshoot)
        say("Paying Off the Statement");
        scroll(credit, 300, 2300, true);
        closeup(credit, "statement", 2.1, 2300, true);
        await wait(2400, id);
        setFill(credit, "100%", true);
        count(credit, '[data-count="statement"]', 1700 / SPEED, id);
        await wait(2300, id);
        green(credit, true);
        await wait(1000, id);
        say("Paid in Full");
        state(credit, "is-paid", true);
        await wait(2400, id);

        // Zoom out while the screen scrolls back to the top, then credit
        // leaves upward
        scroll(credit, 0, 1700, true);
        wide(credit, 1700, true);
        await wait(1900, id);
        // One more beat on the whole account before it goes
        await wait(1300, id);
        exit(credit, "up");
        await wait(900, id);

        // Chequing: in from below, then a tap on Manage card
        say("Manage Card, One Tap Away");
        wide(chequing, 0);
        enter(chequing);
        await wait(700, id);
        cursor(chequing, "show");
        await wait(300, id);
        cursor(chequing, "move");
        await wait(1400, id);
        cursor(chequing, "press");
        tap(chequing);
        await wait(380, id);
        cursor(chequing, "hide");
        state(chequing, "is-pushed", true);
        // A beat on the card screen before chequing leaves
        await wait(3900, id);

        // Then chequing leaves to the left
        exit(chequing, "left");
        await wait(900, id);

        // Savings: in from below, then its goal fills to 100%
        say("A Savings Goal, Reaching 100%");
        wide(savings, 0);
        enter(savings);
        await wait(1700, id);
        closeup(savings, "goal", 2.1, 2300);
        await wait(2400, id);
        setFill(savings, "100%", true);
        count(savings, '[data-count="goal"]', 2100 / SPEED, id);
        await wait(3000, id);

        // Savings: scroll down to the interest, which keeps adding up
        say("Interest, Adding Up");
        scroll(savings, 95, 2200);
        closeup(savings, "interest", 2.1, 2200);
        await wait(2300, id);
        count(savings, '[data-count="interest"]', 2600, id);
        // Off screen, the balance catches up with the goal it just reached
        var balance = q(savings, '[data-count="balance"]');
        balance.textContent = format(balance, +balance.dataset.to);
        await wait(3400, id);

        // Zoom out while the screen scrolls back to the top, then savings
        // leaves upward
        scroll(savings, 0, 1700);
        wide(savings, 1700);
        await wait(1900, id);
        // One more beat on the whole account before it goes
        await wait(1300, id);
        exit(savings, "up");
        await wait(1200, id);
      }
    }

    function start() {
      run++;
      if (inView && !paused && !reduced) loop(run).catch(function () {});
    }

    function stop() { run++; }

    pauseButton.addEventListener("click", function () {
      paused = !paused;
      show.classList.toggle("is-paused", paused);
      pauseButton.setAttribute("aria-pressed", paused);
      pauseButton.setAttribute("aria-label", paused ? "Play the animation" : "Pause the animation");
      if (paused) stop(); else start();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) start(); else stop();
      }, { threshold: 0.35 }).observe(show);
    } else {
      inView = true;
      start();
    }

    // Visitors who prefer less motion get the three accounts, still
    if (reduced) {
      reset();
      phones.forEach(function (phone) { state(phone, "is-in", true, true); });
      caption.textContent = "Chequing, Credit and Savings";
      pauseButton.hidden = true;
    }
  });
})();
