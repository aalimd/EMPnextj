// @ts-nocheck — verbatim legacy port (documented exception); see below.
/* eslint-disable */
/**
 * VERBATIM PORT of legacy `assets/ecg-engine.js` to a TypeScript ES module.
 * Clinical morphology, geometry and teaching text are unchanged.
 * New code must consume this module via the typed facade in `./api.ts`
 * (ECG) or the typed data modules (learning).
 */
/*
 * EM-CPs ECG engine v2 — Phase 1 foundation (normal 12-lead) + Phase 2
 * representative pathology (9 patterns, focused teaching views).
 *
 * Purpose: reusable parametric synthetic ECG renderer that looks clinically
 * plausible while staying physiologically honest.
 *
 * Phase 1: normal sinus-rhythm 12-lead demonstration (3x4 + rhythm).
 * Phase 2: inferior STEMI, hyperacute T comparator, Wellens A/B, de Winter,
 *   hyperkalemia stages, monomorphic VT with AV dissociation/capture/fusion,
 *   complete heart block with independent P march + escape, Smith-modified
 *   Sgarbossa (3 criteria), posterior OMI mirror + V8 confirmation. Focused
 *   teaching views reuse the existing card layouts/badges/hotspots/notes;
 *   only trace generation is upgraded to engine signals.
 *
 * Coordinate system (shared by paper grid, calibration pulse and waveform):
 *   SVG_PER_MM = 8  (preserved from rate-calibration figure)
 *   Paper speed 25 mm/s  -> 1 mm horizontally = 40 ms
 *   Gain 10 mm/mV        -> 1 mm vertically   = 0.1 mV
 *   Calibration: 1 mV = 10 mm = 80 units tall; 200 ms = 5 mm = 40 units wide.
 *   HR 60 -> RR 1000 ms = 25 mm = 200 units. HR 75 -> RR 800 ms = 20 mm = 160 units.
 *
 * Units are never mixed implicitly. Helpers msToUnits()/mvToUnits()/mmToUnits()
 * are the only conversion points. All morphology numbers are documented in ms/mV.
 *
 * Physiological model (normal only):
 *   - Limb leads are Einthoven projections of a frontal-plane dipole, so
 *     II = I + III holds approximately and axis behaviour is automatic.
 *     Each wave (P/Q/R/S/T) has its own vector angle + magnitude; shape
 *     differences between limb leads come from different Q/R/S ratios, not clones.
 *   - Precordial leads V1-V6 use an independent table with plausible R-wave
 *     progression (rS in V1 -> dominant R in V5/V6) and concordant T waves.
 *   - Timing is shared across leads (one global beat train); amplitudes differ.
 *
 * Realism: subtle deterministic seeded variation only (respiratory baseline
 * wander, muscle fuzz, beat-to-beat amplitude variation, respiratory sinus
 * arrhythmia). Defaults are low so teaching morphology stays clear. All
 * variation is reproducible for the same seed; no Math.random() is used.
 *
 * Safety: output SVG is labelled "Synthetic educational ECG" and must never be
 * presented as a patient recording. No clinical teaching text is changed here.
 * Nothing here is diagnostically validated; tracings are teaching simulations.
 *
 * Integration: this file exports window.ECG_ENGINE (calibrated synthetic ECG
 * rendering: converters, signal model, 12-lead and focused renderers,
 * validators). Selected focused cards in assets/ecg-case-tracings.js consume
 * it for trace generation and overlay geometry; inspector waves for those
 * cards live in assets/app.js. It does not directly mutate window.ECG_DATA,
 * and existing ECG_SVG/ecgFigure() compatibility is preserved through that
 * integration layer (schematic beat() remains as fallback).
 */
/* ── Geometry: the only numbers that map physical units to SVG ── */
var SVG_PER_MM = 8;            // 8 SVG user units = 1 mm (matches rate-calibration)
var PAPER_SPEED_MM_S = 25;     // standard paper speed
var GAIN_MM_MV = 10;           // standard gain
var MS_PER_MM = 1000 / PAPER_SPEED_MM_S; // 40 ms per mm horizontally
var MV_PER_MM = 1 / GAIN_MM_MV;           // 0.1 mV per mm vertically

function mmToUnits(mm) { return mm * SVG_PER_MM; }
function msToMm(ms) { return ms / MS_PER_MM; }
function msToUnits(ms) { return (ms / MS_PER_MM) * SVG_PER_MM; } // ms * 0.2
function mvToMm(mv) { return mv * GAIN_MM_MV; }
function mvToUnits(mv) { return mv * GAIN_MM_MV * SVG_PER_MM; }  // mv * 80
function rateToRRms(bpm) { return 60000 / bpm; }

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* ── Deterministic PRNG (mulberry32) + string hash. No Math.random(). ── */
function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashStr(s) {
  var h = 5381;
  for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h >>> 0;
}
/* Deterministic per-sample muscle noise in [-1,1] from (seed, lead, index). */
function hashNoise(seed, leadHash, idx) {
  var x = (seed ^ Math.imul(idx + 1, 374761393) ^ Math.imul(leadHash + 1, 668265263)) | 0;
  x = Math.imul(x ^ (x >>> 13), 1274126177);
  x ^= x >>> 16;
  return ((x >>> 0) / 4294967296) * 2 - 1;
}

/* ── Beat morphology timing (ms, QRS onset = 0). Shared across leads. ── */
var P_CENTER_MS = -120;  // P peak; P onset ~= -162 ms -> PR ~= 160 ms
var P_SIGMA_MS = 14;     // -> P duration ~80 ms
var Q_CENTER_MS = 12;    // septal q
var Q_SIGMA_MS = 5;
var R_CENTER_MS = 38;    // main R peak
var R_SIGMA_MS = 8;
var S_CENTER_MS = 62;    // terminal S nadir
var S_SIGMA_MS = 8;
var T_CENTER_MS = 275;   // T peak; T end ~= QT (380 ms)
var T_SIGMA_UP_MS = 42;  // slower upstroke -> asymmetric, organic T
var T_SIGMA_DOWN_MS = 35;
/* Nominal intervals of the template (ms). Custom qrsMs/qtMs scale timing
   around QRS onset (0) and J point so params are honoured, not label-only. */
var NOMINAL_QRS_MS = 88; // J point = QRS onset + qrsMs
var NOMINAL_QT_MS = 380; // Q onset to T end (to baseline)

function gauss(t, mu, sigma) {
  var z = (t - mu) / sigma;
  return Math.exp(-0.5 * z * z);
}
/* Normalised envelopes (peak = 1) for a time dt ms from QRS onset. */
function beatEnvelopes(dt) {
  var tEnv;
  if (dt < T_CENTER_MS) tEnv = gauss(dt, T_CENTER_MS, T_SIGMA_UP_MS);
  else tEnv = gauss(dt, T_CENTER_MS, T_SIGMA_DOWN_MS);
  return {
    p: gauss(dt, P_CENTER_MS, P_SIGMA_MS),
    q: gauss(dt, Q_CENTER_MS, Q_SIGMA_MS),
    r: gauss(dt, R_CENTER_MS, R_SIGMA_MS),
    s: gauss(dt, S_CENTER_MS, S_SIGMA_MS),
    t: tEnv
  };
}

/* ── Frontal-plane lead axes (degrees). aVR = 210, aVL = 330. ── */
var LEAD_ANGLES = { I: 0, II: 60, III: 120, aVR: 210, aVL: 330, aVF: 90 };
var LIMB_LEADS = ['I', 'II', 'III', 'aVR', 'aVL', 'aVF'];
var PRECORDIAL_LEADS = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
/* Conventional 3x4 rows: each column shares one 2.5 s time window. */
var LAYOUT_3X4 = [
  ['I', 'aVR', 'V1', 'V4'],
  ['II', 'aVL', 'V2', 'V5'],
  ['III', 'aVF', 'V3', 'V6']
];

/* Vector magnitudes (mV) for the normal dipole. R angle = axisDeg. */
function limbVectorMags() {
  return { pMag: 0.14, qMag: 0.10, rMag: 1.25, sMag: 0.18, tMag: 0.42 };
}
function limbVectorAngles(axisDeg) {
  return {
    pAng: 60,            // normal P axis 0-75 deg
    qAng: 180,           // septal: rightward -> negative q laterally
    rAng: axisDeg,       // mean QRS axis (normal ~45)
    sAng: axisDeg + 195, // terminal forces opposite-ish (for 45 -> 240)
    tAng: axisDeg + 5    // T concordant with QRS
  };
}
function cosDeg(d) { return Math.cos(d * Math.PI / 180); }
/* Peak amplitude (mV) of one wave component in one limb lead. */
function limbAmp(mag, compAng, lead) {
  // Augmented axes have a shorter lead vector than bipolar limb leads.
  // This factor preserves aVR=−(I+II)/2, aVL=I−II/2, aVF=II−I/2.
  var length = lead.charAt(0) === 'a' ? Math.sqrt(3) / 2 : 1;
  return mag * length * cosDeg(compAng - LEAD_ANGLES[lead]);
}

/*
 * Precordial table (mV peaks). Independent per lead — NOT scaled clones.
 * R grows V1->V5 then eases in V6; S regresses; T concordant positive.
 * V1 P is biphasic (handled as +0.04 / -0.04 pair); others small upright.
 */
var PRECORDIAL_TABLE = {
  V1: { p: 0.04, pNeg: -0.04, q: 0.00,  r: 0.22, s: -0.85, t: 0.18 },
  V2: { p: 0.05, pNeg: 0.00,  q: 0.00,  r: 0.35, s: -0.75, t: 0.38 },
  V3: { p: 0.07, pNeg: 0.00,  q: 0.00,  r: 0.65, s: -0.45, t: 0.52 },
  V4: { p: 0.08, pNeg: 0.00,  q: -0.03, r: 1.05, s: -0.22, t: 0.55 },
  V5: { p: 0.09, pNeg: 0.00,  q: -0.08, r: 1.35, s: -0.12, t: 0.42 },
  V6: { p: 0.08, pNeg: 0.00,  q: -0.07, r: 1.10, s: -0.09, t: 0.32 }
};

/* ── Case creation ── */
var DEFAULTS = {
  rate: 72, prMs: 160, qrsMs: 88, qtMs: 380, axisDeg: 45, seed: 12345,
  recordMs: 10000, firstQOnMs: 400,
  noise: { baselineWander: 0.03, muscle: 0.008, beatVariation: 0.02, rsaMs: 12, disabled: false }
};

function mergeNoise(over) {
  var base = DEFAULTS.noise, o = over || {};
  if (o.disabled) return { baselineWander: 0, muscle: 0, beatVariation: 0, rsaMs: 0, disabled: true };
  return {
    baselineWander: o.baselineWander !== undefined ? o.baselineWander : base.baselineWander,
    muscle: o.muscle !== undefined ? o.muscle : base.muscle,
    beatVariation: o.beatVariation !== undefined ? o.beatVariation : base.beatVariation,
    rsaMs: o.rsaMs !== undefined ? o.rsaMs : base.rsaMs,
    disabled: !!o.disabled
  };
}

