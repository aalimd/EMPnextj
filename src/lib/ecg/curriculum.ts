// @ts-nocheck — verbatim legacy port (documented exception); see below.
/* eslint-disable */
/**
 * VERBATIM PORT of legacy `assets/ecg-curriculum.js` to a TypeScript ES module.
 * Clinical morphology, geometry and teaching text are unchanged.
 * New code must consume this module via the typed facade in `./api.ts`
 * (ECG) or the typed data modules (learning).
 */
import { ECG_ENGINE } from './engine';
import { ECG_INTERACTIVE } from './interactive';
import { ECG_SVG } from './svgLibrary';

/* Essential ECG curriculum: authored teaching strips and existing reviewed panels. */
const E=ECG_ENGINE, I=ECG_INTERACTIVE, lib=ECG_SVG;
 const sources={rhythm:{label:'AHA 2025 · Adult advanced life support',url:'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-advanced-life-support'},block:{label:'AV block · clinical reference',url:'https://www.merckmanuals.com/professional/cardiovascular-disorders/specific-cardiac-arrhythmias/atrioventricular-block'},bbb:{label:'Bundle branch block · clinical reference',url:'https://www.msdmanuals.com/professional/cardiovascular-disorders/specific-cardiac-arrhythmias/bundle-branch-block-and-fascicular-block'},acs:{label:'ESC · Acute coronary syndromes',url:'https://www.escardio.org/guidelines/clinical-practice-guidelines/all-esc-practice-guidelines/acute-coronary-syndromes/'}};
 Object.assign(sources,{
  flutter:{label:'Atrial flutter · clinical reference',url:'https://www.merckmanuals.com/professional/cardiovascular-disorders/specific-cardiac-arrhythmias/atrial-flutter'},
  qt:{label:'Long QT and torsades · clinical reference',url:'https://www.merckmanuals.com/professional/cardiovascular-disorders/specific-cardiac-arrhythmias/torsades-de-pointes-ventricular-tachycardia'}
 });
 const cases=[];
 function add(id,name,category,summary,kind,lessons,source='rhythm',stem='') {cases.push({id,name,category,summary,kind,lessons,source,stem,guide:'step-rhythm-axis'});}
 // Lesson windows are milliseconds within the displayed lead, not screen coordinates.
 const L=(title,explanation,a=600,b=2400,lane=0)=>({title,explanation,a,b,lane});
 add('sinus-brady','Sinus bradycardia','Rhythms','A sinus rhythm at 45/min in this example. Rate alone does not establish the cause or clinical significance.','brady',[
 L('Slow regular ventricular rate','R–R intervals are about 1.33 seconds: 60,000 / 1,333 is approximately 45/min.',300,1900),L('P before every QRS','An upright lead-II P wave precedes every narrow QRS with the same PR interval.',320,620),L('Interpret perfusion and context','This rhythm may be physiological or secondary to disease or medication. Assess symptoms, blood pressure and perfusion.',0,6000)]);
 add('sinus-tachy','Sinus tachycardia','Rhythms','Regular sinus activity at 120/min. Look for a physiological or pathological driver rather than diagnosing the cause from rate alone.','tachy',[
 L('Regular 120/min rhythm','QRS complexes recur every 500 ms, corresponding to 120/min.',450,1550),L('Consistent P–QRS relationship','P waves precede the QRS with a fixed PR. At faster rates P can approach the preceding T wave.',800,1090),L('Narrow QRS','The modeled QRS is 90 ms. This example does not show a wide-complex tachycardia.',990,1100)]);
 add('flutter','Atrial flutter · 2:1 conduction','Rhythms','Continuous flutter activity at 300/min with a ventricular response of 150/min. A regular rate near 150 should prompt inspection for hidden flutter waves.','flutter',[
 L('Continuous flutter activity','Negative sawtooth activity repeats every 200 ms in this lead-II teaching strip. There is no normal isoelectric P–P baseline.',550,1150),L('Two atrial cycles per QRS','The atrial rate is twice the ventricular rate; one flutter wave can be obscured by QRS or T.',700,1500),L('Regular ventricular response','QRS complexes recur every 400 ms: a ventricular rate of 150/min.',450,1700)]);
 add('svt','Regular narrow-complex SVT','Rhythms','A regular narrow-complex tachycardia at 180/min. The strip illustrates SVT morphology without assigning an AVNRT or AVRT mechanism.','svt',[
 L('Fast regular QRS train','The R–R interval is approximately 333 ms, corresponding to 180/min.',450,1500),L('Narrow complexes','The modeled QRS is 80 ms. QRS width and regularity help organize the differential.',490,600),L('No separate visible sinus P','No distinct sinus P wave is visible in this teaching example. P may be buried or retrograde; this alone cannot identify the circuit.',590,800)]);
 add('junctional','Junctional escape rhythm','Rhythms','A regular narrow-complex escape rhythm at 40/min with no visible preceding P wave. Retrograde P waves may have different positions in real tracings.','junctional',[
 L('Slow narrow escape','The modeled ventricular interval is 1.5 seconds, corresponding to 40/min.',450,2200),L('No preceding sinus P','Inspect the baseline before QRS: no distinct sinus P is drawn. A complete ECG and clinical assessment are required.',260,590)]);
 add('first-degree','First-degree AV block','Conduction','Every P conducts, but the PR is prolonged to 280 ms. This is AV conduction delay without dropped ventricular beats.','first',[
 L('Prolonged PR','Measure from P onset to QRS onset: this model uses 280 ms, above the adult 200 ms threshold.',210,510),L('One P for each QRS','Each regular atrial impulse is followed by a QRS. No impulses are dropped in first-degree AV block.',200,2250)],'block');
 add('mobitz-i','Mobitz I · Wenckebach','Conduction','Progressive PR prolongation culminates in a nonconducted P wave, then the sequence resets.','mobitz1',[
 L('PR progressively lengthens','The conducted PR intervals are 160, 220 and 280 ms in this repeating group.',180,2140),L('P wave without QRS','The fourth P wave is not followed by a ventricular complex.',2520,3040),L('PR resets after the pause','The next conducted beat returns to the shortest PR of 160 ms.',3350,3800)],'block');
 add('mobitz-ii','Mobitz II AV block','Conduction','An on-time P wave suddenly fails to conduct while the PR intervals before and after it remain constant.','mobitz2',[
 L('Constant conducted PR','Conducted beats have the same 180 ms PR, without progressive lengthening.',180,1980),L('Abrupt dropped QRS','The fourth P wave occurs on schedule but has no following QRS. The atrial cycle remains constant.',2520,3040),L('PR unchanged after the block','The next conducted beat has the same PR as those before the dropped beat. Exclude mimics such as blocked atrial ectopy.',3350,3780)],'block');
 add('two-to-one','2:1 AV block','Conduction','Every alternate P wave is nonconducted. A 2:1 strip alone cannot reliably classify Mobitz I versus Mobitz II.','twoone',[
 L('Two P waves for each QRS','Atrial activity continues at 75/min while ventricular complexes occur at about 37.5/min.',180,2240),L('Alternate P is blocked','Inspect the isolated P between two conducted beats; it is not followed by QRS.',950,1360),L('Do not force a Mobitz label','Only one conducted PR is seen per pair, so progressive PR behavior cannot be assessed from this pattern alone.',180,3600)],'block');
 add('rbbb','Right bundle branch block','Conduction','Focused V1 and V6 views illustrate a broad QRS, terminal R′ in V1 and a broad terminal S in V6.','rbbb',[
 L('Broad rSR′ in V1','The QRS is 150 ms with a terminal positive R′ in the right precordial view.',480,670),L('Broad terminal S in V6','The lateral view has a widened terminal negative deflection. Read the lead views together.',480,670,1),L('Secondary repolarization','The terminal T direction opposes the late QRS direction in the right precordial example.',650,970)],'bbb');
 add('lbbb','Left bundle branch block','Conduction','Focused V1 and V6 views illustrate a broad predominantly negative right-precordial QRS and broad notched lateral R.','lbbb',[
 L('Broad negative QRS in V1','The QRS is 160 ms and predominantly negative in this right precordial lead.',480,680),L('Broad notched R in V6','The lateral QRS is broad and positive, with no initial septal q in this modeled view.',480,680,1),L('Discordant ST–T direction','Repolarization opposes the major QRS direction. New LBBB alone does not establish acute coronary occlusion.',660,980,1)],'bbb');
 add('long-qt','Prolonged QT','Intervals and ectopy','At 60/min, this example has QT 540 ms; the rate-corrected value is also 540 ms. The tracing does not distinguish acquired from congenital causes.','longqt',[
 L('QT to the end of T','Measure from QRS onset at 500 ms to T end at 1,040 ms. A separate U wave would not be included.',490,1050),L('Rate correction matters','The R–R is 1,000 ms here, so QT and QTc coincide. At other rates the correction formula affects interpretation.',490,1520),L('Assess reversible causes','Review medications, electrolytes and prior ECGs. QT prolongation raises concern for torsades risk but does not predict an individual event.',490,2050)],'rhythm');
 add('pvc','Premature ventricular complex','Intervals and ectopy','An early broad ventricular complex interrupts sinus rhythm and is followed by a full compensatory pause in this example.','pvc',[
 L('Early broad complex','The ectopic QRS arrives at 1,900 ms, earlier than the expected sinus beat at 2,100 ms; it is broad and has a different shape.',1880,2140),L('No preceding conducted P','No P wave is drawn immediately before the ectopic complex. The ventricular morphology differs from the sinus complexes.',1740,2150),L('Compensatory pause','The normal QRS before the PVC and the next normal QRS are 1,600 ms apart, twice the baseline 800 ms cycle.',1290,3020)]);
 add('pac','Premature atrial complex','Intervals and ectopy','An early atrial depolarization with a different P shape conducts through a narrow QRS and resets the rhythm.','pac',[
 L('Premature altered P','The early atrial wave before the 1,900 ms QRS has a different polarity in this example.',1700,1920),L('Narrow conducted QRS','The premature atrial impulse conducts with the same narrow ventricular morphology as the sinus beats.',1880,2020),L('Noncompensatory pause','The normal beats on either side are less than two baseline cycles apart because the atrial ectopy resets timing.',1290,2820)]);
 add('ventricular-paced','Ventricular paced rhythm','Conduction','Pacing stimuli precede broad ventricular complexes. Electrical capture is illustrated; mechanical capture requires clinical assessment.','paced',[
 L('Pacing stimulus','A narrow vertical stimulus precedes each QRS. Modern bipolar pacing spikes can be subtle on a real ECG.',465,540),L('Electrical capture','Each stimulus is followed by a broad complex in this example. Check every spike rather than assuming capture.',470,740),L('Secondary ST–T changes','The repolarization direction opposes the broad QRS. A paced ECG still requires ischemia assessment in the appropriate setting.',650,1010)]);
 add('vf','Ventricular fibrillation','Arrest rhythms','Disorganized ventricular activity with no repeating organized QRS. Assess the patient immediately and distinguish artifact.','vf',[
 L('Disorganized waveform','The amplitude, contour and interval vary without a repeating P–QRS–T sequence.',500,2300),L('No organized QRS train','There are no consistently identifiable ventricular complexes to count as a perfusing rhythm.',2500,4500),L('Clinical arrest assessment','In an unresponsive patient without a pulse, VF is a shockable arrest rhythm. ECG appearance must be correlated with the patient.',0,6000)]);
 add('torsades','Torsades de pointes pattern','Arrest rhythms','Prolonged QT in the initial sinus beats precedes a polymorphic ventricular run with waxing and waning amplitude.','torsades',[
 L('Prolonged QT before the run','The initial sinus beats have QT 540 ms at 60/min. Torsades is polymorphic VT associated with prolonged QT, not every polymorphic VT.',490,1050),L('Changing polarity and amplitude','The ventricular run changes direction and amplitude around the baseline. This is an illustrative rhythm strip.',3050,5900),L('No stable complexes for synchronization','Sustained polymorphic VT requires immediate unsynchronized shock under AHA guidance. Do not delay shock while attempting synchronization.',3200,5500)]);
 add('asystole','Asystole · verify the recording','Arrest rhythms','No discernible ventricular electrical activity is illustrated. Confirm the patient, electrodes, leads and gain before labeling asystole.','asystole',[
 L('No ventricular complexes','There is no organized ventricular activity in this idealized recording.',300,2200),L('Exclude technical causes and fine VF','Check another lead, electrode contact and gain; a flat line can also reflect a disconnected system.',2400,4400),L('Nonshockable arrest rhythm','When cardiac arrest with asystole is confirmed, follow the nonshockable arrest pathway. Defibrillation does not treat asystole.',0,6000)]);
 add('pea','Pulseless electrical activity · clinical case','Arrest rhythms','Organized electrical activity without a palpable pulse is PEA. There is no unique ECG shape that diagnoses PEA.','pea',[
 L('Organized electrical activity','The strip contains repeating narrow ventricular complexes. Their presence does not establish mechanical circulation.',450,2250),L('The absent pulse defines this case','The supplied clinical scenario, not the waveform alone, makes this PEA. The same electrical tracing could occur with a pulse.',2500,4600),L('Nonshockable arrest pathway','Confirmed PEA requires the nonshockable pathway and a search for reversible causes. Reassess the rhythm as care continues.',0,6000)],'rhythm','Clinical scenario: the patient is unresponsive, is not breathing normally, and has no palpable pulse.');
 cases.find(c=>c.id==='flutter').source='flutter';
 cases.find(c=>c.id==='long-qt').source='qt';
 const panels=[
 ['hyperacute-t','Hyperacute T-wave comparison','Ischemia','Compare normal, broad hyperacute and narrow peaked T morphology. Distribution, symptoms and serial change remain essential.'],
 ['sgarbossa','Modified Sgarbossa patterns','Ischemia','Concordant and excessive discordant ST changes support occlusion assessment in LBBB or ventricular pacing.'],
 ['posterior-omi','Posterior occlusion pattern','Ischemia','Anterior mirror changes are compared with the complete V7–V9 posterior set. Interpret supplemental-lead elevation with age-specific thresholds and the clinical context.'],
 ['avr-lmca','Diffuse ST depression with aVR elevation','Ischemia','A global ischemia pattern that does not identify a specific coronary lesion. Consider ACS and supply–demand causes.'],
 ['hyperkalemia','Hyperkalemia · three appearances','Metabolic and toxic','Peaked T, conduction slowing and sine-wave appearances are alternatives, not a predictable sequence or potassium-level scale.'],
 ['hypokalemia','Hypokalemia pattern','Metabolic and toxic','Small T waves, ST depression and prominent separate U waves are illustrated. Confirm potassium with laboratory testing.'],
 ['hypothermia','Hypothermia · J wave','Metabolic and toxic','A J hump follows QRS. The ECG alone cannot establish body temperature or the cause of a J wave.'],
 ['tca-toxicity','Sodium-channel blockade pattern','Metabolic and toxic','Broad QRS and terminal R in aVR are clues in a compatible toxic exposure; assess the clinical context.'],
 ['vt-vs-svt','Monomorphic ventricular tachycardia','Rhythms','Wide ventricular tachycardia with modeled AV dissociation, capture and fusion beats. These features may be absent in real VT.'],
 ['complete-heart-block','Complete AV block','Conduction','Independent atrial activity continues while a slower ventricular escape rhythm provides ventricular activation.'],
 ['wpw','Ventricular pre-excitation · WPW pattern','Conduction','Short PR and delta upstroke illustrate sinus pre-excitation. This is not a tracing of pre-excited atrial fibrillation.'],
 ['brugada','Brugada type 1 pattern','Other important patterns','Coved right-precordial ST elevation followed by T inversion requires proper lead placement and exclusion of phenocopies.'],
 ['pe-strain','Right ventricular strain pattern','Other important patterns','S1Q3T3 and anterior T inversion are strain clues, neither diagnostic nor sufficiently sensitive to exclude pulmonary embolism.'],
 ['pericarditis-ber','Pericarditis pattern','Other important patterns','PR depression and ST elevation are illustrated in selected leads. Concavity alone cannot distinguish pericarditis from coronary occlusion.'],
 ['electrical-alternans','Electrical alternans','Other important patterns','Repeating changes in QRS amplitude are illustrated. This finding alone does not diagnose tamponade.'],
 ['hypertrophy','LVH voltage and low-voltage comparison','Other important patterns','Compare high-voltage and low-voltage examples. Voltage criteria alone do not establish anatomic hypertrophy.']
 ];
 panels.forEach(([id,name,category,summary])=>cases.push({id,name,category,summary,library:id,guide:id,source:category==='Ischemia'?'acs':null}));
 // Calibrated replacements: each displayed lead has its own morphology; all
 // measurement windows below are derived from the same time/voltage signal.
 Object.assign(sources,{
  voltage:{label:'AHA/ACCF/HRS · Chamber hypertrophy and voltage',url:'https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.108.191097'},
  alternans:{label:'Clinical study · ECG findings in tamponade',url:'https://pubmed.ncbi.nlm.nih.gov/31881163/'},
  calcium:{label:'Clinical ECG cases · calcium and ST/QT duration',url:'https://pmc.ncbi.nlm.nih.gov/articles/PMC3951043/'},
  earlyrep:{label:'JACC · Early repolarization consensus',url:'https://www.jacc.org/doi/10.1016/j.jacc.2015.05.033'},
  repolarization:{label:'AHA/ACCF/HRS · ST, T, U and QT interpretation',url:'https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.108.191096'},
  preexcitation:{label:'ACC/AHA/ACCP/HRS · AF with pre-excitation',url:'https://www.jacc.org/doi/10.1016/j.jacc.2023.08.017'},
  brugada:{label:'ESC · Brugada morphology and lead placement',url:'https://www.escardio.org/communities/councils/cardiology-practice/scientific-documents-and-publications/ejournal/volume-19/brugada-syndrome-and-sports-activity-from-history-to-risk-stratification/'},
  pericarditis:{label:'ESC · ECG findings in pericarditis',url:'https://www.escardio.org/communities/councils/cardiology-practice/scientific-documents-and-publications/ejournal/volume-15/Diagnosis-of-acute-pericarditis/'},
  toxic:{label:'AHA 2025 · Special circumstances and toxicology',url:'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-and-pediatric-special-circumstances-of-resuscitation'},
  hypothermia:{label:'Prospective study · ECG manifestations of hypothermia',url:'https://pubmed.ncbi.nlm.nih.gov/10569384/'},
  pe:{label:'ESC · Acute pulmonary embolism guideline',url:'https://academic.oup.com/eurheartj/article/41/4/543/5556136'}
 });
 const M=(title,explanation,leads,part)=>({title,explanation,leads:leads.split(' '),part});
 const calibrated={
  'avr-lmca':{kind:'diffuse',lanes:['I','II','III','aVR','aVL','aVF','V4','V5','V6'],source:'acs',lessons:[
   M('Widespread ST depression','Horizontal ST depression is present in the displayed limb and lateral chest leads. Assess the distribution on a complete ECG and compare serial changes.','I II III aVL aVF V4 V5 V6','st'),
   M('Opposite aVR elevation','The aVR ST segment is elevated while several other leads are depressed. This indicates global subendocardial ischemia in context; it cannot identify a left-main lesion.','aVR','st'),
   M('Interpret perfusion and symptoms','Consider ACS as well as severe supply–demand imbalance. Ongoing ischemia or hemodynamic compromise needs urgent assessment; this pattern is not an automatic STEMI diagnosis.','II','rhythm')]},
  hypokalemia:{kind:'lowk',lanes:['II','V3'],source:'repolarization',lessons:[
   M('Depressed ST and flattened T','The ST lies below the TP baseline and the T wave is small. ECG appearances cannot determine the potassium concentration or exclude hypokalemia.','II V3','st-t'),
   M('U follows the completed T','A separate positive U follows T. This model ends T at 380 ms and U at 620 ms after QRS onset; U must not be counted as part of QT.','V3','u'),
   M('QT versus QU','Measure QRS onset to T end, not to U end. When T and U merge clinically, use another lead with a clear endpoint rather than reporting a falsely precise QT.','V3','qt')]},
  hypothermia:{kind:'cold',lanes:['II','V5'],source:'hypothermia',lessons:[
   M('Sinus bradycardia at 40/min','Each QRS is preceded by P; the R–R interval is 1,500 ms. Hypothermia may also cause atrial fibrillation and other arrhythmias.','II','rhythm'),
   M('J wave at the QRS–ST junction','A rounded Osborn hump follows the terminal QRS. J waves are compatible with hypothermia but are not specific for it and do not measure core temperature.','II V5','j'),
   M('Prolonged conduction and repolarization','This model has PR 240 ms, QRS 120 ms and QT 560 ms. QT is the uncorrected interval; evaluate core temperature and the patient.','II','p-qt')]},
  brugada:{kind:'brugada1',lanes:['V1','V2'],source:'brugada',lessons:[
   M('Coved right-precordial elevation','The J/ST junction is elevated 3 mm in V1 and 2.5 mm in V2 at standard gain, descending in a coved contour. Type 1 morphology requires at least 2 mm in at least one of V1 or V2.','V1 V2','j-st'),
   M('Negative T after the cove','Follow the elevated ST continuously into an inverted T wave. A saddleback appearance alone is not the diagnostic type 1 pattern.','V1 V2','st-t'),
   M('Pattern versus syndrome','Use V1/V2 in the second, third or fourth intercostal spaces when clinically indicated. Assess fever, drugs, symptoms, family history and phenocopies; this synthetic pattern alone does not establish Brugada syndrome.','V1 V2','qrs-t')]},
  'pe-strain':{kind:'rvstrain',lanes:['I','II','III','V1','V2','V3','V4'],source:'pe',lessons:[
   M('Sinus tachycardia','The sinus rate is 110/min with a P before each QRS. Tachycardia is common in PE but highly nonspecific.','II','rhythm'),
   M('S in I; Q and inverted T in III','Read the deep terminal S in I with the initial Q and negative T in III. S1Q3T3 is a right-heart strain clue, not a diagnosis of PE.','I III','qrs-t'),
   M('Anterior T-wave inversion','Negative T waves in V1–V4 support right ventricular strain in context. Similar changes have other causes; a normal ECG cannot exclude PE.','V1 V2 V3 V4','t')]},
  'pericarditis-ber':{kind:'pericarditis',lanes:['I','II','aVR','V5','V6'],source:'pericarditis',lessons:[
   M('ST elevation across lead territories','The displayed limb and lateral chest leads have upward-concave ST elevation. Confirm widespread involvement on the full ECG; concavity alone cannot exclude coronary occlusion.','I II V5 V6','st'),
   M('PR depression relative to TP','The PR segment is below the TP baseline in the positive leads. Compare a true TP baseline rather than using the displaced PR as zero.','II V5','pr-segment'),
   M('Opposite aVR PR and ST changes','aVR has PR elevation and ST depression. ECG findings support pericarditis only with the history and other diagnostic evidence; use the separate early-repolarization case for comparison.','aVR','p-qt')]},
  'tca-toxicity':{kind:'sodiumblock',lanes:['II','aVR'],source:'toxic',lessons:[
   M('QRS widening','The modeled QRS lasts 160 ms. Sodium-channel blocker poisoning is one possible cause of a broad QRS; compare the exposure history and prior ECG.','II aVR','qrs'),
   M('Prominent terminal R in aVR','The last positive aVR deflection is 4 mm, following a 5 mm S wave (R/S 0.8). A terminal R of at least 3 mm or R/S greater than 0.7 supports this toxic pattern in context.','aVR','qrs'),
   M('Do not diagnose poisoning from aVR alone','A terminal aVR R can have other causes. In suspected life-threatening sodium-channel blocker poisoning, urgent toxicology-directed care includes sodium bicarbonate with monitored endpoints.','II aVR','rhythm')]},
  wpw:{kind:'preexcitation',lanes:['II','V4'],source:'preexcitation',lessons:[
   M('Short PR to delta onset','P onset to the first ventricular deflection is 100 ms. Measure PR to the start of the delta wave, not to the steep R upstroke.','II','pr'),
   M('Delta wave and broad QRS','The first 40 ms of ventricular activation is slurred; the entire QRS lasts 140 ms. Degree and polarity of pre-excitation vary by lead and accessory pathway.','II V4','qrs'),
   M('Sinus pattern versus pre-excited AF','This regular rhythm has organized P waves. WPW pattern does not by itself establish symptomatic WPW syndrome. The separate pre-excited AF example shows a very different irregular tachycardia.','II','rhythm')]},
  'electrical-alternans':{kind:'alternans',lanes:['II','V5'],source:'alternans',lessons:[
   M('Alternating QRS amplitude','Successive QRS complexes alternate between larger and smaller amplitudes while their timing remains regular. Assess several cycles to distinguish alternans from artifact or ectopy.','II V5','rhythm'),
   M('Sinus tachycardia at 110/min','A P precedes each QRS and the R–R interval is about 545 ms. P and T amplitudes also alternate in this model.','II','p-qt'),
   M('Small voltage is not a complete low-voltage diagnosis','These selected leads have small complexes. Formal low voltage requires assessment of every lead in the relevant limb or precordial set. Alternans does not prove tamponade; assess the patient and obtain echocardiography when indicated.','II V5','qrs')]}
 };
 for(const [id,spec] of Object.entries(calibrated))Object.assign(cases.find(c=>c.id===id),spec,{library:undefined,sharedLibrary:id});
 add('preexcited-af','Pre-excited atrial fibrillation','Rhythms','Very rapid irregular ventricular activity with changing QRS width and morphology, without organized P waves.','preaf',[], 'preexcitation');
 Object.assign(cases[cases.length-1],{lanes:['II'],lessons:[
  M('Rapid irregular R–R intervals','The ventricular intervals vary from 220 to 390 ms. The shortest modeled interval is below 250 ms, a high-risk clue in pre-excited AF.','II','rhythm'),
  M('Changing broad QRS complexes','QRS width, amplitude and contour vary with the modeled degree of pre-excitation. There are no organized P waves. An irregular wide tachycardia requires urgent assessment.','II','qrs-t'),
  M('Recognize the treatment distinction','In pre-excited AF, AV-nodal blockers including adenosine, beta blockers, verapamil/diltiazem, digoxin and IV amiodarone can be harmful. Instability requires immediate electrical cardioversion; stable treatment requires an appropriate monitored pathway.','II','rhythm')]});
 add('early-repolarization','Early repolarization pattern','Other important patterns','Selected inferolateral leads show J notching and upward-concave ST elevation. This appearance alone does not establish a benign cause of chest pain.','earlyrep',[],'earlyrep');
 Object.assign(cases[cases.length-1],{lanes:['II','V5','V6'],lessons:[
  M('Terminal QRS notch','A notch appears at the QRS–ST junction with J elevation in the displayed inferolateral leads. Distinguish it from a separate pacing spike or artifact.','II V5 V6','j'),
  M('Concave ST with upright T','The ST rises toward an upright T wave, with no PR depression in this model. Neither concavity nor notching alone excludes acute ischemia.','V5 V6','st-t'),
  M('Compare symptoms and prior ECGs','A stable prior pattern supports early repolarization, but new symptoms still require clinical assessment and serial ECGs when indicated. Compare with the pericarditis and territorial STEMI examples.','II','p-qt')]});
 for(const [id,name,kind,summary] of [
  ['hypocalcemia','Hypocalcemia · prolonged ST/QT','lowca','Prolonged ST duration produces a long QT in this example; confirm calcium and consider other causes of QT prolongation.'],
  ['hypercalcemia','Hypercalcemia · short ST/QT','highca','A short ST segment produces a short QT in this example; confirm calcium and consider other causes of short QT.']]){
  add(id,name,'Metabolic and toxic',summary,kind,[],'calcium');
  cases[cases.length-1].lessons=[M('ST duration changes QT',kind==='lowca'?'At 60/min, QRS onset to T end is 540 ms; the ST segment is prolonged. The separate long-QT case illustrates a different T/ST contour.':'At 60/min, QRS onset to T end is 280 ms, with a very short ST segment. QT and QTc coincide at this rate.','II','qt'),M('Confirm the cause clinically','The ECG cannot determine a calcium concentration. Review laboratory measurements, medications and other acquired or congenital causes of the interval change.','II','rhythm')];
 }
 cases.find(c=>c.id==='complete-heart-block').source='block';
 cases.find(c=>c.id==='vt-vs-svt').source='rhythm';
 cases.find(c=>c.id==='hyperkalemia').source='toxic';
 cases.find(c=>c.id==='hypertrophy').source='voltage';
 for(const id of ['long-qt','hypocalcemia','hypercalcemia'])cases.find(c=>c.id===id).guide='step-intervals';
 cases.find(c=>c.id==='preexcited-af').guide='wpw';
 cases.find(c=>c.id==='early-repolarization').guide='pericarditis-ber';
 const interpolate=(t,points,smooth=false)=>{if(t<points[0][0]||t>points[points.length-1][0])return 0;for(let j=1;j<points.length;j++)if(t<=points[j][0]){const[a,x]=points[j-1],[b,y]=points[j];const u=(t-a)/(b-a);return x+(y-x)*(smooth?u*u*(3-2*u):u);}return 0;};
 function stripData(kind) {
  const record=cases.find(c=>c.kind===kind);
  const data={kind,duration:6000,lanes:record&&record.lanes?record.lanes:kind==='rbbb'||kind==='lbbb'?['V1','V6']:['II'],p:[],beats:[],rate:75};
  let rr=800,pr=160,qrs=90,qt=380;
  if(kind==='brady')rr=60000/45;if(kind==='tachy'){rr=500;qt=320;}if(kind==='flutter'){rr=400;qt=270;}if(kind==='svt'){rr=60000/180;qt=240;qrs=80;}if(kind==='junctional'||kind==='pea')rr=1500;
  if(kind==='first')pr=280;if(kind==='longqt'||kind==='torsades'){rr=1000;qt=540;}if(kind==='rbbb')qrs=150;if(kind==='lbbb')qrs=160;if(kind==='paced'){rr=1000;qrs=160;qt=440;}
  if(kind==='cold'){rr=1500;pr=240;qrs=120;qt=560;}
  if(['rvstrain','alternans'].includes(kind)){rr=60000/110;qt=320;}
  if(kind==='sodiumblock'){rr=600;qrs=160;qt=420;}
  if(kind==='preexcitation'){pr=100;qrs=140;qt=400;}
  if(kind==='brugada1'){qrs=110;qt=420;}
  if(kind==='earlyrep'){qrs=100;qt=400;}
  if(kind==='lowca'){rr=1000;qt=540;}if(kind==='highca'){rr=1000;qt=280;}
  data.rate=60000/rr;
  if(kind==='preaf'){
   data.rate=null;
   const intervals=[280,350,230,310,390,220,270,340,240,300,260,370,250,290,330,225,345,275,320,235];
   for(let q=400,n=0;q<6000;q+=intervals[n++%intervals.length])data.beats.push({on:q,qrs:[150,180,130,165,110][n%5],qt:210,pr:null,variant:n%5});
   return data;
  }
  if(['vf','asystole'].includes(kind))return data;
  if(['mobitz1','mobitz2','twoone'].includes(kind)){
   for(let n=0,p=200;p<6000;n++,p+=800){data.p.push({on:p,amp:.14});const blocked=kind==='twoone'?n%2===1:n%4===3;if(!blocked){const delay=kind==='mobitz1'?[160,220,280][n%4]:180;data.beats.push({on:p+delay,qrs,qt,pr:delay});}}
  }else{
   let times=[];for(let q=500;q<6000;q+=rr)times.push(q);
   if(kind==='pvc')times=[500,1300,1900,2900,3700,4500,5300];
   if(kind==='pac')times=[500,1300,1900,2700,3500,4300,5100,5900];
   if(kind==='torsades')times=[500,1500];
   times.forEach(q=>{const ectopic=kind==='pvc'&&q===1900;data.beats.push({on:q,qrs:ectopic?180:qrs,qt:ectopic?430:qt,ectopic,pr});if(!['svt','junctional','pea','flutter','paced'].includes(kind)&&!ectopic)data.p.push({on:q-pr,amp:kind==='pac'&&q===1900?-.16:.14});});
  }
  return data;
 }
 function voltage(t,data,lane) {
  const kind=data.kind;
  if(kind==='asystole')return 0;
  if(kind==='vf')return .42*Math.sin(t*.031+1.7*Math.sin(t*.0031))+.24*Math.sin(t*.049)+.13*Math.sin(t*.077+.4);
  if(kind==='torsades'&&t>=3000){const u=t-3000;return (.2+.75*Math.abs(Math.sin(u*Math.PI/1400)))*Math.sin(u*.026)*Math.cos(u*Math.PI/2800)+.12*Math.sin(u*.052);}
  if(['diffuse','lowk','cold','brugada1','rvstrain','pericarditis','sodiumblock','preexcitation','alternans','preaf','earlyrep','lowca','highca'].includes(kind))return morphologyVoltage(t,data,lane);
  let v=0;
  if(kind==='flutter'){const phase=((t%200)+200)%200;v+=interpolate(phase,[[0,0],[145,-.22],[200,0]]);}
  for(const p of data.p)v+=interpolate(t-p.on,[[0,0],[20,p.amp*.65],[40,p.amp],[60,p.amp*.65],[80,0]],true);
  for(const beat of data.beats){const d=t-beat.on,w=beat.qrs;let shape=[[0,0],[w*.18,-.12],[w*.4,1],[w*.7,-.25],[w,0]],ta=.28,st=0;
   if(beat.ectopic||kind==='paced'){shape=[[0,0],[w*.23,.3],[w*.55,1.2],[w*.8,.4],[w,0]];ta=-.35;}
   if(kind==='rbbb'){shape=lane===0?[[0,0],[25,.35],[50,-.4],[100,1.0],[150,0]]:[[0,0],[25,1],[55,0],[105,-.5],[150,0]];ta=lane===0?-.25:.25;}
   if(kind==='lbbb'){shape=lane===0?[[0,0],[25,.12],[85,-1.1],[160,0]]:[[0,0],[45,.95],[75,.7],[110,1.05],[160,0]];ta=lane===0?.3:-.3;st=lane===0?.1:-.1;}
   v+=interpolate(d,shape);v+=interpolate(d,[[w,0],[w+20,st],[w+60,st],[(w+beat.qt)/2,ta],[beat.qt,0]],true);
   if(kind==='paced')v+=interpolate(d,[[-14,0],[-12,1.5],[-10,0]]);
  }
  return v;
 }
 // Continuous piecewise waveform in mV; QRS and ST share their J endpoint.
 function morphologyVoltage(t,data,lane) {
  const k=data.kind,lead=data.lanes[lane];let v=0;
  if(k==='rvstrain'&&lead==='II')return morphologyVoltage(t,data,0)+morphologyVoltage(t,data,2);
  const coeff=lead==='aVR'?-.85:lead==='I'?.7:lead==='III'?.3:lead==='aVL'?.2:lead==='aVF'?.65:1;
  const alt=n=>k==='alternans'?(n%2?.18:.32):1;
  for(const [n,p] of data.p.entries())v+=interpolate(t-p.on,[[0,0],[20,.65],[40,1],[60,.65],[80,0]],true)*p.amp*coeff*alt(n);
  if(k==='preaf')v+=.016*Math.sin(t*.043+.5*Math.sin(t*.009));
  for(const [n,b] of data.beats.entries()){
   const d=t-b.on,w=b.qrs,qt=b.qt;let j=0,ta=.28,pr=0;
   let shape=[[0,0],[w*.18,-.1],[w*.4,1],[w*.7,-.25],[w,0]];
   if(k==='diffuse'){j=lead==='aVR'?.15:lead==='I'?-.12:lead==='II'?-.18:lead==='III'?-.06:lead==='aVL'?-.03:lead==='aVF'?-.12:-.15;}
   if(k==='lowk'){j=-.1;ta=.055;}
   if(k==='brugada1'){j=lane===0?.3:.25;ta=-.25;shape=[[0,0],[18,.25],[48,-.4],[78,.55],[w,j]];}
   if(k==='pericarditis'){j=lead==='aVR'?-.15:.15;pr=lead==='aVR'?.04:-.04;}
   if(k==='rvstrain'){
    if(lead==='I')shape=[[0,0],[16,-.05],[36,.5],[66,-.6],[w,0]];
    if(lead==='III')shape=[[0,0],[18,-.24],[38,.7],[65,-.1],[w,0]];
    if(/^V/.test(lead)){const r=[.35,.5,.7,.9][lane-3];shape=[[0,0],[16,-.04],[36,r],[65,-.55],[w,0]];}
    if(lead==='III'||/^V/.test(lead))ta=-.3;
   }
   if(k==='sodiumblock')shape=lead==='aVR'?[[0,0],[25,-.15],[65,-.5],[130,.4],[w,0]]:[[0,0],[28,-.08],[68,1],[115,-.3],[w,0]];
   if(k==='preexcitation')shape=[[0,0],[40,.22],[66,1],[106,-.25],[w,0]];
   if(k==='preaf'){const z=b.variant;shape=[[0,0],[35,.12+z*.035],[w*.55,.8+z*.12],[w*.83,-.15-z*.07],[w,0]];ta=-.18;}
   if(k==='earlyrep'){j=.15;shape=[[0,0],[16,-.08],[36,1],[64,-.15],[78,.12],[88,.23],[w,j]];ta=.4;}
   // Simple frontal projection for the simultaneous diffuse/pericarditis panels.
   // Independent chest-lead shapes are not used to claim a frontal QRS axis.
   const projection=['diffuse','pericarditis'].includes(k)?coeff:1;
   shape=shape.map(([x,y],i)=>[x,i===shape.length-1?j:y*projection]);
   if(pr)shape[0][1]=pr;
   let rep=[[w,j],[w+(qt-w)*.2,j],[w+(qt-w)*.62,ta*projection],[qt,0]];
   if(k==='diffuse'||k==='lowk')rep=[[w,j],[w+80,j],[w+130,0],[qt-75,ta*projection],[qt,0]];
   if(k==='brugada1')rep=[[w,j],[w+55,j*.8],[w+130,.07],[qt-75,ta],[qt,0]];
   if(k==='cold')rep=[[w,0],[w+25,.22],[w+60,0],[qt-115,.22],[qt,0]];
   if(k==='lowca')rep=[[w,0],[330,0],[440,.28],[qt,0]];
   if(k==='highca')rep=[[w,0],[w+10,0],[190,.28],[qt,0]];
   // Choose one side at J to avoid doubling its voltage; smooth ST–T curves.
   let beat=d<=w?interpolate(d,shape):interpolate(d,rep,true);
   if(pr)beat+=interpolate(d,[[-b.pr+80,0],[-b.pr+95,pr],[-.01,pr],[0,0]]);
   if(k==='lowk')beat+=interpolate(d,[[420,0],[500,.22],[620,0]],true);
   v+=beat*alt(n);
  }
  return v;
 }
 function lessonTargets(f,data) {
  const lanes=f.leads?f.leads.map(l=>data.lanes.indexOf(l)):[f.lane];
  return lanes.flatMap(lane=>{
   if(lane<0)throw Error('Finding lead is not displayed: '+f.title);
   const windows=f.part?(f.part==='rhythm'?[[0,data.duration]]:data.beats.filter(b=>b.on>=300&&b.on+b.qt<6000).slice(0,3).map(b=>{
    const q=b.on,w=b.qrs,qt=b.qt,pr=b.pr||160;
    return ({qrs:[q,q+w],st:[q+w,q+w+70],t:[q+w+70,q+qt],qt:[q,q+qt],pr:[q-pr,q],u:[q+410,q+630],j:[q+w-25,q+w+65],'j-st':[q+w-15,q+w+110],'st-t':[q+w,q+qt],'qrs-t':[q,q+qt],'p-qt':[q-pr,q+qt],'pr-segment':[q-pr+85,q-2]})[f.part];
   })):[[f.a,f.b]];
   return windows.map(([a,b])=>{
    let lo=0,hi=0;for(let t=a;t<=b;t+=2){const v=voltage(t,data,lane);lo=Math.min(lo,v);hi=Math.max(hi,v);}
    return [80+a*.2-4,210+lane*270-hi*80-12,(b-a)*.2+8,(hi-lo)*80+24];
   });
  });
 }
 function renderStrip(record) {
  const data=stripData(record.kind),width=1312,height=100+data.lanes.length*270;
  let svg='<svg class="ecg-svg ecg-paper ecg-calibrated" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Synthetic teaching rhythm strip">'+E.renderPaperGrid(width,height)+'<text x="20" y="28" font-size="17">SYNTHETIC · 25 mm/s · 10 mm/mV · 6 seconds</text>';
  data.lanes.forEach((lead,lane)=>{const base=210+lane*270;svg+='<text x="20" y="'+(base-115)+'" font-size="22">'+lead+'</text>';let d='';for(let t=0;t<=6000;t+=2)d+=(t?' L':'M')+(80+t*.2).toFixed(2)+','+(base-voltage(t,data,lane)*80).toFixed(2);svg+='<path class="ecg-trace ecg-signal" d="'+d+'" fill="none" stroke="#111" stroke-width="2.5"/>';});
  svg+='<path d="M20,'+(height-20)+' v-80 h40 v80" fill="none" stroke="#111" stroke-width="2"/><text x="85" y="'+(height-25)+'" font-size="16">1 mV / 200 ms</text></svg>';
  const findings=record.lessons.map(f=>({title:f.title,explanation:f.explanation,targets:lessonTargets(f,data)}));
  return {svg,width,height,data,findings,format:'Focused rhythm strip',caption:'Synthetic educational strip · 6 seconds · selected leads, not a full 12-lead.',scale:'25 mm/s · 10 mm/mV'};
 }
 function renderPanel(record) {
  const entry=lib[record.library];let drawing,findings;
  if(entry.traceSpec){drawing=I.render(entry.traceSpec,{duration:['vt-vs-svt','complete-heart-block'].includes(record.id)?10000:3000,viewer:true});
   findings=entry.findings.map(f=>({title:f.title,explanation:f.explanation,targets:I.findingTargets(drawing,f)}));
  }else{const vb=entry.svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);drawing={svg:entry.svg,width:vb[2],height:vb[3]};findings=entry.findings.map(f=>({...f,targets:f.targets.map(t=>t.slice())}));}
  return {...drawing,findings,format:entry.traceSpec?'Focused ECG panel':entry.figureLabel,caption:entry.caption,scale:entry.traceSpec?'25 mm/s · 10 mm/mV':entry.paperScale?'Paper-scaled teaching diagram':'Teaching diagram · see caption for scale'};
 }
 // Reuse calibrated drawings in the guide and its enlarged viewer too. Mutate
 // the shared lesson array so the viewer cannot retain obsolete schematic targets.
 for(const record of cases.filter(c=>c.sharedLibrary)){
  const item=renderStrip(record),entry=lib[record.sharedLibrary];
  entry.svg=item.svg.replace(/ecgEngMinor|ecgEngMajor/g,id=>record.id+'-'+id);
  entry.findings.splice(0,entry.findings.length,...item.findings);
  entry.caption=item.caption+' Grid and waveform share a calibrated scale; on-screen millimetres depend on zoom. Selected morphology, not a clinically validated patient ECG.';
  entry.figureLabel='Calibrated synthetic ECG';entry.calibrated=true;entry.hasReference=false;
 }
 export const ECG_CURRICULUM={cases,sources,build:record=>record.library?renderPanel(record):renderStrip(record),stripData,voltage};
