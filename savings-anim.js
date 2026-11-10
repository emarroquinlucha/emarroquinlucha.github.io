// Savings concept (resume, Fun! › Fun UI & Ideas): a looping, bouncy demo of
// the savings screen. Each loop: the total counts up and the details spring
// in, the graph line draws itself, a finger drags the tooltip across the
// graph, the range switch hops to 1Y and All (the graph reshapes each time)
// and back to 6m, then the goal card bounces up. Then it all fades and starts
// over. Plays only while on screen. Styles are under "Savings concept" in
// style.css; the graph is drawn in the frame's own points (375 × 812).
(function () {
  var app = document.querySelector(".sv-app");
  if (!app) return;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var line = app.querySelector(".sv-line");
  var area = app.querySelector(".sv-area");
  var guideTop = app.querySelector(".sv-guide-top");
  var guideDrop = app.querySelector(".sv-guide-drop");
  var drop = document.getElementById("sv-drop");
  var dot = app.querySelector(".sv-dot");
  var tip = app.querySelector(".sv-tip");
  var tipDate = app.querySelector(".sv-tip-date");
  var tipValue = app.querySelector(".sv-tip-value");
  var amount = app.querySelector(".sv-amount");
  var xLabels = app.querySelector(".sv-x");
  var tabsBox = app.querySelector(".sv-tabs");
  var tabs = app.querySelectorAll(".sv-tab");

  // Where the graph sits in the frame: six points across, $0–$20k up the side
  var XS = [54, 116, 176, 240, 300, 375];
  var BOTTOM = 505;
  function yOf(v) { return 457 - v / 20000 * 130; }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function dayLabel(start, days, f, withYear) {
    var d = new Date(start.getTime() + f * days * 864e5);
    return MONTHS[d.getMonth()] + " " + (withYear ? d.getFullYear() : d.getDate());
  }

  var RANGES = {
    "6m": { tab: 2, values: [9700, 10900, 10950, 12400, 14000, 14000],
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      date: function (f) { return dayLabel(new Date(2025, 0, 1), 181, f); } },
    "1Y": { tab: 3, values: [5600, 6900, 8100, 9700, 12400, 14000],
      labels: ["Jul", "Sep", "Nov", "Jan", "Mar", "May"],
      date: function (f) { return dayLabel(new Date(2024, 6, 1), 365, f); } },
    "All": { tab: 5, values: [400, 2300, 4600, 7400, 10500, 14000],
      labels: ["2020", "2021", "2022", "2023", "2024", "2025"],
      date: function (f) { return dayLabel(new Date(2020, 0, 1), 1990, f, true); } }
  };

  var range = "6m";
  var ys = RANGES[range].values.map(yOf);

  // The parts that spring in, one after another
  [[".sv-total", "up"], [".sv-track", "scale"], [".sv-change", "up"], [".sv-y", "up"],
   [".sv-x", "up"], [".sv-tabs", "up"]].forEach(function (p, i) {
    var el = app.querySelector(p[0]);
    el.dataset.pop = p[1];
    el.style.transitionDelay = (i * 70) + "ms";
  });

  function money(v) {
    return "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function draw(fraction) {
    var d = "M" + XS.map(function (x, i) { return x + " " + ys[i].toFixed(2); }).join(" L");
    line.setAttribute("d", d);
    area.setAttribute("d", d + " L375 " + BOTTOM + " L54 " + BOTTOM + "Z");
    if (fraction != null) {
      var len = line.getTotalLength();
      line.style.strokeDasharray = len;
      line.style.strokeDashoffset = len * (1 - fraction);
      area.style.opacity = fraction;
    }
  }

  // The graph's height at x, between its points
  function yAt(x) {
    for (var i = 1; i < XS.length; i++) {
      if (x <= XS[i]) {
        var f = (x - XS[i - 1]) / (XS[i] - XS[i - 1]);
        return ys[i - 1] + (ys[i] - ys[i - 1]) * f;
      }
    }
    return ys[ys.length - 1];
  }

  // Puts the dot, guide lines and tooltip at x
  function scrubTo(x) {
    var y = yAt(x);
    dot.style.setProperty("--dx", x);
    dot.style.setProperty("--dy", y);
    guideTop.setAttribute("x1", x); guideTop.setAttribute("x2", x); guideTop.setAttribute("y2", y);
    guideDrop.setAttribute("x1", x); guideDrop.setAttribute("x2", x); guideDrop.setAttribute("y1", y);
    drop.setAttribute("y2", y);
    var f = (x - XS[0]) / (XS[XS.length - 1] - XS[0]);
    tipDate.textContent = RANGES[range].date(f);
    tipValue.textContent = money((457 - y) / 130 * 20000);
    var w = tip.offsetWidth / (app.offsetWidth / 375);
    tip.style.setProperty("--tx", Math.min(Math.max(x - 16, 20), 355 - w).toFixed(1));
  }

  // Easing: a smooth in-out, and an overshoot for the bouncy moves
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOutBack(t) { var c = 1.6; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

  var run = 0;
  function tween(ms, id, fn) {
    return new Promise(function (resolve, reject) {
      var start = performance.now();
      function step(now) {
        if (id !== run) { reject("stopped"); return; }
        var t = Math.min(1, (now - start) / ms);
        fn(t);
        if (t < 1) requestAnimationFrame(step); else resolve();
      }
      requestAnimationFrame(step);
    });
  }
  function wait(ms, id) {
    return new Promise(function (resolve, reject) {
      setTimeout(function () { id === run ? resolve() : reject("stopped"); }, ms);
    });
  }

  // Hops the range switch to a new range: the pill slides, the month labels
  // swap, and the graph reshapes with a bounce
  async function switchTo(name, id) {
    range = name;
    var r = RANGES[name];
    tabsBox.style.setProperty("--tab", r.tab);
    tabs.forEach(function (t) { t.classList.toggle("is-on", t.dataset.range === name); });
    xLabels.style.opacity = 0;
    var from = ys.slice(), to = r.values.map(yOf);
    setTimeout(function () {
      xLabels.querySelectorAll("span").forEach(function (s, i) { s.textContent = r.labels[i]; });
      xLabels.style.opacity = "";
    }, 220);
    await tween(850, id, function (t) {
      var e = easeOutBack(t);
      ys = from.map(function (y, i) { return y + (to[i] - y) * e; });
      draw();
    });
  }

  function reset() {
    app.classList.remove("is-in", "is-scrub", "is-press", "is-goal", "is-out");
    range = "6m";
    ys = RANGES[range].values.map(yOf);
    tabsBox.style.setProperty("--tab", 2);
    tabs.forEach(function (t) { t.classList.toggle("is-on", t.dataset.range === "6m"); });
    xLabels.querySelectorAll("span").forEach(function (s, i) { s.textContent = RANGES["6m"].labels[i]; });
    amount.textContent = money(0);
    draw(0);
    scrubTo(190);
  }

  async function loop(id) {
    while (true) {
      reset();
      await wait(400, id);

      // The total counts up as the details spring in
      app.classList.add("is-in");
      await tween(1300, id, function (t) { amount.textContent = money(12345.67 * easeOutCubic(t)); });

      // The graph draws itself
      await tween(1100, id, function (t) { draw(easeInOut(t)); });
      line.style.strokeDasharray = "";
      await wait(400, id);

      // A finger presses the graph and drags the tooltip across it
      scrubTo(80);
      app.classList.add("is-scrub", "is-press");
      await wait(350, id);
      await tween(2100, id, function (t) { scrubTo(80 + 250 * easeInOut(t)); });
      await tween(1000, id, function (t) { scrubTo(330 - 140 * easeInOut(t)); });
      app.classList.remove("is-press");
      await wait(900, id);
      app.classList.remove("is-scrub");
      await wait(500, id);

      // The range switch: 1Y, All, then back to 6 months
      await switchTo("1Y", id);
      await wait(900, id);
      await switchTo("All", id);
      await wait(900, id);
      await switchTo("6m", id);
      await wait(500, id);

      // The goal card bounces up
      app.classList.add("is-goal");
      await wait(3000, id);

      // Fade out before the next loop
      app.classList.add("is-out");
      await wait(700, id);
    }
  }

  function start() {
    run++;
    loop(run).catch(function () {});
  }

  if (reduced) {
    // Visitors who prefer less motion see the finished screen
    reset();
    draw(1);
    line.style.strokeDasharray = "";
    amount.textContent = money(12345.67);
    app.classList.add("is-in", "is-scrub", "is-goal");
    return;
  }

  reset();
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) start(); else run++;
    }, { threshold: 0.3 }).observe(app);
  } else {
    start();
  }
})();
