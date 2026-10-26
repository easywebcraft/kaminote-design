/* FV：写真1枚をやさしく動かし続ける（2026-10-13）。見た目は hero-calm.css
   TOP（.hero-motion）と下層ページ（.page-fv）の両方で使う
   ・光の筋と光の粒を作る
   ・スクロールで写真を少し遅らせて動かす（奥行き）／PCではマウスの位置で写真をわずかに動かす
   ・「動きを減らす」設定では何もしない */
(function () {
  var hero = document.querySelector('.hero-motion') || document.querySelector('.page-fv');
  if (!hero) return;
  var bg = hero.querySelector('.hero-bg, .page-fv-bg');
  if (!bg || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 動かす部品：TOPは写真の枠（.hero-slide）。下層ページは写真を枠（.hc-move）で包んで、それを動かす
  var mover = hero.querySelector('.hero-slide.is-current');
  if (!mover) {
    var img = bg.querySelector('img');
    if (!img) return;
    mover = document.createElement('div');
    mover.className = 'hc-move';
    bg.insertBefore(mover, img);
    mover.appendChild(img);
  }

  // 光の筋（TOPは HTML に書いてある。下層ページはここで作る）
  if (!bg.querySelector('.hc-light')) {
    var light = document.createElement('div');
    light.className = 'hc-light';
    light.setAttribute('aria-hidden', 'true');
    light.innerHTML = '<i></i><i></i><i></i>';
    bg.appendChild(light);
  }

  // 光の粒（スマホは少なめ）
  var dust = document.createElement('div');
  dust.className = 'hc-dust';
  dust.setAttribute('aria-hidden', 'true');
  var n = innerWidth < 700 ? 14 : 24;
  for (var i = 0; i < n; i++) {
    var p = document.createElement('i');
    var s = 14 + Math.random() * 22;
    // 粒は文字のない右側だけに出す（白い文字の後ろを明るい粒が通ると、文字がぼやけて見えるため。2026-10-27）
    p.style.cssText = '--l:' + (66 + Math.random() * 32).toFixed(1) + '%;--s:' + s.toFixed(1) + 'px;' +
      '--d:' + (9 + Math.random() * 9).toFixed(1) + 's;--w:' + (-Math.random() * 16).toFixed(1) + 's;' +
      '--dx:' + (Math.random() * 80 - 40).toFixed(0) + 'px;--rise:' + (260 + Math.random() * 380).toFixed(0) + 'px';
    dust.appendChild(p);
  }
  bg.appendChild(dust);

  // 奥行き：スクロールとマウス
  var sy = 0, mx = 0, my = 0, ticking = false;
  // 値はFV全体に渡す（TOPは波で写真を切り替えるので、どの写真にも同じ値が効くように）
  function apply() {
    ticking = false;
    hero.style.setProperty('--hc-x', mx.toFixed(1) + 'px');
    hero.style.setProperty('--hc-y', (sy + my).toFixed(1) + 'px');
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
  document.addEventListener('visibilitychange', function () {
    hero.classList.toggle('is-paused', document.hidden);
  });
  onScroll();
})();
