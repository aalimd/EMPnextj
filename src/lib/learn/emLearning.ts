// @ts-nocheck — verbatim legacy port (documented exception); see below.
/* eslint-disable */
/**
 * VERBATIM PORT of legacy `assets/em-learning.js` to a TypeScript ES module.
 * Clinical morphology, geometry and teaching text are unchanged.
 * New code must consume this module via the typed facade in `./api.ts`
 * (ECG) or the typed data modules (learning).
 */
import { EM_LEARNING_DATA } from '@/data/emLearning';
import { STUDENT_LEARNING } from './studentLearning';
import { ECG_EXPLORER } from '../ecg/explorer';

let EM_ECG_RECORDINGS = [];
export function setEcgRecordings(records) { EM_ECG_RECORDINGS = Array.isArray(records) ? records : []; }

/* EM Pocket learning workspace. Local content, local progress, no accounts. */
const D = EM_LEARNING_DATA;
    
    const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const progressKey = 'em-workspace-progress-v1';
    const backupKeys = ['em-cps-learning','em-cps-prefs','em-student-progress','em-ecg-learning-v1','em-ecg-practice-v1','em-learning-focus-v1',progressKey];
    const object = v => !!v && typeof v === 'object' && !Array.isArray(v);
    const own = (o,k) => Object.prototype.hasOwnProperty.call(o,k);
    let memory = {cases:{},viewed:[]}, volatile = false;
    const sessionKey='em-workspace-session-v1';
    const sessions = new Map();
    try { const stored=JSON.parse(sessionStorage.getItem(sessionKey)||'{}'); for(const c of D.cases){const x=stored[c.id];if(x&&Number.isInteger(x.index)&&x.index>=0&&x.index<c.steps.length&&Array.isArray(x.answers)&&x.answers.length>=x.index&&x.answers.length<=x.index+1&&x.answers.every((a,i)=>c.steps[i].options.some(o=>o.id===a))&&Number.isInteger(x.seed)&&!x.done)sessions.set(c.id,{index:x.index,answers:x.answers,seed:x.seed,done:false});} } catch (_) {}
    function persistSessions(){try{sessionStorage.setItem(sessionKey,JSON.stringify(Object.fromEntries([...sessions].filter(([,s])=>!s.done))));return true;}catch(_){return false;}}
    let caseFilter='all';
    function progress() {
        if (!volatile) { try { const v=JSON.parse(localStorage.getItem(progressKey)||'{}'); memory=normalizeProgress(v); } catch (_) {} }
        return memory;
    }
    function normalizeProgress(v) {
        const result={cases:{},viewed:[]};
        if (!object(v)) return result;
        for (const c of D.cases) {
            const x=object(v.cases)&&v.cases[c.id];
            if (object(x)&&Number.isInteger(x.correct)&&x.correct>=0&&x.correct<=c.steps.length&&x.total===c.steps.length&&Number.isInteger(x.runs)&&x.runs>0&&Number.isFinite(x.last)&&x.last>=0) result.cases[c.id]={correct:x.correct,total:x.total,runs:x.runs,last:x.last};
        }
        result.viewed=Array.isArray(v.viewed)?[...new Set(v.viewed.filter(id=>D.modules.some(m=>m.id===id)||['abg','lung','chest','ecg-pairs','recordings'].includes(id)))]:[];
        return result;
    }
    function saveProgress(value) {
        memory=normalizeProgress(value);
        try { localStorage.setItem(progressKey,JSON.stringify(memory)); volatile=false; return true; }
        catch (_) { volatile=true; return false; }
    }
    function sourceHtml(key) {
        const source=D.sources[key];
        return source?'<details class="workspace-source"><summary>Source and scope</summary><p>Supporting teaching points checked '+D.checked+'. This is an educational synthesis, not an independently peer-reviewed protocol.</p><a href="'+esc(source[1])+'" target="_blank" rel="noopener noreferrer">'+esc(source[0])+'</a><p>Confirm patient context, full recommendations and local policy. External sources need an internet connection.</p></details>':'';
    }
    function shell(title,description,active) {
        return '<section class="learning-workspace"><a class="back-btn" href="#">← Presentation library</a><p class="study-kicker">EM POCKET · LEARNING WORKSPACE</p><h1 tabindex="-1">'+esc(title)+'</h1><p class="workspace-lead">'+esc(description)+'</p><nav class="workspace-tabs" aria-label="Learning workspace">'+[['practice','Practice'],['visuals','Visual learning'],['skills','Procedures & teams'],['progress','My progress']].map(([id,label])=>'<a href="#learn~'+id+'"'+(id===active?' aria-current="page"':'')+'>'+label+'</a>').join('')+'</nav><div class="workspace-body"></div></section>';
    }
    function homeHtml() {
        return '<section class="workspace-entry" aria-label="Choose how to use EM Pocket">' +
            '<a href="#presentationLibrary" data-browse-library="1"><span>01 · Presentations</span><strong>Rosen’s Clinical Frameworks</strong><p>Explore 30+ emergency complaints with prioritized differentials, red flags, first minutes and disposition.</p></a>' +
            '<a href="#ecg"><span>02 · ECG Masterclass</span><strong>10-Step ECG Curriculum &amp; Explorer</strong><p>Master rate, rhythm, axis, and ischemia from scratch with interactive 12-lead waveforms.</p></a>' +
            '<a href="#learn~practice"><span>03 · Decision Practice</span><strong>Simulated Patient Scenarios</strong><p>Test your reasoning in evolving clinical cases, manage deterioration, and review debriefs.</p></a>' +
            '</section>';
    }
    function caseCards() {
        const p=progress();
        return '<label for="caseFilter">Show cases</label><select id="caseFilter">'+[['all','All cases'],['continue','In progress'],['review','Incorrect decisions to revisit'],['new','Not yet attempted']].map(([id,label])=>'<option value="'+id+'"'+(caseFilter===id?' selected':'')+'>'+label+'</option>').join('')+'</select><p class="workspace-session-note">Unfinished decisions resume in this browser tab after reload. Completed attempts are saved on this device.</p><div class="workspace-grid">'+D.cases.filter(c=>caseFilter==='all'||(caseFilter==='continue'?sessions.has(c.id)&&!sessions.get(c.id).done:caseFilter==='review'?p.cases[c.id]&&p.cases[c.id].correct<p.cases[c.id].total:!p.cases[c.id])).map(c=>{const done=p.cases[c.id];return '<a class="workspace-card" href="#learn~case-'+c.id+'"><span class="study-kicker">'+esc(c.domain)+'</span><h2>'+esc(c.title)+'</h2><p>3 decisions · evolving fictional case</p><span>'+(sessions.has(c.id)&&!sessions.get(c.id).done?'Continue this session':done?'Latest attempt: '+done.correct+'/'+done.total+' correct':'Start case')+' →</span></a>';}).join('')+'</div><div class="workspace-callout"><h2>Prefer a short question set?</h2><p>The original 12 clinical cases and the ECG practice library are still available.</p><div class="workspace-actions"><a href="#study~case">Short clinical cases →</a><a href="#ecg-explorer~practice">ECG practice →</a><a href="#study~due">Review queue →</a></div></div>';
    }
    function newSession() { return {index:0,answers:[],done:false,seed:Math.floor(Math.random()*100000)}; }
    function mountCase(body,id) {
        const c=D.cases.find(c=>c.id===id);
        if(!c){body.innerHTML='<p>Case not found. <a href="#learn~practice">Choose a case</a>.</p>';return;}
        let s=sessions.get(id);if(!s){s=newSession();sessions.set(id,s);}
        function draw(focus=false) {
            const q=c.steps[s.index], selected=s.answers[s.index], complete=s.done;const depth=STUDENT_LEARNING.getFocus();const objective=depth==='core'?'Identify the immediate threat and explain your first action.':depth==='applied'?'Connect each change to reassessment, escalation and disposition.':'Explain the failed alternatives and lead a debrief using this case’s three discussion questions.';
            body.innerHTML='<article class="evolving-case"><p class="study-kicker">'+esc(c.domain)+' · FICTIONAL TEACHING CASE</p><h2 tabindex="-1">'+esc(c.title)+'</h2><p class="case-prompt">'+esc(c.stem)+'</p><p class="workspace-session-note">'+esc(depth.charAt(0).toUpperCase()+depth.slice(1))+' focus · '+objective+'</p>'+(complete?'<section class="workspace-result"><h3>Case debrief</h3><p>'+s.answers.filter((a,i)=>c.steps[i].options.find(o=>o.id===a).correct).length+' / '+c.steps.length+' first choices correct in this attempt. This is a learning result, not a competency score.</p><ol>'+c.steps.map((x,i)=>'<li><strong>'+esc(x.prompt)+'</strong><p>Your choice: '+esc(x.options.find(o=>o.id===s.answers[i]).text)+'</p><p>'+esc(x.options.find(o=>o.correct).why)+'</p></li>').join('')+'</ol><h3>Discuss with a colleague</h3><ul>'+c.debrief.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul><p role="status">'+(s.saved?'Attempt saved on this device.':'Attempt available for this session only; storage is unavailable.')+'</p></section>':'<p class="workspace-step">Decision '+(s.index+1)+' of '+c.steps.length+'</p><div class="case-update"><strong>Teaching update</strong><p>'+esc(q.update)+'</p></div><fieldset class="quiz-question"><legend>'+esc(q.prompt)+'</legend><div class="quiz-options">'+STUDENT_LEARNING.shuffled(q.options,s.seed+s.index*97).map(o=>'<button type="button" data-evolving-choice="'+o.id+'"'+(selected?' disabled':'')+' class="quiz-option'+(selected&&o.id===selected?(o.correct?' correct':' incorrect'):'')+'">'+esc(o.text)+'</button>').join('')+'</div></fieldset>'+(selected?'<div class="workspace-feedback" role="status"><h3>'+(q.options.find(o=>o.id===selected).correct?'Correct for this scenario':'Review this decision')+'</h3><p>'+esc(q.options.find(o=>o.id===selected).why)+'</p><details><summary>Compare all options</summary>'+q.options.map(o=>'<p><strong>'+esc(o.text)+'</strong> '+esc(o.why)+'</p>').join('')+'</details><p>Each next update describes the teaching team’s actions, independently of your choice.</p><button class="workspace-primary" type="button" data-case-next>'+(s.index===c.steps.length-1?'Open debrief':'Continue case')+'</button></div>':''))+'<div class="workspace-actions">'+(complete?'<button type="button" data-case-retry>Start a new attempt</button>':'')+'<a href="#'+esc(c.topic)+'">Full presentation →</a><a href="#learn~practice">All evolving cases →</a></div>'+sourceHtml(c.source)+'</article>';
            body.querySelectorAll('[data-evolving-choice]').forEach(b=>b.addEventListener('click',()=>{if(s.answers[s.index])return;s.answers[s.index]=b.dataset.evolvingChoice;const retained=persistSessions();draw();if(!retained)body.querySelector('.workspace-feedback').insertAdjacentHTML('beforeend','<p>Reload recovery is unavailable; keep this tab open.</p>');body.querySelector('.workspace-feedback h3').setAttribute('tabindex','-1');body.querySelector('.workspace-feedback h3').focus();}));
            body.querySelector('[data-case-next]')?.addEventListener('click',()=>{if(!s.answers[s.index])return;if(s.index<c.steps.length-1)s.index++;else if(!s.done){s.done=true;const p=progress();p.cases[id]={correct:s.answers.filter((a,i)=>c.steps[i].options.find(o=>o.id===a).correct).length,total:c.steps.length,runs:(p.cases[id]?.runs||0)+1,last:Date.now()};s.saved=saveProgress(p);}persistSessions();draw(true);});
            body.querySelector('[data-case-retry]')?.addEventListener('click',()=>{s=newSession();sessions.set(id,s);persistSessions();draw(true);});
            if(focus)body.querySelector('h2').focus();
        }
        draw();
    }
    function moduleCards() {
        return '<p>Preparation and discussion exercises. Practical skills still require supervised training and local credentialing.</p><div class="workspace-grid">'+D.modules.map(m=>'<a class="workspace-card" href="#learn~module-'+m.id+'"><span class="study-kicker">'+esc(m.kind)+'</span><h2>'+esc(m.title)+'</h2><p>'+esc(m.intro)+'</p><span>Open exercise →</span></a>').join('')+'</div>';
    }
    function readButton(id) {return '<button type="button" data-module-read="'+esc(id)+'">'+(progress().viewed.includes(id)?'✓ Read on this device':'Mark as read')+'</button><p class="module-save" role="status"></p>';}
    function bindRead(body) {body.querySelector('[data-module-read]')?.addEventListener('click',e=>{const p=progress();p.viewed.push(e.target.dataset.moduleRead);const ok=saveProgress(p);e.target.textContent='✓ Read';body.querySelector('.module-save').textContent=ok?'Reading activity saved. This does not certify a skill.':'Reading activity remembered for this session only.';});}
    function mountModule(body,id) {
        const m=D.modules.find(m=>m.id===id);if(!m){body.innerHTML='<p>Module not found.</p>';return;}
        body.innerHTML='<article><p class="study-kicker">'+esc(m.kind)+'</p><h2>'+esc(m.title)+'</h2><p>'+esc(m.intro)+'</p><div class="workspace-grid">'+m.sections.map(([title,points])=>'<section class="workspace-card"><h3>'+esc(title)+'</h3><ul>'+points.map(t=>'<li>'+esc(t)+'</li>').join('')+'</ul></section>').join('')+'</div><fieldset class="workspace-readiness"><legend>Preparation rehearsal</legend><p>Tick each section after explaining it aloud. This is a temporary rehearsal, not a clinical checklist or sign-off.</p>'+m.sections.map(([title],i)=>'<label><input type="checkbox" data-readiness="'+i+'"> I can explain '+esc(title.toLowerCase())+'</label>').join('')+'<p data-readiness-status role="status">0 / '+m.sections.length+' sections rehearsed</p></fieldset><section class="workspace-callout"><h3>Pause and explain</h3><p>'+esc(m.question)+'</p><details><summary>Compare your explanation</summary><p>'+esc(m.answer)+'</p></details></section><div class="workspace-actions">'+readButton(id)+'<a href="#'+esc(m.topic)+'">Related presentation →</a></div>'+sourceHtml(m.source)+'</article>';body.querySelectorAll('[data-readiness]').forEach(box=>box.addEventListener('change',()=>{body.querySelector('[data-readiness-status]').textContent=body.querySelectorAll('[data-readiness]:checked').length+' / '+m.sections.length+' sections rehearsed';}));bindRead(body);
    }
    const visuals=[['recordings','Recorded ECGs: compare real examples','Four anonymized 12-lead recordings with original signals and source labels.'],['abg','Blood gases: primary and mixed processes','Compare two fictional arterial samples and their expected compensation.'],['lung','Lung ultrasound: artifacts and limits','Compare schematic A-lines and B-lines; discuss what a static picture cannot establish.'],['chest','Chest imaging: look beyond the obvious','Compare diagrammed peripheral markings with a pleural-line pattern.'],['ecg-pairs','ECG: compare related patterns','Inspect existing examples together and explain similarities and differences.']];
    function visualCards(){return '<p>Choose real recorded ECGs or clearly labelled teaching diagrams. Compare observations before opening the explanation.</p><div class="workspace-grid">'+visuals.map(([id,title,text])=>'<a class="workspace-card" href="#learn~visual-'+id+'"><h2>'+title+'</h2><p>'+text+'</p><span>Explore →</span></a>').join('')+'</div>';}
    function diagram(type,variant) {
        const frame='<svg viewBox="0 0 440 270" role="img" aria-label="'+(type==='lung'?'Schematic ultrasound artifacts':'Schematic chest markings')+'"><rect width="440" height="270" rx="10" fill="#111b28"/>';
        if(type==='lung')return frame+'<path d="M20 48H420" stroke="#fff" stroke-width="4"/>'+[98,148,198,248].map(y=>'<path d="M20 '+y+'H420" stroke="#94a3b8" stroke-width="2"/>').join('')+(variant?[105,220,335].map(x=>'<path d="M'+x+' 48V268" stroke="#fff" stroke-width="12"/>').join(''):'')+'<text x="22" y="32" fill="white" font-size="18">Pleural interface (schematic)</text></svg>';
        const lungs='<path d="M206 50C135 10 65 85 62 215Q120 250 197 225Z M234 50C305 10 375 85 378 215Q320 250 243 225Z" fill="none" stroke="#94a3b8" stroke-width="3"/>';
        const marks=[80,110,140,170,200].map(y=>'<path d="M180 100L90 '+y+' M180 115L150 '+(y+30)+' M260 100L'+(variant?285:350)+' '+y+'" stroke="#8494a8" stroke-width="2"/>').join('');
        return frame+lungs+marks+(variant?'<path d="M290 49Q334 115 320 221" fill="none" stroke="#fff" stroke-width="3"/>':'')+'<text x="24" y="28" fill="white" font-size="16">Anatomy simplified · not a radiograph</text></svg>';
    }
    function mountVisual(body,id) {
        if(id==='recordings'){mountRecordings(body);return;}const v=visuals.find(v=>v[0]===id);if(!v){body.innerHTML='<p>Visual lesson not found.</p>';return;}
        let source='lung',content='';
        if(id==='abg') {
            source='abg';content='<p>Both fictional arterial samples have bicarbonate 12 mmol/L. Decide whether the respiratory response fits before revealing the interpretation.</p><div class="workspace-grid">'+[['A','7.29','26'],['B','7.10','40']].map(([label,ph,co2])=>'<section class="workspace-card"><h3>Sample '+label+'</h3><dl class="gas-values"><div><dt>pH</dt><dd>'+ph+'</dd></div><div><dt>PaCO₂</dt><dd>'+co2+' mmHg</dd></div><div><dt>HCO₃⁻</dt><dd>12 mmol/L</dd></div></dl></section>').join('')+'</div><details class="workspace-callout"><summary>Reveal the interpretation</summary><p>Both show acidemia with a metabolic acidosis. Expected PaCO₂ ≈ 1.5 × 12 + 8 ± 2 = 24–28 mmHg.</p><p>A fits the expected respiratory compensation. B has a higher PaCO₂ than expected, suggesting an additional respiratory acidosis.</p><p>This comparison does not establish the cause. Assess the clinical context, electrolytes, albumin-adjusted anion gap and relevant investigations. Approximate values are rounded for teaching; this is not a patient calculator.</p></details>';
        } else if(id==='lung') {
            content='<div class="workspace-grid"><figure class="workspace-card">'+diagram('lung',false)+'<figcaption>Horizontal reverberation pattern</figcaption></figure><figure class="workspace-card">'+diagram('lung',true)+'<figcaption>Vertical artifacts crossing the field</figcaption></figure></div><details class="workspace-callout"><summary>What should you notice?</summary><p>A-lines are horizontal artifacts. B-lines arise at the pleural interface, extend to depth and erase crossing A-lines.</p><p>B-lines alone do not identify the cause. Distribution and clinical context matter. This static diagram cannot demonstrate lung sliding; absent sliding alone is not specific for pneumothorax.</p><p>In supervised scanning, identify the rib shadows and pleural line, scan multiple sites, and distinguish true pleural motion from probe movement.</p></details>';
        } else if(id==='chest') {
            source='chest-image';content='<div class="workspace-grid"><figure class="workspace-card">'+diagram('chest',false)+'<figcaption>Diagram A: markings extend toward the periphery</figcaption></figure><figure class="workspace-card">'+diagram('chest',true)+'<figcaption>Diagram B: a pleural line with absent markings beyond it</figcaption></figure></div><details class="workspace-callout"><summary>Interpret the pattern and its limits</summary><p>The second diagram illustrates a pneumothorax pattern. This simplified drawing cannot teach all radiographic appearances, exclude a small pneumothorax or establish tension physiology.</p><p>Use the patient’s condition and the full image. Severe compromise with clinically suspected tension pneumothorax may require treatment before imaging.</p><p>Before interpreting a real image, check identity, side, projection, exposure and the rest of the chest. Obtain appropriate review when uncertain.</p></details>';
        } else {
            source='acs';content='<label for="ecgPair">Choose a comparison</label><select id="ecgPair"><option value="wellens-a,wellens-b">Wellens: two existing variants</option><option value="normal,af">Normal sinus and atrial fibrillation</option><option value="inferior-stemi,anterior-stemi">Inferior and anterior ST-elevation distributions</option></select><p>Compare morphology and distribution. These are separate synthetic teaching examples, not serial patient recordings. Open Explorer for full-size findings and each pattern’s limitations.</p><div class="workspace-grid" data-pair-images></div>';
        }
        body.innerHTML='<article><h2>'+esc(v[1])+'</h2><p class="workspace-media-label">SCHEMATIC / SYNTHETIC TEACHING MATERIAL</p>'+content+'<div class="workspace-actions">'+readButton(id)+'</div>'+sourceHtml(source)+(id==='chest'?sourceHtml('trauma'):id==='ecg-pairs'?sourceHtml('als'):'')+'</article>';
        if(id==='ecg-pairs') { const select=body.querySelector('#ecgPair');const draw=()=>{body.querySelector('[data-pair-images]').innerHTML=select.value.split(',').map(id=>{const item=ECG_EXPLORER.build(id);return '<figure class="workspace-card workspace-ecg"><figcaption>'+esc(item.record.name)+'</figcaption>'+item.svg+'<a href="#ecg-explorer~'+id+'">Inspect this tracing →</a></figure>';}).join('');};select.addEventListener('change',draw);draw(); }
        bindRead(body);
    }
    function mountRecordings(body) {
        const records=EM_ECG_RECORDINGS||[];
        if(!records.length){body.innerHTML='<p>Recordings unavailable. Reload when connected to finish updating the offline library.</p>';return;}
        body.innerHTML='<article><h2>Interpret a recorded ECG</h2><p class="workspace-media-label">ANONYMIZED CLINICAL RECORDINGS · PTB-XL 1.0.3</p><p>Describe rate, regularity, atrial activity and QRS morphology before revealing the dataset label. These recordings have no accompanying acute clinical scenario.</p><div class="recording-controls"><label>Recording<select data-recording>'+records.map((r,i)=>'<option value="'+i+'">Example '+(i+1)+' · record '+r.id+'</option>').join('')+'</select></label><label>Lead<select data-recording-lead>'+records[0].leads.map((l,i)=>'<option value="'+i+'"'+(i===1?' selected':'')+'>'+esc(l.name)+'</option>').join('')+'</select></label><label>Time window<select data-recording-time><option value="0">0–4 seconds</option><option value="3">3–7 seconds</option><option value="6">6–10 seconds</option></select></label></div><div data-recording-plot></div><p>Grid: one large box = 0.2 seconds × 0.5 mV. Digital display size changes with your screen; do not measure with a physical ruler. Scroll horizontally on small screens.</p><details class="workspace-callout" data-recording-answer><summary>Reveal source label and compare</summary><div data-recording-label></div><p>Compare two examples with the same label: real morphology varies. Then compare the other pair. A dataset label is not a complete diagnosis or a treatment plan; inspect all leads and the clinical context.</p></details><details class="workspace-source"><summary>Source, licence and transformations</summary><p>Wagner P, Strodthoff N, Bousseljot R, Samek W, Schaeffter T (2022). PTB-XL, version 1.0.3. PhysioNet.</p><a href="https://doi.org/10.13026/kfzx-aw45" target="_blank" rel="noopener noreferrer">Dataset and documentation</a><p>Original publication: Wagner et al., Scientific Data (2020), <a href="https://doi.org/10.1038/s41597-020-0495-6" target="_blank" rel="noopener noreferrer">PTB-XL: A Large Publicly Available ECG Dataset</a>.</p><p>PhysioNet: Pollard et al. (2026), <a href="https://doi.org/10.1038/s44360-026-00096-z" target="_blank" rel="noopener noreferrer">PhysioNet as a global platform for biomedical research</a>.</p><p>Licensed under <a href="./assets/ptb-xl-LICENSE.txt">Creative Commons Attribution 4.0</a>. Converted WFDB integer samples to local JavaScript and SVG windows. Original 500 Hz samples retained without filtering or resampling; values converted from microvolts to mV for display. No patient demographics are included.</p></details><div class="workspace-actions">'+readButton('recordings')+'<a href="#ecg-explorer">Synthetic patterns and explanations →</a></div></article>';
        const draw=()=>{
            const r=records[Number(body.querySelector('[data-recording]').value)],lead=r.leads[Number(body.querySelector('[data-recording-lead]').value)],start=Number(body.querySelector('[data-recording-time]').value);
            const sample=lead.uv.slice(start*500,(start+4)*500);
            const extent=Math.max(2,Math.ceil(Math.max(...sample.map(Math.abs))/1000)+.5),height=extent*80+60,mid=height/2;
            const path=sample.map((uv,i)=>(i?'L':'M')+(50+i/5).toFixed(1)+' '+(mid-uv/1000*40).toFixed(2)).join(' ');
            body.querySelector('[data-recording-plot]').innerHTML='<div class="recording-scroll" tabindex="0" role="region" aria-label="Recorded ECG waveform; scroll horizontally"><svg viewBox="0 0 500 '+height+'" role="img" aria-label="Record '+r.id+', lead '+esc(lead.name)+', '+start+' to '+(start+4)+' seconds"><defs><pattern id="recordingGrid" width="20" height="20" patternUnits="userSpaceOnUse" x="50" y="'+mid+'"><path d="M20 0H0V20" fill="none" stroke="#d7959c" stroke-width=".6"/></pattern></defs><rect width="500" height="'+height+'" fill="#fffafa"/><rect x="50" y="20" width="400" height="'+(height-40)+'" fill="url(#recordingGrid)"/><path d="M12 '+mid+'h8v-40h20v40h5" fill="none" stroke="#172536" stroke-width="1.5"/><path d="'+path+'" fill="none" stroke="#172536" stroke-width="1.1"/><text x="50" y="16" fill="#172536" font-size="12">'+esc(lead.name)+' · 1 mV calibration · 500 Hz</text><text x="50" y="'+(height-6)+'" fill="#172536" font-size="12">'+start+' s</text><text x="430" y="'+(height-6)+'" fill="#172536" font-size="12">'+(start+4)+' s</text></svg></div>';
            body.querySelector('[data-recording-label]').innerHTML='<p><strong>Record '+r.id+': '+esc(r.label)+'</strong></p><a href="https://physionet.org/content/ptb-xl/1.0.3/'+esc(r.sourcePath)+'.hea" target="_blank" rel="noopener noreferrer">Original recording header →</a>';
        };
        body.querySelectorAll('.recording-controls select').forEach(select=>select.addEventListener('change',()=>{if(select.hasAttribute('data-recording'))body.querySelector('[data-recording-answer]').open=false;draw();}));draw();bindRead(body);
    }
    function safeTree(value,depth=0) {
        if(depth>12)throw Error('Backup nesting is too deep.');
        if(value===null||typeof value==='boolean')return;
        if(typeof value==='number'){if(!Number.isFinite(value))throw Error('Invalid number.');return;}
        if(typeof value==='string'){if(value.length>100000)throw Error('A backup field is too long.');return;}
        if(Array.isArray(value)){if(value.length>5000)throw Error('Too many backup entries.');value.forEach(v=>safeTree(v,depth+1));return;}
        if(!object(value))throw Error('Invalid backup value.');
        for(const [k,v] of Object.entries(value)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Unsafe backup property.');safeTree(v,depth+1);}
    }
    function validateBackup(text) {
        if(typeof text!=='string'||text.length>2000000)throw Error('Choose an EM Pocket JSON backup smaller than 2 MB.');
        const data=JSON.parse(text);safeTree(data);
        if(!object(data)||data.app!=='EM Pocket free'||data.version!==1||!object(data.values))throw Error('This is not a supported EM Pocket backup.');
        const fields=(v,allowed)=>Object.keys(v).every(k=>allowed.includes(k));
        const timestamp=v=>Number.isFinite(v)&&v>=0;
        for(const [key,value] of Object.entries(data.values)) {
            if(!backupKeys.includes(key))throw Error('Backup contains an unsupported storage key.');
            if(key==='em-learning-focus-v1'){if(!['core','applied','advanced'].includes(value))throw Error('Invalid learning depth.');}
            else if(key==='em-ecg-practice-v1'){if(!Array.isArray(value)||!value.every(x=>typeof x==='string'))throw Error('Invalid ECG attempts.');}
            else if(!object(value))throw Error('Invalid progress record.');
            if(key==='em-cps-learning') {
                if(!Object.keys(value).every(k=>['reviewed','reviewPlan','saved','notes'].includes(k))||!Object.values(value).every(object))throw Error('Invalid learning fields.');
                if(value.notes&&!Object.values(value.notes).every(v=>typeof v==='string'))throw Error('Invalid notes.');
                for(const k of ['reviewed','saved'])if(value[k]&&!Object.values(value[k]).every(v=>typeof v==='boolean'||timestamp(v)))throw Error('Invalid topic activity.');
                if(value.reviewPlan&&!Object.values(value.reviewPlan).every(v=>object(v)&&fields(v,['stage','dueAt'])&&Number.isInteger(v.stage)&&v.stage>=0&&v.stage<=4&&timestamp(v.dueAt)))throw Error('Invalid review schedule.');
            }
            if(key==='em-cps-prefs' && (!fields(value,['theme','accent','scale','bold','sidebar'])||(value.theme!==undefined&&!['light','dark'].includes(value.theme))||(value.accent!==undefined&&!['emerald','ocean','violet','rose','amber','teal'].includes(value.accent))||(value.scale!==undefined&&![.85,1,1.12,1.25,1.4].includes(value.scale))||['bold','sidebar'].some(k=>value[k]!==undefined&&typeof value[k]!=='boolean')))throw Error('Invalid reading preferences.');
            if(key==='em-student-progress' && (!fields(value,['ratings','last'])||(value.ratings&&(!object(value.ratings)||!Object.values(value.ratings).every(v=>object(v)&&fields(v,['value','at'])&&['got','partly','again'].includes(v.value)&&timestamp(v.at))))||(value.last!==undefined&&typeof value.last!=='string')))throw Error('Invalid self-assessment record.');
            if(key==='em-ecg-learning-v1' && (!fields(value,['last','finding','completed','review'])||(value.last!==undefined&&typeof value.last!=='string')||(value.finding!==undefined&&(!Number.isInteger(value.finding)||value.finding<0))))throw Error('Invalid ECG location.');
            if(key==='em-ecg-learning-v1' && ['completed','review'].some(k=>value[k]!==undefined&&(!Array.isArray(value[k])||!value[k].every(x=>typeof x==='string'))))throw Error('Invalid ECG learning record.');
            if(key===progressKey && (!fields(value,['cases','viewed'])||!object(value.cases)||!Array.isArray(value.viewed)||Object.keys(normalizeProgress(value).cases).length!==Object.keys(value.cases).length||normalizeProgress(value).viewed.length!==value.viewed.length))throw Error('Invalid workspace progress.');
        }
        return data;
    }
    function exportBackup() {
        const values={};
        for(const key of backupKeys){const raw=localStorage.getItem(key);if(raw!==null)values[key]=key==='em-learning-focus-v1'?raw:JSON.parse(raw);}
        const data={app:'EM Pocket free',version:1,created:new Date().toISOString(),values};
        validateBackup(JSON.stringify(data));return data;
    }
    // Existing values win conflicts. Arrays add missing entries; no whole-origin enumeration.
    function mergeExisting(existing,incoming) {
        if(existing===undefined)return incoming;
        if(Array.isArray(existing)&&Array.isArray(incoming))return [...new Set([...existing,...incoming])];
        if(object(existing)&&object(incoming)){const result={...existing};for(const [k,v]of Object.entries(incoming))result[k]=mergeExisting(own(existing,k)?existing[k]:undefined,v);return result;}
        return existing;
    }
    function importBackup(data) {
        const checked=validateBackup(JSON.stringify(data)),writes=[],originals=[];
        for(const [key,value] of Object.entries(checked.values)) {
            const raw=localStorage.getItem(key);const old=raw===null?undefined:key==='em-learning-focus-v1'?raw:JSON.parse(raw);
            const merged=mergeExisting(old,value);writes.push([key,key==='em-learning-focus-v1'?merged:JSON.stringify(merged)]);originals.push([key,raw]);
        }
        let count=0;
        try{for(const [key,value]of writes){localStorage.setItem(key,value);count++;}}
        catch(error){let failed=false;for(const [key,raw]of originals.slice(0,count)){try{if(raw===null)localStorage.removeItem(key);else localStorage.setItem(key,raw);}catch(_){failed=true;}}throw Error(failed?'Import interrupted; restoration was incomplete. Keep your backup and check saved progress.':'Import could not be saved. Original stored data was restored.');}
        return writes.length;
    }
    function download(data,name) {const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
    function mountProgress(body) {
        const p=progress(),done=Object.keys(p.cases),review=done.filter(id=>p.cases[id].correct<p.cases[id].total);
        body.innerHTML='<h2>Your learning record</h2><p>Reading, attempted decisions and self-confidence describe different activities. None is a certification of clinical competence.</p><div class="workspace-grid"><section class="workspace-card"><h3>'+done.length+' / '+D.cases.length+' evolving cases attempted</h3><p>Results below show the latest completed attempt.</p></section><section class="workspace-card"><h3>'+p.viewed.length+' modules marked read</h3><p>Reading is recorded separately from correct answers.</p></section><section class="workspace-card"><h3>'+review.length+' cases to revisit</h3><p>Suggested from incorrect first choices.</p>'+(review.length?'<a href="#learn~case-'+esc(review[0])+'">Revisit a case →</a>':'<p>No incorrect completed cases to revisit.</p>')+'</section></div><ul class="workspace-progress-list">'+D.cases.map(c=>'<li><a href="#learn~case-'+c.id+'">'+esc(c.title)+'</a><span>'+(p.cases[c.id]?p.cases[c.id].correct+'/'+p.cases[c.id].total+' correct · '+p.cases[c.id].runs+' completed attempt(s)':'Not yet attempted')+'</span></li>').join('')+'</ul><div class="workspace-actions"><a href="#study~due">Scheduled topic reviews →</a><a href="#study~saved">Saved topics & notes →</a><a href="#ecg-explorer">ECG learning record →</a></div><section class="workspace-callout"><h2>Back up your learning</h2><p>Export saved progress, reading preferences and notes to a local JSON file. Session-only activity is not included. The file may contain your personal study notes; keep it private and avoid patient details.</p><div class="workspace-actions"><button type="button" data-backup-export>Export backup</button><label class="backup-label">Choose a backup to import<input type="file" accept=".json,application/json" data-backup-file></label></div><p>Import adds missing records and keeps existing values when they conflict. It does not transfer an agreement or clear existing progress.</p><div data-backup-preview></div><p data-backup-status role="status"></p></section>';
        const status=body.querySelector('[data-backup-status]'),preview=body.querySelector('[data-backup-preview]');let pending=null;
        body.querySelector('[data-backup-export]').addEventListener('click',()=>{try{download(exportBackup(),'em-pocket-learning-'+new Date().toISOString().slice(0,10)+'.json');status.textContent='Backup prepared for download.';}catch(_){status.textContent='Backup could not be read. Storage may be unavailable or contain an invalid record. Nothing was changed.';}});
        let selection=0;
        body.querySelector('[data-backup-file]').addEventListener('change',async e=>{const ticket=++selection;pending=null;preview.innerHTML='';const file=e.target.files[0];if(!file)return;try{if(file.size>2000000)throw Error('Choose a backup smaller than 2 MB.');const parsed=validateBackup(await file.text());if(ticket!==selection)return;pending=parsed;preview.innerHTML='<p>Valid EM Pocket backup · '+Object.keys(parsed.values).length+' storage groups. Existing values will be kept.</p><button type="button" data-backup-apply>Add missing records</button>';preview.querySelector('button').addEventListener('click',()=>{try{const count=importBackup(pending);preview.innerHTML='<button type="button" data-backup-reload>Reload to use imported data</button>';preview.querySelector('button').onclick=()=>location.reload();status.textContent=count+' storage groups processed. Reload after finishing any session-only work.';pending=null;}catch(error){status.textContent=error.message;}});status.textContent='Review the import above before applying it.';}catch(error){if(ticket===selection)status.textContent=error.message;}});
    }
    function mount(stage,target='practice') {
        const active=target.startsWith('case-')?'practice':target.startsWith('module-')?'skills':target.startsWith('visual-')?'visuals':['practice','visuals','skills','progress'].includes(target)?target:'practice';
        const titles={practice:['Practice decisions that evolve','From first assessment to reassessment, disposition and debrief.'],visuals:['Learn to interpret, then explain','Use visual comparisons to connect findings with their limitations.'],skills:['Prepare the procedure. Prepare the team.','Short exercises for supervised practice, handover and teaching.'],progress:['Keep your learning connected','Review your attempts and keep a portable copy of your saved learning.']};
        stage.innerHTML=shell(...titles[active],active);const body=stage.querySelector('.workspace-body');
        if(/^(case|module|visual)-/.test(target))stage.querySelector('.learning-workspace').classList.add('workspace-detail');if(target.startsWith('case-'))mountCase(body,target.slice(5));else if(target.startsWith('module-'))mountModule(body,target.slice(7));else if(target.startsWith('visual-'))mountVisual(body,target.slice(7));else if(active==='progress')mountProgress(body);else body.innerHTML=active==='practice'?caseCards():active==='skills'?moduleCards():visualCards();
        if(active==='practice'&&!target.startsWith('case-')&&!body.querySelector('.workspace-grid .workspace-card'))body.querySelector('.workspace-grid')?.insertAdjacentHTML('afterend','<p role="status">No cases match this filter. Choose All cases to explore the library.</p>');
        body.querySelector('#caseFilter')?.addEventListener('change',e=>{caseFilter=e.target.value;mount(stage,'practice');stage.querySelector('#caseFilter').focus();});
        stage.querySelector('h1').focus({preventScroll:true});window.scrollTo({top:0});
    }
    function reassessmentHtml(cp) {
        return '<details class="reassessment-guide"><summary>Before the next decision · reassess and hand over</summary><div><p>Use these learning prompts with the presentation’s pathway. They are not discharge criteria.</p><ol><li><strong>Reassess:</strong> compare symptoms, observations and examination with the initial assessment and response to treatment.</li><li><strong>Warning signs for '+esc(cp.name)+':</strong><ul>'+((cp.redFlags||[]).map(t=>'<li>'+esc(t)+'</li>').join(''))+'</ul></li><li><strong>Reconsider:</strong> check unresolved findings and alternative explanations, including the pitfalls below.</li><li><strong>Escalate:</strong> communicate deterioration, uncertainty or needs beyond the current setting.</li><li><strong>Plan the transition:</strong> identify outstanding results, responsibility for follow-up, patient understanding and specific return advice.</li></ol><a href="#'+esc(cp.id)+'~disposition">Review this presentation’s disposition pathway →</a><a href="#learn~module-handover">Practice a handover →</a></div></details>';
    }
    function evidenceContext(id) {
        const contexts={
            'chest-pain':['Troponin pathways','Identify the assay, symptom timing and the validated pathway used locally. A result inside the reference range is not automatically a complete rule-out.','acs'],
            'multiple-trauma':['Resources and definitive care','Check the local trauma activation, trained procedural team and transfer arrangements. Imaging availability does not remove the need to respond to instability.','trauma'],
            'pediatric-respiratory-distress':['Age and clinical course','Check age, underlying conditions, feeding and episodes of apnea against the full pediatric pathway. One improved observation does not describe the whole course.','pediatric'],
            'pregnancy-emergency':['Escalation and access','Know the local route to urgent obstetric/gynecologic assessment and supported transfer. Clinical instability must guide the urgency while tests are pending.','pregnancy'],
            'overdose':['Exposure and observation','The substance, recurrence and clinical course affect treatment and monitoring needs. Use substance-specific guidance and toxicology advice rather than one fixed observation period.','opioid'],
            'suicidal':['Assessment and safety planning','A numeric risk category must not determine discharge after self-harm. Use an individual psychosocial assessment and a collaborative plan, alongside local legal and safeguarding requirements.','mental']
        };
        const item=contexts[id];if(!item)return '';
        return '<div class="workspace-callout evidence-context"><h3>'+esc(item[0])+'</h3><p>'+esc(item[1])+'</p>'+sourceHtml(item[2])+'</div>';
    }
    function searchItems(){return [...D.cases.map(c=>({cpId:'learn',target:'case-'+c.id,title:c.title,sub:c.domain+' evolving case',kind:'Practice'})),...D.modules.map(m=>({cpId:'learn',target:'module-'+m.id,title:m.title,sub:m.kind,kind:'Skills'})),...visuals.map(([id,title,text])=>({cpId:'learn',target:'visual-'+id,title,sub:text,kind:'Visual learning'})),{cpId:'learn',target:'progress',title:'Export or import learning backup',sub:'Progress, saved notes and preferences',kind:'My progress'}];}
    export const EM_LEARNING={mount,homeHtml,reassessmentHtml,evidenceContext,searchItems,progress,saveProgress,normalizeProgress,validateBackup,exportBackup,importBackup,mergeExisting,backupKeys,visuals};
