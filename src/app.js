(() => {
  'use strict';
  const root = document.getElementById('paper-soft-light');
  const $ = id => root.querySelector('#' + id);
  const data = JSON.parse(document.getElementById('paper-data').textContent);
  const papers = data.papers;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const decode = value => { try { return decodeURIComponent(value); } catch { return ''; } };
  const byKey = new Map(papers.map(p => [p.key,p]));
  const saved = window.openai?.widgetState?.privateContent || {};
  const validIds = list => Array.isArray(list) ? [...new Set(list)].filter(id => Number.isInteger(id) && papers[id]) : [];
  const state = {page:'landing',tab:'overview',paper:0,filter:'all',search:'',sort:'curated',category:'',author:'',group:'',difficulty:'',limit:18,
    liked:validIds(saved.liked),recent:validIds(saved.recent),drafts:saved.drafts && typeof saved.drafts==='object' ? saved.drafts : {},
    listHash:typeof saved.listHash==='string' ? saved.listHash : '#/explore',listScroll:0,contextIds:[],dock:null,advanced:false};
  let currentHash='',baseURL='',lastFocus,modal=false,modalOverflow='',modalScrollTop=0,dockPinned=false,dockTimer,closeTimer,searchTimer,toastTimer,saveTimer;
  let nextCopyId=0;
  const pendingCopies=new Map();
  function copyText(text){return new Promise((resolve,reject)=>{const id=++nextCopyId;const timer=setTimeout(()=>{pendingCopies.delete(id);reject(new Error('Clipboard unavailable'));},1500);pendingCopies.set(id,{resolve,reject,timer});parent.postMessage({type:'paper-ui-copy',id,text},'*');});}
  const restoredList=new URLSearchParams(state.listHash.split('?')[1]||'');
  for(const key of ['filter','search','sort','category','author','group','difficulty'])if(restoredList.has(key))state[key]=restoredList.get(key);
  if(!['all','recorded','unrecorded','liked','recent'].includes(state.filter))state.filter='all';
  const tabs = ['overview','analysis','plan','process','results'];
  const verdict = v => ({reproduced:'已复现',partially_reproduced:'部分复现',not_reproduced:'未复现'}[v] || v);
  const routeLabel = r => ({paper_only:'仅论文',partial_release:'部分发布材料',full_release:'完整发布材料'}[r] || r);
  const authors = p => p.authors.length > 2 ? p.authors.slice(0,2).join(' · ')+' 等' : p.authors.join(' · ');
  const dateOf = r => /^\d{8}-/.test(r.id) ? r.id.slice(0,4)+'-'+r.id.slice(4,6)+'-'+r.id.slice(6,8) : '';
  const latest = p => p.runs.map(dateOf).sort().at(-1) || '';
  const mins = n => Math.floor(n/60)+' 分 '+Math.round(n%60)+' 秒';
  function save(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>window.openai?.setWidgetState?.({modelContent:{view:state.page,paper:papers[state.paper].title},privateContent:{liked:state.liked,recent:state.recent,drafts:state.drafts,listHash:state.listHash}}).catch(()=>{}),120);}
  function toast(message){let el=$('cp-toast');if(!el){el=document.createElement('div');el.id='cp-toast';el.className='cp-toast';el.setAttribute('role','status');root.append(el);}el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,3500);}
  function art(p,small=false){
    if(small)return '<span class="cp-mini" data-art="'+p.art+'"><span>'+esc(p.key==='isolation-forest'?'IF':p.title.split(/\s+/).slice(0,2).map(w=>w[0]).join(''))+'</span></span>';
    const title=esc(p.cover || (p.title.includes(':') ? p.title.split(':')[0] : p.title)).replace(/\n/g,'<br>');
    const shape=p.art%3===0?'<div class="cp-cover-dots" aria-hidden="true">'+Array.from({length:16},(_,i)=>'<b style="--i:'+i+'"></b>').join('')+'</div>':p.art%3===1?'<div class="cp-cover-lines" aria-hidden="true">'+Array.from({length:6},()=>'<b></b>').join('')+'</div>':'<div class="cp-cover-waves" aria-hidden="true"><b></b><b></b><b></b></div>';
    return '<div class="cp-art" data-art="'+p.art+'" role="img" aria-label="'+esc(p.title)+' 编辑封面"><span class="cp-art-id">'+esc(p.topic)+' / '+esc(p.published.slice(0,4))+'</span><strong class="cp-cover-title">'+title+'</strong>'+shape+'<span class="cp-art-bottom">THE IDEAS COLLECTION <span>↗</span></span></div>';
  }
  function resourceHint(p){const c=p.computeInfo?.compute;if(!c)return '';return '<p class="cp-resource-hint">'+(c.needs_gpu===true?'需要 GPU':c.needs_gpu===false?'CPU 可尝试':'算力待核对')+(c.ref_minutes!=null?' · 参考 '+Math.round(c.ref_minutes)+' 分钟':'')+'</p>';}
  function card(p){const liked=state.liked.includes(p.id);return '<article class="cp-card"><button class="cp-card-open" data-open="'+p.id+'" aria-label="打开 '+esc(p.title)+'">'+art(p)+'<div class="cp-card-copy"><h3>'+esc(p.title)+'</h3><p>'+esc(authors(p))+' · '+esc(p.published.slice(0,4))+'</p><div class="cp-tags"><span class="cp-chip">'+esc(p.topic)+'</span><span class="cp-chip '+(p.runs.length?'available':'')+'">'+(p.runs.length?p.runs.length+' 条历史实验':'论文信息')+'</span></div>'+resourceHint(p)+'</div></button><button class="cp-heart" data-like="'+p.id+'" aria-label="'+(liked?'取消喜欢 ':'喜欢 ')+esc(p.title)+'" aria-pressed="'+liked+'">'+(liked?'♥':'♡')+'</button></article>';}
  function filtered(){
    const words=state.search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list=papers.filter(p=>(state.filter==='all'||(state.filter==='recorded'?p.runs.length:state.filter==='unrecorded'?!p.runs.length:(state.filter==='liked'?state.liked:state.recent).includes(p.id)))
      &&(!state.category||p.category===state.category)&&(!state.author||p.authors.includes(state.author))&&(!state.group||p.group===state.group)
      &&(!state.difficulty||(state.difficulty==='unknown'?p.difficulty==null:String(p.difficulty)===state.difficulty))
      &&words.every(w=>(p.title+' '+p.key+' '+p.topic+' '+p.authors.join(' ')+' '+(p.summary||'')).toLowerCase().includes(w)));
    if(state.filter==='recent')list.sort((a,b)=>state.recent.indexOf(a.id)-state.recent.indexOf(b.id));
    else if(state.sort==='title')list.sort((a,b)=>a.title.localeCompare(b.title));
    else list.sort((a,b)=>(state.sort==='curated'?(Number(!!b.runs.length)-Number(!!a.runs.length))||latest(b).localeCompare(latest(a)):0)||b.published.localeCompare(a.published)||a.title.localeCompare(b.title));
    return list;
  }
  function batchName(p){if(state.filter==='recent')return '继续上次的阅读';if(state.filter==='liked')return '收藏的想法';if(state.sort==='title')return '论文 A–Z';if(state.sort==='curated'&&p.runs.length)return latest(p)?'历史实验 · '+latest(p).slice(0,7).replace('-',' / '):'历史实验 · 早期演示记录';return '发表于 '+p.published.slice(0,4);}
  function counts(){['all','recorded','unrecorded','liked','recent'].forEach(k=>$('cp-count-'+k).textContent=k==='all'?papers.length:k==='recorded'?papers.filter(p=>p.runs.length).length:k==='unrecorded'?papers.filter(p=>!p.runs.length).length:state[k].length);}
  function renderCards(){
    counts();$('cp-home-cards').innerHTML=papers.slice(0,3).map(card).join('');
    const list=filtered(), shown=list.slice(0,state.limit),groups=[];
    shown.forEach(p=>{const title=batchName(p);if(groups.at(-1)?.title!==title)groups.push({title,items:[]});groups.at(-1).items.push(p);});
    $('cp-gallery-cards').innerHTML=groups.map(g=>'<section class="cp-paper-batch"><div class="cp-batch-heading"><h2>'+esc(g.title)+'</h2><span>'+g.items.length+' 篇</span></div><div class="cp-cards">'+g.items.map(card).join('')+'</div></section>').join('');
    $('cp-list-count').textContent=list.length+' 篇论文'+(state.search?' · 搜索“'+state.search+'”':'');
    $('cp-load-status').textContent=list.length?'已展示 '+shown.length+' / '+list.length+' 篇':'';
    $('cp-load-more').hidden=shown.length>=list.length;
    $('cp-gallery-empty').hidden=list.length>0;
    const active=[state.category,state.author,state.group,state.difficulty].filter(Boolean).length;
    $('cp-filter-count').textContent=active||'';
    $('cp-clear-filters').hidden=!active&&!state.search;
    $('cp-empty-title').textContent=state.filter==='liked'&&!state.liked.length?'把好奇的论文，留在手边。':state.filter==='recent'&&!state.recent.length?'你的阅读，从这里开始。':'没有找到匹配的论文';
    $('cp-empty-copy').textContent=state.filter==='liked'&&!state.liked.length?'点击论文右上角的红心，就能在这里和左侧「喜欢」找到它。':state.filter==='recent'&&!state.recent.length?'打开一篇论文后，这里会记住你最近的浏览。':'试着缩短关键词，或清除领域、作者等筛选。';
    $('cp-empty-action').textContent=active||state.search?'重置筛选':'探索全部论文 →';
    root.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===state.filter)));
    $('cp-thumbs').innerHTML=state.recent.slice(0,3).map(id=>'<button data-thumb="'+id+'" aria-label="最近看过 '+esc(papers[id].title)+'">'+art(papers[id],true)+'</button>').join('');
  }
  function renderLikes(){root.querySelectorAll('[data-like]').forEach(b=>{const liked=state.liked.includes(Number(b.dataset.like));b.textContent=liked?'♥':'♡';b.setAttribute('aria-pressed',String(liked));b.setAttribute('aria-label',(liked?'取消喜欢 ':'喜欢 ')+papers[Number(b.dataset.like)].title);});const liked=state.liked.includes(state.paper);$('cp-paper-like').textContent=liked?'♥ 已喜欢':'♡ 喜欢';$('cp-paper-like').setAttribute('aria-pressed',String(liked));counts();}
  function like(id){state.liked=state.liked.includes(id)?state.liked.filter(n=>n!==id):[id,...state.liked];if(state.page==='explore'&&state.filter==='liked')renderCards();renderLikes();if(state.dock!==null)drawDock();save();}
  function listHash(){const q=new URLSearchParams();for(const k of ['filter','search','sort','category','author','group','difficulty']){const v=state[k];if(v&&v!==({filter:'all',sort:'curated'}[k]||''))q.set(k,v);}return '#/explore'+(q.size?'?'+q:'');}
  function navigate(hash,replace=false){parent.postMessage({type:'paper-ui-navigate',hash,replace},'*');}
  function applyListControls(){for(const [k,id] of [['search','cp-search-input'],['sort','cp-sort'],['category','cp-category'],['author','cp-author'],['group','cp-group'],['difficulty','cp-difficulty']])$(id).value=state[k];$('cp-advanced').hidden=!state.advanced;$('cp-toggle-filters').setAttribute('aria-expanded',String(state.advanced));}
  function captureList(){if(state.page==='explore'){state.listHash=currentHash;state.listScroll=root.scrollTop;state.contextIds=filtered().map(p=>p.id);}}
  function openPaper(id){if(!papers[id])return;captureList();navigate('#/paper/'+encodeURIComponent(papers[id].key));}
  function setTab(tab){const selected=getSelected(papers[state.paper]);if(selected&&['process','results'].includes(tab)){navigate(runURL(selected,tab),true);return;}if(tabs.includes(tab))navigate('#/paper/'+encodeURIComponent(papers[state.paper].key)+(tab==='overview'?'':'/'+tab),true);}
  function showPage(hash){
    if(modal)closeModal();closeDock();const previous=state.page,previousPaper=state.paper,previousTab=state.tab,priorScroll=root.scrollTop;currentHash=hash;
    const [path,qs='']=hash.replace(/^#\/?/,'').split('?'),parts=path.split('/');
    const page=parts[0]||'landing';
    // Retired information and video routes resolve to the overview.
    if(page==='paper'&&byKey.has(decode(parts[1]||''))&&['video','source'].includes(parts[2])){navigate('#/paper/'+encodeURIComponent(decode(parts[1])),true);return;}
    if(page==='paper'&&byKey.has(decode(parts[1]||''))){state.page='paper';state.paper=byKey.get(decode(parts[1])).id;state.tab=tabs.includes(parts[2])?parts[2]:'overview';if(previous!=='paper'||previousPaper!==state.paper)state.recent=[state.paper,...state.recent.filter(n=>n!==state.paper)].slice(0,16);renderPaper();}
    else if(page==='explore'||page==='library'){
      state.page='explore';const q=new URLSearchParams(qs);
      for(const k of ['filter','search','sort','category','author','group','difficulty'])state[k]=q.get(k)||({filter:'all',sort:'curated'}[k]||'');
      if(!['all','recorded','unrecorded','liked','recent'].includes(state.filter))state.filter='all';
      if(!['curated','newest','title'].includes(state.sort))state.sort='curated';
      state.advanced=!!(state.category||state.author||state.group||state.difficulty)||state.advanced;
      const returning=previous==='paper'&&hash===state.listHash;
      if(!returning&&previous!=='explore')state.limit=18;
      $('cp-gallery-title').textContent=state.filter==='liked'?'喜欢的，留在手边。':state.filter==='recent'?'好奇心，接着往下。':state.filter==='recorded'?'从已有的实验，出发。':'下一篇，值得深入。';
      $('cp-gallery-sub').textContent=state.filter==='recorded'?'看已有记录与原文，再决定自己要验证什么。':state.filter==='liked'?'你的私人论文书架，保存在当前浏览器。':'沿着好奇心浏览，从一篇论文开始。';
      applyListControls();renderCards();state.listHash=hash;
      requestAnimationFrame(()=>{if(returning){const card=root.querySelector('#cp-gallery-cards [data-open="'+state.paper+'"]');card?.focus({preventScroll:true});root.scrollTop=state.listScroll;}else if(previous!=='explore')root.scrollTop=0;});
    }else if(page==='history'){state.page='history';renderHistory();}else state.page=page==='upload'?'upload':'landing';
    root.querySelectorAll('[data-page]').forEach(el=>el.hidden=el.dataset.page!==state.page);
    root.querySelectorAll('.cp-top [data-route]').forEach(b=>{const active=b.dataset.route===state.page||(b.dataset.route==='library'&&state.filter==='liked'&&state.page==='explore');if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    if(state.page!=='explore'){root.scrollTop=0;renderCards();if(state.page==='paper'&&(previous!=='paper'||previousPaper!==state.paper)){$('cp-paper-title').tabIndex=-1;$('cp-paper-title').focus({preventScroll:true});}}
    renderLikes();save();
    if(state.page==='paper'){if(previous==='paper'&&previousPaper===state.paper&&previousTab===state.tab)root.scrollTop=priorScroll;showRunFromRoute(new URLSearchParams(qs));if(state.tab==='overview'&&new URLSearchParams(qs).get('section')==='info')requestAnimationFrame(()=>{$('cp-paper-information').scrollIntoView({block:'start'});$('cp-paper-information').focus({preventScroll:true});});}
  }
  function renderPaper(){
    const p=papers[state.paper],hasRuns=!!p.runs.length;
    $('cp-paper-title').textContent=p.title;
    $('cp-paper-subtitle').textContent=p.authors.join(', ');
    $('cp-title-video').setAttribute('aria-label','打开 '+p.title+' 的视频播放器'+(p.video?.src?'':'（待生成）'));
    root.querySelector('.cp-title-video-status').textContent=p.video?.src?'可播放':'待生成';
    $('cp-title-video-topic').textContent=p.topic;
    $('cp-title-video-poster').dataset.art=String(p.art);
    $('cp-paper-meta').innerHTML='<span>'+esc(p.published)+'</span><span>'+esc(p.topic)+'</span><span>'+(hasRuns?p.runs.length+' 条历史实验':'已收录论文信息')+'</span>';
    $('cp-summary-note').textContent=p.summary?'以下摘要保留收录原文；论文报告的结论与本站实验记录分开展示。':'这篇论文已收录原文与来源信息，摘要和图文解读尚未收录。';
    $('cp-experiment-note').textContent=hasRuns?'已收录 '+p.runs.length+' 条历史实验。可查看当时的计划、过程与结果。':'想进一步验证一个问题？可以从自己的实验计划开始。';
    $('cp-source-abstract').textContent=p.summary||'先阅读原文，了解作者提出的问题与方法。你也可以把这篇论文带到自己的 AI，围绕不理解的地方继续追问。';
    $('cp-source-metadata').innerHTML=[['作者',p.authors.join(', ')],['发表时间',p.published],['研究领域',p.category],['论文标识',p.key],['收录来源',p.source],['目录难度',p.difficulty?p.difficulty+' / 5（原目录估计）':'未估计']].map(([a,b])=>'<dt>'+a+'</dt><dd>'+esc(b)+'</dd>').join('');
    $('cp-runs-count').textContent=p.runs.length;
    $('cp-results-list').innerHTML=hasRuns?p.runs.map((r,i)=>'<article class="cp-result-record"><div class="cp-record-top"><h3>记录 '+String(i+1).padStart(2,'0')+' · '+(dateOf(r)||'原演示记录')+'</h3><span class="cp-chip available">'+esc(verdict(r.verdict))+'</span><span class="cp-chip">历史记录</span></div><div class="cp-record-meta"><span>耗时 '+mins(r.seconds)+'</span><span>记录费用 ¥'+Number(r.cost_cny).toFixed(4)+'</span><span>材料路径：'+esc(routeLabel(r.route))+'</span></div><details><summary>查看记录来源</summary><p>运行 ID：'+esc(r.id)+'</p><p>原记录文件：'+esc(r.file)+'</p><p>来源：Repro / demo-runs / index.json。此处未载入完整事件轨迹，记录判定不等于重新核验。</p></details></article>').join(''):'<div class="cp-library-empty"><h2>还没有可以查看的实验记录。</h2><p>先确定要验证的问题和条件，准备一份自己的实验计划。</p><button class="cp-crystal" data-tab="plan">规划第一个实验 →</button></div>';
    renderProcess();
    $('cp-plan-paper').textContent=p.title;
    const d=state.drafts[p.key]||{};$('cp-target').value=d.target||'';$('cp-goal').value=d.goal||'理解核心机制';$('cp-scope').value=d.scope||'小规模验证';$('cp-plan-data').value=d.dataset||'';$('cp-plan-repo').value=d.repo||'';$('cp-plan-budget').value=d.budget||'60';updatePlan(false);
    const same=papers.filter(x=>x.id!==p.id&&x.category===p.category).sort((a,b)=>Number(!!b.runs.length)-Number(!!a.runs.length)||b.published.localeCompare(a.published)).slice(0,3);
    $('cp-related-cards').innerHTML=same.map(card).join('');
    root.querySelectorAll('[data-content]').forEach(el=>el.hidden=el.dataset.content!==state.tab);
    root.querySelectorAll('.cp-tabs button').forEach(b=>b.setAttribute('aria-pressed',String((b.hasAttribute('data-experiment')?['plan','process','results'].includes(state.tab):b.dataset.tab===state.tab))));
    $('cp-experiment-nav').hidden=!['plan','process','results'].includes(state.tab);
    $('cp-experiment-context').textContent=state.tab==='plan'?'准备新实验 · 当前浏览器中的计划草稿':'查看已有实验 · 历史记录不会被新计划覆盖';
    if(!state.contextIds.length)state.contextIds=filtered().map(p=>p.id);
    const idx=state.contextIds.indexOf(p.id);
    $('cp-browse-position').textContent=idx>=0?'当前集合 '+(idx+1)+' / '+state.contextIds.length:'独立论文链接';
    $('cp-prev-paper').disabled=idx<=0;
    $('cp-next-paper').disabled=idx<0||idx===state.contextIds.length-1;
    $('cp-end-next').disabled=$('cp-next-paper').disabled;
  }
  function movePaper(n){const i=state.contextIds.indexOf(state.paper);if(i>=0&&papers[state.contextIds[i+n]])openPaper(state.contextIds[i+n]);}
  function updatePlan(persist=true){$('cp-plan-goal').textContent=$('cp-goal').value;$('cp-plan-scope').textContent=$('cp-scope').value;if(persist){state.drafts[papers[state.paper].key]={target:$('cp-target').value.slice(0,500),goal:$('cp-goal').value,scope:$('cp-scope').value,dataset:$('cp-plan-data').value.slice(0,200),repo:$('cp-plan-repo').value.slice(0,300),budget:$('cp-plan-budget').value};const keys=Object.keys(state.drafts);if(keys.length>6)delete state.drafts[keys[0]];save();}}
  function prompt(){const p=papers[state.paper],lines=['论文：'+p.title,'论文原文：'+p.url,'我的问题：'+$('cp-question').value];if($('cp-context-analysis').checked)lines.push('收录作者：'+p.authors.join(', '),'目录摘要（未独立核验）：'+(p.summary||'目录尚未收录摘要，请先阅读原文。'));if($('cp-context-plan').checked)lines.push('实验目标：'+$('cp-goal').value,'实验范围：'+$('cp-scope').value,'想验证的问题：'+($('cp-target').value||'请先和我确认具体的表格、指标与比较条件。'));if($('cp-context-plan').checked)lines.push('数据集与版本：'+($('cp-plan-data').value||'开始前核对并固定'),'代码仓库：'+($('cp-plan-repo').value||'未指定，请确认作者发布情况'),'总时间上限：'+$('cp-plan-budget').value+' 分钟。先检查机器资源；不能完成时报告实际完成范围。','执行前固定目标、数据版本、评价指标、种子和验收容差。任何缩小规模或假设都需说明。','请保存计划、命令与输出、实际代码、指标和干净重跑日志，并分别报告执行状态与核验依据。此材料不包含自动回传接口，请将结果和文件交回用户。');lines.push('请区分论文原有结论、解释性推断和实际实验结果。没有提供全文或证据时请明确指出；不要声称执行未运行的实验。');$('cp-prompt').value=lines.join('\n\n');}
  function showModal(kind){if(modal)closeModal();closeDock();lastFocus=document.activeElement;modal=kind;modalScrollTop=root.scrollTop;modalOverflow=root.style.overflowY;root.style.overflowY='hidden';const overlay=$('cp-'+kind+'-overlay');overlay.hidden=false;root.querySelectorAll('.cp-top,.cp-rail-zone,.cp-main,.cp-footer,[data-page=history]').forEach(el=>el.inert=true);overlay.querySelector('[data-close-modal]').focus({preventScroll:true});}
  function handoff(){$('cp-context-plan').checked=state.tab==='plan';$('cp-handoff-title').textContent=state.tab==='plan'?'把实验计划交给自己的 AI':'带着论文继续追问';$('cp-handoff-status').textContent='复制材料后，在你自己的 AI 中继续。此操作不会启动实验。';prompt();showModal('handoff');}
  function openVideo(){const p=papers[state.paper],player=$('cp-video-player'),ready=typeof p.video?.src==='string'&&p.video.src.length>0;$('cp-player-paper').textContent=p.title;$('cp-player-empty').hidden=ready;player.hidden=!ready;$('cp-player-empty-title').textContent='这篇论文的视频，还在等待下一步。';$('cp-player-empty-copy').textContent='视频生成尚未接入。完成后，就在这里播放。';$('cp-player-empty').querySelector('.cp-chip').textContent='待生成';showModal('video');if(ready){player.src=p.video.src;player.play().catch(()=>{});}}
  function closeModal(){if(!modal)return;const kind=modal;if(kind==='run')stopRunView();modal=false;if(kind==='video'){const player=$('cp-video-player');player.pause();if(player.hasAttribute('src')){player.removeAttribute('src');player.load();}}$('cp-'+kind+'-overlay').hidden=true;root.style.overflowY=modalOverflow;root.querySelectorAll('.cp-top,.cp-rail-zone,.cp-main,.cp-footer,[data-page=history]').forEach(el=>el.inert=false);root.scrollTop=modalScrollTop;if(lastFocus?.isConnected)lastFocus.focus({preventScroll:true});}
  async function copy(text,field,success){try{await copyText(text);toast(success);}catch{field.value=text;field.hidden=false;field.focus();field.select();toast('文本已选中，可按 Ctrl+C 复制。');}}
  async function share(){const link=baseURL+'#/paper/'+encodeURIComponent(papers[state.paper].key);try{await copyText(link);toast('论文链接已复制。');}catch{if(!modal)handoff();let field=$('cp-link-field');if(!field){field=document.createElement('input');field.id='cp-link-field';field.readOnly=true;field.setAttribute('aria-label','论文链接');$('cp-handoff-status').after(field);}field.value=link;field.hidden=false;field.focus();field.select();$('cp-handoff-status').textContent='链接已选中，可按 Ctrl+C 复制。链接打开当前论文主页，设计站保持原有访问权限。';}}
  function drawDock(){const ids=typeof state.dock==='number'?[state.dock]:state.dock==='liked'?state.liked:state.recent;$('cp-dock-title').textContent=typeof state.dock==='number'?'继续阅读':state.dock==='liked'?'喜欢的论文':'最近浏览';$('cp-dock-list').innerHTML=ids.length?ids.slice(0,8).map(id=>'<button class="cp-dock-row" data-open="'+id+'">'+art(papers[id],true)+'<span><strong>'+esc(papers[id].title)+'</strong><small>'+esc(papers[id].topic)+' · '+(papers[id].runs.length?'有实验记录':'论文信息')+'</small></span></button>').join(''):'<p>这里还没有论文。从 Explore 选一篇开始。</p>';if(typeof state.dock!=='number')$('cp-dock-list').innerHTML+='<button class="cp-text-button" data-shelf="'+state.dock+'">查看全部 →</button>';$('cp-dock-preview').hidden=false;root.querySelectorAll('[data-dock]').forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.dock===state.dock)));}
  function openDock(kind){clearTimeout(dockTimer);clearTimeout(closeTimer);state.dock=kind;drawDock();}
  function closeDock(){dockPinned=false;clearTimeout(dockTimer);clearTimeout(closeTimer);state.dock=null;$('cp-dock-preview').hidden=true;root.querySelectorAll('[data-dock]').forEach(b=>b.setAttribute('aria-expanded','false'));}
  function resetFilters(){state.search='';state.category='';state.author='';state.group='';state.difficulty='';state.limit=18;}
  function changeList(replace=true){state.limit=18;navigate(listHash(),replace);}
  /* RUN_WORKSPACE */
  root.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    if(b.dataset.route){captureList();navigate(b.dataset.route==='library'?'#/explore?filter=liked':b.dataset.route==='landing'?'#/':'#/'+b.dataset.route);}
    if(b.dataset.like!==undefined)like(Number(b.dataset.like));
    if(b.dataset.open!==undefined||b.dataset.preview!==undefined)openPaper(Number(b.dataset.open??b.dataset.preview));
    if(b.dataset.tab)setTab(b.dataset.tab);
    if(b.hasAttribute('data-experiment'))setTab(papers[state.paper].runs.length?'process':'plan');
    if(b.hasAttribute('data-paper-info')){if(state.tab!=='overview')navigate('#/paper/'+encodeURIComponent(papers[state.paper].key)+'?section=info',true);else requestAnimationFrame(()=>{$('cp-paper-information').scrollIntoView({block:'start'});$('cp-paper-information').focus({preventScroll:true});});}
    if(b.hasAttribute('data-video-open'))openVideo();
    if(b.dataset.filter){state.filter=b.dataset.filter;changeList();}
    if(b.dataset.shelf){resetFilters();state.filter=b.dataset.shelf;changeList(false);}
    if(b.dataset.dock){if(state.dock===b.dataset.dock&&dockPinned)closeDock();else{openDock(b.dataset.dock);dockPinned=true;}}
    if(b.dataset.thumb!==undefined){openDock(Number(b.dataset.thumb));dockPinned=true;}
    if(b.dataset.closeModal){if(modal==='run')closeRun();else closeModal();}
    if(b.hasAttribute('data-handoff'))handoff();
  });
  $('cp-paper-like').onclick=()=>like(state.paper);
  $('cp-back-list').onclick=$('cp-end-back').onclick=()=>navigate(state.listHash);
  $('cp-prev-paper').onclick=()=>movePaper(-1);$('cp-next-paper').onclick=$('cp-end-next').onclick=()=>movePaper(1);
  $('cp-handoff-open').onclick=$('cp-plan-handoff').onclick=handoff;
  $('cp-open-original').onclick=()=>window.openai?.openExternal?.({href:papers[state.paper].url});
  $('cp-share-paper').onclick=$('cp-copy-paper-link').onclick=share;
  $('cp-browse-topic').onclick=()=>{resetFilters();state.filter='all';state.category=papers[state.paper].category;state.sort='curated';state.listScroll=0;changeList(false);};
  $('cp-search-input').oninput=e=>{state.search=e.target.value.slice(0,200);clearTimeout(searchTimer);searchTimer=setTimeout(()=>changeList(),180);};
  for(const [k,id] of [['sort','cp-sort'],['category','cp-category'],['author','cp-author'],['group','cp-group'],['difficulty','cp-difficulty']])$(id).onchange=e=>{state[k]=e.target.value;changeList();};
  $('cp-toggle-filters').onclick=()=>{state.advanced=!state.advanced;$('cp-advanced').hidden=!state.advanced;$('cp-toggle-filters').setAttribute('aria-expanded',String(state.advanced));};
  $('cp-clear-filters').onclick=()=>{resetFilters();changeList();};
  $('cp-empty-action').onclick=()=>{if(!state.search&&!state.category&&!state.author&&!state.group&&!state.difficulty)state.filter='all';resetFilters();changeList();};
  $('cp-load-more').onclick=()=>{const count=state.limit;state.limit+=18;renderCards();const next=root.querySelectorAll('#cp-gallery-cards [data-open]')[count];if(next)next.focus({preventScroll:true});};
  for(const id of ['cp-goal','cp-scope','cp-target','cp-plan-data','cp-plan-repo','cp-plan-budget'])$(id).oninput=()=>updatePlan();
  for(const id of ['cp-question','cp-context-analysis','cp-context-plan'])$(id).oninput=prompt;
  $('cp-download-brief').onclick=()=>downloadText('paper-'+papers[state.paper].key+'-brief.md',$('cp-prompt').value);
  $('cp-copy-prompt').onclick=()=>copy($('cp-prompt').value,$('cp-prompt'),'Prompt 已复制。');
  $('cp-mcp').onclick=()=>{$('cp-handoff-status').textContent='MCP 暂未开发。目前可以复制 Prompt 或当前论文 Link。';};
  $('cp-file').onchange=()=>{$('cp-upload-status').textContent=$('cp-file').files.length?'已选择：'+$('cp-file').files[0].name+'。文件尚未上传。':'解析服务未接入预览。';};
  $('cp-upload-preview').onclick=()=>{$('cp-upload-status').textContent='确认题名与版本 → 选择分析范围 → 创建任务。当前设计站尚未接入解析服务。';};
  root.addEventListener('pointerover',e=>{if(e.pointerType==='touch'||dockPinned)return;const b=e.target.closest('[data-dock],[data-thumb]');if(!b||b.contains(e.relatedTarget))return;clearTimeout(dockTimer);clearTimeout(closeTimer);dockTimer=setTimeout(()=>openDock(b.dataset.thumb!==undefined?Number(b.dataset.thumb):b.dataset.dock),180);});
  $('cp-dock-area').addEventListener('pointerleave',()=>{clearTimeout(dockTimer);if(!dockPinned)closeTimer=setTimeout(closeDock,250);});
  $('cp-dock-area').addEventListener('pointerenter',()=>clearTimeout(closeTimer));
  $('cp-dock-close').onclick=()=>{closeDock();$('cp-recent').focus();};
  for(const kind of ['handoff','video'])$('cp-'+kind+'-overlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeModal();});
  $('cp-video-player').addEventListener('error',()=>{if(modal!=='video')return;$('cp-video-player').hidden=true;$('cp-player-empty').hidden=false;$('cp-player-empty').querySelector('.cp-chip').textContent='暂不可用';$('cp-player-empty-title').textContent='视频暂时无法播放';$('cp-player-empty-copy').textContent='请稍后重新打开播放器。';});
  root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.fullscreenElement){if(modal){e.preventDefault();if(modal==='run')closeRun();else closeModal();}else closeDock();}if(e.key==='Tab'&&modal){const focusable=[...$('cp-'+modal+'-overlay').querySelectorAll('button:not([disabled]),input,textarea,select,video[controls]')].filter(x=>!x.hidden&&x.getClientRects().length),first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
  window.addEventListener('message',e=>{if(e.source!==parent)return;if(e.data?.type==='paper-ui-copy-result'){const task=pendingCopies.get(e.data.id);if(task){clearTimeout(task.timer);pendingCopies.delete(e.data.id);e.data.ok?task.resolve():task.reject(new Error('Clipboard unavailable'));}return;}if(e.data?.type!=='paper-ui-location'||typeof e.data.hash!=='string')return;if(typeof e.data.baseURL==='string')baseURL=e.data.baseURL;if(e.data.hash!==currentHash)showPage(e.data.hash);});
  window.addEventListener('openai:set_globals',e=>{const s=e.detail?.globals?.widgetState?.privateContent;if(!s)return;state.liked=validIds(s.liked);state.recent=validIds(s.recent);renderLikes();});
  $('cp-category').insertAdjacentHTML('beforeend',[...new Set(papers.map(p=>p.category))].sort().map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join(''));
  $('cp-author').insertAdjacentHTML('beforeend',[...new Set(papers.flatMap(p=>p.authors))].sort().map(a=>'<option>'+esc(a)+'</option>').join(''));
  $('cp-group').insertAdjacentHTML('beforeend',data.groups.map(g=>'<option value="'+esc(g.id)+'">'+esc(g.name_zh)+'</option>').join(''));
  $('cp-snapshot').textContent=data.snapshot;
  $('cp-library-stats').innerHTML='<span><strong>'+papers.length+'</strong>篇收录论文</span><span><strong>'+papers.filter(p=>p.runs.length).length+'</strong>篇有实验记录</span>';
  renderCards();renderLikes();
  parent.postMessage({type:'paper-ui-ready'},'*');
})();
