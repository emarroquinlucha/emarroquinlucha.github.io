// Home refresh (home-tab-refresh.html): the new Home tab in a phone, filmed
// like a camera. Each loop:
//   1. Close on the old accounts list (category and total above plain rows),
//      shown on its own: no phone, no rest of the screen.
//   2. The new list pops in, with each account's card art.
//   3. The camera pulls back and the rest of the screen and the phone fade
//      in around the new list.
//   4. It zooms into the greeting, which rolls Morning, Afternoon, Evening.
//   5. It pans up as an inline message slides in from the top, then away.
//   6. It settles on the rewards pill, which lights up blue with twinkling
//      stars and rolls +$20.32, +300 pts, then Rewards, before fading back
//      to grey. Then it starts over.
// Plays only while on screen. Styles are under "Home refresh" in style.css.
(function () {
  var box = document.querySelector(".ac-show");
  if (!box) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var phone = box.querySelector(".ac-phone");
  var body = phone.querySelector(".phone-mock-body");
  var track = phone.querySelector(".ac-roll-track");
  var hint = box.querySelector(".ac-hint");
  var parts = {
    old: phone.querySelector(".ac-old"),
    accounts: phone.querySelector(".ht-accounts"),
    greeting: phone.querySelector(".ht-greeting"),
    notice: phone.querySelector(".ac-notice"),
    chip: phone.querySelector(".ht-wallet")
  };
  var run = 0;

  // The rewards pill's roll: the label strip (Rewards, +$20.32, +300 pts,
  // Rewards) steps 26 points at a time; the icon strip (sparkle, points,
  // sparkle) follows the label it belongs to
  // The inline message keeps its room in the layout; what's below it slides
  // up out of the way by its height (--nh) while it's hidden, with a
  // transform, so nothing re-lays out (and jitters) as it comes and goes
  function measureNotice() {
    phone.style.setProperty("--nh", parts.notice.offsetHeight + "px");
  }
  measureNotice();
  window.addEventListener("resize", measureNotice);
  if (document.fonts) document.fonts.ready.then(measureNotice);

  var pill = phone.querySelector(".rp");
  var ICON_FOR = [0, 0, 1, 2];
  function pillTo(i, animate) {
    if (!pill) return;
    if (!animate) pill.classList.add("is-still");
    pill.style.setProperty("--label", i);
    pill.style.setProperty("--icon", ICON_FOR[i]);
    if (!animate) { void pill.offsetWidth; pill.classList.remove("is-still"); }
  }

  // A pause / play button (watch-pause.js); waits hold while it's paused
  if (window.watchPause) watchPause.attach(box);
  function wait(ms, id) {
    if (window.watchPause) return watchPause.wait(box, ms, function () { return id === run; });
    return new Promise(function (resolve, reject) {
      setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
    });
  }

  // The caption fades to new words; tag adds a red "Before" or green "After"
  // chip in front of them (the compare's .hint-tag)
  function say(text, tag) {
    var key = (tag || "") + "|" + text;
    if (hint.dataset.key === key) return;
    hint.dataset.key = key;
    hint.style.opacity = 0;
    setTimeout(function () {
      hint.textContent = text;
      if (tag) {
        var chip = document.createElement("span");
        chip.className = "hint-tag" + (tag === "After" ? " is-after" : "");
        chip.textContent = tag;
        hint.insertBefore(chip, hint.firstChild);
      }
      hint.style.opacity = "";
    }, 200);
  }

  // Frames el in the middle of the box at scale times (yFrac picks the point
  // down el to centre on). With no el, the whole phone, unzoomed.
  function frame(el, scale, yFrac) {
    if (!el) { body.style.transform = ""; return; }
    var k = body.getBoundingClientRect().width / body.offsetWidth;
    var b = body.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var x = (r.left + r.width / 2 - b.left) / k;
    var y = (r.top + r.height * (yFrac == null ? 0.5 : yFrac) - b.top) / k;
    var p = phone.getBoundingClientRect();
    var bx = box.getBoundingClientRect();
    // Where the box's centre sits in the phone body's own (unscaled) space
    var cx = bx.left + bx.width / 2 - p.left;
    var cy = bx.top + bx.height / 2 - p.top;
    body.style.transformOrigin = "0 0";
    body.style.transform = "translate(" + (cx - x * scale) + "px," + (cy - y * scale) + "px) scale(" + scale + ")";
  }

  // Rolls the greeting to word i; the window narrows or widens to fit it, so
  // "Eddie" always sits one space after the word
  var rollBox = track.parentNode;
  var words = track.children;
  // The scale that fits el's whole height in the box with room to spare
  // (never more than max)
  function fit(el, max) {
    var k = body.getBoundingClientRect().width / body.offsetWidth;
    var h = el.getBoundingClientRect().height / k;
    return Math.min(max, box.clientHeight * 0.82 / h);
  }

  function roll(i) {
    track.style.setProperty("--roll", i);
    rollBox.style.width = words[i].offsetWidth + "px";
  }

  // Cuts to the opening shot: the old list, close up, behind a quick fade
  async function opening(id) {
    phone.classList.add("is-dark");
    await wait(400, id);
    phone.classList.add("is-cut");
    phone.classList.remove("is-pop", "is-notice", "is-chip");
    phone.classList.add("is-solo");
    phone.dataset.list = "old";
    roll(0);
    // The pill is out of shot: back to its first "Rewards", grey
    if (pill) pill.classList.remove("is-earn");
    pillTo(0, false);
    body.style.transform = "";
    void body.offsetWidth;
    frame(parts.old, fit(parts.old, 1.6), 0.5);
    void body.offsetWidth;
    phone.classList.remove("is-cut", "is-dark");
  }

  async function loop(id) {
    while (true) {
      await opening(id);
      say("Plain Account Rows", "Before");
      await wait(1800, id);

      // The new list pops in with the card art
      phone.dataset.list = "new";
      phone.classList.add("is-pop");
      // The new list is taller, so the camera eases back to fit all of it
      frame(parts.accounts, fit(parts.accounts, 1.6), 0.5);
      say("Accounts With Their Cards", "After");
      await wait(2200, id);

      // Pull back; the phone and the rest of the screen fade in around it
      frame(null);
      phone.classList.remove("is-solo");
      say("The New Home Tab");
      await wait(2000, id);

      // Into the greeting, which rolls through the day
      frame(parts.greeting, 2.6, 0.5);
      say("A Greeting for Every Time of Day");
      await wait(1300, id);
      roll(1);
      await wait(1000, id);
      roll(2);
      await wait(1300, id);

      // Pan up as an inline message slides in, then away
      frame(parts.greeting, 2.0, -0.6);
      say("Inline Messages, When They Matter");
      await wait(1000, id);
      phone.classList.add("is-notice");
      // It slides in, then rests for a beat before easing back out
      await wait(2800, id);
      phone.classList.remove("is-notice");
      await wait(1000, id);

      // Settle on the rewards pill: it lights up and rolls through what you
      // just earned, then fades back to grey
      frame(parts.chip, 3, 0.5);
      phone.classList.add("is-chip");
      say("Rewards Pill Concept. Unreleased.");
      await wait(900, id);
      if (pill) pill.classList.add("is-earn");
      pillTo(1, true);
      await wait(1500, id);
      pillTo(2, true);
      await wait(1500, id);
      pillTo(3, true);
      await wait(700, id);
      if (pill) pill.classList.remove("is-earn");
      await wait(1300, id);
    }
  }

  if (reduced) {
    phone.dataset.list = "new";
    roll(1);
    pillTo(3, false);
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
