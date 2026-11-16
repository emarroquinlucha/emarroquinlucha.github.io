// Likes and views for a case study's pills, like the resume's: shared
// counters stored with Abacus (abacus.jasoncameron.dev), a free counter
// service, since GitHub Pages can't store data itself. Each page counts on
// its own, under the key in .page-stats[data-stats] (for example
// "accounts-architecture" counts "accounts-architecture-views" and
// "accounts-architecture-likes-up" / "-likes-down"). Views count once per
// browser. Local previews (localhost, or <html data-preview>) show the live
// counts but don't add to them.
(function () {
  var box = document.querySelector(".page-stats[data-stats]");
  if (!box) return;
  var key = box.dataset.stats;
  var api = "https://abacus.jasoncameron.dev";
  var ns = "emarroquinlucha-github-io";
  var preview = document.documentElement.hasAttribute("data-preview") ||
    /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  function counter(action, name) {
    return fetch(api + "/" + action + "/" + ns + "/" + name)
      .then(function (r) { return r.ok ? r.json() : { value: 0 }; })
      .then(function (d) { return Math.max(0, d.value || 0); });
  }
  function store(name, value) {
    try { if (value === undefined) return localStorage.getItem(name); localStorage.setItem(name, value); } catch (e) {}
  }
  function show(el, n) { el.textContent = n.toLocaleString(); }

  // Views: counted once per browser, so refreshes don't inflate it
  var viewsPill = box.querySelector(".stat-views");
  var viewsEl = viewsPill && viewsPill.querySelector(".stat-count");
  if (viewsEl) {
    var seen = store(key + "-viewed") === "1";
    counter(seen || preview ? "get" : "hit", key + "-views")
      .then(function (n) {
        if (!seen && !preview) store(key + "-viewed", "1");
        show(viewsEl, n);
        viewsPill.setAttribute("aria-label", n.toLocaleString() + " views");
      })
      .catch(function () { viewsEl.textContent = "–"; });
  }

  // Likes = "likes-up" minus "likes-down", since the service only counts up
  var likeBtn = box.querySelector(".stat-like");
  if (!likeBtn) return;
  var likeEl = likeBtn.querySelector(".stat-count");
  var liked = store(key + "-liked") === "1";
  var likes = 0;
  function render() {
    likeBtn.classList.toggle("is-liked", liked);
    likeBtn.setAttribute("aria-pressed", liked ? "true" : "false");
    show(likeEl, likes);
  }
  Promise.all([counter("get", key + "-likes-up"), counter("get", key + "-likes-down")])
    .then(function (v) { likes = Math.max(0, v[0] - v[1]); render(); })
    .catch(function () { likeEl.textContent = "–"; });
  likeBtn.classList.toggle("is-liked", liked);

  likeBtn.addEventListener("click", function () {
    liked = !liked;
    likes = Math.max(0, likes + (liked ? 1 : -1));
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