/*
 * Build the global beat train (QRS onset times) with subtle respiratory sinus
 * arrhythmia. Deterministic for a given seed/rate. Mean rate stays ~= rate.
 */
function buildBeatTimes(rate, recordMs, firstQOnMs, rsaMs) {
  var baseRR = rateToRRms(rate);
  var times = [];
  var t = firstQOnMs;
  var respPeriodMs = 4200; // ~14 breaths/min
  var k = 0;
  while (t < recordMs + 600) {
    times.push(t);
    var wobble = rsaMs * Math.sin((2 * Math.PI * t) / respPeriodMs);
    t += baseRR + wobble;
    k++;
    if (k > 40) break;
  }
  return { times: times, baseRR: baseRR };
}

/* Per-beat amplitude scale (1 +/- variation), deterministic per beat index. */
function beatScale(beatIdx, seed, variation) {
  if (!variation) return 1;
  var rnd = mulberry32((seed ^ Math.imul(beatIdx + 1, 7919)) >>> 0)();
  return 1 + (rnd - 0.5) * 2 * variation;
}

function createNormalSinusCase(opts) {
  var o = opts || {};
  var rate = o.rate !== undefined ? o.rate : DEFAULTS.rate;
  var prMs = o.prMs !== undefined ? o.prMs : DEFAULTS.prMs;
  var qrsMs = o.qrsMs !== undefined ? o.qrsMs : DEFAULTS.qrsMs;
  var qtMs = o.qtMs !== undefined ? o.qtMs : DEFAULTS.qtMs;
  var axisDeg = o.axisDeg !== undefined ? o.axisDeg : DEFAULTS.axisDeg;
  var seed = o.seed !== undefined ? o.seed : DEFAULTS.seed;
  var noise = mergeNoise(o.noise);
  if (noise.disabled) {
    noise = { baselineWander: 0, muscle: 0, beatVariation: 0, rsaMs: 0, disabled: true };
  }
  // PR shift: our template has PR ~= 162 ms built in; shift P if requested.
  var prShiftMs = prMs - 162;
  var bt = buildBeatTimes(rate, DEFAULTS.recordMs, DEFAULTS.firstQOnMs, noise.rsaMs);
  return {
    kind: 'normal-sinus',
    rate: rate, prMs: prMs, qrsMs: qrsMs, qtMs: qtMs, axisDeg: axisDeg,
    seed: seed, noise: noise, prShiftMs: prShiftMs,
    beatTimes: bt.times, baseRR: bt.baseRR,
    recordMs: DEFAULTS.recordMs
  };
}

/* ── Phase 2: T-shape variants + ST deviation (all in mV/ms) ── */
function tEnvelopeForShape(dtT, tAmp, tShape, ov) {
  ov = ov || {};
  switch (tShape) {
    case 'broad': // hyperacute: bulky, broad base, straightened takeoff
      return tAmp * (dtT < T_CENTER_MS
        ? gauss(dtT, T_CENTER_MS, 60)
        : gauss(dtT, T_CENTER_MS, 45));
    case 'peaked': // hyperkalemia: narrow, pointed, symmetric tent
      return tAmp * gauss(dtT, T_CENTER_MS, 18);
    case 'inverted': // Wellens B: deep symmetric inversion (tAmp negative)
      return tAmp * gauss(dtT, T_CENTER_MS, 30);
    case 'tallSym': // de Winter: tall prominent symmetric
      return tAmp * gauss(dtT, T_CENTER_MS, 32);
    case 'biphasic': { // Wellens A: + then - in same T
      var pos = ov.biphasicPos !== undefined ? ov.biphasicPos : 0.22;
      var neg = ov.biphasicNeg !== undefined ? ov.biphasicNeg : -0.32;
      return pos * gauss(dtT, T_CENTER_MS - 18, 14) + neg * gauss(dtT, T_CENTER_MS + 18, 14);
    }
    case 'normal':
    default:
      return tAmp * (dtT < T_CENTER_MS
        ? gauss(dtT, T_CENTER_MS, T_SIGMA_UP_MS)
        : gauss(dtT, T_CENTER_MS, T_SIGMA_DOWN_MS));
  }
}
/* Convex ST bump (dome) centred J+30ms, normalised so bump(J) = stMv.
   Positive = STE, negative = STD. Tall T on top gives upsloping look. */
function stBump(dt, J_MS, stMv, shape) {
  if (!stMv) return 0;
  if (shape === 'upsloping' || shape === 'horizontal') {
    var afterJ = dt - J_MS;
    // Join the terminal QRS to the J level without altering the R/S peaks.
    if (afterJ < 0) return stMv * Math.exp(-0.5 * Math.pow(afterJ / 8, 2));
    if (shape === 'upsloping') return stMv * Math.max(0, 1 - afterJ / 160);
    if (afterJ <= 65) return stMv;
    var fade = Math.max(0, Math.min(1, (afterJ - 65) / 90));
    return stMv * (1 - fade * fade * (3 - 2 * fade));
  }
  var c = J_MS + 30, sig = 35;
  var atJ = Math.exp(-0.5 * Math.pow(30 / sig, 2)); // 0.692
  return (stMv / atJ) * gauss(dt, c, sig);
}
// Broad LBBB depolarization, with two lateral R peaks rather than a
// stretched narrow-QRS template. Points are fractions of the QRS interval.
function lbbbQrsAt(dt, width, positive) {
  var points = positive ? [[0,0],[.30,1.2],[.50,.92],[.73,1.15],[1,0]]
    : [[0,0],[.18,0],[.58,-1],[.80,-.78],[1,0]];
  var u = dt / width;
  if (u < 0 || u > 1) return 0;
  for (var i=1;i<points.length;i++) if (u <= points[i][0]) {
    var a=points[i-1],b=points[i];return a[1]+(b[1]-a[1])*(u-a[0])/(b[0]-a[0]);
  }
  return 0;
}
function baseTableForLead(lead) {
  if (PRECORDIAL_TABLE.hasOwnProperty(lead)) return PRECORDIAL_TABLE[lead];
  if (['V7', 'V8', 'V9'].indexOf(lead) >= 0) return { p: 0.04, pNeg: 0, q: -0.02, r: 0.30, s: -0.15, t: 0.25 };
  // These explicitly named comparison scenarios all represent V3.
  if (['Normal', 'Hyperacute', 'HyperK?', 'Type A', 'Type B'].indexOf(lead) >= 0) return PRECORDIAL_TABLE.V3;
  throw new Error('Unsupported ECG lead: ' + lead);
}

/* Instantaneous voltage (mV) for one lead at global time tMs. */
function leadVoltageAt(lead, tMs, caseData, sampleIdx) {
  if (caseData && caseData.dissociated) return dissociatedVoltageAt(lead, tMs, caseData, sampleIdx);
  var mags = limbVectorMags();
  var angs = limbVectorAngles(caseData.axisDeg);
  var isLimb = LEAD_ANGLES.hasOwnProperty(lead);
  var ov = (caseData.leadOverrides && caseData.leadOverrides[lead]) || {};
  var stMv = ov.stMv || 0;
  var tShape = ov.tShape || 'normal';
  var pMult = caseData.fibrillatory ? 0 : (ov.pMult !== undefined ? ov.pMult : 1);
  var v = 0;
  // Scale template timing toward requested qrsMs/qtMs so interval params are
  // honoured instead of being label-only (uses outer NOMINAL_* constants).
  var qrsScale = caseData.qrsMs / NOMINAL_QRS_MS;
  var J_MS = caseData.qrsMs;
  var qtSpanNominal = NOMINAL_QT_MS - NOMINAL_QRS_MS; // ST+T after J
  var qtSpanWant = caseData.qtMs - caseData.qrsMs;
  var tScale = qtSpanWant / qtSpanNominal;
  // Find contributing beats (only neighbours matter; envelopes decay fast).
  for (var b = 0; b < caseData.beatTimes.length; b++) {
    var qOn = caseData.beatTimes[b];
    var dt = tMs - qOn;
    if (dt < -220 || dt > 560) continue;
    var dtP = dt + caseData.prShiftMs; // honour requested PR without reshaping
    var dtQ = dt / qrsScale;           // stretch/shrink QRS to qrsMs
    // Map T timing around J so QT end lands on qtMs: scale offset from J.
    var dtT = NOMINAL_QRS_MS + (dt - J_MS) / tScale;
    if (dtT < -260 || dtT > 600) continue;
    var envP = gauss(dtP, P_CENTER_MS, P_SIGMA_MS);
    var envQRS = beatEnvelopes(dtQ);
    if (ov.rSigmaMs) envQRS.r = gauss(dtQ, R_CENTER_MS, ov.rSigmaMs);
    var scale = beatScale(b, caseData.seed, caseData.noise.beatVariation);
    // Slight per-beat timing jitter would blur intervals; keep timing exact.
    if (isLimb) {
      var baseT = limbAmp(mags.tMag, angs.tAng, lead);
      var tAmpL = ov.tAmp !== undefined ? ov.tAmp : baseT;
      var tEnvL = tEnvelopeForShape(dtT, tAmpL, tShape, ov);
      v += scale * (
        limbAmp(mags.pMag, angs.pAng, lead) * pMult * envP +
        limbAmp(mags.qMag, angs.qAng, lead) * envQRS.q +
        limbAmp(mags.rMag, angs.rAng, lead) * envQRS.r +
        limbAmp(mags.sMag, angs.sAng, lead) * envQRS.s +
        tEnvL
      ) + stBump(dt, J_MS, stMv, ov.stShape);
    } else {
      var tab = baseTableForLead(lead);
      var pPos = gauss(dtP, -125, 10) * tab.p * pMult;
      var pNeg = tab.pNeg ? gauss(dtP, -102, 10) * tab.pNeg * pMult : 0;
      var tAmpP = ov.tAmp !== undefined ? ov.tAmp : tab.t;
      var tEnvP = tEnvelopeForShape(dtT, tAmpP, tShape, ov);
      var qA = ov.q !== undefined ? ov.q : tab.q;
      var rA = ov.r !== undefined ? ov.r : tab.r;
      var sA = ov.s !== undefined ? ov.s : tab.s;
      v += scale * (
        pPos + pNeg +
        (ov.qrsShape ? lbbbQrsAt(dt, J_MS, ov.qrsShape === 'lbbb-positive') * (ov.qrsScale || 1) : qA * envQRS.q + rA * envQRS.r + sA * envQRS.s) + tEnvP
      ) + stBump(dt, J_MS, stMv, ov.stShape);
    }
  }
  // Atrial fibrillation is signal, not optional display artifact. It remains
  // present in the clean tracing and never becomes a regular sinus P train.
  if (caseData.fibrillatory) {
    var fAmp = lead === 'V1' ? 0.045 : (lead === 'II' ? 0.030 : 0.018);
    v += fAmp * (0.65 * Math.sin(tMs * 2 * Math.PI / 151 + 0.7 * Math.sin(tMs / 419)) +
      0.35 * Math.sin(tMs * 2 * Math.PI / 197 + 0.5));
  }
  // Sine-wave hyperkalemia: fused QRS-T oscillation, no discrete P.
  if (caseData.sine) {
    var period = caseData.sinePeriodMs || 650;
    var amp = caseData.sineAmpMv || 0.8;
    v = amp * Math.sin((2 * Math.PI * tMs) / period);
  }
  // Respiratory baseline wander (global, same phase all leads) + muscle fuzz.
  if (caseData.noise.baselineWander) {
    v += caseData.noise.baselineWander * Math.sin((2 * Math.PI * tMs) / 4200 + 0.5);
  }
  if (caseData.noise.muscle && sampleIdx !== undefined) {
    v += caseData.noise.muscle * hashNoise(caseData.seed >>> 0, hashStr(lead), sampleIdx);
  }
  return v;
}

