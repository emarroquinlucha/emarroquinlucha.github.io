// Before/after Watch (case studies): for each account, the old screen covers
// the new one, then a line sweeps from right to left uncovering the new
// design, pausing halfway (old on the left, new on the right). Then the next
// account. "explore" is the before/after slider (phone-mock.js). Styles are
// under "Before/after Watch" in style.css. Load after mode-ring.js.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var accounts = [
    {
      title: "Credit Account",
      before: "images/neo-credit-before.png", after: "images/neo-credit-after.png"
    },
    {
      title: "Chequing Account",
      before: "images/neo-chequing-before.png", after: "images/neo-chequing-after.png"
    },
    {
      title: "Savings Account",
      before: "images/neo-savings-before.png", after: "images/neo-savings-after.png"
    }
  ];

  document.querySelectorAll(".compare-slider[data-mode]").forEach(function (slider) {
    var modes = slider.querySelectorAll(".proto-mode button");
    var wipe = slider.querySelector(".compare-wipe");
    var title = slider.querySelector(".compare-watch-title");
    var hint = slider.querySelector(".compare-watch-hint");
    var after = slider.querySelector(".compare-wipe-after");
    var before = slider.querySelector(".compare-wipe-before img");
    var run = 0;
    var inView = false;
    // One loop is 21.6s: the sum of the waits in loop() below
    var LOOP_MS = 21600;
    var ring = window.modeRing ? window.modeRing(slider.querySelector(".proto-mode")) : null;

    function wait(ms, id) {
      return new Promise(function (resolve, reject) {
        setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
      });
    }

    // Captions start with a Before or After tag, like section 01
    function say(tag, text) {
      hint.innerHTML = "";
      if (tag) {
        var t = document.createElement("span");
        t.className = "hint-tag" + (tag === "After" ? " is-after" : "");
        t.textContent = tag;
        hint.appendChild(t);
      }
      hint.appendChild(document.createTextNode(text));
    }

    // Moves the line to p (100 = all old screen, 0 = all new) over ms
    function sweep(p, ms) {
      wipe.classList.toggle("is-moving", ms > 0);
      wipe.style.setProperty("--sweep", ms + "ms");
      if (!ms) void wipe.offsetWidth;
      wipe.style.setProperty("--p", p);
      if (!ms) { void wipe.offsetWidth; }
    }

    function load(account) {
      title.textContent = account.title;
      after.src = account.after;
      before.src = account.before;
      wipe.classList.remove("is-wiping");
      sweep(100, 0);
      // The phone fades in upward from a light blur
      wipe.classList.remove("is-entering");
      void wipe.offsetWidth;
      wipe.classList.add("is-entering");
    }

    async function loop(id) {
      // The first phone comes in softly too: hide whatever is showing (it
      // may be left mid-loop from an earlier visit), then fade it in
      if (!wipe.classList.contains("is-swapping")) {
        wipe.classList.add("is-swapping");
        await wait(400, id);
      }
      load(accounts[0]);
      say("Before", accounts[0].title);
      wipe.classList.remove("is-swapping");
      while (true) {
        if (ring) ring.start(LOOP_MS);
        for (var i = 0; i < accounts.length; i++) {
          var account = accounts[i];
          if (i > 0) {
            // Fade out, swap to the next account's screens, fade back in
            wipe.classList.add("is-swapping");
            await wait(400, id);
            load(account);
            wipe.classList.remove("is-swapping");
          }
          say("Before", account.title);
          await wait(1400, id);

          wipe.classList.add("is-wiping");
          sweep(50, 1000);
          await wait(2600, id);

          say("After", account.title);
          sweep(0, 800);
          await wait(800, id);
          wipe.classList.remove("is-wiping");
          await wait(2000, id);
        }
        // Back to the first account for the next loop
        wipe.classList.add("is-swapping");
        await wait(400, id);
        load(accounts[0]);
        wipe.classList.remove("is-swapping");
      }
    }

    function start() {
      run++;
      if (slider.dataset.mode === "watch" && inView) loop(run).catch(function () {});
    }

    function setMode(mode) {
      slider.dataset.mode = mode;
      modes.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.mode === mode); });
      run++;
      if (ring) ring.stop();
      wipe.classList.remove("is-swapping");
      if (mode === "watch") {
        load(accounts[0]);
        say("Before", accounts[0].title);
        // Hidden until the loop starts and fades it in
        if (!reduced) wipe.classList.add("is-swapping");
        start();
      }
    }

    modes.forEach(function (b) {
      b.addEventListener("click", function () { setMode(b.dataset.mode); });
    });

    // Plays only while on screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView) start();
        else { run++; if (ring) ring.stop(); }
      }, { threshold: 0.3 }).observe(wipe);
    } else {
      inView = true;
    }

    // Visitors who prefer less motion start on Explore
    setMode(reduced ? "explore" : "watch");
  });
})();
