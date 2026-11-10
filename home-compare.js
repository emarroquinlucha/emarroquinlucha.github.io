// Home before and after (home-tab-refresh.html): one phone with the old Home
// tab laid over the new one. A line sweeps from right to left, uncovering the
// new design, pauses halfway (old on the left, new on the right), finishes,
// then sweeps back to the old tab and starts over. Plays only while on
// screen. Styles are under "Home before and after" in style.css.
(function () {
  var box = document.querySelector(".ht-compare");
  if (!box) return;
  var wipe = box.querySelector(".hc-wipe");
  var hint = box.querySelector(".hc-hint");
  var tag = hint.querySelector(".hint-tag");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var run = 0;

  function wait(ms, id) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
    });
  }

  // Moves the line to p (100 = all old tab, 0 = all new) over ms
  function sweep(p, ms) {
    wipe.classList.toggle("is-moving", ms > 0);
    wipe.style.setProperty("--sweep", ms + "ms");
    wipe.style.setProperty("--p", p);
  }

  function say(after) {
    tag.textContent = after ? "After" : "Before";
    tag.classList.toggle("is-after", after);
  }

  async function loop(id) {
    sweep(100, 0);
    say(false);
    while (true) {
      await wait(1600, id);

      wipe.classList.add("is-wiping");
      sweep(50, 1000);
      await wait(2400, id);

      say(true);
      sweep(0, 800);
      await wait(800, id);
      wipe.classList.remove("is-wiping");
      await wait(2600, id);

      // Back to the old tab for the next loop
      wipe.classList.add("is-wiping");
      say(false);
      sweep(100, 1200);
      await wait(1200, id);
      wipe.classList.remove("is-wiping");
    }
  }

  if (reduced) {
    // Visitors who prefer less motion see the halfway view, old and new side by side
    sweep(50, 0);
    wipe.classList.add("is-wiping");
    return;
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      run++;
      if (entries[0].isIntersecting) loop(run).catch(function () {});
    }, { threshold: 0.3 }).observe(box);
  } else {
    loop(++run).catch(function () {});
  }
})();
