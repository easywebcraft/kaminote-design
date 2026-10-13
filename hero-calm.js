/* TOPのFV：写真1枚をやさしく動かし続ける（2026-10-13）。見た目は hero-calm.css
   ・光の粒を作る
   ・スクロールで写真を少し遅らせて動かす（奥行き）／PCではマウスの位置で写真をわずかに動かす
   ・「動きを減らす」設定では何もしない */
(function () {
  var hero = document.querySelector('.hero-motion');
  if (!hero) return;
  var bg = hero.querySelector('.hero-bg');
  var slide = hero.querySelector('.hero-slide.is-current');
  if (!bg || !slide || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 光の粒（スマホは少なめ）
  var dust = document.createElement('div');
  dust.className = 'hc-dust';
  dust.setAttribute('aria-hidden', 'true');
  var n = innerWidth < 700 ? 9 : 16;
  for (var i = 0; i < n; i++) {
    var p = document.createElement('i');
    var s = 10 + Math.random() * 20;
    p.style.cssText = '--l:' + (30 + Math.random() * 70).toFixed(1) + '%;--s:' + s.toFixed(1) + 'px;' +
      '--d:' + (9 + Math.random() * 9).toFixed(1) + 's;--w:' + (-Math.random() * 16).toFixed(1) + 's;' +
      '--dx:' + (Math.random() * 80 - 40).toFixed(0) + 'px;--rise:' + (260 + Math.random() * 380).toFixed(0) + 'px';
    dust.appendChild(p);
  }
  bg.appendChild(dust);

  // 奥行き：スクロールとマウス
  var sy = 0, mx = 0, my = 0, ticking = false;
  function apply() {
    ticking = false;
    slide.style.setProperty('--hc-x', mx.toFixed(1) + 'px');
    slide.style.setProperty('--hc-y', (sy + my).toFixed(1) + 'px');
  }
  function queue() { if (!ticking) { ticking = true; requestAnimationFrame(apply); } }
  function onScroll() {
    var h = hero.offsetHeight || 1;
    sy = Math.min(window.scrollY, h) * 0.22;   // 写真は文字より少し遅れて上へ（奥にあるように見える）
    queue();
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - .5) * -18;
      my = ((e.clientY - r.top) / r.height - .5) * -12;
      queue();
    });
    hero.addEventListener('mouseleave', function () { mx = 0; my = 0; queue(); });
  }
  // タブが裏にあるときは止める
  document.addEventListener('visibilitychange', function () { hero.classList.toggle('is-paused', document.hidden); });
  onScroll();
})();
