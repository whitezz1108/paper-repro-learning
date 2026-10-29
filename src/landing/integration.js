
// Keep product navigation inside the unified site, including generated dialog links.
document.addEventListener('click',event=>{
 const a=event.target.closest('a[href]'); if(!a)return;
 const href=a.getAttribute('href'); let hash;
 if(href.includes('paperrepro-aiid.atoms.world/repro/index.html')){
  hash=href.endsWith('#runs')?'#/history':href.endsWith('#start')?'#/upload':'#/explore';
 }else if(href.includes('paperexplainer-aiid.pub.atoms.world'))hash='#/explore';
 else if(href.startsWith('product:'))hash=href.slice(8);
 if(hash){event.preventDefault();event.stopImmediatePropagation();parent.postMessage({type:'landing-navigate',hash},'*');}
},true);

addEventListener('message',e=>{if(e.source!==parent||e.data?.type!=='landing-visibility')return;document.querySelectorAll('video').forEach(v=>{if(!e.data.visible)v.pause();else if(v.closest('section')?.classList.contains('is-active'))v.play().catch(()=>{});});});
