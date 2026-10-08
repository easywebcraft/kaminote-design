(function(){
  var tabs=Array.from(document.querySelectorAll('.career-tabs [role=tab]'));
  if(!tabs.length)return;
  var panels=tabs.map(function(t){return document.getElementById(t.getAttribute('aria-controls'));});
  function select(index,focus){tabs.forEach(function(t,i){t.setAttribute('aria-selected',i===index?'true':'false');t.tabIndex=i===index?0:-1;panels[i].hidden=i!==index;panels[i].setAttribute('role','tabpanel');panels[i].tabIndex=0;});if(focus)tabs[index].focus();}
  tabs.forEach(function(t,i){t.addEventListener('click',function(){select(i,false);});t.addEventListener('keydown',function(e){var n=i;if(e.key==='ArrowRight')n=(i+1)%tabs.length;else if(e.key==='ArrowLeft')n=(i+tabs.length-1)%tabs.length;else if(e.key==='Home')n=0;else if(e.key==='End')n=tabs.length-1;else return;e.preventDefault();select(n,true);});});
  select(0,false);
})();