/* ── Phase 2: AV dissociation (VT + complete heart block) ──
   Atrial P train and ventricular QRS-T train run independently; P marches
   through. Captures/fusions are special ventricular beats with conducted P. */
function dissociatedVoltageAt(lead, tMs, caseData, sampleIdx) {
  var dis = caseData.dissociated;
  var v = 0;
  var isLimb = LEAD_ANGLES.hasOwnProperty(lead);
  // Atrial P waves (small upright in II, negative aVR via vector; precordial small).
  for (var a = 0; a < dis.atrialTimes.length; a++) {
    var pPeak = dis.atrialTimes[a];
    // Skip dissociated P too close to a conducted capture/fusion P (avoid double).
    var skip = false;
    for (var s = 0; s < (dis.skipAtrialNear || []).length; s++) {
      if (Math.abs(pPeak - dis.skipAtrialNear[s]) < 250) { skip = true; break; }
    }
    if (skip) continue;
    var dtA = tMs - pPeak;
    if (dtA < -60 || dtA > 60) continue;
    var pEnv = gauss(dtA, 0, 12);
    var pAmp;
    if (isLimb) pAmp = limbAmp(dis.atrialPampMv || 0.10, 60, lead);
    else pAmp = (lead === 'V1') ? 0.03 : 0.06;
    v += pAmp * pEnv;
  }
  // Ventricular beats (wide escape / VT). Each has its own qrsMs + morphology.
  for (var b = 0; b < dis.ventricularBeats.length; b++) {
    var vb = dis.ventricularBeats[b];
    var dt = tMs - vb.qOn;
    if (dt < -220 || dt > 560) continue;
    var qrsScale = vb.qrsMs / NOMINAL_QRS_MS;
    var J_MS = vb.qrsMs;
    var dtQ = dt / qrsScale;
    var envQRS = beatEnvelopes(dtQ);
    var tScaleV = ((vb.qtMs || caseData.qtMs) - vb.qrsMs) / (NOMINAL_QT_MS - NOMINAL_QRS_MS);
    var dtT = NOMINAL_QRS_MS + (dt - J_MS) / tScaleV;
    var tEnv = tEnvelopeForShape(dtT, vb.tAmp, vb.tShape || 'normal', vb);
    var vScale = beatScale(b, caseData.seed, caseData.noise.beatVariation);
    var stB = stBump(dt, J_MS, vb.stMv || 0);
    if (isLimb) {
      // VT/escape limb morphology via explicit R/S amps (not vector) for clarity.
      var rA = vb.rMv !== undefined ? vb.rMv : limbAmp(1.10, caseData.axisDeg, lead);
      var sA = vb.sMv !== undefined ? vb.sMv : limbAmp(0.55, caseData.axisDeg + 195, lead);
      v += vScale * (rA * envQRS.r + sA * envQRS.s + (vb.qMv || 0) * envQRS.q + tEnv) + stB;
      if (vb.conductedP && vb.atrialPeak === undefined) {
        var dtP = dt + 120; // conducted P peak 120ms before QRS onset
        v += limbAmp(0.12, 60, lead) * gauss(dtP, P_CENTER_MS + 120, P_SIGMA_MS);
      }
    } else {
      var tab = baseTableForLead(lead);
      var useR = vb.rMvPrec !== undefined ? vb.rMvPrec : tab.r;
      var useS = vb.sMvPrec !== undefined ? vb.sMvPrec : tab.s;
      v += vScale * ((vb.qMv !== undefined ? vb.qMv : tab.q) * envQRS.q + useR * envQRS.r + useS * envQRS.s + tEnv) + stB;
      if (vb.conductedP && vb.atrialPeak === undefined) {
        var dtP2 = dt + 120;
        v += 0.07 * gauss(dtP2, P_CENTER_MS + 120, P_SIGMA_MS);
      }
    }
  }
  if (caseData.noise.baselineWander) {
    v += caseData.noise.baselineWander * Math.sin((2 * Math.PI * tMs) / 4200 + 0.5);
  }
  if (caseData.noise.muscle && sampleIdx !== undefined) {
    v += caseData.noise.muscle * hashNoise(caseData.seed >>> 0, hashStr(lead + '|dis'), sampleIdx);
  }
  return v;
}

/* ── SVG builders (all geometry flows through ms/mV/mm converters) ── */
function renderPaperGrid(w, h) {
  var minor = SVG_PER_MM;        // 8 units = 1 mm
  var major = SVG_PER_MM * 5;    // 40 units = 5 mm
  return '' +
    '<defs>' +
    '<pattern id="ecgEngMinor" width="' + minor + '" height="' + minor + '" patternUnits="userSpaceOnUse">' +
    '<path d="M' + minor + ' 0H0V' + minor + '" fill="none" stroke="rgba(244,120,130,0.28)" stroke-width="1"/>' +
    '</pattern>' +
    '<pattern id="ecgEngMajor" width="' + major + '" height="' + major + '" patternUnits="userSpaceOnUse">' +
    '<path d="M' + major + ' 0H0V' + major + '" fill="none" stroke="rgba(225,60,80,0.45)" stroke-width="1.2"/>' +
    '</pattern>' +
    '</defs>' +
    '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="#fff1f2"/>' +
    '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="url(#ecgEngMinor)"/>' +
    '<rect x="0" y="0" width="' + w + '" height="' + h + '" fill="url(#ecgEngMajor)"/>' +
    '<rect x="1" y="1" width="' + (w - 2) + '" height="' + (h - 2) + '" fill="none" stroke="#d98a92" stroke-width="2"/>';
}

/* Calibration pulse: 1 mV tall, 200 ms wide, from the same converters. */
function renderCalibrationPulse(x, yBase) {
  var h = mvToUnits(1);   // 80 units
  var w = msToUnits(200); // 40 units
  var lead = 14;          // short lead-in/out in SVG units
  var d = 'M' + r1(x) + ',' + r1(yBase) +
    ' H' + r1(x + lead) +
    ' V' + r1(yBase - h) +
    ' H' + r1(x + lead + w) +
    ' V' + r1(yBase) +
    ' H' + r1(x + lead + w + lead);
  return '<path d="' + d + '" fill="none" stroke="#111111" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<text x="' + r1(x) + '" y="' + r1(yBase + 30) + '" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="22" font-weight="700" fill="#111111">CAL 1 mV / 200 ms</text>';
}

function r1(n) { return Math.round(n * 10) / 10; }

/*
 * One lead cell: sample the global signal over [tStart, tStart+dur).
 * STEP_MS = 4 ms -> 0.8 SVG units per sample horizontally at 25 mm/s.
 */
var STEP_MS = 4;

function renderLeadPath(lead, x0, yBase, tStart, durMs, caseData) {
  var d = '';
  var n = Math.floor(durMs / STEP_MS);
  for (var i = 0; i <= n; i++) {
    var t = tStart + i * STEP_MS;
    var globalIdx = Math.round(t / STEP_MS); // stable index for hash noise
    var mv = leadVoltageAt(lead, t, caseData, globalIdx);
    var x = x0 + msToUnits(t - tStart);
    var y = yBase - mvToUnits(mv);
    if (i === 0) d += 'M' + r1(x) + ',' + r1(y);
    else d += ' L' + r1(x) + ',' + r1(y);
  }
  return '<path d="' + d + '" fill="none" stroke="#111111" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';
}

function leadLabel(x, y, name) {
  return '<text x="' + r1(x) + '" y="' + r1(y) + '" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="30" font-weight="800" fill="#111111">' + esc(name) + '</text>';
}

/* 1-second tick marks along the top (200 units apart at 25 mm/s). */
function renderSecondMarks(x0, y, totalMs) {
  var s = '';
  for (var t = 0; t <= totalMs; t += 1000) {
    var x = x0 + msToUnits(t);
    s += '<rect x="' + r1(x) + '" y="' + r1(y) + '" width="3" height="10" fill="#9ca3af"/>';
  }
  return s + '<text x="' + r1(x0 + msToUnits(totalMs) - 130) + '" y="' + r1(y + 30) + '" font-family="system-ui,sans-serif" font-size="20" fill="#6b7280">1-s marks</text>';
}

/* ── Full 12-lead layout: 3x4 (2.5 s each) + 10 s Lead II rhythm ── */
var COL_DUR_MS = 2500;
var COL_W_MM = 62.5;   // 2500 ms at 25 mm/s
var ROW_H_MM = 40;     // 40 mm gives V5 R (1.35 mV=13.5 mm) + label clearance
var GAP_X_MM = 4;
var GAP_Y_MM = 6;
var GUTTER_L_MM = 14;
var MARGIN_R_MM = 6;
var MARGIN_T_MM = 17;
var MARGIN_B_MM = 11;
var RHYTHM_H_MM = 34;  // 34 mm gives rhythm R + label clearance (was 30, tight)
var RHYTHM_GAP_MM = 5;

function layoutMetrics() {
  var colW = mmToUnits(COL_W_MM);
  var rowH = mmToUnits(ROW_H_MM);
  var gapX = mmToUnits(GAP_X_MM);
  var gapY = mmToUnits(GAP_Y_MM);
  var gutL = mmToUnits(GUTTER_L_MM);
  var marR = mmToUnits(MARGIN_R_MM);
  var marT = mmToUnits(MARGIN_T_MM);
  var marB = mmToUnits(MARGIN_B_MM);
  var rhyH = mmToUnits(RHYTHM_H_MM);
  var rhyGap = mmToUnits(RHYTHM_GAP_MM);
  var w = gutL + 4 * colW + 3 * gapX + marR;
  var h = marT + 3 * rowH + 2 * gapY + rhyGap + rhyH + marB;
  return { colW: colW, rowH: rowH, gapX: gapX, gapY: gapY, gutL: gutL, marT: marT, rhyH: rhyH, rhyGap: rhyGap, marB: marB, w: w, h: h };
}

