// Joint chip (case studies, section 04). "Watch" plays a loop in one stage:
// the two group-chat screens, zooming in on each header's avatars, then the
// joint chip on its own, then the credit account zooming in on its header as
// the chip pops in beside settings. "Try it" is that account as a prototype:
// tap the chip for Cardholders, then Winnie for her card. Styles are under
// "Joint chip" in style.css. Load after mode-ring.js.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".joint").forEach(function (joint) {
    var modes = joint.querySelectorAll(".proto-mode button");
    var hint = joint.querySelector(".proto-hint");
    var inspo = Array.prototype.slice.call(joint.querySelectorAll(".joint-inspo"));
    var credit = joint.querySelector(".joint-credit");
    var views = joint.querySelector(".joint-views");
    var stageEl = joint.querySelector(".joint-stage");
    var uncropTimer;
    var run = 0;
    var inView = false;
    // One loop is 17.8s: the sum of the waits in loop() below
    var LOOP_MS = 17800;
    var ring = window.modeRing ? window.modeRing(joint.querySelector(".proto-mode")) : null;
    var tryHints = {
      home: "Tap the Joint Chip",
      cardholders: "Tap Winnie to See Her Card, or the Back Arrow",
      cardholder: "Tap the Back Arrow to Return"
    };

    function wait(ms, id) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
      });
    }

    function say(text) { hint.textContent = text; }
    function scene(name) { joint.dataset.scene = name; }

    // How far el sits from the top-left of box, ignoring transforms
    function offsetIn(el, box) {
      var x = 0, y = 0;
      while (el && el !== box) {
        x += el.offsetLeft;
        y += el.offsetTop;
        el = el.offsetParent;
      }
      return { x: x, y: y };
    }

    // Scales a phone up so its target point lands in the middle of the stage.
    // data-zoom is the most it zooms; data-span is how much of the phone's
    // width should still fit across the stage.
    function zoom(phone) {
      var stage = phone.parentNode;
      var point = offsetIn(phone.querySelector(".joint-target"), phone);
      var scale = Math.min(parseFloat(phone.dataset.zoom),
        stage.clientWidth * 0.94 / (phone.offsetWidth * parseFloat(phone.dataset.span)));
      var tx = stage.clientWidth / 2 - phone.offsetLeft - scale * point.x;
      var ty = stage.clientHeight / 2 - phone.offsetTop - scale * point.y;
      clearTimeout(uncropTimer);
      stageEl.classList.add("is-cropped");
      phone.style.transform = "translate(" + tx + "px, " + ty + "px) scale(" + scale + ")";
    }

    // The stage only crops while a phone is zoomed in, so it never covers
    // the caption; uncropping waits for the phone to finish zooming out
    function unzoom(phone) {
      phone.style.transform = "";
      clearTimeout(uncropTimer);
      uncropTimer = setTimeout(function () {
        if (!joint.querySelector('.joint-phone[style*="scale"]')) stageEl.classList.remove("is-cropped");
      }, 950);
    }

    function go(view) {
      views.dataset.view = view;
      views.querySelectorAll(".joint-view").forEach(function (v) {
        var on = v.dataset.view === view;
        v.classList.toggle("is-current", on);
        v.inert = !on;
      });
      if (joint.dataset.mode === "try") say(tryHints[view]);
    }

    views.addEventListener("click", function (e) {
      var target = e.target.closest("[data-go]");
      if (target && joint.dataset.mode === "try") go(target.dataset.go);
    });

    // Puts everything back where it starts, without animating
    function reset() {
      var phones = inspo.concat(credit);
      phones.forEach(function (p) { p.style.transition = "none"; });
      phones.forEach(function (p) { unzoom(p); p.classList.remove("is-off"); });
      void joint.offsetWidth;
      phones.forEach(function (p) { p.style.transition = ""; });
      joint.classList.remove("is-chip-added");
      clearTimeout(uncropTimer);
      stageEl.classList.remove("is-cropped");
      go("home");
    }

    async function loop(id) {
      reset();
      while (true) {
        if (ring) ring.start(LOOP_MS);
        scene("inspo");
        say("Group Chats Show Who's in Them, Right in the Header");
        await wait(2600, id);

        say("Instagram Stacks the Members' Avatars by the Name");
        inspo[1].classList.add("is-off");
        zoom(inspo[0]);
        await wait(2800, id);

        say("Messages Clusters Everyone's Faces Up Top");
        inspo[0].classList.add("is-off");
        inspo[1].classList.remove("is-off");
        unzoom(inspo[0]);
        zoom(inspo[1]);
        await wait(2800, id);

        unzoom(inspo[1]);
        inspo[0].classList.remove("is-off");
        await wait(1000, id);

        scene("chip");
        say("The Joint Chip: Who Shares the Account, at a Glance");
        await wait(2800, id);

        scene("credit");
        joint.classList.remove("is-chip-added");
        say("On the Account, It Sits Beside Settings");
        await wait(1200, id);
        zoom(credit);
        await wait(1000, id);
        joint.classList.add("is-chip-added");
        await wait(2200, id);
        unzoom(credit);
        await wait(1400, id);
      }
    }

    function start() {
      run++;
      if (joint.dataset.mode === "watch" && inView) loop(run).catch(function () {});
    }

    function setMode(mode) {
      joint.dataset.mode = mode;
      modes.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.mode === mode); });
      run++;
      if (ring) ring.stop();
      reset();
      if (mode === "watch") {
        scene("inspo");
        say("Group Chats Show Who's in Them, Right in the Header");
        start();
      } else {
        scene("credit");
        say(tryHints.home);
      }
    }

    modes.forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.dataset.mode); });
    });

    // Keeps a zoomed phone lined up if the window changes size
    window.addEventListener("resize", function () {
      inspo.concat(credit).forEach(function (p) { if (p.style.transform) zoom(p); });
    });

    // Plays only while on screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) start();
        else { run++; if (ring) ring.stop(); }
      }, { threshold: 0.3 }).observe(joint.querySelector(".joint-stage"));
    } else {
      inView = true;
    }

    // Visitors who prefer less motion start on the tappable version
    setMode(reduced ? "try" : "watch");
  });
})();
