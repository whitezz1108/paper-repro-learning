'use strict';
(() => {
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const films=[...document.querySelectorAll('.panel-film video')];
 const paused=new Set();
 let active=location.hash.slice(1)||'top';
 function sync(){films.forEach(v=>{const btn=document.querySelector(`[data-film="${v.id}"]`);const should=v.closest('section').id===active&&!document.hidden&&!paused.has(v.id)&&!reduce.matches;v.muted=true;v.defaultMuted=true;if(should){if(!v.src)v.src=v.dataset.src;v.play().catch(()=>{});}else v.pause();const en=document.documentElement.lang.startsWith('en');btn.textContent=should?'Ⅱ':'▶';btn.setAttribute('aria-label',should?(en?'Pause background video':'暂停背景视频'):(en?'Play background video':'播放背景视频'));});}
 document.querySelectorAll('[data-film]').forEach(b=>b.addEventListener('click',()=>{paused.has(b.dataset.film)?paused.delete(b.dataset.film):paused.add(b.dataset.film);sync();}));
 document.addEventListener('paperrepro:pagechange',e=>{active=e.detail.id;sync();});document.addEventListener('visibilitychange',sync);reduce.addEventListener('change',sync);new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});sync();
 const tabs=[...document.querySelectorAll('[data-learn]')];
 function select(b){tabs.forEach(t=>{const on=t===b;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;document.getElementById('learn-'+t.dataset.learn).hidden=!on;});}
 tabs.forEach((b,i)=>{b.addEventListener('click',()=>select(b));b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();const n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;select(tabs[n]);tabs[n].focus();}});});
})();
