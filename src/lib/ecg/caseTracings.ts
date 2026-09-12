// @ts-nocheck — verbatim legacy port (documented exception); see below.
/* eslint-disable */
/**
 * VERBATIM PORT of legacy `assets/ecg-case-tracings.js` to a TypeScript ES module.
 * Clinical morphology, geometry and teaching text are unchanged.
 * New code must consume this module via the typed facade in `./api.ts`
 * (ECG) or the typed data modules (learning).
 */
import { ECG_ENGINE } from './engine';
import { ECG_SVG } from './svgLibrary';

/** Applies schematic/engine-backed case overlays onto the shared ECG_SVG library (legacy load-order side effect, now explicit). */
export function applyCaseTracings(): void {
  /*
   * Pattern-library focused teaching leads, never patient recordings.
   * Engine-backed cases are calibrated by ecg-interactive.js. Remaining
   * sketches are explicitly schematic: drawn intervals/voltages are not
   * measurements and require clinical review before use as diagnostic examples.
   */
  function n(value, fallback) { return value === undefined ? fallback : value; }
    function esc(value) {
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // Schematic cycles must contain their complete T/U wave before the next P.
    // These are layout units, not calibrated intervals or heart rates.
    function cycleLength(o) {
      var tail = o.u ? 61 : (o.broadT ? 46 : (o.biphasic ? 44 : (o.symmetric ? 38 : (o.tented ? 24 : (o.st ? 58 : 42)))));
      if (o.coved) tail = 56;
      return Math.max(n(o.cycle, 62), 26 + n(o.qrs, 8) + tail + 14);
    }
    function wrapped(text, maxChars) {
      var lines = [], line = '';
      String(text || '').split(/\s+/).forEach(function (word) {
        if (line && (line + ' ' + word).length > maxChars) { lines.push(line); line = word; }
        else line += (line ? ' ' : '') + word;
      });
      if (line) lines.push(line);
      return lines;
    }
    /* One repeatable schematic beat; do not infer mm or ms from its shape. */
    function beat(x, y, o, index) {
      var p = n(o.p, 3), q = n(o.q, 1.5), r = n(o.r, 16), s = n(o.s, 5);
      var st = n(o.st, 0), t = n(o.t, 7), cycle = cycleLength(o);
      var width = n(o.qrs, 8), j = x + 26 + width, t0 = j + 10;
      var amp = o.alternans && index % 2 ? 0.55 : 1;
      r *= amp; s *= amp; t *= amp;
      var d = 'M' + x + ',' + y + ' H' + (x + 5);
      if (o.delta) d += ' H' + (x + 13) + ' C' + (x + 15) + ',' + y + ' ' + (x + 16) + ',' + (y - p) + ' ' + (x + 17) + ',' + (y - p) + ' C' + (x + 18) + ',' + (y - p) + ' ' + (x + 19) + ',' + y + ' ' + (x + 20) + ',' + y;
      else if (!o.noP) d += ' C' + (x + 8) + ',' + y + ' ' + (x + 9) + ',' + (y - p) + ' ' + (x + 12) + ',' + (y - p) + ' C' + (x + 15) + ',' + (y - p) + ' ' + (x + 16) + ',' + y + ' ' + (x + 19) + ',' + y;
      else d += ' H' + (x + 19);
      if (o.prDepression) d += ' L' + (x + 20) + ',' + (y + o.prDepression) + ' H' + (x + 23);
      if (o.delta) d += ' C' + (x + 21) + ',' + y + ' ' + (x + 24) + ',' + (y - r * 0.15) + ' ' + (x + 26) + ',' + (y - r * 0.30);
      else d += ' L' + (x + 24) + ',' + (y + q);
      d += ' L' + (x + 26 + width * 0.34) + ',' + (o.terminalR ? y + s : y - r) + ' L' + (x + 26 + width * 0.70) + ',' + (o.terminalR ? y - r : y + s) + ' L' + j + ',' + (y - st);
      if (o.jWave) d += ' C' + (j + 2) + ',' + (y - st - o.jWave) + ' ' + (j + 6) + ',' + (y - st - o.jWave) + ' ' + (j + 8) + ',' + (y - st);
      if (o.coved) {
        d += ' C' + (j + 12) + ',' + (y - st * 0.75) + ' ' + (j + 20) + ',' + (y - st * 0.15) + ' ' + (j + 28) + ',' + y;
        d += ' C' + (j + 34) + ',' + (y + Math.abs(t)) + ' ' + (j + 42) + ',' + (y + Math.abs(t)) + ' ' + (j + 48) + ',' + y + ' H' + (j + 56);
      } else if (o.biphasic) {
        var posPeak = n(o.biphasicPos, 6);
        var negNadir = n(o.biphasicNeg, 10);
        d += ' H' + (j + 6);
        d += ' C' + (j + 9) + ',' + (y - st) + ' ' + (j + 11) + ',' + (y - st - posPeak) + ' ' + (j + 15) + ',' + (y - st - posPeak);
        d += ' C' + (j + 19) + ',' + (y - st - posPeak) + ' ' + (j + 21) + ',' + (y - st) + ' ' + (j + 24) + ',' + (y - st);
        d += ' C' + (j + 27) + ',' + (y - st) + ' ' + (j + 29) + ',' + (y - st + negNadir) + ' ' + (j + 33) + ',' + (y - st + negNadir);
        d += ' C' + (j + 37) + ',' + (y - st + negNadir) + ' ' + (j + 40) + ',' + y + ' ' + (j + 44) + ',' + y;
      } else if (o.symmetric) {
        var tAmp = Math.abs(t);
        var sign = t < 0 ? 1 : -1;
        var nadirX = j + 20, touchX = j + 38;
        d += ' H' + (j + 6);
        d += ' C' + (j + 11) + ',' + (y - st) + ' ' + (j + 15) + ',' + (y - st + sign * tAmp) + ' ' + nadirX + ',' + (y - st + sign * tAmp);
        d += ' C' + (j + 25) + ',' + (y - st + sign * tAmp) + ' ' + (j + 33) + ',' + y + ' ' + touchX + ',' + y;
      } else if (o.tented) {
        var tentApex = y - st - t;
        d += ' H' + (j + 8) + ' L' + (j + 16) + ',' + tentApex + ' L' + (j + 24) + ',' + y;
      } else if (o.broadT) {
        var ax = j + 22, ay = y - st - t;
        var tx = j + 46;
        var cp1y = y - st * 0.4 - t * 0.25;
        d += ' C' + (j + 7) + ',' + cp1y + ' ' + (j + 15) + ',' + ay + ' ' + ax + ',' + ay;
        d += ' C' + (j + 29) + ',' + ay + ' ' + (j + 38) + ',' + y + ' ' + tx + ',' + y;
      } else {
        d += ' C' + (t0 + 5) + ',' + (y - st) + ' ' + (t0 + 10) + ',' + (y - st - t) + ' ' + (t0 + 17) + ',' + (y - st - t * 0.60) + ' C' + (t0 + 24) + ',' + (y - st - t * 0.25) + ' ' + (t0 + 27) + ',' + (y - st) + ' ' + (t0 + 32) + ',' + (y - st);
        var te3 = t0 + 32;
        if (st !== 0 && !o.u && te3 + 18 <= x + cycle) d += ' C' + (te3 + 6) + ',' + (y - st) + ' ' + (te3 + 10) + ',' + y + ' ' + (te3 + 16) + ',' + y;
        else if (st !== 0 && !o.u) d += ' L' + (te3 + 6) + ',' + y;
      }
      if (o.u) d += ' C' + (t0 + 37) + ',' + (y - st) + ' ' + (t0 + 40) + ',' + (y - st - o.u) + ' ' + (t0 + 44) + ',' + (y - st - o.u * 0.45) + ' C' + (t0 + 47) + ',' + (y - st) + ' ' + (t0 + 49) + ',' + y + ' ' + (t0 + 51) + ',' + y;
      d += ' H' + (x + cycle);
      return d;
    }

    function trace(x, y, o, width) {
      if (o.sine) {
        var sine = 'M' + x + ',' + y;
        for (var sx = x; sx < x + width - 26; sx += 46) sine += ' C' + (sx + 10) + ',' + (y - 18) + ' ' + (sx + 24) + ',' + (y - 18) + ' ' + (sx + 34) + ',' + y + ' C' + (sx + 44) + ',' + (y + 18) + ' ' + (sx + 58) + ',' + (y + 18) + ' ' + (sx + 68) + ',' + y;
        return sine;
      }
      var d = '';
      var cycle = cycleLength(o);
      for (var bx = x, i = 0; bx <= x + width - cycle; bx += cycle, i++) {
        var next = beat(bx, y, o, i);
        d += i ? next.replace(/^M[^ ]+/, '') : next;
      }
      return d;
    }

    function lead(x, y, name, o) {
      return '<text class="ecg-lead" x="' + x + '" y="' + (y - 25) + '">' + name + '</text><path class="ecg-trace' + (o.qrs > 11 || o.sine ? ' ecg-trace-wide' : '') + '" d="' + trace(x + 16, y, o, 142) + '"/>';
    }

    function longStrip(o, label) {
      return '<line class="ecg-sep" x1="18" y1="226" x2="702" y2="226"/><text class="ecg-lead ecg-lead-rhy" x="42" y="246">' + esc(label || 'II rhythm strip') + '</text><path class="ecg-trace' + (o.qrs > 11 || o.sine ? ' ecg-trace-wide' : '') + ' ecg-rhythm" d="' + trace(58, 270, o, 620) + '"/>';
    }

    function pWaves(y, start, end, cycle) {
      var d = '';
      for (var x = start; x < end; x += cycle) d += 'M' + x + ',' + y + ' C' + (x + 4) + ',' + (y - 4) + ' ' + (x + 8) + ',' + (y - 4) + ' ' + (x + 12) + ',' + y;
      return '<path class="ecg-trace ecg-trace-faint" d="' + d + '"/>';
    }

    function afStrip() {
      var d = 'M58,270';
      for (var x = 58; x < 678; x += 8) d += ' q4,' + (x % 3 ? -3 : 3) + ' 8,0';
      return '<path class="ecg-trace ecg-trace-faint" d="' + d + '"/>';
    }

    function caseSvg(spec, specId) {
      /* A pattern library should show the diagnostic leads, not a shrunken 12-lead. */
      var shown = spec.display || ['II'];
      var laneH = spec.laneH || 58;
      var notes = wrapped(spec.note2, 102).concat(wrapped(spec.note, 102));
      var height = 62 + shown.length * laneH + 16 + notes.length * 14;
      var useEngine = !!(spec.useEngine && ECG_ENGINE && ECG_ENGINE.focusedTracePath);
      var enginePattern = spec.useEngine || specId;
      var body = '<svg class="ecg-svg ecg-paper ecg-case-12lead" viewBox="0 0 720 ' + height + '" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet"><title>' + esc(spec.title) + ' — synthetic focused-lead teaching tracing</title><text class="ecg-lead ecg-case-header" x="18" y="18">SCHEMATIC · NOT TO SCALE · ' + esc(spec.header) + '</text>';
      if (useEngine) {
        var grid = ECG_ENGINE.renderPaperGrid(720, height).replace(/ecgEngMinor/g, 'case-' + specId + '-minor').replace(/ecgEngMajor/g, 'case-' + specId + '-major');
        body = body.replace(/(<\/title>)/, '$1' + grid);
      }
      shown.forEach(function (leadName, index) {
        var y = (useEngine ? 58 : 78) + index * laneH;
        var morphology = spec.leads[leadName] || spec.stripLead || spec.base;
        var wave = (spec.waves && spec.waves[leadName]) || null;
        var waveAttr = wave ? ' data-wave="' + wave + '"' : '';
        if (spec.baseline) {
          body += '<line x1="64" y1="' + y + '" x2="674" y2="' + y + '" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="5 4" opacity="0.9"/>';
        }
        var traceD, isWide;
        if (useEngine) {
          try {
            var engOpts = Object.assign({}, spec.engineOpts, { lane: leadName });
            traceD = ECG_ENGINE.focusedTracePath(leadName, enginePattern, y, engOpts).d;
            var engCd = ECG_ENGINE.createPatternCase(enginePattern, engOpts);
            var engQrs = engCd.qrsMs;
            if (engCd.dissociated && engCd.dissociated.ventricularBeats.length) engQrs = engCd.dissociated.ventricularBeats[0].qrsMs;
            isWide = engQrs >= 120 || !!engCd.sine;
          } catch (e) {
            traceD = trace(64, y, morphology, useEngine ? 610 : 305);
            isWide = morphology.qrs > 11 || morphology.sine;
          }
        } else {
          traceD = trace(64, y, morphology, useEngine ? 610 : 305);
          isWide = morphology.qrs > 11 || morphology.sine;
        }
        body += '<text class="ecg-lead" x="42" y="' + (y - (useEngine ? 24 : 36)) + '">' + esc(leadName) + '</text><path class="ecg-trace' + (isWide ? ' ecg-trace-wide' : '') + '" d="' + traceD + '"' + (useEngine ? '' : ' transform="translate(-64,' + (-y * .5) + ') scale(2,1.5)"') + '/>';
        // Overlay X positions: engine uses physiological first-beat J; schematic uses 64+26+w.
        function overlayJX() {
          if (useEngine) {
            try { return ECG_ENGINE.focusedFirstJX(enginePattern, Object.assign({}, spec.engineOpts)); }
            catch (e2) { /* fall through */ }
          }
          var wOld = morphology.qrs || 8;
          return 64 + 26 + wOld;
        }
        function overlayApexX() {
          if (useEngine) {
            try { return ECG_ENGINE.focusedApexX(leadName, enginePattern, Object.assign({}, spec.engineOpts)); }
            catch (e3) { /* fall through */ }
          }
          var awOld = morphology.qrs || 8;
          return 64 + 26 + awOld + 22;
        }
        if (spec.stHighlight && morphology.st) {
          var jx2, jy2, col;
          if (useEngine) {
            try {
              jx2 = ECG_ENGINE.focusedFirstJX(enginePattern, Object.assign({}, spec.engineOpts));
              var oy2 = ECG_ENGINE.focusedOverlayY(leadName, enginePattern, y, Object.assign({}, spec.engineOpts));
              jy2 = oy2.jy;
            } catch (eH) {
              var w2b = morphology.qrs || 8;
              jx2 = 64 + 26 + w2b;
              jy2 = y - (morphology.st || 0);
            }
            col = ((spec.engineStSign && spec.engineStSign[leadName]) || (morphology.st > 0)) ? '#dc2626' : '#2563eb';
            if (typeof col !== 'string') col = '#dc2626';
            // Determine colour from engine ST when available.
            try {
              var engCdH = ECG_ENGINE.createPatternCase(enginePattern, Object.assign({}, spec.engineOpts, { lane: leadName, noise: { disabled: true } }));
              var ovH = (engCdH.leadOverrides && engCdH.leadOverrides[leadName]) || {};
              col = (ovH.stMv || 0) >= 0 ? '#dc2626' : '#2563eb';
            } catch (eH2) { col = morphology.st > 0 ? '#dc2626' : '#2563eb'; }
          } else {
            var w2 = morphology.qrs || 8;
            jx2 = 64 + 26 + w2;
            jy2 = y - (morphology.st || 0);
            col = morphology.st > 0 ? '#dc2626' : '#2563eb';
          }
          body += '<path class="ecg-sthl" d="M' + jx2 + ',' + jy2 + ' H' + (jx2 + 16) + '" stroke="' + col + '" stroke-width="4" fill="none" stroke-linecap="round" opacity="0.85"' + waveAttr + '/>';
        }
        if (spec.jDots) {
          var jx, jy;
          if (useEngine) {
            try {
              jx = ECG_ENGINE.focusedFirstJX(enginePattern, Object.assign({}, spec.engineOpts));
              jy = ECG_ENGINE.focusedOverlayY(leadName, enginePattern, y, Object.assign({}, spec.engineOpts)).jy;
            } catch (eJ) {
              var wJ = morphology.qrs || 8;
              jx = 64 + 26 + wJ;
              jy = y - (morphology.st || 0);
            }
          } else {
            var w = morphology.qrs || 8;
            jx = 64 + 26 + w;
            jy = y - (morphology.st || 0);
          }
          body += '<circle class="ecg-j" cx="' + jx + '" cy="' + jy + '" r="3"' + waveAttr + '><title>J-point ' + esc(leadName) + ' — ST measured here</title></circle>';
        }
        if (spec.apexDots && morphology.broadT) {
          var ax, ay;
          if (useEngine) {
            try {
              ax = ECG_ENGINE.focusedApexX(leadName, enginePattern, Object.assign({}, spec.engineOpts));
              ay = ECG_ENGINE.focusedOverlayY(leadName, enginePattern, y, Object.assign({}, spec.engineOpts)).apexY;
            } catch (eA) {
              var awF = morphology.qrs || 8;
              var ajxF = 64 + 26 + awF;
              ax = ajxF + 22; ay = y - (morphology.st || 0) - (morphology.t || 0);
            }
          } else {
            var aw = morphology.qrs || 8;
            var ajx = 64 + 26 + aw;
            ax = ajx + 22; ay = y - (morphology.st || 0) - (morphology.t || 0);
          }
          body += '<circle class="ecg-j"' + waveAttr + ' cx="' + ax + '" cy="' + ay + '" r="3"><title>T apex ' + esc(leadName) + ' — taller than R</title></circle>';
        }
        if (spec.broadBase && morphology.broadT) {
          var bjx;
          if (useEngine) {
            try { bjx = ECG_ENGINE.focusedFirstJX(enginePattern, Object.assign({}, spec.engineOpts)); }
            catch (eB) { var bwF = morphology.qrs || 8; bjx = 64 + 26 + bwF; }
          } else {
            var bw = morphology.qrs || 8;
            bjx = 64 + 26 + bw;
          }
          body += '<path class="ecg-marker"' + waveAttr + ' d="M' + bjx + ',' + (y + 10) + ' H' + (bjx + 46) + '"/>';
          body += '<text class="ecg-label"' + waveAttr + ' x="' + (bjx + 6) + '" y="' + (y + 24) + '">broad base</text>';
        }
        if (spec.badges && spec.badges[leadName]) {
          // Engine lanes carry tall realistic R/T peaks under the old badge slot,
          // so right-align badges to the lane end: this keeps the annotated first
          // complex (J-dot, ST highlight, apex, caliper near x≈160–220) clear.
          // Schematic lanes keep the legacy slot (no behavior change there).
          var badgeX = useEngine ? 668 : 150;
          var badgeAnchor = useEngine ? ' text-anchor="end"' : '';
          body += '<text class="ecg-label ecg-label-b" x="' + badgeX + '" y="' + (y - (useEngine ? 26 : 36)) + '"' + waveAttr + badgeAnchor + '>' + esc(spec.badges[leadName]) + '</text>';
        }
        if (spec.calipers && spec.calipers[leadName]) {
          var cx, jy3;
          if (useEngine) {
            try {
              var jxC = ECG_ENGINE.focusedFirstJX(enginePattern, Object.assign({}, spec.engineOpts));
              cx = jxC + 18;
              jy3 = ECG_ENGINE.focusedOverlayY(leadName, enginePattern, y, Object.assign({}, spec.engineOpts)).jy;
            } catch (eC) {
              var wqF = morphology.qrs || 8;
              cx = 64 + 26 + wqF + 18;
              jy3 = y - (morphology.st || 0);
            }
          } else {
            var wq = morphology.qrs || 8;
            cx = 64 + 26 + wq + 18;
            jy3 = y - (morphology.st || 0);
          }
          body += '<line class="ecg-marker"' + waveAttr + ' x1="' + cx + '" y1="' + jy3 + '" x2="' + cx + '" y2="' + y + '"/>';
          body += '<text class="ecg-label"' + waveAttr + ' x="' + (cx + 6) + '" y="' + (y + 14) + '">' + esc(spec.calipers[leadName]) + '</text>';
        }
        if (spec.strip === 'block' && index === 0 && !useEngine) body += pWaves(y, 70, 680, 38);
        if (spec.strip === 'af' && index === 0) body += afStrip();
      });
      var brackets = spec.brackets || (spec.bracket ? [spec.bracket] : []);
      brackets.forEach(function (br) {
        var bi1 = shown.indexOf(br.from), bi2 = shown.indexOf(br.to);
        if (bi1 !== -1 && bi2 !== -1) {
          var by1 = 58 + bi1 * laneH - 8, by2 = 58 + bi2 * laneH + 8, bx = 28, bmid = (by1 + by2) / 2;
          var bwave = br.wave ? ' data-wave="' + br.wave + '"' : '';
          body += '<path class="ecg-marker"' + bwave + ' d="M' + bx + ',' + by1 + ' V' + by2 + ' M' + bx + ',' + by1 + ' H' + (bx + 6) + ' M' + bx + ',' + bmid + ' H' + (bx + 6) + ' M' + bx + ',' + by2 + ' H' + (bx + 6) + '"/>';
          body += '<text class="ecg-label"' + bwave + ' transform="translate(18,' + bmid + ') rotate(-90)" text-anchor="middle">' + esc(br.label) + '</text>';
        }
      });
      if (spec.connector) {
        var ci1 = shown.indexOf(spec.connector.from), ci2 = shown.indexOf(spec.connector.to);
        if (ci1 !== -1 && ci2 !== -1) {
          var cy1 = 58 + ci1 * laneH + 8, cy2 = 58 + ci2 * laneH - 8, cx2 = 690;
          var cwave = spec.connector.wave ? ' data-wave="' + spec.connector.wave + '"' : '';
          body += '<line class="ecg-marker"' + cwave + ' x1="' + cx2 + '" y1="' + cy1 + '" x2="' + cx2 + '" y2="' + cy2 + '"/>';
          body += '<text class="ecg-label"' + cwave + ' x="684" y="' + ((cy1 + cy2) / 2) + '" text-anchor="end">' + esc(spec.connector.label) + '</text>';
        }
      }
      if (spec.hotspots) {
        spec.hotspots.forEach(function (h) {
          var hi = shown.indexOf(h.lead);
          if (hi === -1) return;
          var hy0 = 58 + hi * laneH;
          var hmo = spec.leads[h.lead] || spec.stripLead || spec.base;
          var hjx, hst, ht, isBiphasic;
          if (useEngine) {
            try {
              hjx = ECG_ENGINE.focusedFirstJX(enginePattern, Object.assign({}, spec.engineOpts));
              var oyH = ECG_ENGINE.focusedOverlayY(h.lead, enginePattern, hy0, Object.assign({}, spec.engineOpts));
              // Vertical extent from engine J + T peak (covers STE + tall/inverted T).
              hst = hy0 - oyH.jy;
              ht = (oyH.apexY < oyH.jy ? oyH.jy - oyH.apexY : oyH.jy - oyH.apexY);
              // ht signed: positive up, negative down; use magnitudes for box.
              var topY = Math.min(hy0, oyH.jy, oyH.apexY);
              var botY = Math.max(hy0, oyH.jy, oyH.apexY);
              hst = 0; ht = 0; // use topY/botY directly below
              var hxE = hjx - 14, hwE = 170;
              var htopE = hy0 - (laneH - 12) / 2;
              var hbotE = hy0 + (laneH - 12) / 2;
              if (topY - 12 < htopE) htopE = Math.max(24, topY - 12);
              if (botY + 8 > hbotE) hbotE = botY + 8;
              body += '<g class="ecg-hot" tabindex="0" role="button" data-wave="' + h.wave + '" aria-label="' + esc(h.label) + '"><rect x="' + hxE + '" y="' + htopE + '" width="' + hwE + '" height="' + (hbotE - htopE) + '" rx="6" class="ecg-hotzone"/><title>' + esc(h.title) + '</title></g>';
              return;
            } catch (eH) { /* fall through to schematic */ }
          }
          var hwq = hmo.qrs || 8; hst = hmo.st || 0; ht = hmo.t || 0;
          hjx = 64 + 26 + hwq;
          /* Wide lane-height zone across two beats: comfortable tap target on
             phones, same finding everywhere inside so no hover ambiguity. */
          var hx = hjx - 14, hw = 170;
          var htop = hy0 - (laneH - 12) / 2;
          var hbot = hy0 + (laneH - 12) / 2;
          /* But never narrower than the finding itself (tall T, deep inversion). */
          var ftop = Math.min(hy0, hy0 - hst, hy0 - hst - ht) - 12;
          var fbot = Math.max(hy0, hy0 - hst, hy0 - hst - ht, hy0 + (hmo.biphasic ? 12 : 0)) + 8;
          if (ftop < htop) htop = Math.max(24, ftop);
          if (fbot > hbot) hbot = fbot;
          body += '<g class="ecg-hot" tabindex="0" role="button" data-wave="' + h.wave + '" aria-label="' + esc(h.label) + '"><rect x="' + hx + '" y="' + htop + '" width="' + hw + '" height="' + (hbot - htop) + '" rx="6" class="ecg-hotzone"/><title>' + esc(h.title) + '</title></g>';
        });
      }
      notes.forEach(function (line, i) { body += '<text class="ecg-label ecg-label-b" x="42" y="' + (62 + shown.length * laneH + 10 + i * 14) + '">' + esc(line) + '</text>'; });
      body += '</svg>';
      return body;
    }

    function options(overrides) {
      var out = { p: 3, q: 1.5, r: 15, s: 5, st: 0, t: 7, cycle: 62, qrs: 8 };
      Object.keys(overrides || {}).forEach(function (key) { out[key] = overrides[key]; });
      return out;
    }
    function each(names, value, target) { names.split(' ').forEach(function (name) { target[name] = options(value); }); }

    var cases = {};
    function add(id, title, header, note, base, leads, stripLead, strip, stripLabel) {
      cases[id] = { title: title, header: header, note: note, base: options(base), leads: leads || {}, stripLead: options(stripLead || base), strip: strip, stripLabel: stripLabel };
    }

    var a = {};
    /* Inferior OMI teaching example: contiguous II + III + aVF STE with aVL mirror STD.
       cycle 120 keeps every beat on one connected baseline (no T-into-next-P overlap). */
    each('II III aVF', { st: 16, t: 12, broadT: true, r: 14, s: 4, q: 2, cycle: 120, qrs: 8 }, a);
    a.aVL = options({ st: -8, t: 5, r: 12, s: 5, q: 1.5, cycle: 120, qrs: 8 });
    add('stemi-criteria', 'Inferior STEMI pattern — II, III, aVF with aVL mirror', 'inferior injury with mirror change', 'Convex STE II + III + aVF with mirror STD in aVL — territorial STE + mirror STD supports acute inferior occlusion.', { cycle: 120 }, a, { st: 16, t: 12, broadT: true, r: 14, s: 4, cycle: 120, qrs: 8 });

    var a = {};
    /* Hyperacute 3-shape comparator, one V3 viewpoint so only shape changes:
       normal (asymmetric, R > T) vs hyperacute (broad bulky T dwarfing QRS)
       vs hyperK tenting (narrow pointed peak, flat P). cycle 120 connected. */
    a.Normal = options({ p: 3, q: 1.5, r: 15, s: 5, st: 0, t: 7, cycle: 120, qrs: 8 });
    a.Hyperacute = options({ t: 19, broadT: true, st: 2, r: 10, cycle: 120, qrs: 8 });
    a['HyperK?'] = options({ tented: true, t: 14, r: 10, s: 6, p: 1, qrs: 8, cycle: 120 });
    add('hyperacute-t', 'Hyperacute T — normal vs hyperacute vs hyperK', 'one V3 viewpoint, three T shapes', 'Same V3 viewpoint, three T shapes: normal vs hyperacute vs hyperK tenting.', { cycle: 120 }, a, { t: 19, broadT: true, st: 2, r: 10, cycle: 120, qrs: 8 });

    a = {};
    a['Type A'] = options({ biphasic: true, r: 15, s: 5, st: 0, cycle: 120, qrs: 8 });
    a['Type B'] = options({ symmetric: true, t: -16, r: 15, s: 5, st: 0, cycle: 120, qrs: 8 });
    add('wellens', 'Wellens syndrome — Type A vs Type B', 'pain-free post-angina pattern', 'Pain-free interval after resolved angina: Type A biphasic (+/−) vs Type B deep symmetric inversion in V2–V3. Strongly associated with critical LAD disease in the appropriate clinical setting.', { cycle: 120 }, a, { symmetric: true, t: -16, r: 15, s: 5, st: 0, cycle: 120, qrs: 8 });

    a = {}; each('V1 V2 V3 V4 V5 V6', { st: -8, t: 18, broadT: true, r: 12, cycle: 120 }, a); a.aVR = options({ st: 5, t: -4, r: -8, s: 13, cycle: 120 });
    add('dewinter', 'de Winter pattern — precordial STD with tall T waves', 'proximal LAD occlusion pattern', 'Upsloping J-point ST depression with tall symmetric T waves across V2–V6. aVR elevation is supportive and may be absent.', { cycle: 120 }, a, { st: -8, t: 18, broadT: true, r: 12, cycle: 120 });

    a = {}; each('V1 V2 V3', { r: -5, s: 23, qrs: 15, st: -6, t: -4 }, a); each('I aVL V5 V6', { r: 21, s: 5, qrs: 15, st: 4, t: 5 }, a);
    add('sgarbossa', 'Smith-modified Sgarbossa positive', 'LBBB morphology with concordant change', 'LBBB-like wide complexes: concordant anterior ST depression and concordant lateral STE are abnormal.', { qrs: 15, r: 17, s: 9, t: -5 }, a, { qrs: 15, r: -5, s: 23, st: -6, t: -4 });

    a = {}; each('V1 V2 V3', { r: 18, s: 3, st: -7, t: 12, broadT: true, cycle: 120 }, a);
    add('posterior-omi', 'Posterior OMI mirror pattern', 'posterior injury mirror in V1–V3', 'V1–V3 horizontal ST depression with dominant R and upright T raises concern for posterior occlusion. Record V7–V9 and interpret clinically.', { cycle: 120 }, a, { r: 18, s: 3, st: -7, t: 12, broadT: true, cycle: 120 });

    a = {}; each('I II III aVL aVF V4 V5 V6', { st: -5, t: -2 }, a); a.aVR = options({ r: -8, s: 14, st: 6, t: 4 });
    add('avr-lmca', 'aVR elevation with diffuse ST depression', 'global subendocardial ischaemia', 'aVR ST elevation with widespread horizontal ST depression: high-risk ACS or profound supply–demand mismatch.', {}, a, { st: -5, t: -2 });

    a = {}; each('I II III aVL aVF V2 V3 V4 V5 V6', { p: 1, r: 12, s: 8, qrs: 13, t: 17, tented: true, cycle: 70 }, a); a.aVR = options({ p: 1, r: -8, s: 13, qrs: 13, t: -14, tented: true, cycle: 70 });
    add('hyperkalemia', 'Severe hyperkalaemia pattern', 'diffuse conduction toxicity', 'Diffuse narrow peaked T waves, flattened P waves and QRS widening. Treat the ECG first when unstable.', { p: 1, r: 12, s: 8, qrs: 13, t: 17, tented: true, cycle: 70 }, a, { p: 1, r: 12, s: 8, qrs: 13, t: 17, tented: true, cycle: 70 });

    a = {}; each('I II III aVL aVF V2 V3 V4 V5 V6', { st: -3, t: 2, u: 8 }, a);
    add('hypokalemia', 'Hypokalaemia with U waves', 'diffuse repolarisation abnormality', 'Flattened T waves, ST depression and prominent U waves—best seen across the precordial leads.', {}, a, { st: -3, t: 2, u: 8 });

    a = {}; each('II III aVF V3 V4 V5 V6', { cycle: 88, qrs: 11, jWave: 8, t: 4 }, a);
    add('hypothermia', 'Hypothermia with Osborn waves', 'bradycardic hypothermia pattern', 'Bradycardia with prominent J (Osborn) waves, particularly in inferior and lateral precordial leads.', { cycle: 88, qrs: 11, t: 4 }, a, { cycle: 88, qrs: 11, jWave: 8, t: 4 });

    a = {}; each('V1 V2', { r: 7, s: 14, st: 16, t: -12, coved: true }, a); a.V3 = options({ r: 10, s: 9, st: 4, t: 1 });
    add('brugada', 'Brugada type 1 pattern', 'right precordial coved ST elevation', 'Coved ST elevation ≥2 mm with T-wave inversion in V1–V2; position V1/V2 correctly before calling it.', {}, a, { r: 7, s: 14, st: 16, t: -12, coved: true });

    a = {}; a.I = options({ r: 5, s: 15, t: 4, cycle: 46 }); a.III = options({ q: 7, r: 12, s: 4, t: -9, cycle: 46 }); each('V1 V2 V3 V4', { r: 12, s: 6, t: -12, cycle: 46 }, a);
    add('pe-strain', 'Pulmonary embolism strain pattern', 'sinus tachycardia with RV strain', 'Sinus tachycardia with S1Q3T3 and anterior T-wave inversion can support acute RV strain; it is not diagnostic alone.', { cycle: 46 }, a, { cycle: 46, t: -12 });

    a = {}; each('I II III aVL aVF V2 V3 V4 V5 V6', { st: 5, t: 8, prDepression: 3 }, a); a.aVR = options({ r: -8, s: 14, st: -4, t: -5, prDepression: -2 });
    add('pericarditis-ber', 'Acute pericarditis pattern', 'diffuse ST elevation / PR depression', 'Diffuse concave ST elevation with reciprocal ST depression in aVR; territorial reciprocal changes need an OMI work-up.', {}, a, { st: 5, t: 8 });

    a = {}; each('I II III aVL aVF V1 V2 V3 V4 V5 V6', { cycle: 48, qrs: 15, r: 14, s: 8 }, a); a.aVR = options({ cycle: 48, qrs: 15, q: 0, r: 9, s: 14, t: -4, terminalR: true });
    add('tca-toxicity', 'Tricyclic / sodium-channel blockade', 'sinus tachycardia with wide QRS', 'Wide QRS tachycardia with a terminal R wave in aVR: give sodium bicarbonate and manage as sodium-channel toxicity.', { cycle: 48, qrs: 15, r: 14, s: 8 }, a, { cycle: 48, qrs: 15, r: 14, s: 8 });

    a = {}; each('I II III aVL aVF V1 V2 V3 V4 V5 V6', { delta: true, qrs: 12, r: 15, s: 5, cycle: 56 }, a);
    add('wpw', 'Wolff–Parkinson–White pre-excitation', 'short PR / delta wave', 'Short PR interval, slurred delta upstroke and a widened QRS. Pre-excited AF is an emergency and is not treated with AV-nodal blockers.', { delta: true, qrs: 12, r: 15, s: 5, cycle: 56 }, a, { delta: true, qrs: 12, r: 15, s: 5, cycle: 56 });

    a = {}; each('I II III aVL aVF V1 V2 V3 V4 V5 V6', { noP: true, cycle: 43, qrs: 20, r: 17, s: 12, t: 6 }, a);
    add('vt-vs-svt', 'Monomorphic ventricular tachycardia', 'regular broad-complex tachycardia', 'A regular broad-complex tachycardia should be treated as VT until proved otherwise; seek AV dissociation, capture or fusion beats.', { noP: true, cycle: 43, qrs: 20, r: 17, s: 12, t: 6 }, a, { noP: true, cycle: 43, qrs: 20, r: 17, s: 12, t: 6 });

    a = {}; each('I II III aVL aVF V1 V2 V3 V4 V5 V6', { cycle: 84, qrs: 9, r: 14, s: 5 }, a);
    add('complete-heart-block', 'Complete heart block', 'AV dissociation with slow escape', 'Regular P waves march through independently of a slow escape rhythm: complete AV block until proven otherwise.', { noP: true, cycle: 84, qrs: 9, r: 14, s: 5 }, a, { noP: true, cycle: 84, qrs: 9, r: 14, s: 5 }, 'block');

    a = {}; each('I II III aVL aVF V1 V2 V3 V4 V5 V6', { cycle: 48, r: 11, s: 4, t: 5, alternans: true }, a);
    add('electrical-alternans', 'Electrical alternans', 'tachycardia with beat-to-beat QRS variation', 'Beat-to-beat QRS amplitude variation with tachycardia and low voltage is a tamponade warning—perform immediate POCUS/echo.', { cycle: 48, r: 11, s: 4, t: 5, alternans: true }, a, { cycle: 48, r: 11, s: 4, t: 5, alternans: true });

    /* One representative lead by default; retain a paired lead only when comparison is the finding. */
    var displays = {
      'stemi-criteria': ['II', 'III', 'aVF', 'aVL'],
      'hyperacute-t': ['Normal', 'Hyperacute', 'HyperK?'],
      'wellens': ['Type A', 'Type B'],
      'dewinter': ['V2', 'V3', 'V4', 'V5', 'V6', 'aVR'],
      'sgarbossa': ['V5', 'V3', 'V1'],
      'posterior-omi': ['V1', 'V2', 'V3', 'V7', 'V8', 'V9'],
      'avr-lmca': ['aVR', 'I', 'II', 'aVL', 'aVF', 'V4', 'V5', 'V6'],
      'hyperkalemia': ['II'],
      'hypokalemia': ['V3'],
      'hypothermia': ['V4'],
      'brugada': ['V1', 'V2'],
      'pe-strain': ['I', 'III', 'V1', 'V2', 'V3', 'V4'],
      'pericarditis-ber': ['II', 'aVR'],
      'tca-toxicity': ['aVR'],
      'wpw': ['II'],
      'vt-vs-svt': ['II'],
      'complete-heart-block': ['II'],
      'electrical-alternans': ['II']
    };
    Object.keys(displays).forEach(function (id) { cases[id].display = displays[id]; });
    /* Inferior STEMI: connected beats + Step-1-style red explanations for students. */
    cases['stemi-criteria'].jDots = true;
    cases['stemi-criteria'].baseline = true;
    cases['stemi-criteria'].stHighlight = true;
    cases['stemi-criteria'].waves = { 'II': 'inf', 'III': 'inf', 'aVF': 'inf', 'aVL': 'mirror' };
    cases['stemi-criteria'].badges = {
      'II': 'INFERIOR · convex STE +2 mm',
      'III': 'INFERIOR · convex STE +2 mm',
      'aVF': 'INFERIOR · convex STE +2 mm',
      'aVL': 'MIRROR · STD -1 mm'
    };
    cases['stemi-criteria'].calipers = { 'II': '+2 mm STE · need ≥1 mm', 'aVL': '-1 mm mirror STD' };
    cases['stemi-criteria'].bracket = { from: 'II', to: 'aVF', label: 'contiguous: II·III·aVF', wave: 'inf' };
    cases['stemi-criteria'].connector = { from: 'aVF', to: 'aVL', label: 'mirror', wave: 'mirror' };
    cases['stemi-criteria'].hotspots = [
      { lead: 'II', wave: 'inf', title: 'II · STE +2 mm', label: 'Lead 2: convex ST elevation, plus 2 millimetres. Contiguous inferior injury.' },
      { lead: 'III', wave: 'inf', title: 'III · STE +2 mm', label: 'Lead 3: convex ST elevation, plus 2 millimetres. Contiguous inferior injury.' },
      { lead: 'aVF', wave: 'inf', title: 'aVF · STE +2 mm', label: 'Lead a V F: convex ST elevation, plus 2 millimetres. Contiguous inferior injury.' },
      { lead: 'aVL', wave: 'mirror', title: 'aVL · mirror STD -1 mm', label: 'Lead a V L: mirror ST depression, minus 1 millimetre. Reciprocal of inferior OMI.' }
    ];
    cases['stemi-criteria'].note2 = 'MIRROR mnemonic — inferior UP, aVL DOWN: territorial STE + mirror STD supports acute inferior occlusion.';
    /* Hyperacute 3-shape comparator — one viewpoint, three diagnoses to separate. */
    cases['hyperacute-t'].laneH = 68;
    cases['hyperacute-t'].jDots = true;
    cases['hyperacute-t'].apexDots = true;
    cases['hyperacute-t'].broadBase = true;
    cases['hyperacute-t'].baseline = true;
    cases['hyperacute-t'].stHighlight = true;
    cases['hyperacute-t'].waves = { 'Normal': 't', 'Hyperacute': 'hyperacute', 'HyperK?': 'hyperk' };
    cases['hyperacute-t'].badges = {
      'Normal': 'NORMAL · asymmetric, R > T',
      'Hyperacute': 'HYPERACUTE · bulky T > R',
      'HyperK?': 'HYPERK? · narrow pointed, flat P'
    };
    cases['hyperacute-t'].hotspots = [
      { lead: 'Normal', wave: 't', title: 'Normal T: R > T', label: 'Normal T wave: smooth, asymmetric, smaller than the QRS. The baseline every T is judged against.' },
      { lead: 'Hyperacute', wave: 'hyperacute', title: 'Hyperacute: bulky T > R', label: 'Hyperacute T: broad bulky wave dwarfing the QRS with a straightened takeoff. Territorial early occlusion.' },
      { lead: 'HyperK?', wave: 'hyperk', title: 'HyperK?: narrow tent + flat P', label: 'Hyperkalaemia clue: narrow pointed tent with a narrow base and flattened P. Diffuse, not territorial.' }
    ];
    cases['hyperacute-t'].note2 = 'Broad + bulky + territorial: OMI workup. Narrow + pointed + flat P: check potassium now.';
    /* Wellens 2-shape comparator — Type A biphasic vs Type B deep symmetric inversion. */
    cases['wellens'].laneH = 68;
    cases['wellens'].jDots = true;
    cases['wellens'].baseline = true;
    cases['wellens'].waves = { 'Type A': 'wellens', 'Type B': 'wellens' };
    cases['wellens'].badges = {
      'Type A': 'TYPE A (~25%) · biphasic +/− in V2–V3',
      'Type B': 'TYPE B (~75%) · deep symmetric inverted T'
    };
    cases['wellens'].hotspots = [
      { lead: 'Type A', wave: 'wellens', title: 'Wellens Type A: biphasic +/−', label: 'Wellens Type A: biphasic T wave with initial positivity and terminal negativity in V2–V3. Occurs in ~25% of cases. Strongly associated with critical LAD disease in the appropriate clinical setting.' },
      { lead: 'Type B', wave: 'wellens', title: 'Wellens Type B: deep symmetric TWI', label: 'Wellens Type B: deeply inverted, symmetric T waves in V2–V3. Occurs in ~75% of cases. Strongly associated with critical LAD disease in the appropriate clinical setting.' }
    ];
    cases['wellens'].note2 = 'Pain-free post-angina + preserved R waves + no Q waves: suspect critical LAD disease. Avoid stress testing when Wellens syndrome is suspected.';
    /* de Winter paired comparator — Precordial J-point STD + tall T paired with aVR STE. */
    cases['dewinter'].laneH = 68;
    cases['dewinter'].jDots = true;
    cases['dewinter'].baseline = true;
    cases['dewinter'].stHighlight = true;
    cases['dewinter'].waves = { 'V2': 'dewinter', 'V3': 'dewinter', 'V4': 'dewinter', 'V5': 'dewinter', 'V6': 'dewinter', 'aVR': 'dewinter' };
    cases['dewinter'].badges = {
      'V3': 'V3 · upsloping STD 1–3 mm → tall symmetric T',
      'aVR': 'aVR · supportive STE; not required'
    };
    cases['dewinter'].hotspots = [
      { lead: 'V3', wave: 'dewinter', title: 'de Winter: J-point STD → tall T', label: 'de Winter pattern: 1–3 mm upsloping ST depression at the J-point continuing into tall, prominent, symmetric T waves in precordial leads. Acute proximal LAD occlusion.' },
      { lead: 'aVR', wave: 'dewinter', title: 'aVR: reciprocal STE', label: 'Lead aVR elevation can accompany the precordial de Winter pattern; it is supportive and not required.' }
    ];
    cases['dewinter'].note2 = 'de Winter is an anterior OMI equivalent (~2% of LAD occlusions). Do NOT wait for millimetre STEMI — activate cath lab.';
    /* Smith-modified Sgarbossa in LBBB (paced uses same thresholds) — one lead
       per criterion so concordance vs discordance is actually visible, like a
       real ECG: V5 lateral positive QRS + concordant STE, V3 anterior negative
       QRS + concordant STD, V1 septal QS + excessive discordant STE (ST/S). */
    cases['sgarbossa'].laneH = 68;
    cases['sgarbossa'].jDots = true;
    cases['sgarbossa'].baseline = true;
    cases['sgarbossa'].stHighlight = true;
    cases['sgarbossa'].waves = { 'V5': 'sgSte', 'V3': 'sgStd', 'V1': 'sgDis' };
    cases['sgarbossa'].badges = {
      'V5': 'LATERAL V5 · concordant STE ≥1 mm ①',
      'V3': 'ANTERIOR V3 · concordant STD ≥1 mm ②',
      'V1': 'SEPTAL V1 · discordant STE/S ≥25% ③'
    };
    cases['sgarbossa'].calipers = { 'V1': 'STE 3 mm / S 10 mm = 0.30' };
    cases['sgarbossa'].hotspots = [
      { lead: 'V5', wave: 'sgSte', title: 'V5 · concordant STE ≥1 mm', label: 'Criterion 1: ST elevation in the same direction as a positive QRS in a lateral lead. A positive criterion raises concern for acute occlusion in the appropriate clinical setting.' },
      { lead: 'V3', wave: 'sgStd', title: 'V3 · concordant STD ≥1 mm', label: 'Criterion 2: ST depression in the same direction as a negative QRS in V1–V3. A positive criterion raises concern for acute occlusion in the appropriate clinical setting.' },
      { lead: 'V1', wave: 'sgDis', title: 'V1 · discordant STE/S ≥25%', label: 'Criterion 3: ST elevation opposite a negative QS with ST depth at least 25 percent of S depth. Original 5 mm rule is obsolete.' }
    ];
    cases['sgarbossa'].note2 = 'LBBB + paced share thresholds. Any positive criterion warrants urgent clinical assessment for acute occlusion. Wide QRS ≥120 ms with LBBB shape (no Q lateral, QS V1).';
    /* Isolated posterior OMI — anterior mirror plus true posterior confirmation,
       like a real ECG: V1-V3 horizontal STD with tall R (R/S>1) and upright T,
       plus V8 posterior STE>=0.5mm. Flip shows the hidden STEMI. */
    cases['posterior-omi'].jDots = true;
    cases['posterior-omi'].baseline = true;
    cases['posterior-omi'].stHighlight = true;
    cases['posterior-omi'].waves = { 'V1': 'post', 'V2': 'post', 'V3': 'post', 'V7': 'post', 'V8': 'post', 'V9': 'post' };
    cases['posterior-omi'].badges = {
      'V1': 'MIRROR V1 · horizontal STD + tall R',
      'V2': 'MIRROR V2 · STD + R/S>1 + upright T',
      'V3': 'MIRROR V3 · STD + tall R/T',
      'V7': 'POSTERIOR V7 · 1.0 mm STE',
      'V8': 'POSTERIOR V8 · 0.8 mm STE',
      'V9': 'POSTERIOR V9 · 0.6 mm STE'
    };
    cases['posterior-omi'].hotspots = [
      { lead: 'V1', wave: 'post', title: 'V1 · mirror STD + tall R', label: 'Anterior mirror: horizontal ST depression with tall R wave. Flip shows posterior ST elevation.' },
      { lead: 'V2', wave: 'post', title: 'V2 · STD + R/S>1 + upright T', label: 'Posterior mirror in V2: horizontal STD with prominent R (R/S above 1) and upright T. Do not label anterior ischemia.' },
      { lead: 'V3', wave: 'post', title: 'V3 · mirror STD + tall T', label: 'Contiguous V1–V3 mirror change with upright T waves. Suspect posterior injury; record V7–V9 and assess clinically.' },
      { lead: 'V8', wave: 'post', title: 'V8 · posterior STE ≥0.5 mm', label: 'True posterior lead V8 (V7–V9 set): Elevation supports posterior injury; confirm distribution in contiguous posterior leads, with clinical context and age-specific thresholds.' }
    ];
    cases['posterior-omi'].note2 = 'Flip V1–V3 → posterior STE. Record V7–V9; use contiguous leads and age-specific posterior STE thresholds. Digitalis scooped STD is not horizontal territorial mirror.';
    var teachingLabels = {
      'avr-lmca': { aVR: 'ST above baseline', I: 'ST below baseline', II: 'ST below baseline', aVL: 'ST below baseline', aVF: 'ST below baseline', V4: 'ST below baseline', V5: 'ST below baseline', V6: 'ST below baseline' },
      hypokalemia: { V3: 'Small T followed by a separate larger U' },
      hypothermia: { V4: 'J wave immediately after the QRS' },
      brugada: { V1: 'Coved ST descending into negative T', V2: 'Coved ST descending into negative T' },
      'pe-strain': { I: 'Deep S', III: 'Q wave and inverted T', V1: 'Anterior T inversion', V2: 'Anterior T inversion', V3: 'Anterior T inversion', V4: 'Anterior T inversion' },
      'pericarditis-ber': { II: 'PR below baseline; ST above baseline', aVR: 'Opposite PR and ST displacement' },
      'tca-toxicity': { aVR: 'Terminal positive R after the negative complex' },
      wpw: { II: 'Shorter PR; slurred beginning of QRS (delta)' },
      'electrical-alternans': { II: 'Alternating large and small QRS complexes' }
    };
    Object.keys(teachingLabels).forEach(function (id) {
      cases[id].badges = teachingLabels[id];
      cases[id].baseline = true;
      cases[id].laneH = 100;
    });
    /* Phase 2: engine-backed realistic traces for 9 representative patterns.
       Teaching text/badges/hotspots/notes above are preserved verbatim;
       only trace generation switches to ECG_ENGINE signals. Fallback to
       schematic beat() remains if engine is missing. */
    ['stemi-criteria', 'hyperacute-t', 'wellens', 'dewinter', 'hyperkalemia', 'vt-vs-svt', 'complete-heart-block', 'sgarbossa', 'posterior-omi'].forEach(function (id) {
      if (cases[id]) cases[id].useEngine = id;
    });
    cases['hyperkalemia'].engineOpts = { stage: 'advanced' };
    // VT/CHB: engine draws real AV dissociation; old faint pWaves overlay off via useEngine.
    // Step 6 legend: same integration layer re-renders the omi-equivalents ladder
    // with realistic engine mini-traces; step title/caption are preserved below.
    if (ECG_SVG && ECG_SVG['omi-equivalents'] && ECG_ENGINE && ECG_ENGINE.renderOmiLegend) {
      try { ECG_SVG['omi-equivalents'].svg = ECG_ENGINE.renderOmiLegend(); } catch (e) {}
    }

    Object.keys(cases).forEach(function (id) {
      if (!ECG_SVG || !ECG_SVG[id]) return;
      var item = cases[id];
      ECG_SVG[id].title = item.title;
      ECG_SVG[id].caption = 'Schematic focused leads; not to scale and not a patient recording. ' + item.note;
      ECG_SVG[id].figureLabel = 'Schematic · not to scale';
      if (item.useEngine) ECG_SVG[id].traceSpec = { pattern: id, lanes: item.display, options: item.engineOpts || {}, waves: item.waves || {}, note: item.note };
      ECG_SVG[id].noCompare = true;
      ECG_SVG[id].svg = caseSvg(item, id);
    });
}
