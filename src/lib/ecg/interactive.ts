// @ts-nocheck — verbatim legacy port (documented exception); see below.
/* eslint-disable */
/**
 * VERBATIM PORT of legacy `assets/ecg-interactive.js` to a TypeScript ES module.
 * Clinical morphology, geometry and teaching text are unchanged.
 * New code must consume this module via the typed facade in `./api.ts`
 * (ECG) or the typed data modules (learning).
 */
import { ECG_ENGINE } from './engine';
import { ECG_SVG } from './svgLibrary';
import { applyCaseTracings } from './caseTracings';

// Legacy script order applied case-tracings before this module; reproduce explicitly.
applyCaseTracings();

/* Calibrated teaching panels and an accessible ECG workbench. No patient data. */
var E = ECG_ENGINE, lib = ECG_SVG;
  
  var sequence = 0, active = null;
  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var round = function (v) { return Math.round(v * 100) / 100; };
  var referencePatterns = ['stemi-criteria', 'hyperacute-t', 'wellens', 'dewinter', 'hyperkalemia'];
  var laneLabels = { Normal: 'V3 · normal', Hyperacute: 'V3 · hyperacute', 'HyperK?': 'V3 · peaked T', 'Type A': 'V3 · Wellens A', 'Type B': 'V3 · Wellens B', Early: 'II · peaked T', Advanced: 'II · wide QRS', Severe: 'II · sine wave' };
  lib['atrial-fibrillation'] = { title: 'Atrial fibrillation', traceSpec: { pattern: 'atrial-fibrillation', lanes: ['II'], options: {}, waves: {}, note: 'Irregular ventricular response without organized P waves. This example has narrow QRS complexes; it does not model pre-excitation.' } };
  // Findings describe only features modeled in the displayed leads.
  function finding(title, leads, segment, explanation) { return { title: title, leads: leads.split(' '), segment: segment, explanation: explanation }; }
  var lessons = {
    'stemi-criteria': [finding('Inferior ST elevation', 'II III aVF', 'st', 'Inspect the J point and ST segment in the contiguous inferior leads.'), finding('Reciprocal ST depression', 'aVL', 'st', 'Opposite ST displacement in aVL supports inferior ischemic injury in a compatible clinical presentation.')],
    'hyperacute-t': [finding('Broad, bulky T wave', 'Hyperacute', 't', 'This V3 shape comparison illustrates T-wave bulk. A single lead cannot establish the territorial distribution required in clinical interpretation.'), finding('Narrow peaked T comparison', 'HyperK?', 't', 'A narrow peak is a potassium clue, not a potassium measurement. ECG appearances overlap; assess the whole tracing and laboratory results.')],
    wellens: [finding('Anterior T-wave abnormality', 'V2 V3', 't', 'Type A is initially positive then negative; Type B is deeply inverted. Interpret after recent angina, often while pain-free. The ECG pattern alone does not prove a specific coronary lesion.'), finding('Preserved anterior R waves', 'V2 V3', 'qrs', 'Preserved R waves and little ST displacement accompany this synthetic example. Clinical Wellens assessment also requires the history and exclusion of mimics.')],
    dewinter: [finding('Upsloping ST depression', 'V2 V3 V4 V5 V6', 'st', 'The depressed J point rises toward tall T waves across the precordial leads. This is a high-risk occlusion pattern in the right clinical context.'), finding('Tall symmetric T waves', 'V2 V3 V4 V5 V6', 't', 'Inspect the ST segment together with the prominent T wave; tall T amplitude alone is nonspecific.'), finding('Associated aVR elevation', 'aVR', 'st', 'aVR elevation can accompany de Winter morphology; it is neither required nor independently diagnostic.')],
    sgarbossa: [finding('Concordant elevation', 'V5', 'st', 'ST elevation follows the positive QRS direction.'), finding('Concordant depression', 'V3', 'st', 'ST depression follows a negative QRS in an anterior lead.'), finding('Excessive discordance', 'V1', 'qrs-st', 'Compare J-point elevation with S-wave depth. Modified Sgarbossa supports occlusion assessment in LBBB or ventricular pacing; clinical context remains essential.')],
    'posterior-omi': [finding('Anterior mirror depression', 'V1 V2 V3', 'st', 'Horizontal ST depression in V1–V3 raises concern for posterior injury.'), finding('Prominent R and upright T', 'V1 V2 V3', 'qrs-t', 'These accompanying features support the posterior mirror pattern but may be absent early.'), finding('Posterior lead elevation', 'V7 V8 V9', 'st', 'V7–V9 show contiguous posterior elevation of 1.0, 0.8 and 0.6 mm. The usual posterior threshold is 0.5 mm; 1 mm is used for greater specificity in men under 40. Interpret with symptoms and serial changes; negative posterior leads do not exclude occlusion.')],
    hyperkalemia: [finding('Peaked T appearance', 'Early', 't', 'A narrow peaked T wave may occur with hyperkalemia. A normal ECG does not exclude dangerous hyperkalemia.'), finding('P / PR / QRS changes', 'Advanced', 'p-qrs', 'This example combines attenuated P waves, delayed AV conduction and QRS widening. These changes need not occur in a fixed sequence.'), finding('Fused QRS–T appearance', 'Severe', 'rhythm', 'The sine-wave example has no discrete P, QRS or T endpoints to measure. These variants do not predict a potassium concentration.')],
    'atrial-fibrillation': [finding('Irregular RR intervals', 'II', 'rhythm', 'Successive ventricular intervals genuinely vary in this model; the irregularity is not merely baseline noise.'), finding('No organized P waves', 'II', 'baseline', 'Inspect the changing fibrillatory baseline between QRS complexes. There is no repeating sinus P wave or measurable PR interval.')],
    'complete-heart-block': [finding('Independent atrial activity', 'II', 'atrial', 'P waves continue at their own regular rate, without a fixed relationship to QRS complexes.'), finding('Slow ventricular escape', 'II', 'qrs', 'The ventricular rhythm is slower than the atrial rhythm. Inspect the 10-second strip to appreciate AV dissociation.')],
    'vt-vs-svt': [finding('Wide ventricular rhythm', 'II', 'qrs', 'The underlying rhythm is a broad-complex tachycardia. This teaching model represents VT, not a validated diagnostic algorithm.'), finding('Capture and fusion examples', 'II', 'capture', 'The long strip includes an engineered capture and fusion beat aligned with independent atrial activity. These findings are not present in every VT.')]
  };
  function viewerSpec(id, original, variant) {
    var spec = Object.assign({}, original, { options: Object.assign({}, original.options) });
    if (id === 'wellens') { spec.lanes = ['V2', 'V3']; spec.options.variant = variant || 'B'; }
    if (id === 'dewinter') spec.lanes = ['V2', 'V3', 'V4', 'V5', 'V6', 'aVR'];
    return spec;
  }
  function signal(spec, lane, artifact) {
    var opts = Object.assign({}, spec.options, { lane: lane, noise: { disabled: !artifact } });
    var lead = lane;
    if (spec.pattern === 'hyperkalemia') {
      opts.stage = { Early: 'early', Advanced: 'advanced', Severe: 'severe' }[lane] || opts.stage;
      lead = 'II';
    }
    return { lead: lead, data: E.createPatternCase(spec.pattern, opts) };
  }
  function path(lead, data, x, baseline, duration, ux, uy) {
    var d = '';
    // 500 Hz sampling; endpoints included exactly even for non-integral windows.
    for (var t = 0; t <= duration; t += 2) {
      d += (t ? ' L' : 'M') + round(x + t * ux) + ',' + round(baseline - E.leadVoltageAt(lead, t, data, t / 2) * uy);
    }
    return d;
  }
  function render(spec, opts) {
    opts = opts || {};
    var speed = opts.speed === undefined ? 25 : opts.speed, gain = opts.gain === undefined ? 10 : opts.gain, duration = opts.duration === undefined ? 3000 : opts.duration;
    if (![25, 50].includes(speed) || ![5, 10, 20].includes(gain) || !Number.isFinite(duration) || duration < 1000 || duration > 10000) throw new RangeError('Unsupported ECG speed, gain or duration');
    if (!spec || !Array.isArray(spec.lanes) || !spec.lanes.length || (opts.lane && opts.lane !== 'all' && !spec.lanes.includes(opts.lane))) throw new RangeError('Unsupported ECG lane');
    var ux = 8 * speed / 1000, uy = 8 * gain, x = 80, width = x + duration * ux + 32;
    var lanes = opts.lane && opts.lane !== 'all' ? [opts.lane] : spec.lanes;
    var uid = 'ecgpanel' + (++sequence), y = 64, rows = [];
    lanes.forEach(function (lane) {
      var s = signal(spec, lane, !!opts.artifact), ref = null;
      if (opts.normal) {
        s.lead = /^(Normal|Hyperacute|HyperK\?|Type A|Type B)$/.test(lane) ? 'V3' : s.lead;
        s.data = E.createNormalSinusCase({ rate: 72, noise: { disabled: !opts.artifact } });
      }
      if (!opts.normal && referencePatterns.indexOf(spec.pattern) >= 0 && lane !== 'Severe') {
        ref = E.createNormalSinusCase({ rate: s.data.rate, noise: { disabled: true } });
        // QRS onsets aligned exactly; this is a model reference, not an old ECG.
        ref.beatTimes = s.data.beatTimes.slice();
      }
      var max = 0, min = 0;
      for (var t = 0; t <= duration; t += 2) {
        var v = E.leadVoltageAt(s.lead, t, s.data, t / 2);
        max = Math.max(max, v); min = Math.min(min, v);
        if (ref) { var rv = E.leadVoltageAt(s.lead, t, ref, t / 2); max = Math.max(max, rv); min = Math.min(min, rv); }
      }
      var top = y, baseline = y + 42 + Math.ceil(max * uy), bottom = baseline + Math.ceil(-min * uy) + 24;
      rows.push({ lane: lane, lead: s.lead, data: s.data, ref: ref, top: top, baseline: baseline, bottom: bottom });
      y = bottom + 12;
    });
    var height = y + Math.max(104, uy + 24);
    var svg = '<svg class="ecg-svg ecg-paper ecg-calibrated" viewBox="0 0 ' + width + ' ' + height + '" role="group" aria-label="Calibrated synthetic focused ECG" preserveAspectRatio="xMidYMid meet">';
    svg += '<title>Synthetic focused ECG — not a patient recording</title>';
    // Each instance owns its pattern IDs, including when the dialog is open.
    svg += E.renderPaperGrid(width, height).replace(/ecgEngMinor/g, uid + 'minor').replace(/ecgEngMajor/g, uid + 'major');
    svg += '<text x="16" y="22" class="ecg-panel-heading">SYNTHETIC · ' + speed + ' mm/s · ' + gain + ' mm/mV</text>';
    for (var ms = 0; ms <= duration; ms += 1000) {
      svg += '<text x="' + round(x + ms * ux) + '" y="49" class="ecg-panel-tick">' + ms / 1000 + ' s</text>';
    }
    rows.forEach(function (r) {
      svg += '<line x1="' + x + '" y1="' + r.baseline + '" x2="' + (width - 32) + '" y2="' + r.baseline + '" stroke="#94a3b8" stroke-width="0.6" stroke-dasharray="4 4"/>';
      svg += '<text x="16" y="' + (r.top + 20) + '" class="ecg-panel-heading">' + esc(opts.normal ? r.lead + ' · normal' : laneLabels[r.lane] || r.lane) + '</text>';
      var rate = r.data.sine ? 'Fused QRS–T · no discrete intervals' : (r.data.dissociated ? 'Atrial 75/min · ventricular ' : 'Model rate ') + r.data.rate + '/min';
      svg += '<text x="' + (width - 20) + '" y="' + (r.top + 20) + '" text-anchor="end" class="ecg-panel-tick ecg-annotation">' + esc(rate) + '</text>';
      if (r.ref) svg += '<path class="ecg-reference" d="' + path(r.lead, r.ref, x, r.baseline, duration, ux, uy) + '"/>';
      svg += '<path class="ecg-trace ecg-signal" d="' + path(r.lead, r.data, x, r.baseline, duration, ux, uy) + '"/>';
      var wave = (spec.waves || {})[r.lane];
      if (wave && !opts.viewer) svg += '<g class="ecg-hot" role="button" tabindex="0" data-wave="' + esc(wave) + '" aria-label="Explain ' + esc(laneLabels[r.lane] || r.lane) + '"><rect class="ecg-hotzone" x="' + x + '" y="' + (r.top + 26) + '" width="' + (duration * ux) + '" height="' + (r.bottom - r.top - 26) + '"/></g>';
    });
    // A 1 mV / 200 ms calibration pulse; space reserved separately from leads.
    var calY = height - 16, calX = 24;
    svg += '<path d="M16,' + calY + ' H' + calX + ' V' + (calY - uy) + ' H' + (calX + 200 * ux) + ' V' + calY + ' h8" fill="none" stroke="#111" stroke-width="1.5"/>';
    svg += '<text x="' + (calX + 200 * ux + 20) + '" y="' + (height - 26) + '" class="ecg-panel-tick">1 mV / 200 ms · small box = ' + round(1000 / speed) + ' ms / ' + round(1 / gain) + ' mV</text></svg>';
    // Gains above 10 need extra calibration space.
    return { svg: svg, rows: rows, width: width, height: height, x: x, ux: ux, uy: uy, duration: duration };
  }
  // Register the modeled patterns with room for their actual amplitudes.
  Object.keys(lib).forEach(function (id) {
    var entry = lib[id], spec = entry.traceSpec;
    entry.noCompare = true; // Retire the unrelated stock ST–T inset everywhere.
    if (!spec && !entry.sources && !entry.figureLabel && !entry.paperScale) {
      entry.figureLabel = 'Schematic · not to scale';
      entry.caption = 'Concept diagram, not a patient recording. Numeric criteria are teaching references, not measurements of these drawn waveforms.';
    }
    if (entry.paperScale) {
      entry.figureLabel = 'Paper-scaled teaching diagram';
      var vb = entry.svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
      if (entry.svg.indexOf('<pattern') < 0) entry.svg = entry.svg.replace(/(<svg[^>]*>)/, '$1' + E.renderPaperGrid(vb[2], vb[3]).replace(/ecgEngMinor/g, id + 'Minor').replace(/ecgEngMajor/g, id + 'Major'));
    }
    if (!spec) return;
    if (id === 'hyperkalemia') {
      spec.lanes = ['Early', 'Advanced', 'Severe'];
      spec.waves = { Early: 'hyperk', Advanced: 'hyperk', Severe: 'hyperk' };
      spec.note = 'Three possible hyperkalemia appearances, not a predictable sequence or potassium-level scale.';
    }
    var result = render(spec);
    entry.svg = result.svg;
    entry.calibrated = true;
    entry.figureLabel = 'Calibrated simulation';
    entry.caption = 'Synthetic focused leads, not a patient recording or a full 12-lead. Each small box represents 40 ms / 0.1 mV at this setting. ' + spec.note;
    entry.hasReference = referencePatterns.indexOf(id) >= 0;
  });
  if (lib['rate-calibration']) {
    var calibration = lib['rate-calibration'];
    calibration.figureLabel = 'Calibrated teaching diagram';
    calibration.caption = 'Synthetic lead II at 25 mm/s and 10 mm/mV. Grid and tracing share the same scale; screen millimetres vary with zoom.';
    // Preserve the independently checked calibration path exactly.
    calibration.svg = calibration.svg.replace(/(<svg[^>]*>)/, '$1' + E.renderPaperGrid(640, 320).replace(/ecgEngMinor/g, 'calMinor').replace(/ecgEngMajor/g, 'calMajor'));
  }
  if (lib['ischemia-map']) {
    lib['ischemia-map'].figureLabel = 'Criteria diagram';
    lib['ischemia-map'].caption = 'Lead and threshold teaching map; not a patient ECG. Voltage examples share the paper scale, but isolated schematic beats do not establish a diagnosis.';
  }
  if (lib['toxic-metabolic-mimics']) {
    lib['toxic-metabolic-mimics'].svg = render(lib.hyperkalemia.traceSpec).svg;
    lib['toxic-metabolic-mimics'].figureLabel = 'Calibrated simulation · hyperkalemia examples';
    lib['toxic-metabolic-mimics'].caption = lib.hyperkalemia.caption;
  }
  // A complete normal layout was previously only available in the dev harness.
  lib['normal-12lead'] = { title: 'Normal sinus rhythm · full 12-lead', svg: E.renderNormal12Lead({ noise: { disabled: true } }).svg, noCompare: true, figureLabel: 'Calibrated simulation', caption: 'Synthetic educational 12-lead; not a patient recording. Sequential 2.5-second columns plus a 10-second lead II strip. Swipe inside the paper on phones, or Enlarge to inspect.' };

  // Describe what each sketch actually shows; never imply it is a complete ECG.
  var schematicLessons = {
    'avr-lmca': 'Find aVR elevation opposite depression across the displayed leads. This does not identify a left-main lesion; assess supply–demand causes and ACS.',
    hypokalemia: 'Read left to right: QRS, small T, then larger U. A separate U is excluded from QT measurement; this sketch cannot provide QT/QU values.',
    hypothermia: 'Locate the J hump at the end of QRS. Temperature, bradycardia and interval prolongation must be established clinically; this drawing does not measure them.',
    brugada: 'Follow the coved ST down into an inverted T in V1–V2. Confirm the ≥2 mm criterion and documented lead position on an actual tracing; exclude phenocopies.',
    'pe-strain': 'Compare the deep S in I, Q/inverted T in III and anterior T inversion. These are RV-strain clues; neither this pattern nor its absence diagnoses or excludes PE.',
    'pericarditis-ber': 'The drawing shows only pericarditis concepts in II and aVR. BER and OMI are compared in the text; concavity or a J notch alone cannot distinguish them.',
    'tca-toxicity': 'Find the final positive R in aVR after the negative QRS deflection. Measure QRS duration and R amplitude on a calibrated ECG, and assess the exposure and perfusion.',
    wpw: 'This is sinus pre-excitation: a shortened PR and a delta upstroke. It is not pre-excited AF; that rhythm is irregular, often extremely fast and has changing QRS shapes.',
    'electrical-alternans': 'Compare consecutive QRS amplitudes. This single-lead sketch shows alternation only; it cannot establish whole-ECG low voltage, tachycardia or tamponade.'
  };
  Object.keys(schematicLessons).forEach(function (id) {
    lib[id].caption = 'Schematic · not to scale · no box-counting. ' + schematicLessons[id];
  });

  lessons['hyperacute-t'].unshift(finding('Normal T comparison', 'Normal', 't', 'The normal V3 comparison has an asymmetric T wave with a smaller amplitude than R. Compare it with the two abnormal shapes below.'));

  // Static targets use the source SVG coordinate system, never screen pixels.
  // Shared by the guide viewer and Explorer: derive regions from the rendered signal.
  function findingTargets(drawing, f) {
    var targets = [];
      drawing.rows.forEach(function (row) {
        if (f.leads.indexOf(row.lane) < 0) return;
        var data = row.data, windows = [];
        if (f.segment === 'rhythm') windows = [[0, drawing.duration]];
        else if (f.segment === 'baseline') windows = data.beatTimes.map(function (q, i) { return [i ? data.beatTimes[i - 1] + data.qtMs + 15 : 0, q - 25]; });
        else if (f.segment === 'atrial') windows = (data.dissociated && data.dissociated.atrialTimes || []).map(function (p) { return [p - 55, p + 55]; });
        else data.beatTimes.forEach(function (q, i) {
          var beat = data.dissociated && data.dissociated.ventricularBeats[i];
          var j = beat ? beat.qrsMs : data.qrsMs, end = beat ? beat.qtMs : data.qtMs;
          if (f.segment === 'capture' && (!data.dissociated || (i !== data.dissociated.captureIdx && i !== data.dissociated.fusionIdx))) return;
          var a = q, b = q + j;
          if (f.segment === 'st') { a += j; b = a + 100; }
          if (f.segment === 't') { a += j + 80; b = q + end; }
          if (f.segment === 'qrs-st') b += 100;
          if (f.segment === 'qrs-t') b = q + end;
          if (f.segment === 'p-qrs') a -= data.prMs || 220;
          windows.push([a, b]);
        });
        // Mark representative complete segments, avoiding a wall of circles on long strips.
        windows.filter(function (w) { return w[0] >= 0 && w[1] <= drawing.duration; }).slice(0, 3).forEach(function (w) {
          var a = Math.max(0, w[0]), b = Math.min(drawing.duration, w[1]); if (b <= a) return;
          var low = 0, high = 0;
          for (var t = a; t <= b; t += 2) {
            var voltage = E.leadVoltageAt(row.lead, t, data, t / 2); low = Math.min(low, voltage); high = Math.max(high, voltage);
          }
          var top = Math.max(row.top + 28, row.baseline - high * drawing.uy - 10);
          var bottom = Math.min(row.bottom, row.baseline - low * drawing.uy + 10);
          targets.push([drawing.x + a * drawing.ux, top, (b - a) * drawing.ux, bottom - top]);
        });
      });
    return targets;
  }
  function diagramFinding(title, explanation, targets, wave) {
    return { title: title, explanation: explanation, targets: targets, wave: wave };
  }
  var D = diagramFinding;
  Object.assign(lessons, {
    'rate-calibration': [
      D('Calibration pulse', 'The pulse is 1 mV tall and 200 ms wide. Check speed and gain before counting boxes.', [[80,24,52,112]], 'cal'),
      D('P wave and PR interval', 'P is atrial depolarization. Measure PR from the beginning of P to the beginning of QRS, including the P wave.', [[334,80,53,50]], 'pr'),
      D('QRS and ST segment', 'QRS is ventricular depolarization. The ST segment begins at the end of QRS (the J point); compare it with the isoelectric baseline.', [[366,34,39,96]], 'qrs'),
      D('T wave and QT interval', 'T is ventricular repolarization. QT runs from QRS onset to T end; QTc also accounts for heart rate.', [[356,20,96,126]], 'qt'),
      D('R–R and rate', 'In this regular rhythm, four large boxes between R peaks gives 300 ÷ 4 = 75/min at 25 mm/s. Use a longer strip for irregular rhythms.', [[215,8,170,26]], 'rr')],
    'rhythm-axis': [
      D('Sinus P and narrow QRS', 'The upper strip has a P before each QRS with a consistent PR. Inspect P-wave direction in the appropriate leads before naming sinus rhythm.', [[252,98,24,30],[284,46,25,102]], 'psinus'),
      D('Wide QRS', 'The middle strip has wider ventricular complexes. Width alone cannot distinguish VT from supraventricular conduction with aberrancy.', [[252,204,38,116]], 'wide'),
      D('Irregular R–R intervals', 'Compare successive R peaks in the lower strip: the intervals vary and there is no organized repeating P wave.', [[85,390,500,98]], 'reg'),
      D('Axis quadrants', 'Use the net QRS direction in I and aVF. If I is positive and aVF negative, lead II helps distinguish a normal leftward axis from left-axis deviation.', [[460,20,170,120]], 'axis')],
    intervals: [
      D('P and PR', 'PR starts at P onset, not P end. The drawn PR is 160 ms; the P itself is 80 ms.', [[116,82,40,82]], 'pr'),
      D('QRS duration', 'Measure from the earliest QRS onset to its end. The example is narrow at 85 ms.', [[148,24,25,98]], 'qrs'),
      D('QT to T end', 'Include ventricular depolarization and repolarization. This example shows QT 380 ms; do not include a separate U wave.', [[148,24,84,110]], 'qt'),
      D('R–R for correction', 'Use the R–R interval when interpreting QTc. The example is regular with an R–R of 800 ms.', [[88,214,180,112]], 'rr')],
    hypertrophy: [
      D('Deep S in V1', 'This voltage panel is drawn at half gain (5 mm/mV). The displayed S depth corresponds to 15 mm at standard gain.', [[120,130,42,92]], 'v1'),
      D('Tall R in V5', 'The displayed R height corresponds to 22 mm at standard gain. Combine the appropriate voltages only after correcting for gain; voltage criteria alone do not establish anatomic hypertrophy.', [[414,56,46,112]], 'v5'),
      D('Low-voltage example', 'The lower strip illustrates small complexes. Whole-ECG low voltage requires the relevant lead set, not just this single strip.', [[40,322,560,44]], 'lowv')],
    'omi-equivalents': [
      D('Hyperacute T morphology', 'The left example emphasizes a broad, bulky T wave relative to QRS. Assess territory, symptoms and serial change on a complete ECG.', [[82,48,130,145]]),
      D('de Winter morphology', 'The middle example combines an upsloping depressed ST segment and a tall T wave. Read the ST–T shape together.', [[238,48,130,145]]),
      D('Wellens-type inversion', 'The right example shows a deep inverted anterior T wave. Interpret with the recent angina history and clinical setting.', [[410,120,150,104]]),
      D('Separate normal rhythm reference', 'Lead II below is a normal rhythm reference. The three upper examples are separate teaching patterns, not simultaneous leads from one patient.', [[70,260,536,112]])],
    'avr-lmca': [D('aVR ST elevation', schematicLessons['avr-lmca'], [[130,55,85,45]]), D('Widespread opposite depression', 'Compare the ST segment below the dashed baseline in I, II and the other displayed leads. Interpret this distribution with perfusion and symptoms.', [[130,158,100,42],[130,258,100,42],[130,358,100,42]])],
    hypokalemia: [D('Small T then separate U', schematicLessons.hypokalemia, [[154,65,120,26]]), D('ST below baseline', 'Locate the ST segment just after QRS and compare it with the dashed baseline. These are qualitative shapes; use a calibrated patient ECG for measurements.', [[132,70,42,22]])],
    hypothermia: [D('J wave after QRS', schematicLessons.hypothermia, [[130,53,34,38]]), D('QRS–J–T sequence', 'Trace the complex from QRS through the extra J hump to the later T wave. This shape does not establish body temperature or a heart rate.', [[107,48,115,47]])],
    brugada: [D('Coved ST in V1', schematicLessons.brugada, [[129,45,125,65]]), D('Matching V2 morphology', 'The second lead shows the same coved descent into an inverted T. Proper right precordial lead placement and exclusion of mimics are essential.', [[129,145,125,65]])],
    'pe-strain': [D('Deep S in lead I', 'The first row shows a prominent negative S after R. This is one component of the S1Q3T3 mnemonic, which is neither sensitive nor specific for PE.', [[110,57,35,51]]), D('Q and inverted T in III', 'Compare the initial negative deflection and later inverted T in the second row.', [[106,157,125,47]]), D('Anterior T inversion', schematicLessons['pe-strain'], [[150,267,82,40],[150,367,82,40],[150,467,82,40]])],
    'pericarditis-ber': [D('PR depression and ST elevation', 'In II, the short PR segment sits below baseline while ST is above it. Use the whole ECG and clinical presentation to distinguish pericarditis from occlusion.', [[100,55,127,39]]), D('Opposite change in aVR', schematicLessons['pericarditis-ber'], [[100,160,127,42]])],
    'tca-toxicity': [D('Terminal R in aVR', schematicLessons['tca-toxicity'], [[120,56,35,48]]), D('Broad QRS morphology', 'Follow the full negative-to-positive ventricular complex. The sketch conveys morphology; it cannot provide a QRS duration or a terminal-R measurement.', [[106,54,54,54]])],
    wpw: [D('Short PR and delta upstroke', schematicLessons.wpw, [[86,51,54,38]]), D('Ventricular complex after delta', 'The slurred beginning merges into the rest of QRS. Diagnose pre-excitation on a calibrated complete ECG, not by measuring this schematic.', [[106,49,48,49]])],
    'electrical-alternans': [D('Large then small QRS', schematicLessons['electrical-alternans'], [[107,52,44,40],[283,59,44,34]]), D('Alternation repeats', 'Compare the third ventricular complex with the smaller second one. Repeating amplitude change is the illustrated feature; confirm the cause clinically.', [[459,52,44,40]])],
    'ischemia-map': [
      D('Inferior ST elevation', 'The upper-left example locates the inferior-lead J-point threshold. Apply criteria in contiguous leads and the clinical setting.', [[16,88,298,110]], 'inf'),
      D('Reciprocal depression', 'The upper-right example shows the opposite ST direction in aVL. Reciprocal changes support interpretation but are not a standalone diagnosis.', [[326,88,298,110]], 'mirror'),
      D('V2–V3 thresholds', 'The middle row separates the sex- and age-specific anterior thresholds. Check the correct category rather than applying 1 mm to every lead.', [[16,240,608,144]], 'ant'),
      D('Right-sided and posterior views', 'V4R assesses right ventricular involvement; V7–V9 assess the posterior wall. Negative supplemental leads do not exclude occlusion.', [[16,428,608,122]], 'post'),
      D('Other ischemic changes', 'The bottom examples locate ST depression, inverted T and a broad/deep Q. Interpret new changes with prior and serial ECGs.', [[16,600,608,106]], 'ischa')],
    'normal-12lead': [
      D('Sinus rhythm in lead II', 'Follow P–QRS–T in lead II. P precedes each QRS with a consistent PR in this synthetic normal rhythm.', [[112,500,500,290]]),
      D('Compare precordial R progression', 'Compare V1 through V6: an initially dominant S gives way to larger R waves. The columns show sequential time windows, not simultaneous beats.', [[1176,136,500,320],[1176,504,500,320],[1176,872,500,320],[1708,136,500,320],[1708,504,500,320],[1708,872,500,320]]),
      D('Ten-second rhythm strip', 'Use the continuous bottom lead II to assess regularity over time. The upper columns each cover 2.5 seconds.', [[112,1210,2096,290]]),
      D('Calibration pulse', 'The pulse at the left of the rhythm strip represents 1 mV and 200 ms. Check gain and speed before making measurements.', [[16,1260,80,150]])]
  });
  // The step-seven figure is the same modeled hyperkalemia panel, with all its tools.
  lib['toxic-metabolic-mimics'].viewerAlias = 'hyperkalemia';
  lib['toxic-metabolic-mimics'].hasReference = lib.hyperkalemia.hasReference;
  lessons['toxic-metabolic-mimics'] = lessons.hyperkalemia;
  Object.keys(lib).forEach(function (id) { lib[id].findings = lessons[id] || []; });

  Object.keys(lib).forEach(function (id) {
    var entry = lib[id];
    if (!entry.svg || entry.svg.includes('<pattern')) return;
    var vb = entry.svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
    var grid = E.renderPaperGrid(vb[2], vb[3]).replace(/ecgEngMinor/g, id + '-decorativeMinor').replace(/ecgEngMajor/g, id + '-decorativeMajor');
    entry.svg = entry.svg.replace(/(<svg[^>]*>)/, '$1' + '<g class="ecg-decorative-paper" aria-hidden="true">' + grid + '</g>');
    entry.caption += ' Background grid is decorative; do not measure this schematic with its boxes.';
  });

  function addFindingEllipse(group, bounds) {
    var ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    ellipse.setAttribute('cx', bounds[0] + bounds[2] / 2); ellipse.setAttribute('cy', bounds[1] + bounds[3] / 2);
    ellipse.setAttribute('rx', bounds[2] / 2); ellipse.setAttribute('ry', bounds[3] / 2);
    group.appendChild(ellipse);
  }

  function measure(a, b, ux, uy) {
    var ms = Math.abs(b.x - a.x) / ux, mv = (a.y - b.y) / uy;
    return { ms: ms, mv: mv, rrRate: ms > 0 ? 60000 / ms : null };
  }
  function open(id, returnTo, settings) {
    close();
    var entry = lib[id];
    if (!entry) return;
    settings = settings || {};
    var model = lib[entry.viewerAlias] || entry;
    var spec = model.traceSpec && viewerSpec(entry.viewerAlias || id, model.traceSpec, settings.variant), box = document.createElement('div');
    var lesson = lessons[id] || [], selectedFinding = 0, showFindings = settings.findings !== false;
    if (settings.wave) {
      var matching = lesson.findIndex(function (f) { return f.wave === settings.wave || (f.leads && spec && f.leads.some(function (lead) { return (spec.waves || {})[lead] === settings.wave; })); });
      if (matching >= 0) selectedFinding = matching;
    }
    box.className = 'ecg-lightbox ecg-workbench';
    box.id = 'ecgWorkbench';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', entry.title);
    var controls = '<label>Zoom <select aria-label="Zoom" data-view="zoom"><option value="1">Fit width</option><option value="1.5">150%</option><option value="2">200%</option><option value="3">300%</option></select></label>';
    {
      controls = '<label class="ecg-diagnosis">ECG <select aria-label="ECG" data-view="diagnosis">' + Object.keys(lib).map(function (key) { return '<option value="' + key + '"' + (key === id ? ' selected' : '') + '>' + esc(lib[key].title) + '</option>'; }).join('') + '</select></label>' + controls;
    }
    if (spec) {
      if (id === 'wellens') controls += '<label>Variant <select aria-label="Variant" data-view="variant"><option value="B"' + (settings.variant !== 'A' ? ' selected' : '') + '>Type B · inverted</option><option value="A"' + (settings.variant === 'A' ? ' selected' : '') + '>Type A · biphasic</option></select></label>';
      controls += '<label>Lead <select aria-label="Lead" data-view="lane"><option value="all">All shown leads</option>' + spec.lanes.map(function (l) { return '<option value="' + esc(l) + '">' + esc(laneLabels[l] || l) + '</option>'; }).join('') + '</select></label>';
      controls += '<label>Speed <select aria-label="Speed" data-view="speed"><option value="25">25 mm/s</option><option value="50">50 mm/s</option></select></label><label>Gain <select aria-label="Gain" data-view="gain"><option value="5">5 mm/mV</option><option value="10" selected>10 mm/mV</option><option value="20">20 mm/mV</option></select></label><label>Window <select aria-label="Window" data-view="duration"><option value="3000">3 seconds</option><option value="6000">6 seconds</option><option value="10000">10 seconds</option></select></label>';
      controls += '<button type="button" data-view="artifact" aria-pressed="false">Artifact</button><button type="button" data-view="measure" aria-pressed="false">Calipers</button>';
      controls += '<button type="button" data-view="normal" aria-pressed="' + String(!!settings.normal) + '">Normal ECG</button>';
      if (entry.hasReference) controls += '<button type="button" data-view="reference" aria-pressed="false">Normal reference</button>';
    }
    controls += '<button type="button" data-view="findings" aria-pressed="' + String(showFindings) + '">Highlights</button>';
    if (/class="[^"]*(?:ecg-label|ecg-marker|ecg-annotation)/.test(entry.svg || '')) controls += '<button type="button" data-view="labels" aria-pressed="true">Labels</button>';
    box.innerHTML = '<div class="ecg-lightbox-card"><div class="ecg-lightbox-head"><strong>' + esc(entry.title) + '</strong><button class="ecg-lightbox-close" type="button">Close</button></div><div class="ecg-workbench-tools">' + controls + '</div><div class="ecg-workbench-paper" tabindex="0" aria-label="ECG paper; scroll to inspect"><div class="ecg-workbench-canvas"></div></div><div class="ecg-caliper-inputs" hidden><label>Point A time (ms)<input data-point="a" data-axis="t" type="number" value="400" min="0" step="10"></label><label>A voltage (mV)<input data-point="a" data-axis="v" type="number" value="0" step="0.05"></label><label>Point B time (ms)<input data-point="b" data-axis="t" type="number" value="1200" min="0" step="10"></label><label>B voltage (mV)<input data-point="b" data-axis="v" type="number" value="0" step="0.05"></label></div><p class="ecg-measurement" role="status"></p><p class="ecg-lightbox-cap">' + esc((entry.caption || 'Teaching diagram; not a patient recording.').replace('Each small box represents 40 ms / 0.1 mV at this setting. ', '')) + (entry.hasReference ? ' Reference: a modeled normal lead at the same rate and QRS onset times; not a prior patient ECG.' : '') + '</p></div>';
    if (lesson.length) {
      var findings = document.createElement('section'); findings.className = 'ecg-findings'; findings.setAttribute('aria-label', 'Key findings');
      findings.innerHTML = '<strong>Key findings · select to circle in red</strong><div class="ecg-finding-buttons">' + lesson.map(function (f, i) { return '<button type="button" data-finding="' + i + '" aria-pressed="false">' + esc(f.title) + '</button>'; }).join('') + '</div><p class="ecg-finding-detail" role="status"></p>';
      box.querySelector('.ecg-workbench-paper').before(findings);
    }
    box.querySelector('.ecg-workbench-paper').insertAdjacentHTML('beforebegin', '<p class="ecg-paper-help">Scroll inside the ECG to inspect the full tracing.</p>');
    if (spec) {
      box.querySelector('.ecg-lightbox-head strong').textContent = entry.title;
      var primary = box.querySelector('.ecg-workbench-tools');
      var advanced = document.createElement('details'); advanced.className = 'ecg-settings';
      advanced.innerHTML = '<summary>Scale, zoom &amp; calipers</summary><div class="ecg-workbench-tools"></div>';
      Array.from(primary.children).forEach(function (control) {
        var input = control.matches('[data-view]') ? control : control.querySelector('[data-view]');
        if (['diagnosis', 'variant', 'lane', 'normal', 'findings'].indexOf(input.dataset.view) < 0) advanced.lastChild.appendChild(control);
      });
      primary.after(advanced);
    }
    active = { box: box, returnTo: returnTo || document.activeElement, overflow: document.body.style.overflow, background: [] };
    document.body.appendChild(box);
    Array.from(document.body.children).forEach(function (el) {
      if (el !== box && !['SCRIPT', 'STYLE'].includes(el.tagName)) { active.background.push([el, el.inert]); el.inert = true; }
    });
    document.body.style.overflow = 'hidden';
    var state = { speed: 25, gain: 10, duration: spec && /complete-heart-block|vt-vs-svt|atrial-fibrillation/.test(id) ? 10000 : 3000, lane: 'all', viewer: true, artifact: false, normal: !!settings.normal && !!spec };
    if (spec) box.querySelector('[data-view="duration"]').value = String(state.duration);
    var canvas = box.querySelector('.ecg-workbench-canvas'), readout = box.querySelector('.ecg-measurement');
    var result, points = [], measuring = false, dragging = -1;
    // Keyboard focus uses the same finding marker as mouse/touch selection.
    box.addEventListener('focusin', function (event) {
      if (!event.target.matches('.ecg-guided-target')) return;
      selectedFinding = Number(event.target.dataset.finding); showFindings = true;
      paintFindings();
    });
    function paintFindings() {
      var old = canvas.querySelector('.ecg-finding-marks'); if (old) old.remove();
      var detail = box.querySelector('.ecg-finding-detail'); if (!detail) return;
      box.querySelectorAll('[data-finding]').forEach(function (btn, i) { btn.setAttribute('aria-pressed', String(showFindings && !state.normal && Number(btn.dataset.finding) === selectedFinding)); });
      box.querySelector('[data-view="findings"]').setAttribute('aria-pressed', String(showFindings && !state.normal));
      if (state.normal) { detail.textContent = 'Normal sinus model at 72/min in the same lead views. Select Normal ECG again to return to the diagnosis.'; return; }
      if (!showFindings) { detail.textContent = 'Clean ECG. Choose a finding to highlight its lead and segment.'; return; }
      var f = lesson[selectedFinding];
      if (!spec) {
        detail.textContent = f.explanation;
        var svg = canvas.querySelector('svg'), ns = 'http://www.w3.org/2000/svg';
        var marks = document.createElementNS(ns, 'g'); marks.setAttribute('class', 'ecg-finding-marks');
        f.targets.forEach(function (r) { addFindingEllipse(marks, r); });
        svg.appendChild(marks); return;
      }
      detail.textContent = 'Leads: ' + f.leads.map(function (lead) { return laneLabels[lead] || lead; }).join(', ') + '. ' + f.explanation;
      var ns = 'http://www.w3.org/2000/svg', g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'ecg-finding-marks');
      findingTargets(result, f).forEach(function (r) { addFindingEllipse(g, r); });
      canvas.querySelector('svg').appendChild(g);
    }
    function updateCalipers() {
      var svg = canvas.querySelector('svg'), old = svg && svg.querySelector('.ecg-calipers');
      if (old) old.remove();
      if (!measuring || !result) { readout.textContent = ''; return; }
      readout.textContent = 'Tap two points in the same lead, drag A/B, or enter their coordinates below. Measure from an isoelectric baseline for ST height.';
      var ns = 'http://www.w3.org/2000/svg', g = document.createElementNS(ns, 'g'); g.setAttribute('class', 'ecg-calipers');
      points.forEach(function (p, i) {
        var row = result.rows[p.row], line = document.createElementNS(ns, 'line');
        ['x1', 'x2'].forEach(function (a) { line.setAttribute(a, p.x); });
        line.setAttribute('y1', row.top + 26); line.setAttribute('y2', row.bottom); g.appendChild(line);
        var dot = document.createElementNS(ns, 'circle'); dot.setAttribute('cx', p.x); dot.setAttribute('cy', p.y); dot.setAttribute('r', 7); dot.setAttribute('data-handle', i); g.appendChild(dot);
        var hit = document.createElementNS(ns, 'circle');
        hit.setAttribute('class', 'ecg-caliper-hit'); hit.setAttribute('cx', p.x); hit.setAttribute('cy', p.y);
        hit.setAttribute('r', Math.max(10, 22 * result.width / Math.max(1, svg.getBoundingClientRect().width)));
        hit.setAttribute('data-handle', i); g.appendChild(hit);
        var text = document.createElementNS(ns, 'text'); text.setAttribute('x', p.x + 10); text.setAttribute('y', p.y - 10); text.textContent = i ? 'B' : 'A'; g.appendChild(text);
        var timeInput = box.querySelector('[data-point="' + (i ? 'b' : 'a') + '"][data-axis="t"]');
        var voltageInput = box.querySelector('[data-point="' + (i ? 'b' : 'a') + '"][data-axis="v"]');
        if (document.activeElement !== timeInput) timeInput.value = round((p.x - result.x) / result.ux);
        if (document.activeElement !== voltageInput) voltageInput.value = round((row.baseline - p.y) / result.uy);
      });
      svg.appendChild(g);
      if (points.length === 2) {
        var m = measure(points[0], points[1], result.ux, result.uy);
        readout.textContent = 'Δt ' + round(m.ms) + ' ms · ΔV (B − A) ' + round(m.mv) + ' mV' + (m.rrRate ? ' · If R–R: ' + round(m.rrRate) + ' bpm' : '') + '. Manual placement; not automated interval detection.';
      }
    }
    function paint() {
      points = [];
      if (spec) { result = render(spec, state); canvas.innerHTML = result.svg; }
      else if (entry.png) {
        canvas.innerHTML = '<img class="ecg-img" alt="' + esc(entry.title) + '" src="' + esc(entry.png) + '">';
        canvas.querySelector('img').addEventListener('error', function () { canvas.innerHTML = entry.svg || '<p>Image unavailable.</p>'; });
      } else canvas.innerHTML = entry.svg;
      // Reuse authored SVGs with instance-local IDs and guided findings.
      var staticSvg = !spec && canvas.querySelector('svg');
      if (staticSvg) {
        var suffix = '-viewer' + (++sequence), ids = {};
        staticSvg.querySelectorAll('[id]').forEach(function (el) { ids[el.id] = el.id + suffix; el.id += suffix; });
        staticSvg.querySelectorAll('*').forEach(function (el) { Array.from(el.attributes).forEach(function (a) {
          var value = a.value; Object.keys(ids).forEach(function (old) { value = value.split('url(#' + old + ')').join('url(#' + ids[old] + ')'); });
          if (a.name === 'aria-labelledby') value = value.split(' ').map(function (key) { return ids[key] || key; }).join(' ');
          if (value !== a.value) el.setAttribute(a.name, value);
        }); });
        var labelled = staticSvg.getAttribute('aria-labelledby');
        if (labelled) staticSvg.setAttribute('aria-labelledby', labelled.split(' ').map(function (key) { return ids[key] || key; }).join(' '));
      }
      canvas.querySelectorAll('.ecg-hot').forEach(function (el) { el.remove(); });
      canvas.querySelectorAll('[tabindex]').forEach(function (el) { el.removeAttribute('tabindex'); });
      canvas.style.width = Number(box.querySelector('[data-view="zoom"]').value) * 100 + '%';
      // Keep long rhythm strips readable inside their paper scroller.
      canvas.style.minWidth = spec && state.duration > 3000 ? Math.round(result.width * .65) + 'px' : '';
      box.querySelectorAll('[data-axis="t"]').forEach(function (input) { input.max = state.duration; });
      if (staticSvg) {
        // Explicit targets also work by keyboard; keep existing artwork inert.
        lesson.forEach(function (f, index) { f.targets.forEach(function (bounds) {
          var target = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          ['x', 'y', 'width', 'height'].forEach(function (key, i) { target.setAttribute(key, bounds[i]); });
          target.setAttribute('class', 'ecg-guided-target'); target.setAttribute('data-finding', index);
          target.setAttribute('role', 'button'); target.setAttribute('tabindex', '0');
          target.setAttribute('aria-label', f.title); staticSvg.appendChild(target);
        }); });
        staticSvg.removeAttribute('aria-hidden'); staticSvg.setAttribute('role', 'group');
        staticSvg.setAttribute('aria-label', entry.title + ' — select a feature for explanation');
      }
      updateCalipers();
      paintFindings();
    }
    function toggle(btn) { var on = btn.getAttribute('aria-pressed') !== 'true'; btn.setAttribute('aria-pressed', String(on)); return on; }
    box.addEventListener('click', function (event) {
      if (event.target === box || event.target.closest('.ecg-lightbox-close')) { close(); return; }
      var findingButton = event.target.closest('[data-finding]');
      if (findingButton) {
        selectedFinding = Number(findingButton.dataset.finding); showFindings = true; state.normal = false;
        if (spec) {
          box.querySelector('[data-view="normal"]').setAttribute('aria-pressed', 'false');
          state.lane = 'all'; box.querySelector('[data-view="lane"]').value = 'all';
          if (lesson[selectedFinding].segment === 'capture') { state.duration = 10000; box.querySelector('[data-view="duration"]').value = '10000'; }
        }
        paint();
        var firstMark = canvas.querySelector('.ecg-finding-marks ellipse');
        if (findingButton.classList.contains('ecg-guided-target')) box.querySelector('button[data-finding="' + selectedFinding + '"]').focus({ preventScroll: true });
        if (firstMark) {
          // Scroll only the paper, keeping the explanation and controls in place.
          var paper = box.querySelector('.ecg-workbench-paper'), markBounds = firstMark.getBoundingClientRect(), paperBounds = paper.getBoundingClientRect();
          paper.scrollLeft += markBounds.left - paperBounds.left - 24;
          paper.scrollTop += markBounds.top - paperBounds.top - 24;
        }
        return;
      }
      var btn = event.target.closest('button[data-view]'); if (!btn) return;
      var key = btn.dataset.view, on = toggle(btn);
      if (key === 'artifact') { state.artifact = on; paint(); }
      if (key === 'normal') { state.normal = on; paint(); }
      if (key === 'findings') { showFindings = on; state.normal = false; if (spec) box.querySelector('[data-view="normal"]').setAttribute('aria-pressed', 'false'); paint(); }
      if (key === 'reference') canvas.classList.toggle('show-reference', on);
      if (key === 'labels') canvas.classList.toggle('hide-labels', !on);
      if (key === 'measure') { measuring = on; points = []; canvas.classList.toggle('is-measuring', on); box.querySelector('.ecg-caliper-inputs').hidden = !on; updateCalipers(); }
    });
    function onControlChange(event) {
      var input = event.target;
      if (input.matches('select[data-view]') && event.type === 'change') {
        if (input.dataset.view === 'diagnosis' || input.dataset.view === 'variant') {
          var key = input.dataset.view;
          open(key === 'diagnosis' ? input.value : id, active.returnTo, { normal: state.normal, findings: showFindings, variant: key === 'variant' ? input.value : undefined });
          active.box.querySelector('[data-view="' + key + '"]').focus(); return;
        }
        if (input.dataset.view === 'zoom') { canvas.style.width = Number(input.value) * 100 + '%'; updateCalipers(); }
        else {
          state[input.dataset.view] = input.dataset.view === 'lane' ? input.value : Number(input.value);
          if (input.dataset.view === 'lane' && state.lane !== 'all') {
            var match = lesson.findIndex(function (f) { return f.leads.includes(state.lane); });
            if (match >= 0) selectedFinding = match;
            else { state.lane = 'all'; input.value = 'all'; }
          }
          if (lesson[selectedFinding].segment === 'capture' && state.duration < 10000) selectedFinding = 0;
          paint();
        }
      }
      if (input.matches('[data-point]') && result && input.value !== '' && input.validity.valid) {
        var rowIndex = points[0] ? points[0].row : 0, row = result.rows[rowIndex];
        points = ['a', 'b'].map(function (key) {
          var t = Number(box.querySelector('[data-point="' + key + '"][data-axis="t"]').value), v = Number(box.querySelector('[data-point="' + key + '"][data-axis="v"]').value);
          return { row: rowIndex, x: result.x + Math.max(0, Math.min(state.duration, t)) * result.ux, y: Math.max(row.top + 26, Math.min(row.bottom, row.baseline - v * result.uy)) };
        }); updateCalipers();
      }
    }
    box.addEventListener('change', onControlChange);
    box.addEventListener('input', onControlChange);
    function location(event, rowIndex) {
      var svg = canvas.querySelector('svg'), matrix = svg.getScreenCTM(); if (!matrix) return null;
      var p = svg.createSVGPoint(); p.x = event.clientX; p.y = event.clientY; p = p.matrixTransform(matrix.inverse());
      if (p.x < result.x || p.x > result.x + state.duration * result.ux) return null;
      var idx = rowIndex !== undefined ? rowIndex : result.rows.findIndex(function (r) { return p.y >= r.top + 26 && p.y <= r.bottom; });
      if (idx < 0) return null;
      var row = result.rows[idx]; return { x: p.x, y: Math.max(row.top + 26, Math.min(row.bottom, p.y)), row: idx };
    }
    canvas.addEventListener('pointerdown', function (event) {
      if (!measuring || !result) return;
      var handle = event.target.getAttribute('data-handle');
      if (handle !== null) { dragging = Number(handle); canvas.setPointerCapture(event.pointerId); event.preventDefault(); return; }
      var p = location(event); if (!p) return;
      if (points.length === 2 || (points.length && points[0].row !== p.row)) points = [];
      points.push(p); updateCalipers();
    });
    canvas.addEventListener('pointermove', function (event) {
      if (dragging < 0) return; var p = location(event, points[dragging].row); if (p) { points[dragging] = p; updateCalipers(); }
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (name) { canvas.addEventListener(name, function () { dragging = -1; }); });
    box.addEventListener('keydown', function (event) {
      // Keep app-wide shortcuts from changing routes behind this modal.
      event.stopPropagation();
      if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.ecg-guided-target')) { event.preventDefault(); event.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); return; }
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab') return;
      var focusable = Array.from(box.querySelectorAll('button, select, input, summary, [tabindex="0"]')).filter(function (el) { return !el.disabled && el.getClientRects().length; });
      var first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    paint(); box.querySelector('.ecg-lightbox-close').focus();
  }
  function close() {
    if (!active) return;
    var a = active; active = null; a.box.remove(); document.body.style.overflow = a.overflow;
    a.background.forEach(function (pair) { pair[0].inert = pair[1]; });
    if (a.returnTo && a.returnTo.isConnected) a.returnTo.focus();
  }
  if (typeof window !== 'undefined') window.addEventListener('hashchange', close);
  export const ECG_INTERACTIVE = { open: open, close: close, render: render, measure: measure, signal: signal, findingTargets: findingTargets };
