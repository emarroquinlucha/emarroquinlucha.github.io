// Posters gallery (posters.html): lays the posters out in staggered columns,
// scrolls the page smoothly (the content eases after the real scroll
// position), lets each column drift at its own speed for a little depth,
// and tilts a poster in 3D with a glare while the cursor is over it. The
// filters on the left show one group at a time: the gallery fades out, the
// matching posters are laid out again, and it fades back in. Each poster's
// gentle bob is CSS (see "Posters gallery" in style.css).
(function () {
  var page = document.getElementById("pg");
  var grid = page.querySelector(".pg-grid");
  var items = Array.prototype.slice.call(grid.querySelectorAll(".pg-item"));
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Columns: 4 on wide screens, 3 on tablets, 2 on phones. Each column gets
  // its own drift speed (a fraction of the scroll) and starting offset.
  var SPEEDS = [0, 0.06, -0.04, 0.09];
  var columns = [];
  var count = 0;
  var group = "all";

  function columnCount() {
    var w = window.innerWidth;
    return w < 640 ? 2 : w < 1000 ? 3 : 4;
  }

  function layout(force) {
    var n = columnCount();
    if (n === count && !force) return;
    count = n;
    columns.forEach(function (c) { c.remove(); });
    columns = [];
    for (var i = 0; i < n; i++) {
      var col = document.createElement("div");
      col.className = "pg-column";
      col.style.setProperty("--offset", i % 2 ? 1 : 0);
      grid.appendChild(col);
      columns.push(col);
    }
    items.forEach(function (item) { if (item.parentNode) item.parentNode.removeChild(item); });
    var shown = items.filter(function (item) {
      return group === "all" || item.dataset.group === group;
    });
    // Filtered, only as many columns as posters (centred, by CSS)
    grid.classList.toggle("is-filtered", group !== "all");
    grid.style.setProperty("--cols", n);
    columns.forEach(function (col, i) {
      if (group !== "all" && i >= shown.length) col.remove();
    });
    shown.forEach(function (item, i) { columns[i % n].appendChild(item); });
    grid.classList.add("is-columns");
  }

  // Smooth scroll: the page is pinned and moved by hand, easing toward the
  // real scroll position; a spacer gives the window its scroll height
  var smooth = !reduced && fine;
  var spacer = null;
  var current = window.scrollY;

  function measure() {
    if (spacer) spacer.style.height = page.offsetHeight + "px";
  }

  if (smooth) {
    document.documentElement.classList.add("is-smooth");
    spacer = document.createElement("div");
    spacer.className = "pg-spacer";
    document.body.appendChild(spacer);
  }

  function frame() {
    var target = window.scrollY;
    current += (target - current) * (smooth ? 0.09 : 1);
    if (Math.abs(target - current) < 0.05) current = target;
    if (smooth) page.style.transform = "translate3d(0," + (-current).toFixed(2) + "px,0)";
    pinFilter();
    fadeTop();
    if (!reduced) {
      // No drift while filtered, so the row's tops stay lined up
      var still = group !== "all";
      columns.forEach(function (col, i) {
        col.style.transform = still ? "" : "translate3d(0," + (current * SPEEDS[i % SPEEDS.length]).toFixed(2) + "px,0)";
      });
    }
    requestAnimationFrame(frame);
  }

  layout();
  measure();
  window.addEventListener("resize", function () { layout(); measure(); });
  window.addEventListener("load", measure);
  items.forEach(function (item) {
    var img = item.querySelector("img");
    if (!img.complete) img.addEventListener("load", measure);
  });
  requestAnimationFrame(frame);

  // The filter control (desktop): under the heading, then pinned to the top
  // of the window once the page scrolls it up there. Phones keep it at the
  // bottom of the window (CSS).
  var filter = document.querySelector(".pg-filter");
  var header = page.querySelector(".pg-header");
  var wide = window.matchMedia("(min-width: 641px)");
  var PIN = 60;
  function pinFilter() {
    if (!filter || !wide.matches) return;
    var natural = header.offsetTop + header.offsetHeight + 44;
    filter.style.top = Math.max(PIN, natural - current).toFixed(2) + "px";
    filter.classList.toggle("is-pinned", natural - current <= PIN);
  }

  // The posters fade out as they reach the top of the window: a mask on the
  // page, from clear at FADE_FROM to solid at FADE_TO (px from the window's
  // top). The page moves under it, so the mask is shifted by the scroll.
  var FADE_FROM = 0, FADE_TO = 140, lastFade = null;
  function fadeTop() {
    var y = Math.round(current);
    if (y === lastFade) return;
    lastFade = y;
    var mask = "linear-gradient(to bottom, transparent " + (y + FADE_FROM) + "px, #000 " + (y + FADE_TO) + "px)";
    page.style.webkitMaskImage = mask;
    page.style.maskImage = mask;
  }

  // Filters: fade the gallery out, lay out the chosen group, fade it back in
  var buttons = Array.prototype.slice.call(document.querySelectorAll(".pg-filter button"));
  var busy = null;
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var next = btn.dataset.filter;
      if (next === group) return;
      buttons.forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-current", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      group = next;
      clearTimeout(busy);
      grid.classList.add("is-filtering");
      busy = setTimeout(function () {
        // From now on the posters come in with the quick blur-in, not the fog
        grid.classList.add("is-refiltered");
        layout(true);
        measure();
        // Back up to the top of the gallery if the page was scrolled past it
        var top = grid.offsetTop - 120;
        if (window.scrollY > top) window.scrollTo(0, Math.max(0, top));
        requestAnimationFrame(function () { grid.classList.remove("is-filtering"); });
      }, reduced ? 0 : 260);
    });
  });

  // Hover: the poster leans toward the cursor, the glare follows it
  if (!fine || reduced) return;
  var MAX = 10; // degrees

  items.forEach(function (item) {
    var tilt = item.querySelector(".pg-tilt");
    var target = { x: 0.5, y: 0.5 }, now = { x: 0.5, y: 0.5 };
    var raf = null;

    function step() {
      now.x += (target.x - now.x) * 0.16;
      now.y += (target.y - now.y) * 0.16;
      tilt.style.setProperty("--ry", ((now.x - 0.5) * 2 * MAX).toFixed(2) + "deg");
      tilt.style.setProperty("--rx", ((0.5 - now.y) * 2 * MAX).toFixed(2) + "deg");
      tilt.style.setProperty("--gx", (now.x * 100).toFixed(1) + "%");
      tilt.style.setProperty("--gy", (now.y * 100).toFixed(1) + "%");
      var settled = Math.abs(target.x - now.x) < 0.001 && Math.abs(target.y - now.y) < 0.001;
      raf = settled ? null : requestAnimationFrame(step);
    }

    item.addEventListener("pointermove", function (e) {
      var r = item.getBoundingClientRect();
      target.x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      target.y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      item.classList.add("is-tilting");
      if (!raf) raf = requestAnimationFrame(step);
    });

    item.addEventListener("pointerleave", function () {
      target.x = target.y = 0.5;
      item.classList.remove("is-tilting");
      if (!raf) raf = requestAnimationFrame(step);
    });
  });
})();