function renderNormal12Lead(opts) {
  return render12Lead(Object.assign({}, opts, { caseData: createNormalSinusCase(opts) }));
}

function render12Lead(opts) {
  opts = opts || {};
  var caseData = opts.caseData || createNormalSinusCase(opts);
  if (caseData.supportedLeads && caseData.supportedLeads.length < 12) throw new Error('This model supports focused leads only');
  var title = opts.title || 'Normal sinus rhythm — 12-lead';
  var description = opts.description || 'Sinus rhythm about ' + caseData.rate + ' per minute with normal PR, QRS and QT intervals.';
  var subtitle = opts.subtitle === undefined ? caseData.rate + '/min · sinus' : opts.subtitle;
  var teaching = opts.teaching === undefined ? 'P upright I/II, negative aVR · V1 rS → R growth → dominant R V5/V6 · T concordant, asymmetric' : opts.teaching;
  var rhythmLabel = opts.rhythmLabel || 'II rhythm · 10 s · ' + caseData.rate + '/min regular';
  var footer = opts.footer === undefined ? 'PR ~' + caseData.prMs + ' ms · QRS ~' + caseData.qrsMs + ' ms · QT ~' + caseData.qtMs + ' ms.' : opts.footer;
  var m = layoutMetrics();
  var W = Math.round(m.w), H = Math.round(m.h);
  var s = '';
  s += '<svg class="ecg-svg ecg-paper ecg-engine-12lead" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-labelledby="ecgEngTitle ecgEngDesc" preserveAspectRatio="xMidYMid meet">';
  s += '<title id="ecgEngTitle">' + esc(title) + ' — synthetic educational ECG</title>';
  s += '<desc id="ecgEngDesc">Synthetic educational 12-lead ECG at 25 mm per second and 10 mm per millivolt. ' + esc(description) + ' Not a patient recording.</desc>';
  s += renderPaperGrid(W, H);
  // Header: title + speed/gain + synthetic badge (calibration sits in the left gutter).
  s += '<text x="' + m.gutL + '" y="38" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="30" font-weight="800" fill="#111111">' + esc(title) + '</text>';
  s += '<text x="' + m.gutL + '" y="68" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="22" font-weight="700" fill="#374151">SYNTHETIC EDUCATIONAL ECG · 25 mm/s · 10 mm/mV · ' + esc(subtitle) + '</text>';
  s += '<text x="' + m.gutL + '" y="96" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="20" fill="#6b7280">' + esc(teaching) + '</text>';
  s += renderSecondMarks(m.gutL, m.marT - 14, 10000);
  // 12 lead cells.
  for (var r = 0; r < 3; r++) {
    for (var c = 0; c < 4; c++) {
      var lead = LAYOUT_3X4[r][c];
      var x0 = m.gutL + c * (m.colW + m.gapX);
      var yTop = m.marT + r * (m.rowH + m.gapY);
      var yBase = yTop + m.rowH / 2;
      var tStart = c * COL_DUR_MS;
      s += leadLabel(x0 + 8, yTop + 34, lead);
      s += renderLeadPath(lead, x0, yBase, tStart, COL_DUR_MS, caseData);
      // Subtle cell frame so columns read as separate 2.5 s windows.
      s += '<rect x="' + r1(x0) + '" y="' + r1(yTop) + '" width="' + r1(m.colW) + '" height="' + r1(m.rowH) + '" fill="none" stroke="#e5b8bd" stroke-width="1.5"/>';
    }
  }
  // Rhythm strip: full 10 s Lead II.
  var rhyTop = m.marT + 3 * m.rowH + 2 * m.gapY + m.rhyGap;
  var rhyBase = rhyTop + m.rhyH / 2;
  var rhyX = m.gutL;
  var rhyW = 4 * m.colW + 3 * m.gapX;
  s += '<line x1="' + r1(m.gutL - 20) + '" y1="' + r1(rhyTop) + '" x2="' + r1(m.gutL + rhyW + 10) + '" y2="' + r1(rhyTop) + '" stroke="#e5a0a7" stroke-width="1.5" stroke-dasharray="8 5"/>';
  s += leadLabel(rhyX + 8, rhyTop + 32, rhythmLabel);
  s += renderLeadPath('II', rhyX, rhyBase, 0, 10000, caseData);
  s += '<rect x="' + r1(rhyX) + '" y="' + r1(rhyTop) + '" width="' + r1(rhyW) + '" height="' + r1(m.rhyH) + '" fill="none" stroke="#e5b8bd" stroke-width="1.5"/>';
  // Calibration pulse in the left gutter at rhythm baseline: no lead lane
  // starts left of x=gutL, so the 40x80 pulse and its label obscure nothing.
  s += renderCalibrationPulse(24, rhyBase);
  // Footer safety note (always visible, inside the paper).
  s += '<text x="' + m.gutL + '" y="' + r1(H - 14) + '" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="21" font-weight="700" fill="#374151">Synthetic educational tracing — not a patient recording. ' + esc(footer) + '</text>';
  s += '</svg>';
  return { svg: s, caseData: caseData, width: W, height: H };
}

/* ── Phase 2: representative pathology cases (focused teaching views) ──
   All numbers in ms/mV. ST in mV (0.10 mV = 1 mm). T shapes via tShape.
   Lead-to-lead variation is explicit (II/III/aVF not clones). Seeds fixed
   for reproducibility. Noise stays subtle; disable via noise.disabled. */

function basePatternCase(over) {
  var o = over || {};
  var noise = mergeNoise(o.noise);
  var prShiftMs = (o.prMs !== undefined ? o.prMs : 160) - 162;
  var bt = buildBeatTimes(o.rate || 72, DEFAULTS.recordMs, DEFAULTS.firstQOnMs, noise.rsaMs);
  return {
    kind: o.kind || 'pattern',
    rate: o.rate || 72,
    prMs: o.prMs !== undefined ? o.prMs : 160,
    qrsMs: o.qrsMs !== undefined ? o.qrsMs : 88,
    qtMs: o.qtMs !== undefined ? o.qtMs : 380,
    axisDeg: o.axisDeg !== undefined ? o.axisDeg : 45,
    seed: o.seed !== undefined ? o.seed : 12345,
    noise: noise, prShiftMs: prShiftMs,
    beatTimes: bt.times, baseRR: bt.baseRR, recordMs: DEFAULTS.recordMs,
    leadOverrides: o.leadOverrides || {},
    sine: o.sine || false, sinePeriodMs: o.sinePeriodMs, sineAmpMv: o.sineAmpMv
  };
}

