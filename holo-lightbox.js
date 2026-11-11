// Poster lightbox (posters.html): clicking any poster opens it on its own,
// with a faint holographic foil over it. Left alone, it floats (a CSS bob)
// and sways in a very slight tilt. With the cursor over it, it leans toward
// the cursor like the posters in the gallery, and the glare and foil follow.
// Beside it (under it on narrow screens): its title and details from
// DETAILS below, with a "Sold out" badge for prints. Esc, the close button or a click outside
// closes it. Styles are under "Poster lightbox" in style.css.
(function () {
  // Each poster's details, by its image name (images/poster-NAME.jpg). Leave
  // a field out to hide its row. year: still to fill in.
  var DETAILS = {
    "carousel": { event: "Winnipeg Psychedelic × dialog, May 31", made: "Photo collage",
      idea: "Round and round we go, and the horses have opinions." },
    "timekeeper": { series: "Eddie Marroquin Nº14", made: "Photo collage",
      idea: "Time woke up from a bad dream and is running a little late about it." },
    "acid-warehouse": { series: "Eddie Marroquin Nº3", made: "Digital",
      idea: "Thirteen friendly ghosts who agree the bass could be louder." },
    "cherries": { series: "Nº9 · Gradients of Eternity, Part II", made: "Photo collage",
      idea: "Two cherries, one stem, an entire sky's worth of commitment." },
    "horrors": { series: "Eddie Marroquin Nº11", made: "Photo collage",
      idea: "Eating, sex and art: three doors, one hallway, no exit signs." },
    "funhouse": { event: "dialog: house music and debauchery", made: "Photo collage",
      idea: "Every mirror in here is lying, but they're very good dancers." },
    "dopaminergic": { series: "The Complete Debauchery, Part II", made: "Photo collage",
      idea: "A donut is a circle that skipped the meeting about restraint." },
    "celestial": { series: "Eddie Marroquin Nº12", made: "Photo collage",
      idea: "A small planet circles its worries until they look like rings." },
    "avocado": { series: "Nº10 · Gradients of Eternity, Part III", made: "Photo collage",
      idea: "Ripe for exactly one sunset. Then it's guacamole, metaphysically." },
    "saturnalia": { event: "dialog, December 14", made: "Photo collage",
      idea: "Three pines keep the old winter feast; the moons bring snacks." },
    "wonderland": { event: "Always Dale, October 31", made: "Photo collage",
      idea: "Down the rabbit hole, past the dress code, into the good part." },
    "lollipops": { series: "The Complete Debauchery, Part III", made: "Photo collage",
      idea: "Love takes new shapes. Today it's a lollipop, and it's sticky." },
    "strawberry": { series: "Nº8 · Gradients of Eternity, Part I", made: "Photo collage",
      idea: "The first fruit to float. It never explained how, and we didn't ask." },
    "love": { series: "Eddie Marroquin Nº2", made: "Digital",
      idea: "Love, read backwards in a mirror, is still love, just more confusing." },
    "venus": { series: "Eddie Marroquin Nº12", made: "Photo collage",
      idea: "The bull of heaven falls for Venus, beyond all reason and most astronomy." },
    "matroyshka": { series: "Eddie Marroquin Nº4", made: "Photo collage",
      idea: "A mirror inside a mirror inside a mirror, all of them asking who's next." },
    "pleasure-pain": { series: "The Complete Debauchery, Part I", made: "Photo collage",
      idea: "The agony and ecstasy of two ice creams melting toward philosophy." }
  };
  var ROWS = [["year", "Year"], ["series", "Series"], ["event", "Event"], ["made", "Medium"], ["idea", "Lore"]];

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var MAX = 10;  // degrees, following the cursor (as in the gallery)
  var IDLE = 3;  // degrees, the sway on its own

  var box = document.createElement("div");
  box.className = "holo-lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.innerHTML =
    '<button class="holo-close" type="button" aria-label="Close">' +
    '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>' +
    '<div class="holo-stage"><div class="holo-float"><div class="holo-card">' +
    '<img class="holo-img" alt="">' +
    '<span class="holo-foil" aria-hidden="true"></span>' +
    '<span class="holo-glare" aria-hidden="true"></span>' +
    '</div></div>' +
    '<div class="holo-info"><dl class="holo-details"></dl></div>' +
    '</div>';
  document.body.appendChild(box);
  var card = box.querySelector(".holo-card");
  var img = box.querySelector(".holo-img");
  var closeBtn = box.querySelector(".holo-close");
  var details = box.querySelector(".holo-details");

  function fill(name, title) {
    var d = DETAILS[name] || {};
    var rows = ROWS.filter(function (r) { return d[r[0]]; }).map(function (r) { return [r[1], d[r[0]]]; });
    rows.unshift(["Title", title]);
    rows.push(["Prints", ""]);
    details.innerHTML = "";
    rows.forEach(function (r) {
      var row = document.createElement("div");
      var dt = document.createElement("dt");
      var dd = document.createElement("dd");
      dt.textContent = r[0];
      if (r[0] === "Prints") {
        dd.innerHTML = '<span class="holo-badge">Sold out</span>';
      } else {
        dd.textContent = r[1];
      }
      row.appendChild(dt);
      row.appendChild(dd);
      details.appendChild(row);
    });
  }

  var target = { x: 0.5, y: 0.5 }, now = { x: 0.5, y: 0.5 };
  var hovering = false, raf = null, lastFocus = null;

  function step(time) {
    var t = time / 1000;
    if (!hovering) {
      // The slow sway, a small fraction of the full tilt
      var k = IDLE / MAX / 2;
      target.x = 0.5 + (reduced ? 0 : k * Math.sin(t * 0.55));
      target.y = 0.5 + (reduced ? 0 : k * Math.sin(t * 0.8 + 1));
    }
    var ease = hovering ? 0.16 : 0.05;
    now.x += (target.x - now.x) * ease;
    now.y += (target.y - now.y) * ease;
    card.style.setProperty("--ry", ((now.x - 0.5) * 2 * MAX).toFixed(2) + "deg");
    card.style.setProperty("--rx", ((0.5 - now.y) * 2 * MAX).toFixed(2) + "deg");
    card.style.setProperty("--gx", (now.x * 100).toFixed(1) + "%");
    card.style.setProperty("--gy", (now.y * 100).toFixed(1) + "%");
    raf = box.classList.contains("is-open") ? requestAnimationFrame(step) : null;
  }

  function open(item) {
    var src = item.querySelector("img");
    img.src = src.currentSrc || src.src;
    img.alt = src.alt;
    var m = /poster-([a-z-]+)\.jpg/.exec(src.getAttribute("src"));
    fill(m ? m[1] : "", item.dataset.title || "");
    card.style.setProperty("--ar", (src.naturalWidth || src.width) / (src.naturalHeight || src.height));
    lastFocus = document.activeElement;
    target.x = target.y = now.x = now.y = 0.5;
    hovering = false;
    card.classList.remove("is-tilting");
    box.classList.add("is-open");
    document.documentElement.classList.add("is-holo-open");
    closeBtn.focus({ preventScroll: true });
    if (!raf) raf = requestAnimationFrame(step);
  }

  function close() {
    if (!box.classList.contains("is-open")) return;
    box.classList.remove("is-open");
    document.documentElement.classList.remove("is-holo-open");
    if (lastFocus) lastFocus.focus({ preventScroll: true });
  }

  if (fine && !reduced) {
    card.addEventListener("pointermove", function (e) {
      var r = card.getBoundingClientRect();
      target.x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
      target.y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
      hovering = true;
      card.classList.add("is-tilting");
    });
    card.addEventListener("pointerleave", function () {
      hovering = false;
      card.classList.remove("is-tilting");
    });
  }

  box.addEventListener("click", function (e) {
    if (!e.target.closest(".holo-card, .holo-info")) close();
  });
  closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });

  document.querySelectorAll(".pg-item").forEach(function (item) {
    var title = item.dataset.title || "poster";
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", "Open " + title);
    item.addEventListener("click", function () { open(item); });
    item.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(item); }
    });
  });
})();
