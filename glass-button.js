// Glass button: gives every .glass-button its hover glow and arrow, and lets
// the highlight on the glass follow the cursor. Usage on any page:
//   <a class="glass-button" href="page.html">Label</a>   (or <button>)
//   <script src="glass-button.js?v=1"></script>          (end of the body)
(function () {
  var arrow = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 7h9M7.75 3.25 11.5 7l-3.75 3.75"/></svg>';

  document.querySelectorAll(".glass-button").forEach(function (button) {
    button.insertAdjacentHTML("afterbegin", '<span class="glass-button-glow" aria-hidden="true"></span>');
    button.insertAdjacentHTML("beforeend", '<span class="glass-button-arrow" aria-hidden="true">' + arrow + arrow + "</span>");

    button.addEventListener("pointermove", function (e) {
      var box = button.getBoundingClientRect();
      button.style.setProperty("--light-x", (e.clientX - box.left) + "px");
      button.style.setProperty("--light-y", (e.clientY - box.top) + "px");
    });
  });
})();
