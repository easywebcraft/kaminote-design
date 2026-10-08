/* 比較ページ専用：冒頭演出の後、メニューを順にふんわり表示する。 */
(function () {
  var header = document.querySelector('.head');
  if (!header || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var targets = [header.querySelector('.brand'), header.querySelector('.lang-btn')]
    .concat(Array.from(header.querySelectorAll('.gnav > a, .gnav > .gdrop > .gdrop-t')))
    .concat([header.querySelector('.cta-pill'), header.querySelector('.burger')]);
  var started = false;
  header.classList.add('warm-menu-pending');
  function reveal() {
    if (started) return;
    started = true;
    header.classList.remove('warm-menu-pending');
    var visible = targets.filter(function (el) { return el && el.getClientRects().length; });
    visible.forEach(function (el, i) {
      if (!el.animate) return;
      var animation = el.animate([
        {opacity:0, transform:'translateY(-12px)'},
        {opacity:1, transform:'translateY(0)'}
      ], {duration:800, delay:i * 90, easing:'cubic-bezier(.22,.61,.36,1)', fill:'both'});
      // 最後に変形を解除し、メニューの開閉やホバーを元のスタイルへ戻す。
      animation.onfinish = function () { animation.cancel(); };
    });
  }
  if (document.documentElement.classList.contains('nursery-intro-active')) {
    window.addEventListener('nursery-intro-end', reveal, {once:true});
  } else requestAnimationFrame(reveal);
})();
