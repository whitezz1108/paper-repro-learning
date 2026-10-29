"""Read-only migration of Repro archives. Never starts a runner or a paid API."""
from pathlib import Path
import base64, datetime, gzip, hashlib, json, re, shutil, urllib.request

ROOT=Path(__file__).resolve().parents[1]
OLD=Path('C:/Users/44977/Desktop/capstonefinal/workingnow/repro/app/frontend/public/repro')
SRC=ROOT/'src'
def read(p): return json.loads(p.read_text('utf-8-sig'))
def packed(obj): return base64.b64encode(gzip.compress(json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode(),mtime=0)).decode()
def last(events,kind): return next((e for e in reversed(events) if e.get('type')==kind),{})
data=read(SRC/'papers.json'); papers=data['papers']; catalog=[]; blobs={}; pdfs={}
for p in papers: p['runs']=[]
for entry in read(OLD/'demo-runs/index.json'):
    p=next((p for p in papers if p['key']==entry['paper'] or (p['key']=='isolation-forest' and entry['title']=='Isolation Forest')),None)
    if not p: raise ValueError('Unmapped run '+entry['id'])
    raw=(OLD/'demo-runs'/entry['file']).read_bytes()
    ev=[json.loads(line) for line in raw.decode('utf-8-sig').splitlines() if line.strip()]
    stage='reader'
    for e in ev:
        if e['type']=='stage_start': stage=e.get('stage',stage)
        e['_stage']=stage
    c=last(ev,'contract'); full=last(ev,'contract_full'); v=last(ev,'verdict'); end=last(ev,'run_end')
    pdf=(OLD/'demo-runs'/entry['pdf']).read_bytes() if entry.get('pdf') else None
    pdfkey=hashlib.sha256(pdf).hexdigest()[:16] if pdf else None
    if pdf: pdfs[pdfkey]=base64.b64encode(gzip.compress(pdf,mtime=0)).decode()
    stamp=ev[0].get('ts')
    r={**entry,'paper':p['key'],'kind':'recorded','agent':'Repro pipeline','created_at':datetime.datetime.fromtimestamp(stamp,datetime.timezone.utc).isoformat() if stamp else None,
       'target':c.get('target',v.get('target',{})),'contract':c,'full':full,'routeInfo':last(ev,'route'),'plan':last(ev,'plan'),
       'result':v,'rerun':last(ev,'rerun_result'),'meter':end.get('meter',{}),'timings':end.get('timings',{}),'resources':last(ev,'resources'),
       'eventCount':len(ev),'duration':max(float(e.get('t',0)) for e in ev),'pdfKey':pdfkey,'sha256':hashlib.sha256(raw).hexdigest()}
    catalog.append(r); blobs[r['id']]=packed(ev); p['runs'].append({k:r.get(k) for k in ['id','title','status','verdict','route','seconds','cost_cny','file','kind','agent','created_at']})

# Read exactly the public records already exposed by the old frontend. Store a snapshot, not live credentials.
jobs_source=(OLD/'jobs.js').read_text('utf-8')
url=re.search(r'const SB_URL = "([^"]+)"',jobs_source)[1]
key=re.search(r'const SB_KEY = "([^"]+)"',jobs_source)[1]
def get(path):
    req=urllib.request.Request(url+'/rest/v1/'+path,headers={'apikey':key,'Authorization':'Bearer '+key})
    with urllib.request.urlopen(req,timeout=40) as response: return json.load(response)
jobs=get('repro_jobs?select=id,arxiv_id,title,status,verdict,agent,model,created_at,updated_at&agent=not.in.(viewer-steps-1-3,recorded-run-seed)&order=created_at.desc&limit=500')
for j in jobs:
    match=re.search(r'\d{4}\.\d{4,5}',j.get('arxiv_id') or '')
    p=next((p for p in papers if match and p['key']==match[0]),None)
    if not p: continue
    original=get('repro_events?job_id=eq.'+j['id']+'&select=id,kind,agent,created_at,payload&order=id')
    ev=[]; started=datetime.datetime.fromisoformat(j['created_at'].replace('Z','+00:00'))
    for x in original:
        payload=x.get('payload') or {}
        ev.append({**payload,'type':x['kind'],'seq':x['id'],'t':max(0,(datetime.datetime.fromisoformat(x['created_at'].replace('Z','+00:00'))-started).total_seconds()),'agent':x.get('agent'),'created_at':x['created_at'],'_stage':{'contract':'reader','route':'router','plan':'planner','result':'verifier','file':'implementer'}.get(x['kind'],'implementer')})
    c=last(ev,'contract'); claims=c.get('claims') or []; tgt=c.get('match_target',c.get('target',{}))
    if isinstance(tgt,str): tgt=next((x for x in claims if x.get('id')==tgt),{'statement':tgt})
    if isinstance(tgt,dict) and tgt.get('id'): tgt={**next((x for x in claims if x.get('id')==tgt['id']),{}),**tgt}
    result=last(ev,'result'); audit=next((e['audit'] for e in reversed(ev) if isinstance(e.get('audit'),dict)),{})
    r={**j,'paper':p['key'],'kind':'agent','target':tgt or {},'contract':c,'full':c,'routeInfo':last(ev,'route'),'plan':last(ev,'plan'),'result':result,'audit':audit,'rerun':{},'meter':{},'timings':{},'eventCount':len(ev),'duration':max([e['t'] for e in ev]+[0]),'seconds':None,'cost_cny':None,'file':'repro_events snapshot','pdfKey':None}
    catalog.append(r); blobs[r['id']]=packed(ev); p['runs'].append({k:r.get(k) for k in ['id','title','status','verdict','route','seconds','cost_cny','file','kind','agent','created_at']})
compute=read(OLD/'compute.json')
for p in papers: p['computeInfo']=compute.get(p['key'],{})
snapshot=datetime.datetime.now(datetime.timezone.utc).isoformat()
(SRC/'papers.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),'utf-8')
(SRC/'runs.json').write_text(json.dumps({'snapshot':snapshot,'runs':catalog},ensure_ascii=False,separators=(',',':')),'utf-8')
(SRC/'run-blobs.json').write_text(json.dumps({'events':blobs,'pdfs':pdfs},separators=(',',':')),'utf-8')
(SRC/'vendor').mkdir(exist_ok=True)
for name in ['pdf.min.js','pdf.worker.min.js','README.md']: shutil.copy2(OLD/'vendor'/name,SRC/'vendor'/name)
print(json.dumps({'runs':len(catalog),'agent_runs':sum(r['kind']=='agent' for r in catalog),'pdfs':len(pdfs),'snapshot':snapshot,'packed_bytes':(SRC/'run-blobs.json').stat().st_size}))
