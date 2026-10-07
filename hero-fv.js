/* 写真のマスクと光の境目を同じ座標で動かす。写真の拡大は内側で行う。 */
(function () {
  var hero = document.querySelector('.hero-motion');
  if (!hero || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
  var light = hero.querySelector('.hero-light');
  var lines = light.querySelectorAll('line');
  var current = 0, timer = 0, frame = 0, changing = false;
  var hold = 5000, wipeDuration = 1000;
  var ready = slides.map(function (slide) {
    var img = slide.querySelector('img');
    return img.decode ? img.decode().then(function () { return true; }, function () { return false; }) : Promise.resolve(true);
  });
  function schedule() {
    clearTimeout(timer);
    if (!document.hidden) timer = setTimeout(next, hold);
  }
  function next() {
    if (document.hidden || changing) return;
    changing = true;
    // 未読込の写真を待つ間も、表示中の写真のカメラは動き続ける。
    var candidate = (current + 1) % slides.length;
    ready[candidate].then(function (loaded) {
      if (!loaded || document.hidden) { changing = false; schedule(); return; }
      var previous = slides[current], incoming = slides[candidate];
      slides.forEach(function (slide) {
        if (slide !== previous) { slide.classList.remove('is-leaving'); slide.style.removeProperty('clip-path'); }
      });
      incoming.style.clipPath = 'polygon(0 0, 0 0, -24% 100%, 0 100%)';
      // 開始位置を、まだ見えないうちに準備する。
      void incoming.offsetWidth;
      previous.classList.replace('is-current', 'is-leaving');
      incoming.classList.add('is-current');
      current = candidate;
      var elapsed = 0, last = 0;
      function draw(now) {
        if (document.hidden) { last = 0; frame = requestAnimationFrame(draw); return; }
        if (last) elapsed += now - last;
        last = now;
        var progress = Math.min(1, elapsed / wipeDuration);
        // ゆっくり出発し、真ん中で進んで、穏やかに収まる。
        var eased = progress * progress * (3 - 2 * progress);
        var x = -2 + 128 * eased;
        incoming.style.clipPath = 'polygon(0 0, ' + x + '% 0, ' + (x - 24) + '% 100%, 0 100%)';
        lines.forEach(function (line) {
          line.setAttribute('x1', x * 10);
          line.setAttribute('x2', (x - 24) * 10);
        });
        light.style.opacity = Math.sin(Math.PI * progress) * .9;
        if (progress < 1) frame = requestAnimationFrame(draw);
        else {
          // 次の写真に完全に隠れてから、前の写真を初期位置へ戻す。
          light.style.opacity = '0';
          incoming.style.removeProperty('clip-path');
          previous.classList.remove('is-leaving');
          changing = false; frame = 0; schedule();
        }
      }
      frame = requestAnimationFrame(draw);
    });
  }
  ready[0].then(function () { hero.classList.add('is-playing'); schedule(); });
  document.addEventListener('visibilitychange', function () {
    hero.classList.toggle('is-paused', document.hidden);
    clearTimeout(timer);
    if (!document.hidden && !changing) schedule();
  });
})();