function createPatternCase(patternId, opts) {
  opts = opts || {};
  switch (patternId) {
    case 'stemi-criteria': // inferior OMI: II/III/aVF convex STE, aVL mirror STD
      return basePatternCase({
        kind: 'inferior-stemi', rate: 78, prMs: 160, qrsMs: 90, qtMs: 410,
        axisDeg: 45, seed: 2001, noise: opts.noise,
        leadOverrides: {
          I: { stMv: -0.04, tAmp: -0.02, tShape: 'broad' },
          II: { stMv: 0.20, tAmp: 0.50, tShape: 'broad' },
          III: { stMv: 0.24, tAmp: 0.52, tShape: 'broad' },
          aVF: { stMv: 0.22, tAmp: 0.51, tShape: 'broad' },
          aVL: { stMv: -0.14, tAmp: -0.27, tShape: 'broad' },
          aVR: { stMv: -0.08, tAmp: -0.24, tShape: 'broad' }
        }
      });
    case 'hyperacute-t': {
      var lane = opts.lane || 'Hyperacute';
      if (lane === 'Normal') {
        return basePatternCase({
          kind: 'hyperacute-normal', rate: 72, prMs: 160, qrsMs: 88, qtMs: 380,
          axisDeg: 45, seed: 2002, noise: opts.noise,
          leadOverrides: { Normal: { tAmp: 0.52, tShape: 'normal' } }
        });
      }
      if (lane === 'HyperK?') {
        return basePatternCase({
          kind: 'hyperacute-hyperk', rate: 72, prMs: 160, qrsMs: 88, qtMs: 380,
          axisDeg: 45, seed: 2003, noise: opts.noise,
          leadOverrides: { 'HyperK?': { tAmp: 0.90, tShape: 'peaked', pMult: 0.25 } }
        });
      }
      return basePatternCase({
        kind: 'hyperacute', rate: 72, prMs: 160, qrsMs: 88, qtMs: 420,
        axisDeg: 45, seed: 2004, noise: opts.noise,
        leadOverrides: { Hyperacute: { stMv: 0.05, tAmp: 1.10, tShape: 'broad' } }
      });
    }
    case 'wellens': {
      var wlane = opts.variant === 'A' ? 'Type A' : (opts.variant === 'B' ? 'Type B' : (opts.lane || 'Type B'));
      if (wlane === 'Type A') {
        return basePatternCase({
          kind: 'wellens-A', rate: 68, prMs: 160, qrsMs: 88, qtMs: 410,
          axisDeg: 45, seed: 2005, noise: opts.noise,
          leadOverrides: { 'Type A': { tShape: 'biphasic', biphasicPos: 0.22, biphasicNeg: -0.32 }, V2: { tShape: 'biphasic', biphasicPos: 0.18, biphasicNeg: -0.28 }, V3: { tShape: 'biphasic', biphasicPos: 0.22, biphasicNeg: -0.32 } }
        });
      }
      return basePatternCase({
        kind: 'wellens-B', rate: 68, prMs: 160, qrsMs: 88, qtMs: 430,
        axisDeg: 45, seed: 2006, noise: opts.noise,
        leadOverrides: { 'Type B': { tAmp: -0.60, tShape: 'inverted' }, V2: { tAmp: -0.50, tShape: 'inverted' }, V3: { tAmp: -0.60, tShape: 'inverted' } }
      });
    }
    case 'dewinter':
      return basePatternCase({
        kind: 'dewinter', rate: 78, prMs: 160, qrsMs: 88, qtMs: 400,
        axisDeg: 45, seed: 2007, noise: opts.noise,
        leadOverrides: {
          V2: { stMv: -0.16, stShape: 'upsloping', tAmp: 0.75, tShape: 'tallSym' },
          V3: { stMv: -0.18, stShape: 'upsloping', tAmp: 0.90, tShape: 'tallSym' },
          V4: { stMv: -0.16, stShape: 'upsloping', tAmp: 1.10, tShape: 'tallSym' },
          V5: { stMv: -0.13, stShape: 'upsloping', tAmp: 1.05, tShape: 'tallSym' },
          V6: { stMv: -0.10, stShape: 'upsloping', tAmp: 0.85, tShape: 'tallSym' },
          aVR: { stMv: 0.10, tAmp: -0.10, tShape: 'normal' }
        }
      });
    case 'sgarbossa':
      // LBBB with all 3 Smith-modified criteria, one per lead (best teaching):
      // V5 lateral positive QRS + concordant STE (criterion 1),
      // V3 anterior negative QRS + concordant STD (criterion 2),
      // V1 septal QS + excessive discordant STE, ST/S>25% (criterion 3).
      // Baseline is discordant LBBB (lateral STD/TWI, anterior STE); MI breaks it.
      // Wide QRS 150ms, no Q laterally, QS in V1. Paced rhythm uses same thresholds.
      return basePatternCase({
        kind: 'sgarbossa-lbbb', rate: 78, prMs: 160, qrsMs: 150, qtMs: 480,
        axisDeg: 45, seed: 2020, noise: opts.noise,
        leadOverrides: {
          V5: { qrsShape: 'lbbb-positive', q: 0.00, r: 1.20, s: -0.10, stMv: 0.12, tAmp: 0.35, tShape: 'normal' },
          V3: { qrsShape: 'lbbb-negative', qrsScale: 0.9, r: 0.25, s: -0.90, stMv: -0.12, tAmp: 0.30, tShape: 'normal' },
          V1: { qrsShape: 'lbbb-negative', r: 0.00, s: -1.00, stMv: 0.30, tAmp: 0.40, tShape: 'normal' }
        }
      });
    case 'posterior-omi':
      // Isolated posterior OMI mirror + true posterior confirmation (best teaching):
      // V1-V3 anterior horizontal STD with tall broad R (R/S>1, R~40ms) and
      // upright T = posterior injury seen from the front; V8 posterior STE>=0.5mm
      // supports posterior injury; V7–V9 and clinical assessment remain necessary.
      return basePatternCase({
        kind: 'posterior-omi', rate: 78, prMs: 160, qrsMs: 90, qtMs: 400,
        axisDeg: 45, seed: 2021, noise: opts.noise,
        leadOverrides: {
          V1: { r: 0.50, rSigmaMs: 13, s: -0.20, stMv: -0.10, stShape: 'horizontal', tAmp: 0.35, tShape: 'normal' },
          V2: { r: 0.70, rSigmaMs: 13, s: -0.25, stMv: -0.12, stShape: 'horizontal', tAmp: 0.45, tShape: 'normal' },
          V3: { r: 0.90, rSigmaMs: 13, s: -0.25, stMv: -0.12, stShape: 'horizontal', tAmp: 0.50, tShape: 'normal' },
          V7: { r: 0.40, s: -0.15, stMv: 0.10, tAmp: 0.28, tShape: 'normal' },
          V9: { r: 0.22, s: -0.10, stMv: 0.06, tAmp: 0.20, tShape: 'normal' },
          V8: { r: 0.30, s: -0.15, stMv: 0.08, tAmp: 0.25, tShape: 'normal' }
        }
      });
    case 'hyperkalemia': {
      var stage = opts.stage || 'advanced';
      if (stage === 'early') {
        return basePatternCase({
          kind: 'hyperk-early', rate: 72, prMs: 160, qrsMs: 88, qtMs: 380,
          axisDeg: 45, seed: 2008, noise: opts.noise,
          leadOverrides: { II: { tAmp: 0.70, tShape: 'peaked', pMult: 1.0 } }
        });
      }
      if (stage === 'progressive') {
        return basePatternCase({
          kind: 'hyperk-progressive', rate: 68, prMs: 210, qrsMs: 95, qtMs: 380,
          axisDeg: 45, seed: 2009, noise: opts.noise,
          leadOverrides: { II: { tAmp: 0.85, tShape: 'peaked', pMult: 0.4 } }
        });
      }
      if (stage === 'severe') {
        return basePatternCase({
          kind: 'hyperk-severe', rate: 60000 / 650, prMs: 200, qrsMs: 160, qtMs: 420,
          axisDeg: 45, seed: 2010,
          noise: opts.noise || { baselineWander: 0.02, muscle: 0.006, beatVariation: 0.01 },
          sine: true, sinePeriodMs: 650, sineAmpMv: 0.80
        });
      }
      return basePatternCase({ // advanced (default teaching snapshot)
        kind: 'hyperk-advanced', rate: 65, prMs: 220, qrsMs: 130, qtMs: 400,
        axisDeg: 45, seed: 2011, noise: opts.noise,
        leadOverrides: { II: { tAmp: 0.90, tShape: 'peaked', pMult: 0.25 } }
      });
    }
    case 'atrial-fibrillation':
      return createAFCase(opts);
    case 'vt-vs-svt':
      return createVTCase(opts);
    case 'complete-heart-block':
      return createCHBCase(opts);
    case 'normal-sinus':
      return createNormalSinusCase(opts);
    default:
      throw new Error('Unsupported ECG pattern: ' + patternId);
  }
}

/* Seeded non-repeating ventricular intervals: AF irregularity is retained
   when display artifact is disabled. No organized atrial P component. */
function createAFCase(opts) {
  var cd = basePatternCase({ kind: 'atrial-fibrillation', rate: 110, prMs: 0,
    qrsMs: 88, qtMs: 340, axisDeg: 45, seed: 2022, noise: opts.noise });
  var random = mulberry32(2022), qOn = 400, times = [], intervals = [];
  while (qOn < DEFAULTS.recordMs + 600) {
    times.push(qOn);
    var rr = 390 + random() * 390;
    intervals.push(rr); qOn += rr;
  }
  cd.beatTimes = times;
  cd.baseRR = intervals.reduce(function (a, b) { return a + b; }, 0) / intervals.length;
  cd.rate = Math.round(60000 / cd.baseRR);
  cd.prMs = null;
  cd.fibrillatory = true;
  return cd;
}

function buildRegularBeats(rate, firstQOn, recordMs) {
  var rr = rateToRRms(rate), out = [], t = firstQOn, k = 0;
  while (t < recordMs + 600 && k < 40) { out.push(t); t += rr; k++; }
  return out;
}

function createVTCase(opts) {
  opts = opts || {};
  var seed = 2012;
  var noise = mergeNoise(opts.noise);
  noise.beatVariation = noise.disabled ? 0 : 0.01; // monomorphic: minimal variation
  noise.rsaMs = 0;            // regular
  var vRate = 170, aRate = 75;
  var vBeats = buildRegularBeats(vRate, 400, DEFAULTS.recordMs);
  var aPeaks = buildRegularBeats(aRate, 260, DEFAULTS.recordMs);
  // Two selected teaching events are tied to the existing regular P train.
  // Fusion: atrial impulse reaches the ventricle near the first VT beat.
  // Capture: P at 2660 ms conducts at 2780 ms, before the next VT beat.
  // These are scripted examples; the simulator does not model refractory tissue.
  var capIdx = 7, fusIdx = 0;
  var ventricularBeats = vBeats.map(function (t, i) {
    if (i === capIdx) {
      return { qOn: aPeaks[3] + 120, qrsMs: 88, qtMs: 300, rMv: 0.85,
        sMv: -0.15, tAmp: 0.35, tShape: 'normal', conductedP: true, atrialPeak: aPeaks[3] };
    }
    if (i === fusIdx) {
      return { qOn: t, qrsMs: 115, qtMs: 320, rMv: 1.00,
        sMv: -0.35, tAmp: -0.10, tShape: 'normal', conductedP: true, atrialPeak: aPeaks[0] };
    }
    return { qOn: t, qrsMs: 150, qtMs: 320, rMv: 1.10, sMv: -0.45, tAmp: -0.30, tShape: 'normal' };
  });
  return {
    kind: 'vt-monomorphic', rate: vRate, prMs: null, qrsMs: 150, qtMs: 320,
    axisDeg: 45, seed: seed, noise: noise, prShiftMs: -2,
    beatTimes: ventricularBeats.map(function (b) { return b.qOn; }), baseRR: rateToRRms(vRate), recordMs: DEFAULTS.recordMs,
    leadOverrides: {}, supportedLeads: ['II'],
    dissociated: {
      atrialTimes: aPeaks, atrialPampMv: 0.09,
      ventricularBeats: ventricularBeats, skipAtrialNear: [],
      captureIdx: capIdx, fusionIdx: fusIdx
    }
  };
}

function createCHBCase(opts) {
  opts = opts || {};
  var seed = 2013;
  var noise = mergeNoise(opts.noise);
  noise.rsaMs = 0; // both rhythms regular and independent
  var aRate = 75, vRate = 35;
  var aPeaks = buildRegularBeats(aRate, 200, DEFAULTS.recordMs);
  var vBeats = buildRegularBeats(vRate, 400, DEFAULTS.recordMs);
  var ventricularBeats = vBeats.map(function (t) {
    return { qOn: t, qrsMs: 120, qtMs: 440, rMv: 0.90, sMv: -0.50, tAmp: -0.25, tShape: 'normal' };
  });
  return {
    kind: 'complete-heart-block', rate: vRate, prMs: null, qrsMs: 120, qtMs: 440,
    axisDeg: 45, seed: seed, noise: noise, prShiftMs: -2,
    beatTimes: vBeats, baseRR: rateToRRms(vRate), recordMs: DEFAULTS.recordMs,
    leadOverrides: {}, supportedLeads: ['II'],
    dissociated: {
      atrialTimes: aPeaks, atrialPampMv: 0.10,
      ventricularBeats: ventricularBeats, skipAtrialNear: []
    }
  };
}

/* Focused-lane trace via engine (610u = 3050ms window, same card geometry).
   displayName may be anatomical (II, V3, aVR) or comparator (Normal, Type A). */
