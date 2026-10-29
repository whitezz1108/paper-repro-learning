"""One-time extraction of the published sandbox; no changes to its CSP or permissions."""
from pathlib import Path
import html, json, re

root = Path(__file__).resolve().parents[1]
src = root / 'src'
src.mkdir(exist_ok=True)
outer = (root / 'dist/index.html').read_text('utf-8')
match = re.search(r'data-srcdoc="([\s\S]*?)"\s*></iframe>', outer)
frame = html.unescape(match.group(1))
fragment = Path(r'C:/Users/44977/.codex/visualizations/2026/10/28/01a180e1-b583-7de3-a9fd-f7536eab763d/paper-soft-light.html').read_text('utf-8')
assert fragment.strip() in frame
(src/'wrapper.html').write_text(outer[:match.start(1)]+'{{FRAME}}'+outer[match.end(1):], 'utf-8')
(src/'frame.html').write_text(frame.replace(fragment.strip(), '{{APP}}'), 'utf-8')
base = fragment[:fragment.index('<script>')]
start = base.index('  <section class="cp-stage" data-page="explore"')
end = base.index('  <section class="cp-stage" data-page="upload"', start)
base = base[:start]+'{{GALLERY}}\n'+base[end:]
start = base.index('  <div data-page="paper"')
end = base.index('</main>', start)
base = base[:start]+'{{PAPER}}\n'+base[end:]
start = base.index('<div class="cp-overlay" id="cp-preview-overlay"')
end = base.index('<div class="cp-overlay" id="cp-handoff-overlay"', start)
base = base[:start]+base[end:]
base = base.replace('搜索示例论文','搜索论文').replace('视觉提案 · 封面与内容均为示意','论文目录来自 Repro 本地快照 · 封面为编辑设计')
base = base.replace('当前分析范围','论文摘要与来源').replace('正式版附上对应版本的真实材料；这里只预览交接结构。','附上当前论文的已收录材料。你可以先编辑问题，再复制到自己的 AI。').replace('示例 Prompt','Prompt').replace('<button class="cp-smoke" disabled>Link · 待真实任务接入</button>','<button class="cp-smoke" id="cp-copy-paper-link">复制论文 Link</button>')
(src/'base.html').write_text(base, 'utf-8')

old = Path(r'C:/Users/44977/Desktop/capstonefinal/workingnow/repro/app/frontend/public/repro')
directory = json.loads((old/'directory.json').read_text('utf-8-sig'))
compute = json.loads((old/'compute.json').read_text('utf-8-sig'))
runs = json.loads((old/'demo-runs/index.json').read_text('utf-8-sig'))
extras = [
 {'key':'isolation-forest','title':'Isolation Forest','authors':['Fei Tony Liu','Kai Ming Ting','Zhi-Hua Zhou'],'published':'2008','category':'cs.LG','topic':'异常检测','question':'为什么孤立的点，更容易被分开？','cover':'Finding\nthe unusual.','art':0,'url':'https://cs.nju.edu.cn/zhouzh/zhouzh.files/publication/icdm08b.pdf'},
 {'key':'1706.03762','title':'Attention Is All You Need','authors':['Ashish Vaswani et al.'],'published':'2017','category':'cs.CL','topic':'序列建模','question':'一个词，如何找到此刻需要的信息？','cover':'Attention\nis all you need.','art':1},
 {'key':'1506.02142','title':'Dropout as a Bayesian Approximation: Representing Model Uncertainty in Deep Learning','authors':['Yarin Gal','Zoubin Ghahramani'],'published':'2015','category':'cs.LG','topic':'不确定性','question':'模型能不能知道自己有多不确定？','cover':'Knowing what\nwe don’t know.','art':2},
 {'key':'1607.01759','title':'Bag of Tricks for Efficient Text Classification','authors':['Armand Joulin','Edouard Grave','Piotr Bojanowski','Tomas Mikolov'],'published':'2016','category':'cs.CL','topic':'文本分类','question':'用更少的计算，完成文本分类。','cover':'Small model.\nBig ideas.','art':3}
]
papers = extras + [dict(p, key=p['id'], group='yang-yujiu') for p in directory['papers'].values() if p['id'] not in {p['key'] for p in extras}]
for i,p in enumerate(papers):
 p['id']=i
 p.setdefault('art',i%6)
 p.setdefault('topic',{'cs.CL':'语言与文本','cs.CV':'视觉与图像','cs.LG':'机器学习','cs.AI':'人工智能','stat.ML':'统计学习'}.get(p['category'],p['category']))
 p.setdefault('url','https://arxiv.org/abs/'+p['key'])
 p['runs']=[{k:r[k] for k in ['id','title','status','verdict','route','seconds','cost_cny','file']} for r in runs if r['paper']==p['key'] or (p['key']=='isolation-forest' and r['title']=='Isolation Forest')]
 p['difficulty']=compute.get(p['key'],{}).get('compute',{}).get('difficulty')
 p['source']='Repro directory.json' if p.get('group') else ('Repro demos / recorded index' if p['runs'] else '原设计站收录')
data={'snapshot':directory['built'],'papers':papers,'groups':[{k:g[k] for k in ['id','name_zh']} for g in directory['groups']]}
(src/'papers.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps({'papers':len(papers),'with_runs':sum(bool(p['runs']) for p in papers),'runs':sum(len(p['runs']) for p in papers)}))
