// Scroll reveals. Skipped for reduced-motion users or browsers without IntersectionObserver.
(function () {
  if (!window.matchMedia || !matchMedia('(prefers-reduced-motion: no-preference)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  // [selector, stagger in seconds between siblings]
  var groups = [
    ['.sec-head', 0],
    ['.tries .try', 0.08],
    ['.recording', 0],
    ['.flow > li', 0.14],
    ['.flow-note', 0],
    ['.wrong-row', 0.07],
    ['.table-scroll', 0],
    ['.who', 0]
  ];
  var els = [];
  groups.forEach(function (g) {
    Array.prototype.forEach.call(document.querySelectorAll(g[0]), function (el, i) {
      el.setAttribute('data-reveal', '');
      if (g[1]) el.style.setProperty('--d', (i * g[1]).toFixed(2) + 's');
      els.push(el);
    });
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  els.forEach(function (el) { io.observe(el) });
  document.documentElement.classList.add('motion');

  // Safety net: never leave content hidden.
  window.addEventListener('beforeprint', function () { els.forEach(function (el) { el.classList.add('in') }) });
  setTimeout(function () {
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add('in');
    });
  }, 1500);
})();
