// A day on Home: the new Home tab passing through a day, in the case study's
// hero (home-tab-refresh.html, .ht-hero) and on the resume's card for it
// (index.html, .case-ht). The greeting rolls Morning, Afternoon, Evening;
// in the hero the light around the phone shifts too (a warm wash in the
// morning, none in the afternoon, a cool one in the evening) and the phone
// floats. Each afternoon the rewards pill lights up and rolls +$20.32,
// +300 pts, then Rewards, and fades back to grey. Each plays only while on
// screen (the hero with a pause / play button, watch-pause.js); reduced motion gets
// a still afternoon. Styles are under "A day on Home" in style.css; the
// pill's are under "Rewards pill".
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TIMES = ["morning", "afternoon", "evening"];
  var ICON_FOR = [0, 0, 1, 2];

  document.querySelectorAll(".ht-hero, .case-ht").forEach(function (box) {
    var phone = box.querySelector(".ht-phone");
    var track = phone && phone.querySelector(".ac-roll-track");
    if (!track) return;
    var pill = phone.querySelector(".rp");
    var rollBox = track.parentNode;
    var words = track.children;
    var run = 0;

    // The hero gets a pause / play button; the resume's card doesn't
    if (window.watchPause && !box.classList.contains("case-ht")) watchPause.attach(box);
    function wait(ms, id) {
      if (window.watchPause) return watchPause.wait(box, ms, function () { return id === run; });
      return new Promise(function (resolve, reject) {
        setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
      });
    }

    // The greeting rolls to word i, its window fitting the word, and the
    // light follows the time of day
    function setTime(i) {
      track.style.setProperty("--roll", i);
      rollBox.style.width = words[i].offsetWidth + "px";
      box.dataset.time = TIMES[i];
    }

    // The rewards pill: label strip Rewards, +$20.32, +300 pts, Rewards;
    // the icon strip follows
    function pillTo(i, animate) {
      if (!pill) return;
      if (!animate) pill.classList.add("is-still");
      pill.style.setProperty("--label", i);
      pill.style.setProperty("--icon", ICON_FOR[i]);
      if (!animate) { void pill.offsetWidth; pill.classList.remove("is-still"); }
    }

    async function loop(id) {
      while (true) {
        setTime(0);
        await wait(3600, id);

        setTime(1);
        await wait(1800, id);
        // Something was earned: the pill lights up and rolls through it
        if (pill) pill.classList.add("is-earn");
        pillTo(1, true);
        await wait(1500, id);
        pillTo(2, true);
        await wait(1500, id);
        pillTo(3, true);
        await wait(700, id);
        if (pill) pill.classList.remove("is-earn");
        await wait(1600, id);

        setTime(2);
        // Grey again, the pill quietly resets to its first "Rewards"
        await wait(700, id);
        pillTo(0, false);
        await wait(2900, id);
      }
    }

    if (reduced) {
      setTime(1);
      pillTo(3, false);
      return;
    }

    // The resume's card holds still at afternoon for now: it plays the
    // blueprint build instead (ht-build.js)
    if (box.classList.contains("case-ht")) {
      setTime(1);
      pillTo(0, false);
      return;
    }

    pillTo(0, false);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        run++;
        if (entries[0].isIntersecting) loop(run).catch(function () {});
      }, { threshold: 0.3 }).observe(box);
    } else {
      loop(++run).catch(function () {});
    }
  });
})();