function focusedTracePath(displayName, patternId, y, patternOpts) {
  var caseData = createPatternCase(patternId, Object.assign({}, patternOpts, { lane: displayName }));
  // Map comparator names to anatomical base inside leadVoltageAt via baseTableForLead.
  var x0 = 64, widthU = 610, durMs = widthU / 0.2; // 3050 ms
  var d = '', step = 4, n = Math.floor(durMs / step);
  for (var i = 0; i <= n; i++) {
    var t = i * step;
    var mv = leadVoltageAt(displayName, t, caseData, Math.round(t / step));
    // Hyperkalemia severe sine uses same path (leadVoltageAt handles sine flag).
    var x = x0 + msToUnits(t);
    var yy = y - mvToUnits(mv);
    if (i === 0) d += 'M' + r1(x) + ',' + r1(yy);
    else d += ' L' + r1(x) + ',' + r1(yy);
  }
  return { d: d, caseData: caseData };
}
function focusedFirstJX(patternId, patternOpts) {
  var caseData = createPatternCase(patternId, patternOpts || {});
  var qrs = caseData.qrsMs;
  var firstQOn = 400;
  if (caseData.dissociated && caseData.dissociated.ventricularBeats.length) {
    firstQOn = caseData.dissociated.ventricularBeats[0].qOn;
    qrs = caseData.dissociated.ventricularBeats[0].qrsMs;
  } else if (caseData.beatTimes && caseData.beatTimes.length) {
    firstQOn = caseData.beatTimes[0];
    qrs = caseData.qrsMs;
  }
  return 64 + msToUnits(firstQOn + qrs);
}
/* T-apex X for first beat (for apex dots). Scans live signal for true peak. */
function focusedApexX(displayName, patternId, patternOpts) {
  var caseData = createPatternCase(patternId, Object.assign({}, patternOpts, { lane: displayName, noise: { disabled: true } }));
  var qOn = 400;
  if (caseData.dissociated && caseData.dissociated.ventricularBeats.length) qOn = caseData.dissociated.ventricularBeats[0].qOn;
  else if (caseData.beatTimes && caseData.beatTimes.length) qOn = caseData.beatTimes[0];
  var best = -1e9, bestDt = 200;
  for (var dt = 100; dt <= 500; dt += 2) {
    var v = leadVoltageAt(displayName, qOn + dt, caseData, undefined);
    if (v > best) { best = v; bestDt = dt; }
  }
  return 64 + msToUnits(qOn + bestDt);
}
/* Overlay Y positions (SVG units) for first-beat J and T apex, noise-free. */
function focusedOverlayY(displayName, patternId, y, patternOpts) {
  var caseData = createPatternCase(patternId, Object.assign({}, patternOpts, { lane: displayName, noise: { disabled: true } }));
  var qOn = 400, qrs = 88;
  if (caseData.dissociated && caseData.dissociated.ventricularBeats.length) {
    qOn = caseData.dissociated.ventricularBeats[0].qOn;
    qrs = caseData.dissociated.ventricularBeats[0].qrsMs;
  } else if (caseData.beatTimes && caseData.beatTimes.length) {
    qOn = caseData.beatTimes[0];
    qrs = caseData.qrsMs;
  }
  var jv = leadVoltageAt(displayName, qOn + qrs, caseData, undefined);
  var best = -1e9;
  for (var dt = 100; dt <= 500; dt += 2) {
    var v = leadVoltageAt(displayName, qOn + dt, caseData, undefined);
    if (v > best) best = v;
  }
  return { jy: y - mvToUnits(jv), apexY: y - mvToUnits(best), jMv: jv, tMv: best };
}

/* ── Step 6 legend: OMI equivalents at a glance ──
   Same slots, labels and 640-wide viewBox as the legacy V2–V4 ladder, but each
   mini-sketch is a true engine signal window (0.2u/ms, 80u/mV — same scale as
   every other engine tracing) instead of a cartoon: hyperacute bulky T,
   de Winter STD→tall T, Wellens B inversion, plus a realistic sinus rhythm
   strip. Baselines/labels sit lower than legacy so tall realistic T waves
   clear the header; no teaching copy is changed here. */
function renderOmiLegend() {
  function miniTrace(displayName, patternId, xSlot, yBase, wU, tStartMs, stepMs, laneOpts) {
    var caseData = createPatternCase(patternId, Object.assign({}, laneOpts, { lane: displayName }));
    var d = '', n = Math.floor((wU / 0.2) / stepMs);
    for (var i = 0; i <= n; i++) {
      var t = tStartMs + i * stepMs;
      var mv = leadVoltageAt(displayName, t, caseData, Math.round(t / STEP_MS));
      var x = xSlot + msToUnits(t - tStartMs);
      var y = yBase - mvToUnits(mv);
      d += (i === 0 ? 'M' : ' L') + r1(x) + ',' + r1(y);
    }
    return '<path class="ecg-trace" d="' + d + '" fill="none" stroke="#111111" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  var s = '<svg class="ecg-svg ecg-paper" viewBox="0 0 640 400" role="img" aria-labelledby="ecgOmiTitle" preserveAspectRatio="xMidYMid meet">';
  s += '<title id="ecgOmiTitle">OMI equivalents at a glance — synthetic teaching ladder: hyperacute, de Winter, Wellens</title>';
  s += renderPaperGrid(640, 400).replace(/ecgEngMinor/g, 'omiLegendMinor').replace(/ecgEngMajor/g, 'omiLegendMajor');
  s += '<text class="ecg-lead" x="18" y="26">Synthetic focused leads · 25 mm/s · 10 mm/mV</text>';
  s += '<text class="ecg-label" x="70" y="50">V3</text><text class="ecg-label" x="240" y="50">V3</text><text class="ecg-label" x="410" y="50">V2 · Wellens B</text>';
  s += '<text class="ecg-lead ecg-lead-rhy" x="90" y="268">II rhythm</text>';
  s += '<line class="ecg-sep" x1="0" y1="248" x2="640" y2="248"/>';
  s += miniTrace('Hyperacute', 'hyperacute-t', 70, 156, 150, 230, 2);
  s += '<text class="ecg-label" x="70" y="236">hyperacute broad</text>';
  s += miniTrace('V3', 'dewinter', 240, 156, 150, 230, 2);
  s += '<text class="ecg-label" x="240" y="236">de Winter STD→T</text>';
  s += miniTrace('V2', 'wellens', 410, 156, 150, 230, 2, { variant: 'B' });
  s += '<text class="ecg-label" x="430" y="236">Wellens B ↓</text>';
  s += miniTrace('II', 'normal-sinus', 70, 350, 540, 0, 4);
  s += '<path class="ecg-trace" d="M10,350 H20 V270 H60 V350 H68"/><text class="ecg-label" x="18" y="386">1 mV · 200 ms calibration</text>';
  s += '</svg>';
  return s;
}

/* ── Lightweight self-checks for local validation (no framework) ── */
function validateGeometry() {
  var checks = [];
  function check(name, got, want, tol) {
    var ok = Math.abs(got - want) <= (tol || 0.001);
    checks.push({ name: name, got: got, want: want, ok: ok });
    return ok;
  }
  check('8 units = 1 mm', mmToUnits(1), 8);
  check('1000 ms = 25 mm (HR60 RR)', msToMm(1000), 25);
  check('HR60 RR units', msToUnits(rateToRRms(60)), 200);
  check('HR75 RR units', msToUnits(rateToRRms(75)), 160);
  check('1 mV = 10 mm', mvToMm(1), 10);
  check('1 mV units', mvToUnits(1), 80);
  check('200 ms cal width units', msToUnits(200), 40);
  check('PR 160 ms units', msToUnits(160), 32);
  check('QRS 88 ms units', msToUnits(88), 17.6, 0.01);
  return checks;
}

function validateNormalMorphology(caseData) {
  // Sample R and S peaks per precordial lead from the template (no noise).
  // Use a real interior beat time — a fixed t=1000 ms falls between beats.
  var probe = { rate: caseData.rate, prMs: caseData.prMs, qrsMs: caseData.qrsMs, qtMs: caseData.qtMs, axisDeg: caseData.axisDeg, seed: caseData.seed, noise: { disabled: true } };
  var quiet = createNormalSinusCase(probe);
  var qOn = quiet.beatTimes[2] || quiet.beatTimes[0];
  function peak(lead, targetMs) {
    // Scan one beat around the real QRS onset.
    var best = -1e9, bestT = 0;
    var wantR = targetMs === 'r';
    for (var dt = -20; dt <= 120; dt += 1) {
      var v = leadVoltageAt(lead, qOn + dt, quiet, undefined);
      if (wantR) { if (v > best) { best = v; bestT = dt; } }
    }
    if (!wantR) {
      best = 1e9;
      for (var d2 = -20; d2 <= 120; d2 += 1) {
        var vv = leadVoltageAt(lead, qOn + d2, quiet, undefined);
        if (vv < best) { best = vv; bestT = d2; }
      }
    }
    return best;
  }
  var rV = {}, sV = {};
  ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'].forEach(function (L) {
    rV[L] = peak(L, 'r');
    // S depth: most negative after R (allow baseline 0 floor for lateral leads).
    sV[L] = peak(L, 's');
  });
  var checks = [];
  checks.push({ name: 'V1 predominantly negative (R < 0.4, S deep)', ok: rV.V1 < 0.4 && sV.V1 < -0.5, got: 'R=' + rV.V1.toFixed(2) + ' S=' + sV.V1.toFixed(2) });
  checks.push({ name: 'R progression V1<V3<V5', ok: rV.V1 < rV.V3 && rV.V3 < rV.V5, got: [rV.V1, rV.V3, rV.V5].map(function (x) { return x.toFixed(2); }).join('/') });
  checks.push({ name: 'V5/V6 dominant R (>0.8)', ok: rV.V5 > 0.8 && rV.V6 > 0.8, got: 'V5=' + rV.V5.toFixed(2) + ' V6=' + rV.V6.toFixed(2) });
  checks.push({ name: 'S regression V1>V5 (deeper in V1)', ok: sV.V1 < sV.V5, got: 'V1=' + sV.V1.toFixed(2) + ' V5=' + sV.V5.toFixed(2) });
  // Limb polarity at axis 45: II tallest positive, aVR negative.
  function qrsNet(lead) {
    var mx = -1e9, mn = 1e9;
    for (var dt = 0; dt <= 88; dt += 1) {
      var v = leadVoltageAt(lead, qOn + dt, quiet, undefined);
      if (v > mx) mx = v;
      if (v < mn) mn = v;
    }
    return { mx: mx, mn: mn };
  }
  var nII = qrsNet('II'), nAVR = qrsNet('aVR'), nI = qrsNet('I');
  checks.push({ name: 'II positive tall', ok: nII.mx > 0.7, got: nII.mx.toFixed(2) });
  checks.push({ name: 'aVR predominantly negative', ok: nAVR.mn < -0.5 && nAVR.mx < 0.35, got: 'max=' + nAVR.mx.toFixed(2) + ' min=' + nAVR.mn.toFixed(2) });
  checks.push({ name: 'I positive', ok: nI.mx > 0.3, got: nI.mx.toFixed(2) });
  // P-wave polarity: upright I/II/aVF, negative aVR, biphasic V1.
  function pRange(lead) {
    var mx = -1e9, mn = 1e9;
    for (var dt = -170; dt <= -50; dt += 1) {
      var v = leadVoltageAt(lead, qOn + dt, quiet, undefined);
      if (v > mx) mx = v;
      if (v < mn) mn = v;
    }
    return { mx: mx, mn: mn };
  }
  var pI = pRange('I'), pII = pRange('II'), pAVF = pRange('aVF'), pAVR = pRange('aVR'), pV1 = pRange('V1');
  checks.push({ name: 'P upright I/II/aVF', ok: pI.mx > 0.03 && pII.mx > 0.08 && pAVF.mx > 0.05, got: 'I=' + pI.mx.toFixed(2) + ' II=' + pII.mx.toFixed(2) + ' aVF=' + pAVF.mx.toFixed(2) });
  checks.push({ name: 'P negative aVR', ok: pAVR.mn < -0.05, got: pAVR.mn.toFixed(2) });
  checks.push({ name: 'P biphasic V1 (+/-)', ok: pV1.mx > 0.02 && pV1.mn < -0.02, got: '+' + pV1.mx.toFixed(2) + '/' + pV1.mn.toFixed(2) });
  // T polarity + asymmetry: concordant positive except aVR negative; organic skew.
  function tRange(lead) {
    var mx = -1e9, mn = 1e9;
    for (var d3 = 140; d3 <= 420; d3 += 1) {
      var vv = leadVoltageAt(lead, qOn + d3, quiet, undefined);
      if (vv > mx) mx = vv;
      if (vv < mn) mn = vv;
    }
    return { mx: mx, mn: mn };
  }
  var tII = tRange('II'), tAVR = tRange('aVR'), tV5 = tRange('V5');
  checks.push({ name: 'T concordant positive II/V5', ok: tII.mx > 0.25 && tV5.mx > 0.25, got: 'II=' + tII.mx.toFixed(2) + ' V5=' + tV5.mx.toFixed(2) });
  checks.push({ name: 'T negative aVR', ok: tAVR.mn < -0.2, got: tAVR.mn.toFixed(2) });
  // ST isoelectric at J+60 ms (<0.05 mV) in limb + precordial.
  var stVals = ['II', 'V2', 'V5'].map(function (L) { return Math.abs(leadVoltageAt(L, qOn + quiet.qrsMs + 60, quiet, undefined)); });
  var stOk = stVals.every(function (x) { return x < 0.05; });
  checks.push({ name: 'ST isoelectric J+60ms', ok: stOk, got: stVals.map(function (x) { return x.toFixed(3); }).join('/') });
  return { checks: checks, rV: rV, sV: sV };
}

