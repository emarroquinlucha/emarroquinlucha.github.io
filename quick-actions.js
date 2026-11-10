// Quick actions prototype (home-tab-refresh.html): the new Home tab in a
// phone, where each quick action opens its money movement sheet.
//   Watch: taps Pay, Add funds, Move funds and Send in turn (each button
//   bounces, its sheet springs up). On Move funds the phone zooms in on
//   "Move within Neo" and outlines it; on Send it zooms in on the Send and
//   Request rows. Then it zooms out, closes and starts over.
//   Explore: visitors tap the quick actions themselves; the X or a tap
//   outside the sheet closes it.
// Plays only while on screen. Styles are under "Quick actions prototype" in
// style.css. Load after mode-ring.js.
(function () {
  var proto = document.querySelector(".qa-proto");
  if (!proto) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stage = proto.querySelector(".qa-stage");
  var phone = proto.querySelector(".qa-phone");
  var body = phone.querySelector(".phone-mock-body");
  var screen = phone.querySelector(".phone-mock-screen");
  var scrim = phone.querySelector(".qa-scrim");
  var tap = phone.querySelector(".qa-tap");
  var hint = proto.querySelector(".qa-hint");
  var modeButtons = proto.querySelectorAll(".proto-mode button");
  var ring = window.modeRing ? window.modeRing(proto.querySelector(".proto-mode")) : null;

  var LABELS = { pay: "Pay", add: "Add Funds", move: "Move Funds", send: "Send" };
  // While Watch zooms in: when a customer doesn't have the account an action
  // needs, the sheet suggests opening it instead of hiding the action
  var CAPTIONS = {
    move: "No Second Account? It Suggests Adding One to Move Funds",
    send: "No Everyday Account? It Suggests Opening One to Send and Request"
  };
  var HINT_EXPLORE = "Tap a Quick Action to Open Its Sheet";
  var HINT_OPEN = "Tap the X to Close";

  var run = 0;
  var inView = false;
  var openSheet = null;

  function sheet(name) { return phone.querySelector('.qa-sheet[data-sheet="' + name + '"]'); }
  function action(name) { return phone.querySelector('.qa-action[data-sheet="' + name + '"]'); }

  function wait(ms, id) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
    });
  }

  function say(text) {
    if (hint.textContent === text) return;
    hint.style.opacity = 0;
    setTimeout(function () { hint.textContent = text; hint.style.opacity = ""; }, 200);
  }

  // A soft circle where the finger lands, on the screen
  function tapOn(el) {
    var s = screen.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var scale = s.width / screen.offsetWidth;
    tap.style.left = ((r.left + r.width / 2 - s.left) / scale) + "px";
    tap.style.top = ((r.top + r.height / 2 - s.top) / scale) + "px";
    tap.classList.remove("is-tapping");
    void tap.offsetWidth;
    tap.classList.add("is-tapping");
  }

  function bounce(btn) {
    btn.classList.remove("is-bouncing");
    void btn.offsetWidth;
    btn.classList.add("is-bouncing");
  }

  function open(name) {
    if (openSheet) sheet(openSheet).classList.remove("is-open");
    openSheet = name;
    bounce(action(name));
    sheet(name).classList.add("is-open");
    phone.classList.add("is-open");
  }

  function close() {
    if (!openSheet) return;
    sheet(openSheet).classList.remove("is-open");
    openSheet = null;
    phone.classList.remove("is-open");
  }

  // Zooms the phone in so el sits in the middle of it, scale times bigger
  function zoom(el, scale) {
    var b = body.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var k = b.width / body.offsetWidth; // any zoom already applied
    var x = (r.left + r.width / 2 - b.left) / k;
    var y = (r.top + r.height / 2 - b.top) / k;
    stage.classList.add("is-cropped");
    body.style.transformOrigin = x + "px " + y + "px";
    body.style.transform = "translate(" + (body.offsetWidth / 2 - x) + "px," +
      (body.offsetHeight * 0.6 - y) + "px) scale(" + scale + ")";
  }

  function unzoom() {
    body.style.transform = "";
  }

  function reset() {
    close();
    unzoom();
    stage.classList.remove("is-cropped");
    phone.querySelectorAll(".is-lit").forEach(function (el) { el.classList.remove("is-lit"); });
  }

  // Opens a sheet the way a finger would, then (for some) zooms in on rows
  async function show(name, id, focus, scale, caption) {
    say(LABELS[name]);
    tapOn(action(name));
    await wait(160, id);
    open(name);
    await wait(1500, id);
    if (focus) {
      zoom(focus, scale);
      if (caption) say(caption);
      await wait(900, id);
      focus.classList.add("is-lit");
      await wait(2200, id);
      focus.classList.remove("is-lit");
      await wait(300, id);
      unzoom();
      await wait(900, id);
    }
    tapOn(sheet(name).querySelector(".qa-close"));
    await wait(160, id);
    close();
    await wait(800, id);
  }

  // One loop is 20.9s: the sum of the waits below
  var LOOP_MS = 20880;

  async function loop(id) {
    reset();
    while (true) {
      if (ring) ring.start(LOOP_MS);
      say("Quick Actions on Home");
      await wait(1400, id);
      await show("pay", id);
      await show("add", id);
      await show("move", id, sheet("move").querySelector(".qa-focus"), 1.9, CAPTIONS.move);
      await show("send", id, sheet("send").querySelector(".qa-list"), 1.55, CAPTIONS.send);
      stage.classList.remove("is-cropped");
      await wait(400, id);
    }
  }

  function start() {
    run++;
    reset();
    if (ring) ring.stop();
    if (proto.dataset.mode === "watch") {
      if (inView && !reduced) loop(run).catch(function () {});
      else if (reduced) { open("move"); sheet("move").querySelector(".qa-focus").classList.add("is-lit"); say(CAPTIONS.move); }
    } else {
      say(HINT_EXPLORE);
    }
  }

  // Watch / Explore
  modeButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (proto.dataset.mode === btn.dataset.mode) return;
      proto.dataset.mode = btn.dataset.mode;
      modeButtons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      var explore = btn.dataset.mode === "explore";
      phone.querySelectorAll(".qa-action, .qa-close").forEach(function (el) {
        el.tabIndex = explore ? 0 : -1;
      });
      start();
    });
  });

  // Explore: the quick actions open their sheets; the X or the dimmed
  // Home tab closes them
  phone.querySelectorAll(".qa-action").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (proto.dataset.mode !== "explore") return;
      open(btn.dataset.sheet);
      say(HINT_OPEN);
    });
  });
  function closeExplore() {
    if (proto.dataset.mode !== "explore") return;
    close();
    say(HINT_EXPLORE);
  }
  phone.querySelectorAll(".qa-close").forEach(function (btn) {
    btn.addEventListener("click", closeExplore);
  });
  scrim.addEventListener("click", closeExplore);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (proto.dataset.mode === "watch") {
        if (inView) start();
        else { run++; if (ring) ring.stop(); }
      }
    }, { threshold: 0.3 }).observe(phone);
  } else {
    inView = true;
    start();
  }
})();
