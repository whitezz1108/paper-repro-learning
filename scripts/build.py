"""Assemble readable source into the original sandboxed export."""
from pathlib import Path
import html,json,re,shutil
root=Path(__file__).resolve().parents[1]
src=root/'src'
read=lambda name:(src/name).read_text('utf-8')
base=read('base.html').replace('{{GALLERY}}',read('gallery.html')).replace('{{PAPER}}',read('paper.html'))+read('video-dialog.html')+read('run-workspace.html')
base=base.replace('</style>','\n'+read('collection.css')+'\n'+read('run-workspace.css')+'\n</style>',1)
payload=json.dumps(json.loads(read('papers.json')),ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
def json_script(name,ident):
 return '<script type="application/json" id="'+ident+'">'+json.dumps(json.loads(read(name)),ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')+'</script>'
worker=json.dumps(read('vendor/pdf.worker.min.js')).replace('<','\\u003c')
pdf_lib=read('vendor/pdf.min.js').replace('</script','<\\/script')
pdf_init='pdfjsLib.GlobalWorkerOptions.workerSrc=URL.createObjectURL(new Blob(['+worker+'],{type:"text/javascript"}));'
code=read('app.js').replace('/* RUN_WORKSPACE */',read('run-workspace.js'))
app=base+'<script type="application/json" id="paper-data">'+payload+'</script>'+json_script('runs.json','run-data')+json_script('run-blobs.json','run-blobs')+'<script>'+pdf_lib+'\n'+pdf_init+'</script>\n<script>\n'+code+'\n</script>\n</div>'
frame=read('frame.html').replace('{{APP}}',app)
outer=read('wrapper.html').replace('{{FRAME}}',html.escape(frame,quote=True))
outer=outer.replace('</head>','<style>html,body{height:100%;overflow:hidden;background:#141413}body{padding:0}#codex-visualization{width:100%;max-width:none;height:100dvh!important;margin:0}</style>\n</head>',1)
outer=outer.replace('<title>paper-soft-light.html</title>','<title>paper. — 论文探索与实验</title>',1)
outer=outer.replace('</body>','<script>\n'+read('host.js')+'\n</script>\n</body>')
assert 'sandbox="allow-scripts"' in outer
assert len(re.findall('Content-Security-Policy',outer))==2
assert '{{APP}}' not in outer and '{{FRAME}}' not in outer
(root/'dist/index.html').write_text(outer,'utf-8')
print('Built dist/index.html:',len(outer.encode('utf-8')),'bytes')

shutil.copytree(src/"landing",root/"dist/landing",dirs_exist_ok=True)

# The private sandbox has an opaque origin: inline landing dependencies so
# authentication redirects cannot turn CSS/JS/media into HTML responses.
import base64,mimetypes
landing=src/'landing'
def asset_url(path):
    f=landing/path
    if not f.is_file(): return path
    return 'data:'+ (mimetypes.guess_type(str(f))[0] or 'application/octet-stream')+';base64,'+base64.b64encode(f.read_bytes()).decode()
def inline_assets(text):
    return re.sub(r'assets/[a-zA-Z0-9._/-]+',lambda m:asset_url(m[0]),text)
page=(landing/'index.html').read_text('utf-8')
page=re.sub(r'<link[^>]+href="([^" ]+\.css)"[^>]*>',lambda m:'<style>'+inline_assets((landing/m[1]).read_text('utf-8'))+'</style>',page)
page=re.sub(r'<script[^>]+src="([^" ]+\.js)"[^>]*></script>',lambda m:'<script defer>'+inline_assets((landing/m[1]).read_text('utf-8')).replace('</script','<\\/script')+'</script>',page)
# Keep former deferred scripts deferred until all DOM nodes exist.
scripts=re.findall(r'<script defer>(.*?)</script>',page,re.S)
page=re.sub(r'<script defer>.*?</script>','',page,flags=re.S)
page=page.replace('</body>',''.join('<script>'+v+'</script>' for v in scripts)+'</body>')
page=inline_assets(page)
(root/'dist/landing/index.html').write_text(page,'utf-8')
print('Self-contained landing:',len(page.encode('utf-8')),'bytes')