/*
 * Interval + rate + rendering checks against the live signal (noise-free).
 * Tolerances account for Gaussian-tail threshold effects: onset to baseline
 * is exact by construction, while 0.02 mV threshold reads a few ms late/early.
 */
function validateIntervals(caseData) {
  var probe = { rate: caseData.rate, prMs: caseData.prMs, qrsMs: caseData.qrsMs, qtMs: caseData.qtMs, axisDeg: caseData.axisDeg, seed: caseData.seed, noise: { disabled: true } };
  var quiet = createNormalSinusCase(probe);
  var checks = [];
  function push(name, ok, got) { checks.push({ name: name, ok: !!ok, got: String(got) }); }
  // RR: mean of interior beats vs 60000/rate.
  var rrs = [];
  for (var i = 1; i < 6 && i < quiet.beatTimes.length; i++) rrs.push(quiet.beatTimes[i] - quiet.beatTimes[i - 1]);
  var meanRR = rrs.reduce(function (a, b) { return a + b; }, 0) / rrs.length;
  var wantRR = rateToRRms(quiet.rate);
  push('RR mean ~= 60000/rate (' + quiet.rate + '/min)', Math.abs(meanRR - wantRR) <= quiet.noise.rsaMs + 5 + 1e-9, meanRR.toFixed(1) + ' vs ' + wantRR.toFixed(1) + ' ms');
  var qOn = quiet.beatTimes[2] || quiet.beatTimes[0];
  function vAt(lead, dt) { return leadVoltageAt(lead, qOn + dt, quiet, undefined); }
  // PR: P onset (first |v|>0.02 going forward from -210) to QRS onset (0).
  var pOn = null;
  for (var d = -210; d <= 0; d += 1) { if (Math.abs(vAt('II', d)) > 0.02) { pOn = d; break; } }
  var prMeas = pOn === null ? NaN : -pOn;
  push('PR interval ~' + quiet.prMs + ' ms', pOn !== null && Math.abs(prMeas - quiet.prMs) <= 20, prMeas.toFixed(0) + ' ms (thr 0.02 mV)');
  // QRS: J timing honoured; R tall and ST returns near baseline by J+60.
  var rPeak = -1e9;
  for (var d2 = 0; d2 <= quiet.qrsMs + 20; d2 += 1) { var vv = vAt('II', d2); if (vv > rPeak) rPeak = vv; }
  var st60 = Math.abs(vAt('II', quiet.qrsMs + 60));
  push('QRS J at ' + quiet.qrsMs + ' ms, R tall, ST flat', rPeak > 0.7 && st60 < 0.05, 'R=' + rPeak.toFixed(2) + ' ST60=' + st60.toFixed(3));
  // QT: T end (first |v|<0.02 after T peak) vs qtMs.
  var tPeak = 200, tPeakV = -1e9;
  for (var d4 = 150; d4 <= 420; d4 += 1) { var tv = vAt('II', d4); if (tv > tPeakV) { tPeakV = tv; tPeak = d4; } }
  var tEnd = null;
  for (var d5 = tPeak; d5 <= 520; d5 += 1) { if (Math.abs(vAt('II', d5)) < 0.02) { tEnd = d5; break; } }
  push('QT interval ~' + quiet.qtMs + ' ms', tEnd !== null && Math.abs(tEnd - quiet.qtMs) <= 45, (tEnd === null ? 'n/a' : tEnd + ' ms') + ' (thr 0.02 mV)');
  // Calibration pulse geometry from the same converters.
  push('CAL 1 mV = 80 units', Math.abs(mvToUnits(1) - 80) < 0.001, mvToUnits(1));
  push('CAL 200 ms = 40 units', Math.abs(msToUnits(200) - 40) < 0.001, msToUnits(200));
  var calSvg = renderCalibrationPulse(0, 100);
  push('CAL path rendered', calSvg.indexOf('<path') !== -1 && calSvg.indexOf('CAL 1 mV') !== -1, calSvg.length + ' chars');
  // Paper grid uses 8u minor / 40u major in the same coordinate space.
  var grid = renderPaperGrid(200, 150);
  push('Paper grid 8u/40u locked to waveform', grid.indexOf('width="8"') !== -1 && grid.indexOf('width="40"') !== -1, 'minor 8 / major 40');
  return checks;
}

