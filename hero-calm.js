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
  // 値はFV全体に渡す（TOPは写真を切り替えるので、どの写真にも同じ値が効くように）
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
  // TOPだけ：光でふわっと写真を切り替える（写真が2枚以上あるとき）。見た目は hero-calm.css の .hc-glow / .is-entering
  var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
  var glow = hero.querySelector('.hc-glow');
  var timer = 0;
  if (slides.length > 1 && glow) {
    var hold = 5000;          // 1枚を見せる時間
    var current = 0, changing = false;
    var ready = slides.map(function (sl) {
      var im = sl.querySelector('img');
      return im.decode ? im.decode().then(function () { return true; }, function () { return false; }) : Promise.resolve(true);
    });
    var schedule = function (wait) {
      clearTimeout(timer);
      if (!document.hidden) timer = setTimeout(next, wait || hold);
    };
    var next = function () {
      if (document.hidden || changing) return;
      var nxt = (current + 1) % slides.length;
      ready[nxt].then(function (ok) {
        if (!ok || document.hidden) { schedule(); return; }
        changing = true;
        var prev = slides[current], inc = slides[nxt];
        // ① 光が明るくなり、今の写真も少し明るく
        glow.classList.remove('is-off');
        glow.classList.add('is-on');
        prev.classList.add('is-leaving');
        prev.classList.remove('is-current');
        setTimeout(function () {
          // ② 光の中で、次の写真がぼけた明るい状態からふわっと現れる
          inc.classList.add('is-entering');
          void inc.offsetWidth;
          inc.classList.add('is-current');
          setTimeout(function () {
            // ③ 光が引いていく
            glow.classList.add('is-off');
            glow.classList.remove('is-on');
            setTimeout(function () {
              prev.classList.remove('is-leaving');
              inc.classList.remove('is-entering');
              current = nxt; changing = false; schedule();
            }, 1300);
          }, 700);
        }, 650);
      });
    };
    // 最初のロゴの演出があるときは、幕が開いてから数えはじめる
    schedule(document.documentElement.classList.contains('tm-intro') ? hold + 4000 : hold);
  }

  // タブが裏にあるときは止める
  document.addEventListener('visibilitychange', function () {
    hero.classList.toggle('is-paused', document.hidden);
    // 写真を切り替えるFVでは、裏にある間は切り替えを止め、戻ったら5秒後に再開
    if (typeof schedule === 'function') { clearTimeout(timer); if (!document.hidden) schedule(); }
  });
  onScroll();
})();
