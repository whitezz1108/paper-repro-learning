"""Check archival coverage, payload integrity and sandbox boundaries."""
from pathlib import Path
import base64,gzip,hashlib,json,re
root=Path(__file__).resolve().parents[1]
def read(name): return json.loads((root/'src'/name).read_text('utf-8'))
runs=read('runs.json')['runs']; blobs=read('run-blobs.json'); papers=read('papers.json')['papers']
keys={p['key'] for p in papers}; ids={r['id'] for r in runs}
assert len(ids)==len(runs)==12
assert len([r for r in runs if r['kind']=='recorded'])==10
assert len([r for r in runs if r['kind']=='agent'])==2
old=Path('C:/Users/44977/Desktop/capstonefinal/workingnow/repro/app/frontend/public/repro/demo-runs')
for r in runs:
 assert r['paper'] in keys
 ev=json.loads(gzip.decompress(base64.b64decode(blobs['events'][r['id']])))
 assert len(ev)==r['eventCount'] and ev
 assert all(isinstance(e.get('t'),(int,float)) for e in ev)
 assert r['duration']==max(e['t'] for e in ev)
 if r['kind']=='recorded':
  assert hashlib.sha256((old/r['file']).read_bytes()).hexdigest()==r['sha256']
  assert gzip.decompress(base64.b64decode(blobs['pdfs'][r['pdfKey']])).startswith(b'%PDF-')
  assert r['result']['verdict']==r['verdict']
for p in papers:
 assert all(r['id'] in ids and next(x for x in runs if x['id']==r['id'])['paper']==p['key'] for r in p['runs'])
html=(root/'dist/index.html').read_text('utf-8')
assert 'sandbox="allow-scripts"' in html and 'allow-same-origin' not in re.search(r'<iframe[^>]+',html)[0]
assert 'data-tab=&quot;video&quot;' not in html
assert 'connect-src blob: data:' in html and 'frame-src &#x27;none&#x27;' in html
print('PASS: 12 runs mapped, 10 source hashes preserved, 8 PDFs decode, event counts match, sandbox and CSP retained.')
