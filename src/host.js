(() => {
  const frame=document.getElementById('codex-visualization');
  const valid=hash=>typeof hash==='string'&&hash.length<2400&&/^#\/(?:$|explore(?:\?[^\r\n<>]*)?|history|upload|paper\/[a-zA-Z0-9.%_-]+(?:\/(?:overview|source|analysis|video|plan|process|results))?(?:\?[^\r\n<>]*)?)$/.test(hash);
  const landing=document.createElement('iframe');landing.id='paper-landing';landing.title='Paper Repro 首页';landing.setAttribute('sandbox','allow-scripts');landing.src='landing/index.html';landing.style.cssText='position:fixed;inset:0;width:100%;height:100dvh;max-width:none;margin:0;border:0;background:#111118';document.body.append(landing);
  const syncSurface=()=>{const home=!location.hash||['#/', '#/landing'].includes(location.hash);landing.hidden=!home;frame.hidden=home;landing.style.display=home?'block':'none';frame.style.display=home?'none':'block';landing.contentWindow?.postMessage({type:'landing-visibility',visible:home},'*');};
  addEventListener('message',event=>{if(event.source!==landing.contentWindow||event.data?.type!=='landing-navigate'||!valid(event.data.hash))return;location.hash=event.data.hash;syncSurface();});
  syncSurface();addEventListener('hashchange',syncSurface);
  const send=()=>frame.contentWindow?.postMessage({type:'paper-ui-location',hash:valid(location.hash)?location.hash:'#/',baseURL:location.origin+location.pathname},'*');
  addEventListener('message',event=>{
    if(event.source!==frame.contentWindow||!event.data||typeof event.data!=='object')return;
    if(event.data.type==='paper-ui-ready')send();
    if(event.data.type==='paper-ui-download'&&navigator.userActivation?.isActive===true&&typeof event.data.name==='string'&&/^[a-zA-Z0-9._-]{1,120}\.(?:md|json|txt)$/.test(event.data.name)&&typeof event.data.text==='string'&&event.data.text.length<=6000000){
      const url=URL.createObjectURL(new Blob([event.data.text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=event.data.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    if(event.data.type==='paper-ui-copy'&&Number.isSafeInteger(event.data.id)&&typeof event.data.text==='string'&&event.data.text.length<=32000){
      const id=event.data.id;
      const reply=ok=>frame.contentWindow?.postMessage({type:'paper-ui-copy-result',id,ok},'*');
      if(navigator.userActivation?.isActive!==true||!navigator.clipboard){reply(false);return;}
      navigator.clipboard.writeText(event.data.text).then(()=>reply(true),()=>reply(false));
    }
    if(event.data.type==='paper-ui-navigate'&&valid(event.data.hash)){
      if(event.data.replace===true){history.replaceState(null,'',event.data.hash);send();}
      else if(location.hash===event.data.hash)send();
      else location.hash=event.data.hash;
    }
  });
  addEventListener('hashchange',send);
})();
