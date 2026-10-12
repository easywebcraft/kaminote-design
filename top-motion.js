/* TOPページのスクロールの動き（2026-10-12・おすすめセット）。見た目は top-motion.css
   ・端末の「視差効果を減らす」がオンなら、動きは付けない（スマホの固定ボタンだけは出す）
   ・scroll-warm.js より前に読むこと（ここで動かす部品を、scroll-warm.js の対象から外すため） */
(function () {
  var root = document.documentElement;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var motion = !reduce && 'IntersectionObserver' in window;
  var head = document.querySelector('.head');
  var hero = document.querySelector('.classic-hero');
  var spbar = document.querySelector('.tm-spbar');
  var visit = document.querySelector('.soft-visit');
  var foot = document.querySelector('.foot');
  var lenis = null;

  if (motion) {
    root.classList.add('tm-on');

    /* --- なめらかなスクロール（Lenis） --- */
    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, anchors: { offset: -((head && head.offsetHeight) || 58) } });
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }

    /* --- FVの見出しを1文字ずつに分ける（言語を切り替えたら作り直す） --- */
    var h1 = hero && hero.querySelector('h1');
    var splitting = false;
    function split() {
      if (!h1 || splitting) return;
      splitting = true;
      var i = 0;
      h1.querySelectorAll('.ln').forEach(function (ln) {
        if (ln.querySelector('.tm-ch')) { i += ln.querySelectorAll('.tm-ch').length; return; }
        var text = ln.textContent;
        var frag = document.createDocumentFragment();
        text.split(/(\s+)/).forEach(function (tok) {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
          var w = document.createElement('span');
          w.className = 'tm-w';
          Array.from(tok).forEach(function (ch) {
            var s = document.createElement('span');
            s.className = 'tm-ch';
            s.style.setProperty('--i', i++);
            s.textContent = ch;
            w.appendChild(s);
          });
          frag.appendChild(w);
        });
        ln.textContent = '';
        ln.appendChild(frag);
        ln.setAttribute('aria-label', text);
      });
      splitting = false;
    }
    split();
    if (h1 && window.MutationObserver) {
      new MutationObserver(function () { if (!splitting) split(); }).observe(h1, { childList: true, subtree: true });
    }

    /* --- 動かす部品に印を付ける（scroll-warm.js の対象からは外す） --- */
    function mark(sel, kind, stagger) {
      document.querySelectorAll(sel).forEach(function (el, n) {
        el.removeAttribute('data-home-reveal');
        el.setAttribute('data-tm', kind);
        if (stagger) el.style.setProperty('--d', n);
      });
    }
    mark('.soft h2.soft-title, #soft-news-t, #soft-faq-t, #soft-visit-t', 'rise');
    mark('.soft-point', 'draw', true);
    mark('.soft-gate', 'draw', true);
    mark('.soft-reason', 'card', true);
    mark('.soft-day-photo', 'circle');
    // 線の長さを 1 として扱う（線が描かれていく動きのため）
    document.querySelectorAll('[data-tm="draw"] .ds-ic svg *').forEach(function (p) {
      if (/^(path|circle|rect|line|polyline|polygon|ellipse)$/.test(p.tagName)) p.setAttribute('pathLength', '1');
    });

    /* --- 画面に入ったら .is-in（1回だけ） --- */
    // ★せり上がる見出しは、最初は切り取って見えない状態にしているため、それ自体は「画面に入った」と判定されない。
    //   見出しを包む親の部品を見張り、親が入ったら見出しに .is-in を付ける
    var watch = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        (watch.get(e.target) || []).forEach(function (el) { el.classList.add('is-in'); });
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
    document.querySelectorAll('[data-tm]').forEach(function (el) {
      var t = el.getAttribute('data-tm') === 'rise' ? el.parentElement : el;
      if (!watch.has(t)) { watch.set(t, []); io.observe(t); }
      watch.get(t).push(el);
    });
  }

  /* --- 最初のロゴ演出：約2秒見せてから幕を開ける。押す・キー・ホイールで飛ばせる --- */
  var loader = document.querySelector('.tm-loader');
  if (loader && root.classList.contains('tm-intro')) {
    if (lenis) lenis.stop();
    var opened = false;
    var open = function () {
      if (opened) return;
      opened = true;
      loader.classList.add('is-out');
      root.classList.remove('tm-hold');             // 幕が開くのに合わせて、FVの見出しが動き出す
      setTimeout(function () {
        root.classList.remove('tm-intro');
        if (lenis) lenis.start();
      }, 1850);              // フェードアウト（0.2秒待って1.6秒）が終わってから消す
    };
    var timer = setTimeout(open, 3600);
    ['click', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, function () { clearTimeout(timer); open(); }, { once: true, passive: true });
    });
  }

  /* --- スクロールに合わせて動くもの --- */
  var tl = document.querySelector('.soft-tl');
  var tlItems = tl ? Array.from(tl.querySelectorAll('li')) : [];
  var photos = Array.from(document.querySelectorAll('.soft-reason-photo img'));
  var ticking = false;
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    if (motion) {
      // いつもの一日：線が伸び、点が順に灯る
      if (tl) {
        var r = tl.getBoundingClientRect();
        var p = clamp((vh * 0.72 - r.top) / r.height);
        tl.style.setProperty('--tl', p.toFixed(3));
        var line = r.top + p * r.height;
        tlItems.forEach(function (li) {
          var lr = li.getBoundingClientRect();
          li.classList.toggle('is-lit', lr.top + lr.height / 2 <= line + 2);
        });
      }
      // 3つの理由：イラストがゆっくりずれる
      photos.forEach(function (img) {
        var b = img.parentElement.getBoundingClientRect();
        if (b.bottom < 0 || b.top > vh) return;
        var off = ((b.top + b.height / 2) - vh / 2) / vh;
        img.style.setProperty('--py', (off * -22).toFixed(1) + 'px');
      });
      // 見学のおさそい：角丸のカードから画面いっぱいへ
      if (visit) {
        var v = visit.getBoundingClientRect();
        visit.style.setProperty('--vp', clamp((vh - v.top) / (vh * 0.65)).toFixed(3));
      }
    }
    // スマホの固定ボタン
    if (spbar) {
      var heroBottom = hero ? hero.getBoundingClientRect().bottom : 0;
      var hideAt = Math.min(visit ? visit.getBoundingClientRect().top : Infinity, foot ? foot.getBoundingClientRect().top : Infinity);
      spbar.classList.toggle('is-shown', heroBottom < 0 && hideAt > vh * 0.85);
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  if (lenis) lenis.on('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  update();
})();
