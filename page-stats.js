// Likes and views for a case study's pills, like the resume's: shared
// counters stored with Abacus (abacus.jasoncameron.dev), a free counter
// service, since GitHub Pages can't store data itself. Each page counts on
// its own, under the key in .page-stats[data-stats] (for example
// "accounts-architecture" counts "accounts-architecture-views" and
// "accounts-architecture-likes-up" / "-likes-down"). Views count once per
// browser. Local previews (localhost, or <html data-preview>) show the live
// counts but don't add to them. The service sometimes goes down: requests
// give up after 4s, and each pill shows the last count this browser saw
// (kept in localStorage) instead of "–".
(function () {
  var box = document.querySelector(".page-stats[data-stats]");
  if (!box) return;
  var key = box.dataset.stats;
  var api = "https://abacus.jasoncameron.dev";
  var ns = "emarroquinlucha-github-io";
  var preview = document.documentElement.hasAttribute("data-preview") ||
    /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  function counter(action, name) {
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 4000);
    return fetch(api + "/" + action + "/" + ns + "/" + name, ctrl ? { signal: ctrl.signal } : {})
      .then(function (r) {
        // A server error means the service is down, not a count of 0
        if (!r.ok && r.status !== 404) throw new Error("counter " + r.status);
        return r.ok ? r.json() : { value: 0 };
      })
      .then(function (d) { clearTimeout(timer); return Math.max(0, d.value || 0); },
            function (e) { clearTimeout(timer); throw e; });
  }
  function store(name, value) {
    try { if (value === undefined) return localStorage.getItem(name); localStorage.setItem(name, value); } catch (e) {}
  }
  function show(el, n) { el.textContent = n.toLocaleString(); }
  // The last count seen, shown at once and kept if the service is down
  function last(name, n) {
    if (n === undefined) { var v = parseInt(store(key + "-" + name + "-last"), 10); return isNaN(v) ? null : v; }
    store(key + "-" + name + "-last", String(n));
  }

  // Views: counted once per browser, so refreshes don't inflate it
  var viewsPill = box.querySelector(".stat-views");
  var viewsEl = viewsPill && viewsPill.querySelector(".stat-count");
  if (viewsEl) {
    var seen = store(key + "-viewed") === "1";
    var lastViews = last("views");
    if (lastViews !== null) show(viewsEl, lastViews);
    counter(seen || preview ? "get" : "hit", key + "-views")
      .then(function (n) {
        if (!seen && !preview) store(key + "-viewed", "1");
        last("views", n);
        show(viewsEl, n);
        viewsPill.setAttribute("aria-label", n.toLocaleString() + " views");
      })
      .catch(function () { if (lastViews === null) viewsEl.textContent = "–"; });
  }

  // Likes = "likes-up" minus "likes-down", since the service only counts up
  var likeBtn = box.querySelector(".stat-like");
  if (!likeBtn) return;
  var likeEl = likeBtn.querySelector(".stat-count");
  var liked = store(key + "-liked") === "1";
  var lastLikes = last("likes");
  var likes = lastLikes || 0;
  function render() {
    likeBtn.classList.toggle("is-liked", liked);
    likeBtn.setAttribute("aria-pressed", liked ? "true" : "false");
    show(likeEl, likes);
  }
  if (lastLikes !== null) render();
  Promise.all([counter("get", key + "-likes-up"), counter("get", key + "-likes-down")])
    .then(function (v) { likes = Math.max(0, v[0] - v[1]); last("likes", likes); render(); })
    .catch(function () { if (lastLikes === null) likeEl.textContent = "–"; });
  likeBtn.classList.toggle("is-liked", liked);

  likeBtn.addEventListener("click", function () {
    liked = !liked;
    likes = Math.max(0, likes + (liked ? 1 : -1));
    last("likes", likes);
    if (!preview) store(key + "-liked", liked ? "1" : "0");
    render();
    // Restart the bounce (and the heart pop when liking)
    likeBtn.classList.remove("is-bouncing", "is-popping");
    void likeBtn.offsetWidth;
    likeBtn.classList.add("is-bouncing");
    if (liked) likeBtn.classList.add("is-popping");
    if (!preview) counter("hit", key + (liked ? "-likes-up" : "-likes-down")).catch(function () {});
  });
  likeBtn.addEventListener("animationend", function (e) {
    if (e.animationName === "pill-bounce") likeBtn.classList.remove("is-bouncing");
    if (e.animationName === "heart-pop") likeBtn.classList.remove("is-popping");
  });
})();
