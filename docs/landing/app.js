'use strict';

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const zh = Object.fromEntries($$('[data-i18n]').map(el => [el.dataset.i18n, el.innerHTML]));
  const en = {
    evidenceDetail: 'Settings & audit ↗', evidenceDialogTitle: 'EXPERIMENT SETTINGS & AUDIT', evidenceDialogIntro: 'The contract and audit summary from this recorded Isolation Forest run. The verdict applies to the selected Ionosphere AUC experiment.', evidenceDialogSource: 'Open the full recording in the original workspace ↗',
    skip: 'Skip to content', navWorkflow: 'How it works', navCases: 'Recorded cases', navBench: 'Benchmark', navEvidence: 'The evidence', workspace: 'Open workspace',
    heroLead: 'Give every published claim a real test.', heroDescription: 'Read the paper. Build the experiment. Run it again.<br>Follow the evidence, from the first line of code to the final result.', heroPrimary: 'Explore a real run', heroSecondary: 'Start your reproduction', heroNote: 'Recorded runs are ready to explore. No environment setup.', heroCaption: 'From knowledge on paper to evidence in practice.',
    evidenceKicker: 'Start with a real run', evidenceHeading: 'One conclusion.<br><span class="muted-heading">A complete chain of evidence.</span>', evidenceIntro: 'What the paper claims. What the agent does. What a rerun finds.<br>See all three together, and assess the result for yourself.', fullRecording: 'Open the full recording', recorded: 'Recorded case summary', tabClaim: 'The claim', tabExecution: 'The process', tabVerdict: 'The verdict', tour: 'Play walkthrough',
    paperAbstract: 'Isolate anomalies through random partitions. Shorter paths suggest more anomalous instances.', paperSource: 'Claim linked to its source in the paper', reproduced: 'Reproduced', cleanRerun: 'Independent clean rerun · AUC', reported: 'Paper reports', difference: 'Difference', acceptance: 'Within the preset acceptance band of ±0.05', cleanTime: 'Clean rerun', summaryNote: 'Interactive summary of a recording · Not a live execution',
    statDuration: 'Total time for this run', statCost: 'Model cost for this run', statCommands: 'Executed commands', statCompute: 'No GPU required for this case', dataNote: 'These figures describe one recorded Isolation Forest run in the existing product. They are not average costs, runtimes, or a guarantee of success.',
    workflowKicker: 'Evidence at every step', workflowHeading: 'A complex experiment.<br>A clear process.', workflowIntro: 'From understanding the method to an independent check, follow the steps behind a long-running experiment.', workflowSix: 'traceable steps<br>through one reproduction', step0: 'Read', step1: 'Set the target', step2: 'Implement', step3: 'Run & repair', step4: 'Rerun', step5: 'Conclude',
    casesKicker: 'Real papers. Real processes.', casesHeading: 'Start with what<br><span class="muted-heading">the paper gives you.</span>', casesIntro: 'Working code, a broken legacy environment, or just a paper.<br>Three starting points. Three concrete paths to a result.', fullRelease: 'FULL RELEASE', partialRelease: 'PARTIAL RELEASE', paperOnly: 'PAPER ONLY', fastTextSummary: 'Use the author’s code.<br>Get the experiment running.', dropoutSummary: 'Port the old framework.<br>Preserve the protocol.', iforestSummary: 'Implement the method.<br>Verify the result.', partialReproduced: 'Partially reproduced', casesNote: 'Partial reproduction stays partial. Knowing what did not reproduce is a useful result, too.', allRuns: 'All recorded runs', benchTitle: 'Different models. The same test.', benchLink: 'Explore the benchmark',
    startHeading: 'Your next paper.<br>Your next experiment.', startDescription: 'Bring a PDF or an arXiv link.<br>Choose how you want to run it.', openWorkspace: 'Open the reproduction workspace', modeReplay: 'Explore a recording', modeReplayDescription: 'Follow a recorded run, step by step. Inspect the process and the conclusion without running an experiment on your device.', modeReplayFoot: 'Online viewing · No setup', modeLocal: 'Use your own agent', modeLocalDescription: 'Get a task link from the workspace and give it to Claude Code, Codex, or another agent to run on your own machine.', modeLocalFoot: 'Your environment · Local execution', modeLab: 'Connect to the lab runner', modeLabDescription: 'Run the full workflow in the lab environment. An access key is required; execution consumes model tokens and compute.', modeLabFoot: 'Access required · Subject to runner availability', availability: 'The original site currently offers recorded replays. Before starting a new task, check runner connectivity and access in the workspace.', paperLibrary: 'Paper library ↗', backTop: 'Back to top ↑', caseDetail: 'RECORDED CASE / SUMMARY'
  };
  Object.assign(en, {"navLearn": "Understand papers", "learnKicker": "Start with understanding", "learnHeading": "Understand<br><em>the paper.</em>", "learnIntro": "Explore the question, method and experiments through structured explanations and video. Return to the original paper to check the evidence.", "learnPoint1": "Question & contribution", "learnPoint1d": "What problem does it solve? What is new?", "learnPoint2": "Method & experiments", "learnPoint2d": "How does it work? What is tested?", "learnPoint3": "Findings & limits", "learnPoint3d": "What is supported, and what remains open?", "explorePapers": "Explore papers ↗", "analysisTab": "Read the explanation", "videoTab": "Video explanation", "methodTitle": "Why are anomalies easier to isolate?", "diagramCaption": "Mechanism illustration · Not experimental data", "methodBody": "Randomly choose a feature and a split value to partition the samples. Points far from dense regions often need fewer splits to isolate. Average path lengths across trees are used to construct an anomaly score.", "methodSource": "Original paper · Method §2 ↗", "videoTitle": "Another way to understand a paper.", "videoBody": "Open the video library to select an existing explanation or submit a paper. This example has no linked explanation video yet; the background is decorative.", "videoLink": "Open the video library ↗", "learnOutro": "Once you understand it, choose a question worth testing.", "nextLearn": "Next · Understand the paper ↓", "evidenceHeading": "See a claim<br><span class=\"muted-heading\">put to the test.</span>", "evidenceIntro": "Follow one selected experiment through implementation, execution and verification. Inspect what the agent read and ran, and how the result differs from the paper.", "fullRecording": "Explore this run", "startDescription": "Start with an existing explanation, or bring a PDF or arXiv link.<br>Understand first. Then choose a question to test.", "openWorkspace": "Open workspace", "modeReplay": "Understand a paper", "modeReplayDescription": "Explore structured explanations and video, from the question and method to the experiments.", "modeReplayFoot": "Explore papers ↗", "modeLocal": "Explore a recording", "modeLocalDescription": "Inspect a recorded run and its conclusion, without setting up an experiment.", "modeLocalFoot": "View recorded runs ↗", "modeLab": "Start my experiment", "modeLabDescription": "Choose a concrete target and prepare a task for your own agent or an available runtime.", "modeLabFoot": "Prepare an experiment ↗"});
  let language = 'zh';
  try { if (localStorage.getItem('paperrepro-language') === 'en') language = 'en'; } catch (_) {}
  let currentView = 'execution';
  let currentStep = 0;
  let tourTimer = null;
  let activeCase = null;
  const t = (cn, english) => language === 'zh' ? cn : english;
  const originalRuns = 'https://paperrepro-aiid.atoms.world/repro/index.html#runs';

  const agents = [
    ['阅读者', 'Reader', '定位结果与方法', 'Locate the claim and method', '54.4s'],
    ['路由者', 'Router', '检查代码与算力', 'Check code and compute', '8.0s'],
    ['规划者', 'Planner', '确定实现计划', 'Plan the implementation', '54.8s'],
    ['实现者', 'Implementer', '编写、运行与修复', 'Implement, run, and repair', '29m 56s'],
    ['核验者', 'Verifier', '独立重跑与审计', 'Independently rerun and audit', '28.7s']
  ];
  function evidenceMarkup(view) {
    let content;
    if (view === 'claim') {
      content = `<h3 class="process-heading">${t('先固定目标，再开始实验。', 'Set the target before the experiment.')}</h3><p class="process-sub">${t('选定 Table 3 的 Ionosphere AUC。<br>验收阈值在代码运行前确定。', 'Target the Ionosphere AUC in Table 3.<br>Fix the acceptance band before running code.')}</p><div class="claim-grid"><div class="claim-cell"><strong>351</strong><span>${t('数据样本', 'instances')}</span></div><div class="claim-cell"><strong>32</strong><span>${t('连续特征', 'continuous features')}</span></div><div class="claim-cell"><strong>100</strong><span>${t('隔离树', 'isolation trees')}</span></div><div class="claim-cell"><strong>256</strong><span>${t('子采样大小 ψ', 'subsample size ψ')}</span></div></div><div class="claim-target">${t('目标：AUC 0.85<br>预设验收范围：±0.05<br>训练不使用异常标签；标签仅用于评估。', 'Target: AUC 0.85<br>Preset acceptance band: ±0.05<br>Train without anomaly labels; use them only for evaluation.')}</div>`;
    } else if (view === 'verdict') {
      content = `<h3 class="process-heading">${t('重跑之后，再给出判断。', 'Rerun first. Then reach a verdict.')}</h3><p class="process-sub">${t('核验者基于独立干净重跑检查结果。', 'The verifier checks an independent clean rerun.')}</p><div class="audit-row"><span>${t('数据集与样本数量', 'Dataset & sample count')}</span><b>✓ ${t('一致', 'matched')}</b></div><div class="audit-row"><span>${t('评估协议', 'Evaluation protocol')}</span><b>✓ ${t('一致', 'matched')}</b></div><div class="audit-row"><span>${t('指标定义', 'Metric definition')}</span><b>✓ AUC</b></div><div class="audit-row"><span>${t('预设验收范围', 'Preset acceptance band')}</span><b>✓ ±0.05</b></div><p class="audit-note">${t('这次运行保存了 16 项设置。结论对应所选实验目标，完整方法与设置可在原录制中检查。', 'This run records 16 settings. The verdict applies to the selected target. Inspect the method and settings in the original recording.')}</p><div class="audit-verdict">${t('独立重跑：0.851 AUC<br>相对论文结果差值：+0.001', 'Independent rerun: 0.851 AUC<br>Difference from paper: +0.001')}</div>`;
    } else {
      content = `<h3 class="process-heading">${t('五个角色，一次完整运行。', 'Five roles. One complete run.')}</h3><p class="process-sub">${t('以下为该次录制中的实际阶段与耗时。', 'Actual stages and durations from this recording.')}</p><ol class="agent-timeline">${agents.map(a => `<li><span class="timeline-check" aria-hidden="true">✓</span><span class="timeline-text">${t(a[0],a[1])}<span>${t(a[2],a[3])}</span></span><span class="timeline-time">${a[4]}</span></li>`).join('')}</ol><div class="process-chip"><span class="tiny-dot"></span><span>19 ${t('条命令', 'commands')} / 38 ${t('次模型调用', 'model calls')}</span></div>`;
    }
    return content;
  }
  function renderEvidence(view, focus = false) {
    currentView = view;
    $$('.evidence-tabs [role=tab]').forEach(btn => {
      const active = btn.dataset.view === view;
      btn.setAttribute('aria-selected', String(active));
      btn.tabIndex = active ? 0 : -1;
      if (active && focus) btn.focus();
    });
    const panel = $('#evidence-panel');
    panel.dataset.view = view;
    panel.setAttribute('aria-labelledby', 'tab-' + view);
    $('#detail-pane-label').textContent = view === 'claim' ? 'THE CONTRACT' : view === 'verdict' ? 'THE AUDIT' : 'THE PROCESS';
    const content = evidenceMarkup(view);
    $('#detail-content').innerHTML = content;
    $('#detail-content').classList.remove('entered');
    requestAnimationFrame(() => $('#detail-content').classList.add('entered'));
  }

  const iconPaths = [
    '<path d="M11 3h20l10 10v34H11zM31 3v11h10M18 22h16M18 28h16M18 34h10"/><path d="M5 10v42h29"/>',
    '<circle cx="25" cy="26" r="20"/><circle cx="25" cy="26" r="12"/><circle cx="25" cy="26" r="3"/><path d="M25 0v10M25 42v10M0 26h10M40 26h10"/>',
    '<path d="M15 14 4 26l11 12M35 14l11 12-11 12M29 7l-9 39"/>',
    '<rect x="3" y="8" width="44" height="37" rx="2"/><path d="M3 17h44M10 13h1M15 13h1M13 25l7 6-7 6M25 37h13"/>',
    '<path d="M42 20A18 18 0 0 0 10 12l-5 7m0-12v12h12M8 34a18 18 0 0 0 32 8l5-7m0 12V35H33"/><path d="m18 27 5 5 10-12"/>',
    '<path d="M10 3h22l10 10v36H10zM32 3v11h10M17 34h18"/><path d="m17 23 5 5 12-10M17 40h13"/>'
  ];
  const steps = [
    {tag:'READ THE PAPER',title:['从原文里，找到要核验的事。','Find the claim in the original paper.'],desc:['定位方法章节、结果表格与实验要求，同时记录论文未说明的细节。每个目标都能追溯到原文。','Locate the methods, results tables, and implementation requirements. Record unspecified details and link the target back to its source.'],out:['产物 / 论文标注与实验要求','OUTPUT / ANNOTATIONS & REQUIREMENTS']},
    {tag:'DEFINE THE CONTRACT',title:['先说清楚，怎样才算复现。','Agree on what counts as reproduced.'],desc:['在运行之前固定数据、指标和验收范围。这次案例的目标为 Ionosphere AUC 0.85，预设容差为 ±0.05。','Fix the data, metric, and acceptance band before execution. This case targets an Ionosphere AUC of 0.85 with a preset band of ±0.05.'],out:['产物 / 可核验的复现目标','OUTPUT / A TESTABLE TARGET']},
    {tag:'BUILD THE EXPERIMENT',title:['顺着论文，构建实验。','Build from what the paper provides.'],desc:['代码完整时沿用作者实现；依赖失效时修复或迁移；只有论文时按方法重新实现，并记录所做假设。','Use the author’s implementation where available. Repair or port broken dependencies. Reimplement from the paper when code is absent, recording assumptions.'],out:['产物 / 实验代码与实现计划','OUTPUT / CODE & IMPLEMENTATION PLAN']},
    {tag:'EXECUTE & DIAGNOSE',title:['看到运行，也看到问题。','See the execution, including the failures.'],desc:['执行实验、检查输出，并根据错误继续诊断与修复。命令、日志、耗时与模型费用都进入运行记录。','Execute the experiment, inspect its output, and diagnose errors. Commands, logs, timing, and model costs remain in the run record.'],out:['产物 / 执行日志与过程记录','OUTPUT / EXECUTION LOG & TRACE']},
    {tag:'VERIFY INDEPENDENTLY',title:['清理结果，再从头跑一次。','Clear the results. Run it again.'],desc:['核验者独立进行干净重跑，检查代码与结果。用重新执行得到的证据，检验实现者给出的结果。','The verifier performs an independent clean rerun and audits the code and results. Fresh execution provides the evidence for the conclusion.'],out:['产物 / 独立重跑与核验审计','OUTPUT / CLEAN RERUN & AUDIT']},
    {tag:'REPORT THE EVIDENCE',title:['结论有边界，依据看得见。','A scoped verdict with visible evidence.'],desc:['对比论文值与观测值，给出已复现、部分复现或未复现的判断。保留不一致和阻塞原因，让下一步更明确。','Compare reported and observed values. Report reproduced, partially reproduced, or not reproduced, preserving mismatches and blockers.'],out:['产物 / 结果对照与复现报告','OUTPUT / COMPARISON & REPORT']}
  ];
  function renderWorkflow(index, focus = false) {
    currentStep = index;
    $$('.workflow-step').forEach(btn => {
      const active = Number(btn.dataset.step) === index;
      btn.setAttribute('aria-selected', String(active));
      btn.tabIndex = active ? 0 : -1;
      if (active && focus) btn.focus();
    });
    const step = steps[index];
    const panel = $('#workflow-detail');
    panel.setAttribute('aria-labelledby','step-' + index);
    panel.innerHTML = `<div class="detail-icon" aria-hidden="true"><svg viewBox="0 0 50 56">${iconPaths[index]}</svg></div><span class="detail-overline">${step.tag}</span><h3>${t(...step.title)}</h3><p>${t(...step.desc)}</p><div class="detail-output"><span aria-hidden="true">↳</span><span>${t(...step.out)}</span></div>`;
  }

  const cases = {
    fasttext: {name:'fastText',paper:'Bag of Tricks for Efficient Text Classification',route:['完整发布','FULL RELEASE'],status:['已复现','Reproduced'],time:'21m 23s',cost:'¥0.56',desc:['作者代码、脚本与数据均已公开。这条路径沿用作者工具和论文设置；Windows 环境需要移植 shell 脚本，并使用 fasttext-wheel 安装包。','The author’s code, scripts, and data are available. This path uses the author’s tool and paper settings. On Windows, the shell script requires a Python port and the package is fasttext-wheel.']},
    dropout: {name:'MC Dropout',paper:'Dropout as a Bayesian Approximation: Representing Model Uncertainty in Deep Learning',route:['部分发布','PARTIAL RELEASE'],status:['部分复现','Partially reproduced'],time:'42m 37s',cost:'¥0.51',desc:['代码、数据与 20 组数据划分已公开，但原代码依赖已难以安装的 Theano 与 Keras 1。复现需要迁移到当前框架，并保留原实验协议。该次录制结论为“部分复现”。','Code, data, and 20 split indices are available, but the implementation depends on Theano and Keras 1, which no longer install. Reproduction requires a port to a current framework while retaining the protocol. This recording reports partial reproduction.']},
    iforest: {name:'Isolation Forest',paper:'Isolation Forest · Ionosphere / Table 3',route:['仅论文','PAPER ONLY'],status:['已复现','Reproduced'],time:'32m 22s',cost:'¥0.32',desc:['该次运行按论文实现隔离树、路径长度与异常分数。独立干净重跑得到 AUC 0.851，论文值为 0.85，差值 +0.001，落在运行前固定的 ±0.05 验收范围内。','This run implements the isolation trees, path length, and anomaly score from the paper. An independent clean rerun measures AUC 0.851 against the reported 0.85: a difference of +0.001, within the preset ±0.05 band.']}
  };
  const dialog = $('#case-dialog');
  function renderCase(key) {
    activeCase = key;
    const c = cases[key];
    $('#case-dialog-content').innerHTML = `<h2 class="dialog-title" id="case-dialog-title">${c.name}</h2><p class="dialog-paper">${c.paper}</p><span class="case-status ${key==='dropout'?'partial':'success'}">${t(...c.route)} · ${t(...c.status)}</span><p class="dialog-description">${t(...c.desc)}</p><div class="dialog-metrics"><div><b>${c.time}</b><span>${t('该次运行总耗时','Total time for this run')}</span></div><div><b>${c.cost}</b><span>${t('该次运行模型费用','Model cost for this run')}</span></div></div><p class="dialog-footnote">${t('来源：原产品首页与录制运行，2026-10-28 核对。这里展示单次案例摘要；完整事件、日志与审计请在原工作台中选择对应录制查看。','Source: the original product homepage and recordings, checked on 2026-10-28. This is a summary of one run. Select the corresponding recording in the original workspace to inspect events, logs, and audits.')}</p><a class="button dialog-link" href="${originalRuns}" target="_blank" rel="noopener noreferrer"><span>${t('打开原工作台的运行记录','Open recordings in the workspace')}</span><span aria-hidden="true">↗</span></a>`;
  }

  function stopTour() {
    if (tourTimer) clearInterval(tourTimer);
    tourTimer = null;
    const btn = $('#tour-button');
    btn.setAttribute('aria-pressed','false');
    btn.innerHTML = `<span aria-hidden="true">▷</span><span>${t('播放导览','Play walkthrough')}</span>`;
  }
  function updateLanguage() {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    $$('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      el.innerHTML = language === 'zh' ? zh[key] : (en[key] || zh[key]);
    });
    $('#language-toggle').textContent = language === 'zh' ? 'EN' : '中文';
    $('#language-toggle').setAttribute('aria-label', language === 'zh' ? 'Switch to English' : '切换为中文');
    $('#dialog-close').setAttribute('aria-label', t('关闭案例摘要','Close case summary'));
    $('#menu-toggle').setAttribute('aria-label', t('展开导航','Toggle navigation'));
    $('.acceptance-chart').setAttribute('aria-label', t('论文值 0.85，复现值 0.851，均在 0.80 到 0.90 的验收范围内','Reported value 0.85 and reproduced value 0.851, within the acceptance band of 0.80 to 0.90'));
    $('.evidence-tabs').setAttribute('aria-label', t('案例证据视角','Case evidence views'));
    $('.workflow-list').setAttribute('aria-label', t('复现流程','Reproduction workflow'));
    renderEvidence(currentView);
    renderWorkflow(currentStep);
    if (activeCase) renderCase(activeCase);
    stopTour();
    window.PaperReproPager?.refresh();
  }
  $('#language-toggle').addEventListener('click', () => {
    language = language === 'zh' ? 'en' : 'zh';
    try { localStorage.setItem('paperrepro-language', language); } catch (_) {}
    updateLanguage();
  });
  $$('.evidence-tabs [role=tab]').forEach(btn => btn.addEventListener('click', () => { stopTour(); renderEvidence(btn.dataset.view); }));
  $$('.workflow-step').forEach(btn => btn.addEventListener('click', () => renderWorkflow(Number(btn.dataset.step))));
  function keyboardTabs(rootSelector, callback, vertical = false) {
    const buttons = $$(`${rootSelector} [role=tab]`);
    $(rootSelector).addEventListener('keydown', e => {
      const i = buttons.indexOf(document.activeElement);
      if (i < 0) return;
      let next = i;
      if (e.key === (vertical ? 'ArrowDown' : 'ArrowRight')) next = (i + 1) % buttons.length;
      else if (e.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) next = (i - 1 + buttons.length) % buttons.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = buttons.length - 1;
      else return;
      e.preventDefault();
      callback(buttons[next]);
    });
  }
  keyboardTabs('.evidence-tabs', btn => { stopTour(); renderEvidence(btn.dataset.view,true); });
  keyboardTabs('.workflow-list', btn => renderWorkflow(Number(btn.dataset.step),true),true);
  $('#tour-button').addEventListener('click', () => {
    if (tourTimer) { stopTour(); return; }
    const views = ['claim','execution','verdict'];
    let i = 0;
    renderEvidence(views[0]);
    $('#tour-button').setAttribute('aria-pressed','true');
    $('#tour-button').innerHTML = `<span aria-hidden="true">Ⅱ</span><span>${t('暂停导览','Pause walkthrough')}</span>`;
    tourTimer = setInterval(() => {
      i++;
      if (i >= views.length) { stopTour(); return; }
      renderEvidence(views[i]);
    },3200);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopTour(); });
  $$('[data-case]').forEach(btn => btn.addEventListener('click', () => {
    stopTour();
    renderCase(btn.dataset.case);
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }));
  $('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {
    if (e.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; });
  $('#menu-toggle').addEventListener('click', () => {
    const open = $('#menu-toggle').getAttribute('aria-expanded') === 'true';
    $('#menu-toggle').setAttribute('aria-expanded',String(!open));
    $('#mobile-nav').hidden = open;
  });
  $$('#mobile-nav a').forEach(a => a.addEventListener('click', () => { $('#mobile-nav').hidden = true; $('#menu-toggle').setAttribute('aria-expanded','false'); }));
  document.addEventListener('keydown', e => { if(e.key === 'Escape') { $('#mobile-nav').hidden = true; $('#menu-toggle').setAttribute('aria-expanded','false'); stopTour(); } });

  const evidenceDialog = $('#evidence-dialog');
  $('#evidence-detail-button').addEventListener('click', () => {
    stopTour();
    $('#evidence-dialog-content').innerHTML = `<section>${evidenceMarkup('claim')}</section><section>${evidenceMarkup('verdict')}</section>`;
    $('#evidence-dialog-close').setAttribute('aria-label', t('关闭证据详情','Close evidence details'));
    evidenceDialog.showModal();
  });
  $('#evidence-dialog-close').addEventListener('click', () => evidenceDialog.close());
  evidenceDialog.addEventListener('click', e => {
    if (e.target !== evidenceDialog) return;
    const r = evidenceDialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) evidenceDialog.close();
  });
  document.addEventListener('paperrepro:pagechange', event => {
    if (event.detail?.id !== 'evidence') stopTour();
  });
  updateLanguage();
})();