/* ── Phase 2 pattern validators (noise-free probes, lead-specific) ── */
function validatePatterns() {
  var checks = [];
  function push(name, ok, got) { checks.push({ name: name, ok: !!ok, got: String(got) }); }
  function stAt(patternId, lead, opts) {
    var cd = createPatternCase(patternId, Object.assign({ noise: { disabled: true } }, opts));
    var qOn = (cd.beatTimes && cd.beatTimes[2]) || 400;
    if (cd.dissociated) return NaN;
    return leadVoltageAt(lead, qOn + cd.qrsMs + 60, cd, undefined);
  }
  // Inferior STEMI: STE II/III/aVF, mirror STD aVL, III>II variation, not clones.
  var stII = stAt('stemi-criteria', 'II', {}), stIII = stAt('stemi-criteria', 'III', {}),
      stAVF = stAt('stemi-criteria', 'aVF', {}), stAVL = stAt('stemi-criteria', 'aVL', {});
  push('STEMI STE II/III/aVF >=0.10mV (1mm)', stII >= 0.10 && stAVF >= 0.10 && stIII >= 0.10,
    'II=' + stII.toFixed(2) + ' III=' + stIII.toFixed(2) + ' aVF=' + stAVF.toFixed(2));
  push('STEMI mirror STD aVL <=-0.05', stAVL <= -0.05, 'aVL=' + stAVL.toFixed(2));
  push('STEMI lead variation (not clones)', Math.abs(stIII - stII) > 0.015, '|III-II|=' + Math.abs(stIII - stII).toFixed(3));
  // Hyperacute vs hyperkalemia T shapes.
  function tPeakFor(lane) {
    var cd = createPatternCase('hyperacute-t', { lane: lane, noise: { disabled: true } });
    var qOn = cd.beatTimes[2];
    var best = -1e9, bestT = 0;
    for (var dt = 100; dt <= 450; dt += 1) {
      var v = leadVoltageAt(lane, qOn + dt, cd, undefined);
      if (v > best) { best = v; bestT = dt; }
    }
    // Width at half max (broad vs narrow).
    var hw1 = null, hw2 = null;
    for (var d1 = bestT; d1 > 50; d1 -= 1) { if (leadVoltageAt(lane, qOn + d1, cd, undefined) < best / 2) { hw1 = d1; break; } }
    for (var d2 = bestT; d2 < 500; d2 += 1) { if (leadVoltageAt(lane, qOn + d2, cd, undefined) < best / 2) { hw2 = d2; break; } }
    return { amp: best, width: (hw1 !== null && hw2 !== null) ? hw2 - hw1 : NaN };
  }
  var hAc = tPeakFor('Hyperacute'), hK = tPeakFor('HyperK?'), hN = tPeakFor('Normal');
  push('Hyperacute bulky T > R (>0.80)', hAc.amp > 0.80, hAc.amp.toFixed(2));
  push('Hyperacute broad base wider than HyperK', hAc.width > hK.width + 15, hAc.width + ' vs ' + hK.width);
  push('HyperK narrow pointed (width <70ms)', hK.width < 70, hK.width + 'ms');
  push('Normal R > T baseline', hN.amp < 0.70, hN.amp.toFixed(2));
  // Wellens: Type A biphasic (+ then -), Type B deep symmetric inversion, R preserved.
  function wellensProbe(lane) {
    var cd = createPatternCase('wellens', { lane: lane, noise: { disabled: true } });
    var qOn = cd.beatTimes[2];
    var mx = -1e9, mn = 1e9, rPk = -1e9;
    for (var dt = -20; dt <= 120; dt += 1) { var rv = leadVoltageAt(lane, qOn + dt, cd, undefined); if (rv > rPk) rPk = rv; }
    for (var d3 = 140; d3 <= 430; d3 += 1) { var tv = leadVoltageAt(lane, qOn + d3, cd, undefined); if (tv > mx) mx = tv; if (tv < mn) mn = tv; }
    return { mx: mx, mn: mn, r: rPk };
  }
  var wA = wellensProbe('Type A'), wB = wellensProbe('Type B');
  push('Wellens A biphasic (+/-)', wA.mx > 0.10 && wA.mn < -0.15, '+' + wA.mx.toFixed(2) + '/' + wA.mn.toFixed(2));
  push('Wellens B deep inversion (<=-0.40)', wB.mn <= -0.40, wB.mn.toFixed(2));
  push('Wellens R preserved (>0.40, no Q)', wA.r > 0.40 && wB.r > 0.40, 'A R=' + wA.r.toFixed(2) + ' B R=' + wB.r.toFixed(2));
  // de Winter: V3 STD + tall T, aVR STE.
  var dwV3 = stAt('dewinter', 'V3', {}), dwAVR = stAt('dewinter', 'aVR', {});
  var dwCd = createPatternCase('dewinter', { noise: { disabled: true } });
  var dwQ = dwCd.beatTimes[2], dwT = -1e9;
  for (var d6 = 140; d6 <= 430; d6 += 1) { var vv = leadVoltageAt('V3', dwQ + d6, dwCd, undefined); if (vv > dwT) dwT = vv; }
  push('de Winter V3 STD (-0.10..-0.30)', dwV3 <= -0.08 && dwV3 >= -0.35, dwV3.toFixed(2));
  push('de Winter V3 tall T (>=0.60)', dwT >= 0.60, dwT.toFixed(2));
  push('de Winter aVR STE (>=0.05)', dwAVR >= 0.05, dwAVR.toFixed(2));
  // Hyperkalemia stages differ (not identical).
  function hkT(stage) {
    var cd = createPatternCase('hyperkalemia', { stage: stage, noise: { disabled: true } });
    if (cd.sine) return { amp: 0.80, sine: true };
    var q2 = cd.beatTimes[2], best = -1e9;
    for (var d7 = 140; d7 <= 430; d7 += 1) { var x = leadVoltageAt('II', q2 + d7, cd, undefined); if (x > best) best = x; }
    return { amp: best, qrs: cd.qrsMs, pr: cd.prMs };
  }
  var hkE = hkT('early'), hkA = hkT('advanced'), hkS = hkT('severe');
  push('HyperK stages differ', hkE.amp !== hkA.amp && hkA.qrs !== hkE.qrs, 'early T=' + hkE.amp.toFixed(2) + ' QRS' + hkE.qrs + ' vs adv T=' + hkA.amp.toFixed(2) + ' QRS' + hkA.qrs);
  push('HyperK severe sine', !!hkS.sine, 'sine-wave');
  push('HyperK advanced wide QRS (>=120)', hkA.qrs >= 120, 'QRS=' + hkA.qrs);
  // VT: regular wide 150, dissociated P, capture narrow + fusion intermediate visible.
  var vtCd = createPatternCase('vt-vs-svt', { noise: { disabled: true } });
  var vBeats = vtCd.dissociated.ventricularBeats;
  var rrsV = [];
  for (var vi = 1; vi < vBeats.length; vi++) {
    if (!vBeats[vi].conductedP && !vBeats[vi - 1].conductedP) rrsV.push(vBeats[vi].qOn - vBeats[vi - 1].qOn);
  }
  var regV = Math.max.apply(null, rrsV) - Math.min.apply(null, rrsV) < 5;
  var hasCap = vBeats.some(function (b) { return b.qrsMs === 88 && b.conductedP; });
  var hasFus = vBeats.some(function (b) { return b.qrsMs === 115 && b.conductedP; });
  push('Underlying VT regular outside capture/fusion (RR var <5ms)', regV, rrsV.slice(0, 3).map(function (x) { return x.toFixed(0); }).join('/'));
  push('VT wide QRS 150', vBeats.some(function (b) { return b.qrsMs === 150; }), 'underlying QRS=' + vtCd.qrsMs);
  push('VT capture narrow + fusion intermediate', hasCap && hasFus, 'capture88+fusion115');
  push('VT AV dissociation (atrial 75 vs vent 170)', vtCd.dissociated.atrialTimes.length >= 10 && vBeats.length >= 10, 'A=' + vtCd.dissociated.atrialTimes.length + ' V=' + vBeats.length);
  // CHB: independent P 75 + escape 35, no fixed PR.
  var chb = createPatternCase('complete-heart-block', { noise: { disabled: true } });
  var aN = chb.dissociated.atrialTimes.length, vN = chb.dissociated.ventricularBeats.length;
  var prs = [];
  chb.dissociated.ventricularBeats.slice(0, 4).forEach(function (vb) {
    var bestPR = 1e9;
    chb.dissociated.atrialTimes.forEach(function (ap) {
      var pr = vb.qOn - (ap - 42); // P onset ~42ms before P peak
      if (pr >= 0 && pr < bestPR) bestPR = pr;
    });
    prs.push(bestPR);
  });
  var prVar = Math.max.apply(null, prs) - Math.min.apply(null, prs);
  push('CHB P march (A~12) + escape (V~5-6)', aN >= 10 && vN >= 4 && vN <= 8, 'A=' + aN + ' V=' + vN);
  push('CHB no fixed PR (var >200ms)', prVar > 200, 'PRs=' + prs.map(function (x) { return x.toFixed(0); }).join('/'));
  // Smith-modified Sgarbossa in LBBB (paced uses same thresholds):
  // 1 concordant STE>=1mm with positive QRS, 2 concordant STD>=1mm V1-V3,
  // 3 discordant STE>=1mm with ST/S<=-0.25. Positive criteria raise concern for OMI.
  var sgCd = createPatternCase('sgarbossa', { noise: { disabled: true } });
  var sgQ = sgCd.beatTimes[2];
  function sgST(lead) { return leadVoltageAt(lead, sgQ + sgCd.qrsMs, sgCd, undefined); } // J-point (Smith measures at J)
  function sgQRS(lead) {
    var mx = -1e9, mn = 1e9;
    var qrsEnd = sgCd.qrsMs - 30; // QRS-only, exclude J-point ST bump
    for (var d = 0; d <= qrsEnd; d += 1) {
      var v = leadVoltageAt(lead, sgQ + d, sgCd, undefined);
      if (v > mx) mx = v;
      if (v < mn) mn = v;
    }
    // S depth: most negative in QRS window
    return { mx: mx, mn: mn };
  }
  var sgV5 = sgQRS('V5'), sgV3 = sgQRS('V3'), sgV1 = sgQRS('V1');
  var sgStV5 = sgST('V5'), sgStV3 = sgST('V3'), sgStV1 = sgST('V1');
  push('Sgarbossa QRS wide >=120 (LBBB)', sgCd.qrsMs >= 120, 'QRS=' + sgCd.qrsMs);
  push('Sgarbossa LBBB polarity (V1 neg, V5 pos, no Q)', sgV1.mx < 0.25 && sgV1.mn < -0.5 && sgV5.mx > 0.8, 'V1 max=' + sgV1.mx.toFixed(2) + ' min=' + sgV1.mn.toFixed(2) + ' V5 max=' + sgV5.mx.toFixed(2));
  push('Sgarbossa 1 concordant STE V5 >=1mm', sgStV5 >= 0.10 && sgV5.mx > 0.5, 'V5 ST=' + sgStV5.toFixed(2));
  push('Sgarbossa 2 concordant STD V3 <=-1mm', sgStV3 <= -0.10 && sgV3.mn < -0.3, 'V3 ST=' + sgStV3.toFixed(2));
  var sgRatio = sgStV1 / sgV1.mn; // ST positive / S negative => negative ratio
  push('Sgarbossa 3 discordant ST/S<=-0.25 (V1)', sgStV1 >= 0.10 && sgRatio <= -0.25, 'V1 ST=' + sgStV1.toFixed(2) + ' S=' + sgV1.mn.toFixed(2) + ' ratio=' + sgRatio.toFixed(2));
  // Isolated posterior OMI: V1-V3 horizontal STD + tall R (R/S>1) + upright T;
  // V8 posterior STE shown; posterior lead distribution needs clinical review.
  var poCd = createPatternCase('posterior-omi', { noise: { disabled: true } });
  var poQ = poCd.beatTimes[2];
  function poST(lead) { return leadVoltageAt(lead, poQ + poCd.qrsMs, poCd, undefined); } // J-point
  function poQRS(lead) {
    var mx = -1e9, mn = 1e9;
    for (var dp = 0; dp <= poCd.qrsMs - 20; dp += 1) {
      var vp = leadVoltageAt(lead, poQ + dp, poCd, undefined);
      if (vp > mx) mx = vp;
      if (vp < mn) mn = vp;
    }
    return { mx: mx, mn: mn };
  }
  function poT(lead) {
    var mxT = -1e9;
    for (var dtT2 = 140; dtT2 <= 430; dtT2 += 1) {
      var vt = leadVoltageAt(lead, poQ + dtT2, poCd, undefined);
      if (vt > mxT) mxT = vt;
    }
    return mxT;
  }
  var poV1 = poQRS('V1'), poV2 = poQRS('V2'), poV3 = poQRS('V3');
  var poStV1 = poST('V1'), poStV2 = poST('V2'), poStV3 = poST('V3'), poStV8 = poST('V8');
  push('Posterior STD V1-V3 <=-0.08 (horizontal mirror)', poStV1 <= -0.08 && poStV2 <= -0.08 && poStV3 <= -0.08,
    'V1=' + poStV1.toFixed(2) + ' V2=' + poStV2.toFixed(2) + ' V3=' + poStV3.toFixed(2));
  push('Posterior R/S>1 V1-V3 (tall R)', (poV1.mx / Math.abs(poV1.mn)) > 1 && (poV2.mx / Math.abs(poV2.mn)) > 1,
    'V1 R/S=' + (poV1.mx / Math.abs(poV1.mn)).toFixed(2) + ' V2=' + (poV2.mx / Math.abs(poV2.mn)).toFixed(2));
  push('Posterior upright T V2-V3', poT('V2') > 0.25 && poT('V3') > 0.25, 'V2 T=' + poT('V2').toFixed(2) + ' V3=' + poT('V3').toFixed(2));
  push('Posterior V8 STE>=0.05 shown', poStV8 >= 0.05, 'V8 ST=' + poStV8.toFixed(2));
  return checks;
}

export const ECG_ENGINE = {
  geom: { SVG_PER_MM: SVG_PER_MM, PAPER_SPEED_MM_S: PAPER_SPEED_MM_S, GAIN_MM_MV: GAIN_MM_MV, MS_PER_MM: MS_PER_MM },
  mmToUnits: mmToUnits, msToMm: msToMm, msToUnits: msToUnits,
  mvToMm: mvToMm, mvToUnits: mvToUnits, rateToRRms: rateToRRms,
  createNormalSinusCase: createNormalSinusCase,
  createPatternCase: createPatternCase,
  leadVoltageAt: leadVoltageAt,
  renderNormal12Lead: renderNormal12Lead,
  render12Lead: render12Lead,
  layoutMetrics: layoutMetrics,
  renderOmiLegend: renderOmiLegend,
  renderPaperGrid: renderPaperGrid,
  renderCalibrationPulse: renderCalibrationPulse,
  focusedTracePath: focusedTracePath,
  focusedFirstJX: focusedFirstJX,
  focusedApexX: focusedApexX,
  focusedOverlayY: focusedOverlayY,
  validateGeometry: validateGeometry,
  validateNormalMorphology: validateNormalMorphology,
  validateIntervals: validateIntervals,
  validatePatterns: validatePatterns,
  layout: { LAYOUT_3X4: LAYOUT_3X4, COL_DUR_MS: COL_DUR_MS },
  version: '2.0.0-phase2'
};
