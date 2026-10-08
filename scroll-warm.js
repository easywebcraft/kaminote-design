/* 比較用：スクロールで一度だけ、やさしく現れる。本文・操作はそのまま。 */
(function () {
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  if (motion.matches || !window.IntersectionObserver || !Element.prototype.animate) return;
  var selectors = '.v2-num,.v2-about-ph,.v2-about-tx,.v2-anshin > .v2-wrap > .v2-head,' +
    '.v2-ed-ph,.v2-ed-tx,.v2-day .v2-head,.v2-day-ph > figure,.v2-tl > li,.v2-day .v2-note,' +
    '.v2-byoji-ph,.v2-byoji-tx,.v2-gates .v2-head,.v2-g-c,.v2-news .v2-head,.news-list > li,' +
    '.v2-end-in > h2,.v2-end-in > p,.v2-end-in > .v2-act';
  var units = Array.from(document.querySelectorAll(selectors));
  var observer, active = new Set();
  function show(el, delay) {
    if (!el.classList.contains('warm-scroll-pending')) return;
    el.classList.remove('warm-scroll-pending');
    if (observer) observer.unobserve(el);
    if (motion.matches) return;
    var photo = el.matches('.v2-about-ph,.v2-ed-ph,.v2-day-ph > figure,.v2-byoji-ph');
    var animation = el.animate([
      {opacity:0, transform:photo ? 'translateY(28px) scale(.97)' : 'translateY(22px)'},
      {opacity:1, transform:'translateY(0) scale(1)'}
    ], {duration:photo ? 1100 : 850, delay:delay || 0, easing:'cubic-bezier(.22,.61,.36,1)', fill:'both'});
    active.add(animation);
    animation.onfinish = function () { active.delete(animation); animation.cancel(); };
  }
  function finishAll() {
    if (observer) observer.disconnect();
    units.forEach(function (el) { el.classList.remove('warm-scroll-pending'); });
    active.forEach(function (animation) { animation.cancel(); });
    active.clear();
  }
  function begin() {
    if (motion.matches) { finishAll(); return; }
    try {
      observer = new IntersectionObserver(function (entries) {
        var visible = entries.filter(function (entry) { return entry.isIntersecting; });
        visible.sort(function (a,b) {
          return a.boundingClientRect.top-b.boundingClientRect.top || a.boundingClientRect.left-b.boundingClientRect.left;
        });
        visible.forEach(function (entry,i) { show(entry.target, Math.min(i,3)*110); });
      }, {rootMargin:'0px 0px -7% 0px', threshold:.04});
      units.forEach(function (el) { observer.observe(el); });
    } catch (error) { finishAll(); }
  }
  units.forEach(function (el) { el.classList.add('warm-scroll-pending'); });
  // キーボードでリンクへ移動したときも、すぐ表示する。
  document.addEventListener('focusin', function (event) {
    var el = event.target.closest('.warm-scroll-pending');
    if (el) show(el,0);
  });
  motion.addEventListener('change', function (event) { if (event.matches) finishAll(); });
  if (document.documentElement.classList.contains('nursery-intro-active')) {
    window.addEventListener('nursery-intro-end', begin, {once:true});
  } else begin();
})();
