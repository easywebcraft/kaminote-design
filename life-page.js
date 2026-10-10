/* 園での生活：年齢タブと、画面に入る際のやさしい動き */
(function () {
 var tabs = Array.from(document.querySelectorAll('.life-age-tabs [role="tab"]'));
 var panels = tabs.map(function (tab) { return document.getElementById(tab.getAttribute('aria-controls')); });
 function select(index, focus) {
  tabs.forEach(function (tab,i) {
   tab.setAttribute('aria-selected',String(i===index)); tab.tabIndex = i===index ? 0 : -1;
   panels[i].hidden = i!==index;
  });
  if (focus) tabs[index].focus();
 }
 tabs.forEach(function (tab,i) {
  tab.addEventListener('click',function () { select(i,false); });
  tab.addEventListener('keydown',function (event) {
   var next;
   if (event.key==='ArrowRight') next=(i+1)%tabs.length;
   if (event.key==='ArrowLeft') next=(i+tabs.length-1)%tabs.length;
   if (event.key==='Home') next=0;
   if (event.key==='End') next=tabs.length-1;
   if (next!==undefined) { event.preventDefault(); select(next,true); }
  });
 });
 if (tabs.length) select(0,false);
 var motion=matchMedia('(prefers-reduced-motion: reduce)');
 if (motion.matches || !window.IntersectionObserver || !Element.prototype.animate) return;
 var units=Array.from(document.querySelectorAll('[data-life-reveal],.life-day-panel > .life-timeline > li,.life-family-points > div,.life-more,.life-events-details,.life-visit-button,.life-visit-links'));
 var shown=new WeakSet(), running=new Map(), observer, outside;
 function reveal(el,delay) {
  if (shown.has(el)) return;
  shown.add(el); el.classList.remove('life-reveal-pending');
  if(motion.matches)return;
  if (running.has(el)) running.get(el).cancel();
  var photo=el.matches('.life-day-photos figure,.life-family-photo');
  var timeline=el.matches('.life-timeline > li');
  var card=el.matches('.life-promise,.life-activity,.life-season,.life-family-points > div');
  var from=photo?'translateX(26px) scale(.965)':timeline?'translateX(-24px)':card?'translateY(28px) scale(.98)':'translateY(22px)';
  var animation=el.animate([{opacity:0,transform:from},{opacity:1,transform:'translateY(0) scale(1)'}],
   {duration:photo?1200:card?920:850,delay:delay||0,easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'});
  running.set(el,animation);
  animation.onfinish=function () { if(running.get(el)===animation)running.delete(el);animation.cancel(); };
 }
 function finishAll() {
  if(observer)observer.disconnect();if(outside)outside.disconnect();
  units.forEach(function(el){el.classList.remove('life-reveal-pending');});
  running.forEach(function(animation){animation.cancel();});running.clear();
 }
 try {
  observer=new IntersectionObserver(function(entries){
   entries.filter(function(e){return e.isIntersecting;}).sort(function(a,b){return a.boundingClientRect.top-b.boundingClientRect.top||a.boundingClientRect.left-b.boundingClientRect.left;})
    .forEach(function(e,i){reveal(e.target,Math.min(i,3)*110);});
  },{rootMargin:'0px 0px -6% 0px',threshold:.03});
  outside=new IntersectionObserver(function(entries){entries.forEach(function(e){var r=e.boundingClientRect;if(!e.isIntersecting&&(r.bottom<=0||r.top>=innerHeight))shown.delete(e.target);});},{threshold:0});
  units.forEach(function(el){el.classList.add('life-reveal-pending');observer.observe(el);outside.observe(el);});
 } catch(error){finishAll();}
 document.addEventListener('focusin',function(event){var el=event.target.closest('.life-reveal-pending');if(el)reveal(el,0);});
 motion.addEventListener('change',function(event){if(event.matches)finishAll();});
})();
