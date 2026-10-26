/* 「園の様子」ギャラリー（2026-10-26）。見た目は gallery.css、中身の写真は ~/kmtools/km_gallery.py が書き出す
   ・帯を左へゆっくり流す（1周およそ 75 秒）。写真の列を1組だけ複製して並べ、1組分進んだら戻すので継ぎ目で跳ばない
   ・PCはマウスでドラッグ、スマホは指で横スワイプ（ふつうの横スクロール）
   ・ホバー中・キーボードのフォーカス中・操作中は止め、離して少し経ったら再開
   ・「動きを減らす」設定では自動で流さない（手では動かせる）
   ・写真を押すと拡大（<dialog>）。左右の移動・Esc・閉じるボタン・キーボード操作に対応 */
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');

  Array.prototype.forEach.call(document.querySelectorAll('[data-kg]'), function (root) {
    var vp = root.querySelector('.kg-viewport');
    var track = root.querySelector('.kg-track');
    var items = Array.prototype.slice.call(track.children);
    if (!vp || !items.length) return;

    // 複製：読み上げ・タブ移動の対象から外す
    items.forEach(function (li) {
      var c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.classList.add('kg-clone');
      c.querySelectorAll('button').forEach(function (b) { b.tabIndex = -1; });
      c.querySelectorAll('img').forEach(function (im) { im.alt = ''; });
      track.appendChild(c);
    });

    var setW = 0, pos = 0, last = 0, paused = 0, resumeAt = 0, hovering = false, focused = false, running = false;
    var SECONDS = 75;
    function measure() {
      var first = track.children[0], copy = track.children[items.length];
      setW = copy.offsetLeft - first.offsetLeft;
    }
    function wrap() {
      if (!setW) return;
      if (pos >= setW) pos -= setW;
      else if (pos < 1) pos += setW;
    }
    function apply() { vp.scrollLeft = pos; }
    function holdFor(ms) { resumeAt = Math.max(resumeAt, performance.now() + ms); }
    function tick(t) {
      if (!last) last = t;
      var dt = Math.min(t - last, 64); last = t;
      var stop = reduce.matches || hovering || focused || dragging || t < resumeAt || document.hidden || lb.open;
      if (!stop && setW) { pos += setW / SECONDS * dt / 1000; wrap(); apply(); }
      requestAnimationFrame(tick);
    }

    // 手で動かしたとき（スワイプ・ホイール・キー）も継ぎ目を回す
    vp.addEventListener('scroll', function () {
      if (Math.abs(vp.scrollLeft - pos) < 1.5) return;
      pos = vp.scrollLeft; var before = pos; wrap();
      if (pos !== before) apply();
      holdFor(1800);
    }, { passive: true });

    // ホバー・フォーカス
    vp.addEventListener('mouseenter', function () { hovering = true; });
    vp.addEventListener('mouseleave', function () { hovering = false; holdFor(600); });
    // マウスで押したときのフォーカスでは止めない（キーボードで来たときだけ止める）
    root.addEventListener('focusin', function (e) { focused = !!(e.target.matches && e.target.matches(':focus-visible')); });
    root.addEventListener('focusout', function (e) { if (!root.contains(e.relatedTarget)) { focused = false; holdFor(600); } });
    vp.addEventListener('touchstart', function () { holdFor(2500); }, { passive: true });
    vp.addEventListener('wheel', function () { holdFor(1800); }, { passive: true });

    // マウスのドラッグ（タッチはふつうのスクロールに任せる）
    var dragging = false, moved = false, startX = 0, startPos = 0;
    vp.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true; moved = false; startX = e.clientX; startPos = pos;
    });
    vp.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; vp.classList.add('is-dragging'); vp.setPointerCapture(e.pointerId); }
      if (moved) { pos = startPos - dx; wrap(); apply(); }
    });
    function endDrag(e) {
      if (!dragging) return;
      dragging = false; vp.classList.remove('is-dragging');
      if (vp.hasPointerCapture && vp.hasPointerCapture(e.pointerId)) vp.releasePointerCapture(e.pointerId);
      holdFor(1500);
    }
    vp.addEventListener('pointerup', endDrag);
    vp.addEventListener('pointercancel', endDrag);
    // ドラッグした直後のクリックは拡大しない
    vp.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    vp.addEventListener('dragstart', function (e) { e.preventDefault(); });

    // キーボード：帯にフォーカスして ← → で動かす
    vp.addEventListener('keydown', function (e) {
      if (e.target !== vp) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        var step = (items[0].offsetWidth || 300) + 20;
        pos += e.key === 'ArrowRight' ? step : -step; wrap();
        vp.scrollTo({ left: pos, behavior: reduce.matches ? 'auto' : 'smooth' });
      }
    });

    // ---------- 拡大表示 ----------
    var lb = document.createElement('dialog');
    lb.className = 'kg-lightbox';
    lb.setAttribute('aria-label', '写真の拡大表示');
    lb.innerHTML = '<div class="kg-lb-in"><p class="kg-lb-count" aria-live="polite"></p>' +
      '<figure class="kg-lb-fig"><img alt=""><figcaption></figcaption></figure>' +
      '<button type="button" class="kg-lb-btn kg-lb-prev" aria-label="前の写真">&#8249;</button>' +
      '<button type="button" class="kg-lb-btn kg-lb-next" aria-label="次の写真">&#8250;</button>' +
      '<button type="button" class="kg-lb-btn kg-lb-close" aria-label="閉じる">&#10005;</button></div>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('figcaption'), lbCount = lb.querySelector('.kg-lb-count');
    var cur = 0, opener = null;
    function show(i) {
      cur = (i + items.length) % items.length;
      var im = items[cur].querySelector('img');
      var b = items[cur].querySelector('.kg-cap b'), s = items[cur].querySelector('.kg-cap span'), pk = items[cur].querySelector('.kg-cap .kg-park');
      lbImg.src = im.currentSrc || im.src;
      lbImg.alt = im.alt;
      lbCap.textContent = [pk && pk.textContent, b && b.textContent, s && s.textContent].filter(Boolean).join('｜') || im.alt;
      lbCount.textContent = (cur + 1) + ' / ' + items.length;
    }
    function open(i, btn) {
      opener = btn; show(i);
      document.documentElement.classList.add('kg-lock');
      lb.showModal();
      lb.querySelector('.kg-lb-close').focus();
    }
    lb.addEventListener('close', function () {
      document.documentElement.classList.remove('kg-lock');
      holdFor(800);
      if (opener) {
        // 複製を押していた場合は、元の写真にフォーカスを戻す
        var target = opener.closest('.kg-clone') ? items[cur].querySelector('.kg-open') : opener;
        target.focus({ preventScroll: true });
      }
    });
    lb.querySelector('.kg-lb-close').addEventListener('click', function () { lb.close(); });
    lb.querySelector('.kg-lb-prev').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.kg-lb-next').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
    });
    // 写真の外（暗いところ）を押したら閉じる
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.classList.contains('kg-lb-in')) lb.close(); });
    // スマホ：拡大中の左右スワイプで前後へ
    var sx = null;
    lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
    });

    var buttons = Array.prototype.slice.call(track.querySelectorAll('.kg-open'));
    track.addEventListener('click', function (e) {
      var btn = e.target.closest('.kg-open');
      if (!btn) return;
      open(buttons.indexOf(btn) % items.length, btn);
    });

    // 開始
    function start() {
      measure(); pos = vp.scrollLeft || 0; wrap(); apply();
      if (!running) { running = true; requestAnimationFrame(tick); }
    }
    if (document.readyState === 'complete') start(); else addEventListener('load', start);
    addEventListener('resize', function () { var r = setW ? pos / setW : 0; measure(); pos = r * setW; wrap(); apply(); });
  });
})();
