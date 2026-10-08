(function () {
  var root = document.documentElement, intro = document.getElementById('nurseryIntro');
  if (!intro || !root.classList.contains('nursery-intro-active')) return;
  var ended = false, timers = [];
  function finish() {
    if (ended) return;
    ended = true;
    timers.forEach(clearTimeout);
    clearTimeout(window.nurseryIntroSafety);
    root.classList.remove('nursery-intro-active');
    intro.remove();
    window.dispatchEvent(new Event('nursery-intro-end'));
    document.removeEventListener('keydown', skip);
  }
  function skip(e) { if (e.key === 'Escape') finish(); }
  document.addEventListener('keydown', skip);
  function later(fn, delay) { timers.push(setTimeout(function () { if (!ended) fn(); }, delay)); }
  function start() {
    var original = document.querySelector('.hero-copy h1');
    var title = original.cloneNode(true);
    title.querySelectorAll('svg').forEach(function (svg) { svg.remove(); });
    title.querySelectorAll('[data-i18n]').forEach(function (el) { el.removeAttribute('data-i18n'); });
    title.classList.add('nursery-intro-title');
    var style = getComputedStyle(original);
    ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing'].forEach(function (name) { title.style[name] = style[name]; });
    // 一文字ごとの幅の丸めで、最後の句読点が折り返さないよう1pxだけ余裕を持たせる。
    title.style.width = (original.getBoundingClientRect().width + 1) + 'px';
    var texts = [], walker = document.createTreeWalker(title, NodeFilter.SHOW_TEXT), node;
    while ((node = walker.nextNode())) texts.push(node);
    var letters = [];
    texts.forEach(function (text) {
      var clean = text.textContent.replace(/\s+/g, ' ').trim();
      var fragment = document.createDocumentFragment();
      Array.from(clean).forEach(function (char) {
        var span = document.createElement('span');
        span.className = 'intro-char'; span.textContent = char === ' ' ? '\u00a0' : char;
        fragment.appendChild(span); letters.push(span);
      });
      text.replaceWith(fragment);
    });
    var step = Math.min(55, 1500 / Math.max(1, letters.length));
    letters.forEach(function (letter, i) { letter.style.setProperty('--letter-delay', i * step + 'ms'); });
    intro.querySelector('.nursery-intro-inner').prepend(title);
    requestAnimationFrame(function () { title.classList.add('is-revealing'); });
    var revealEnd = Math.max(0, letters.length - 1) * step + 750;
    later(function () { intro.classList.add('is-logo'); }, revealEnd + 150);
    later(function () {
      var from = title.getBoundingClientRect(), to = original.getBoundingClientRect();
      title.animate([{transform:'translate(0,0)'},{transform:'translate(' + (to.left-from.left) + 'px,' + (to.top-from.top) + 'px)'}],
        {duration:1100,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'});
      intro.querySelector('.nursery-intro-logo').animate([{opacity:1},{opacity:0,transform:'translateY(-8px)'}],{duration:450,fill:'forwards'});
      intro.querySelector('.nursery-intro-curtain').animate([{opacity:1},{opacity:0}],{duration:1100,easing:'ease-in-out',fill:'forwards'});
      later(finish, 1100);
    }, revealEnd + 1400);
  }
  function boot() {
    var fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.race([fonts, new Promise(function (resolve) { setTimeout(resolve, 700); })]).then(function () { if (!ended) start(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true});
  else boot();
})();
