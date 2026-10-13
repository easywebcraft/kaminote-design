/* 下層ページのスクロールの動き（2026-10-12）。見た目は site-motion.css。TOPは top-motion.js（こちらは使わない）
   ・各ページで、翻訳ファイル（i18n.js）や scroll-warm.js・life-page.js より前に読むこと
     （ここで動かす部品を、それらの浮かび上がりの対象から外すため）
   ・「視差効果を減らす」がオンなら動きは付けない（スマホの固定ボタンだけは出す） */
(function () {
  var root = document.documentElement;
  var motion = root.classList.contains('tm-on') && 'IntersectionObserver' in window;
  window.__tmReady = true;                                   // <head> の保険に「読めた」と伝える
  var head = document.querySelector('.head');
  var fv = document.querySelector('.page-fv');
  var spbar = document.querySelector('.tm-spbar');
  var foot = document.querySelector('.foot');
  var VISIT = '.pk-visit, .nw-visit, .pz-visit, .life-visit, .recruit-visit, .policy-visit, .faq-contact';
  var visit = Array.from(document.querySelectorAll(VISIT)).pop() || null;
  var lenis = null;

  if (!motion) { root.classList.remove('tm-on'); }
  if (motion) {
    /* --- 既存の浮かび上がり（scroll-warm.js・life-page.js）の対象から外す --- */
    document.querySelectorAll('[data-home-reveal], [data-life-reveal]').forEach(function (el) {
      el.removeAttribute('data-home-reveal'); el.removeAttribute('data-life-reveal');
    });

    /* --- なめらかなスクロール --- */
    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1, anchors: { offset: -((head && head.offsetHeight) || 58) - 12 } });
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }

    /* --- FVの見出しを1文字ずつに分ける（<br>・<em> などはそのまま。言語を切り替えたら作り直す） --- */
    var h1 = fv && fv.querySelector('h1');
    var busy = false;
    function splitNode(node, counter) {
      Array.from(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          if (!n.textContent.trim()) return;
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (tok) {
            if (!tok) return;
            if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
            var w = document.createElement('span');
            w.className = 'tm-w';
            Array.from(tok).forEach(function (ch) {
              var s = document.createElement('span');
              s.className = 'tm-ch';
              s.style.setProperty('--i', counter.i++);
              s.textContent = ch;
              w.appendChild(s);
            });
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && !/^(BR|SVG)$/i.test(n.tagName) && !n.classList.contains('tm-w')) {
          splitNode(n, counter);
        }
      });
    }
    function split() {
      if (!h1 || busy || h1.querySelector('.tm-ch')) { if (h1) h1.classList.add('tm-split'); return; }
      busy = true;
      h1.setAttribute('aria-label', h1.textContent.replace(/\s+/g, ' ').trim());
      splitNode(h1, { i: 0 });
      h1.classList.add('tm-split');
      busy = false;
    }
    split();
    if (h1 && window.MutationObserver) new MutationObserver(function () { if (!busy) split(); }).observe(h1, { childList: true, subtree: true });

    /* --- 動かす部品に印を付ける --- */
    var OUT = '.head *, .foot *, .page-fv *, .tm-spbar';
    function mark(sel, kind, stagger) {
      var groups = new Map();
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.matches(OUT) || el.closest('[data-tm]')) return;
        el.setAttribute('data-tm', kind);
        if (stagger) {
          var p = el.parentElement;
          var n = groups.get(p) || 0;
          el.style.setProperty('--d', Math.min(n, 5));
          groups.set(p, n + 1);
        }
      });
    }
    // 写真（カードより先に。カードの中の写真は、カードと一緒に現れる）
    mark('.pk-photo, .policy-photo, .home-photo, .life-family-photo, .life-day-photos figure, .philo-photo, .recruit-hero-photo, .graduate-photo', 'photo');
    // カード
    mark(['.pk-card', '.pk-access-card', '.ag-fee-box', '.ag-temp-box', '.bj-info', '.bj-three article', '.bj-steps li', '.bj-summary li',
          '.pz-step', '.pz-three article', '.pz-goal-grid article', '.nw-card', '.nw-list li', '.pk-flow .as-flow-row', '.pk-table-wrap',
          '.life-promise', '.life-activity', '.life-season', '.life-family-points > div',
          '.policy-principle', '.policy-related-grid a', '.policy-process-step', '.policy-diversity li',
          '.faq-categories a', '.faq-group', '.ag-faq-item', '.home-quick-card', '.recruit-entry', '.recruit-work-card', '.graduate-growth-grid li',
          '.graduate-places article', '.career-consult', '.home-section article', '.home-section li.warm-scroll-pending'].join(','), 'card', true);
    // 見出し
    mark('h2', 'rise');
    // アイコン
    document.querySelectorAll('.ds-ic, svg.ds-svg').forEach(function (ic) {
      if (ic.matches(OUT) || ic.closest('[data-tm="draw"]')) return;
      ic.setAttribute('data-tm', 'draw');
      ic.querySelectorAll('svg *').forEach(function (p) {
        if (/^(path|circle|rect|line|polyline|polygon|ellipse)$/i.test(p.tagName)) p.setAttribute('pathLength', '1');
      });
      if (ic.tagName.toLowerCase() === 'svg') ic.querySelectorAll('*').forEach(function (p) { if (/^(path|circle|rect|line|polyline|polygon|ellipse)$/i.test(p.tagName)) p.setAttribute('pathLength', '1'); });
    });
    // 最後の見学のおさそい
    if (visit && getComputedStyle(visit).backgroundImage !== 'none' || visit && getComputedStyle(visit).backgroundColor !== 'rgba(0, 0, 0, 0)') visit.setAttribute('data-tm', 'visit');

    /* --- 画面に入ったら .is-in（1回だけ）。見出しは切り取って見えないため、親を見張る --- */
    var watch = new Map();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        (watch.get(e.target) || []).forEach(function (el) {
          el.classList.add('is-in');
          setTimeout(function () { el.classList.add('tm-done'); }, 2600);
        });
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
    document.querySelectorAll('[data-tm]').forEach(function (el) {
      var kind = el.getAttribute('data-tm');
      if (kind === 'visit') return;
      var t = (kind === 'rise' || kind === 'photo') ? el.parentElement : el;
      if (!watch.has(t)) { watch.set(t, []); io.observe(t); }
      watch.get(t).push(el);
    });
  }

  /* --- スクロールに合わせて動くもの --- */
  var ticking = false;
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function update() {
    ticking = false;
    var vh = window.innerHeight;
    if (motion && visit && visit.getAttribute('data-tm') === 'visit') {
      var v = visit.getBoundingClientRect();
      visit.style.setProperty('--vp', clamp((vh - v.top) / (vh * 0.65)).toFixed(3));
    }
    if (spbar) {
      var fvBottom = fv ? fv.getBoundingClientRect().bottom : 300 - window.scrollY;
      var hideAt = Math.min(visit ? visit.getBoundingClientRect().top : Infinity, foot ? foot.getBoundingClientRect().top : Infinity);
      spbar.classList.toggle('is-shown', fvBottom < 0 && hideAt > vh * 0.85);
    }
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  if (lenis) lenis.on('scroll', onScroll);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', onScroll);
  update();
})();

// FVを画面いっぱいにするため、ヘッダーとスマホの文字の高さを測ってCSSへ渡す（幅・言語で変わるため。2026-10-13 TOPと同じ）
(function () {
  var root = document.documentElement, head = document.querySelector('.head'), copy = document.querySelector('.page-fv .page-fv-copy');
  if (!copy) return;
  function set() {
    if (head) { root.style.setProperty('--head-h', head.offsetHeight + 'px'); }
    root.style.setProperty('--pfv-copy-h', copy.offsetHeight + 'px');
  }
  set();
  window.addEventListener('resize', set);
  window.addEventListener('load', set);
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(set); }
  // 言語を切り替えると文字の高さが変わる
  document.addEventListener('click', function (e) { if (e.target.closest('.lang-menu')) { setTimeout(set, 60); } });
})();
