// 3D Experiments tile (resume, Play): a small dotted world, spinning slowly
// on a tilted axis with a moon on its own orbit. Built with three.js from the
// CDN. The dots fade toward the back so the sphere reads as round on the
// paper. Spins only while on screen; reduced motion gets a still frame.
// Styles are under "3D Experiments globe" in style.css.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const canvas = document.querySelector(".fun-globe");
if (canvas) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 6.6);

  // Dots: each one's size and opacity follow how far round the front it is
  const dotMaterial = (color, size) => new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uSize: { value: size },
      uRatio: { value: renderer.getPixelRatio() }
    },
    vertexShader: `
      uniform float uSize;
      uniform float uRatio;
      varying float vFront;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 n = normalize(mat3(modelViewMatrix) * normalize(position));
        vFront = clamp(n.z * 0.5 + 0.5, 0.0, 1.0);
        gl_PointSize = uSize * uRatio * (0.55 + 0.45 * vFront);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      varying float vFront;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float edge = smoothstep(0.5, 0.38, d);
        gl_FragColor = vec4(uColor, edge * mix(0.06, 0.85, vFront * vFront));
      }`
  });

  // The world: dots in rings of latitude, evenly spaced along each ring
  const world = new THREE.Group();
  const pts = [];
  const RINGS = 26;
  for (let i = 1; i < RINGS; i++) {
    const lat = Math.PI * i / RINGS;
    const r = Math.sin(lat);
    const count = Math.max(6, Math.round(64 * r));
    for (let j = 0; j < count; j++) {
      const lon = 2 * Math.PI * j / count + i * 0.37;
      pts.push(r * Math.cos(lon), Math.cos(lat), r * Math.sin(lon));
    }
  }
  const worldGeo = new THREE.BufferGeometry();
  worldGeo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  world.add(new THREE.Points(worldGeo, dotMaterial("#d6d6dc", 3)));

  // A faint body behind the dots, so the back half reads as further away
  world.add(new THREE.Mesh(
    new THREE.SphereGeometry(0.985, 48, 32),
    new THREE.MeshBasicMaterial({ color: "#f4f4f6", transparent: true, opacity: 0.55, depthWrite: false })
  ));

  const tilt = new THREE.Group();
  tilt.rotation.z = THREE.MathUtils.degToRad(-18);
  tilt.rotation.x = THREE.MathUtils.degToRad(12);
  tilt.add(world);
  scene.add(tilt);

  // The moon's orbit: a dotted ring, and the moon riding it
  const orbit = new THREE.Group();
  orbit.rotation.x = THREE.MathUtils.degToRad(72);
  orbit.rotation.y = THREE.MathUtils.degToRad(-14);
  const ring = [];
  for (let k = 0; k < 120; k++) {
    const a = 2 * Math.PI * k / 120;
    ring.push(Math.cos(a) * 1.55, Math.sin(a) * 1.55, 0);
  }
  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute("position", new THREE.Float32BufferAttribute(ring, 3));
  const ringMat = new THREE.PointsMaterial({ color: "#d6d6dc", size: 1.6 * renderer.getPixelRatio(), sizeAttenuation: false, transparent: true, opacity: 0.6, depthWrite: false });
  orbit.add(new THREE.Points(ringGeo, ringMat));
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 24, 16),
    new THREE.MeshBasicMaterial({ color: "#7a70f0" })
  );
  orbit.add(moon);
  scene.add(orbit);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  let t = 0, last = 0, raf = 0;
  function frame(now) {
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    t += dt;
    world.rotation.y = t * 0.35;
    const a = t * 0.6 + 0.8;
    moon.position.set(Math.cos(a) * 1.55, Math.sin(a) * 1.55, 0);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }

  resize();
  window.addEventListener("resize", resize);

  if (reduced) {
    frame(0);
    stop();
  } else if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(canvas);
  } else {
    start();
  }
}
