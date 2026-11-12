// 3D Experiments tile (resume, Play): a small dotted world, spinning slowly
// on a tilted axis with a moon on its own orbit. Drawn on a plain 2D canvas
// (no 3D library): each dot is rotated and projected with a little math,
// and the dots shrink and fade toward the back so the sphere reads as
// round on the paper. A pale disc behind sits over the dots like a faint
// body; the moon, in the Structure & Craft gradient's colours, passes behind
// the globe or in front of it. Spins at 30 frames a second, only while on
// screen; reduced motion gets a still frame. Styles are under "3D
// Experiments globe" in style.css.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var D2R = Math.PI / 180;

  // The camera: 30° field of view, 6.6 units back
  var DIST = 6.6, HALF_FOV = Math.tan(15 * D2R);

  // The world: dots in rings of latitude, evenly spaced along each ring
  var world = [];
  var RINGS = 26;
  for (var i = 1; i < RINGS; i++) {
    var lat = Math.PI * i / RINGS, r = Math.sin(lat);
    var count = Math.max(6, Math.round(64 * r));
    for (var j = 0; j < count; j++) {
      var lon = 2 * Math.PI * j / count + i * 0.37;
      world.push([r * Math.cos(lon), Math.cos(lat), r * Math.sin(lon)]);
    }
  }

  // Rotations (the order three.js used: the spin, then the tilt)
  function rotY(p, a) { var c = Math.cos(a), s = Math.sin(a); return [c * p[0] + s * p[2], p[1], -s * p[0] + c * p[2]]; }
  function rotX(p, a) { var c = Math.cos(a), s = Math.sin(a); return [p[0], c * p[1] - s * p[2], s * p[1] + c * p[2]]; }
  function rotZ(p, a) { var c = Math.cos(a), s = Math.sin(a); return [c * p[0] - s * p[1], s * p[0] + c * p[1], p[2]]; }
  var TILT_X = 12 * D2R, TILT_Z = -18 * D2R;
  var ORBIT_X = 72 * D2R, ORBIT_Y = -14 * D2R, ORBIT_R = 1.55;

  // The moon's orbit: a dotted ring
  var ring = [];
  for (var k = 0; k < 120; k++) {
    var a = 2 * Math.PI * k / 120;
    ring.push(rotX(rotY([Math.cos(a) * ORBIT_R, Math.sin(a) * ORBIT_R, 0], ORBIT_Y), ORBIT_X));
  }

  document.querySelectorAll(".fun-globe").forEach(function (canvas) {
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var w = 0, h = 0, ratio = 1, f = 1;

    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight;
      if (!w || !h) return;
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
      f = (h / 2) / HALF_FOV;
    }

    // A point in the scene to the screen: x, y and its scale
    function project(p) {
      var s = f / (DIST - p[2]);
      return [w / 2 + p[0] * s, h / 2 - p[1] * s, s];
    }

    function dot(x, y, d, color, alpha) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, d / 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    function drawMoon(m) {
      var p = project(m), rad = 0.09 * p[2];
      var g = ctx.createLinearGradient(0, p[1] - rad, 0, p[1] + rad);
      g.addColorStop(0, "#e5883c");
      g.addColorStop(0.3, "#e9a592");
      g.addColorStop(0.62, "#e48ec8");
      g.addColorStop(1, "#b19adc");
      ctx.globalAlpha = 1;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p[0], p[1], rad, 0, 2 * Math.PI);
      ctx.fill();
    }

    function draw(t) {
      if (!w) return;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, w, h);

      var ma = t * 0.6 + 0.8;
      var moon = rotX(rotY([Math.cos(ma) * ORBIT_R, Math.sin(ma) * ORBIT_R, 0], ORBIT_Y), ORBIT_X);
      var centre = project([0, 0, 0]);
      var mp = project(moon);
      var hidden = moon[2] < 0 && Math.hypot(mp[0] - centre[0], mp[1] - centre[1]) < centre[2] * 1.02;
      if (hidden) drawMoon(moon);

      // The dots: smaller and fainter round the back
      var spin = t * 0.35;
      for (var n = 0; n < world.length; n++) {
        var q = rotX(rotZ(rotY(world[n], spin), TILT_Z), TILT_X);
        var front = Math.min(1, Math.max(0, q[2] * 0.5 + 0.5));
        var p = project(q);
        // (#ababb0: the grey the 3D version's dots actually showed in)
        dot(p[0], p[1], 3 * (0.55 + 0.45 * front), "#ababb0", 0.06 + 0.79 * front * front);
      }

      // The faint body over them, so the back reads as further away
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#f4f4f6";
      ctx.beginPath();
      ctx.arc(centre[0], centre[1], 0.985 * centre[2], 0, 2 * Math.PI);
      ctx.fill();

      // The orbit's dotted ring, then the moon when it's in front
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = "#c4c4ca";
      for (var o = 0; o < ring.length; o++) {
        var rp = project(ring[o]);
        ctx.fillRect(rp[0] - 0.8, rp[1] - 0.8, 1.6, 1.6);
      }
      if (!hidden) drawMoon(moon);
      ctx.globalAlpha = 1;
    }

    // 30 frames a second is plenty for a slow spin
    var t = 0, last = 0, raf = 0, acc = 0;
    function frame(now) {
      var dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      t += dt;
      acc += dt;
      if (acc >= 1 / 30) { acc = 0; draw(t); }
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { cancelAnimationFrame(raf); raf = 0; }

    resize();
    window.addEventListener("resize", function () { resize(); draw(t); });

    draw(0);
    if (reduced) return;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries[0].isIntersecting ? start() : stop();
      }).observe(canvas);
    } else {
      start();
    }
  });
})();
