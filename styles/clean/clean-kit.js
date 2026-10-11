/* CLEAN KIT — style 02 rebuilt to STYLE-BIBLE.md.
   Rules: flat shapes, two tones per material (base + one hue-shifted shadow), no outlines, no rim light, no gradients,
   no grain. Thin ink strokes only inside shapes. Warm khaki world, two blacks, cream instead of white.
   Characters are drawn in 3/4 front view, relaxed slouch, hands in pockets.                                   */
(function () {
  var C = {}; window.CLEAN = C;
  C.PAL = {
    bg: '#AE9675', groundShadow: '#4E4236', ink: '#050304', softBlack: ['#332C32', '#1F1920'], cream: ['#F5ECE4', '#C9B6A8'],
    teal: ['#057378', '#034F55'], denim: ['#527481', '#284150'], orange: ['#E13B07', '#A82A05'], gold: '#E2A052',
    skin: { deep: ['#7A2E28', '#4A1A1E'], brown: ['#8F4A30', '#5A2A1C'], tan: ['#C47A50', '#8E4E34'], light: ['#E69972', '#B86A4E'], fair: ['#E8A88A', '#B87862'] }
  };
  function P(d, c, ex) { return '<path d="' + d + '" fill="' + c + '"' + (ex || '') + '/>' }
  function S(d, c, w, ex) { return '<path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (ex || '') + '/>' }
  C.P = P; C.S = S;

  /* faces: lid = how far the upper lid comes down (0 open .. 1 shut), look = pupil shift, brow = [lift, tilt] */
  C.FACES = {
    cool: { lid: .38, look: -4, brow: [0, 0], mouth: 'smirk' },
    happy: { lid: .2, look: -2, brow: [-5, -3], mouth: 'smile' },
    surprised: { lid: 0, look: 0, brow: [-14, -4], mouth: 'o' },
    annoyed: { lid: .55, look: -6, brow: [4, 8], mouth: 'flat' },
    sad: { lid: .45, look: -2, brow: [-4, -10], mouth: 'down' },
    sleepy: { lid: .8, look: 0, brow: [2, -2], mouth: 'flat' }
  };

  /* ---------- character 01: the "93" jersey teen ---------- */
  C.guy93 = function (o) {
    o = o || {}; var K = C.PAL, sk = K.skin[o.skin || 'deep'], f = C.FACES[o.face || 'cool'], s = '';
    // ground shadow: a flat strip, offset right
    s += P('M112,1228 L516,1228 L530,1240 L126,1240Z', K.groundShadow, ' opacity=".7"');

    // dreads behind the head and shoulders (beaded chains)
    var chains = [[372, 236, 420, 400], [384, 244, 452, 380], [358, 240, 388, 412], [394, 252, 470, 350], [346, 244, 352, 410]];
    chains.forEach(function (c, i) { for (var k = 0; k <= 10; k++) { var t = k / 10, x = c[0] + (c[2] - c[0]) * t + Math.sin(t * 3 + i) * 6, y = c[1] + (c[3] - c[1]) * t; s += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="9" ry="8" fill="' + K.ink + '"/>' } });

    // far arm (behind the body): sleeve in shadow teal, its stripes in muted tones
    s += P('M396,410 C428,436 446,504 448,594 L404,600 C402,526 398,462 386,424Z', K.teal[1]);
    s += P('M402,548 L447,544 L447,562 L403,566Z', '#9C8E86') + P('M403,566 L447,562 L448,580 L404,584Z', K.ink);

    // pants: wide legs that pool over the shoes; the far leg is mostly shadow
    s += P('M314,740 L440,736 L506,1152 C462,1170 384,1172 342,1158 L326,880Z', K.denim[1]);           // far leg (mostly shadow)
    s += P('M314,740 L350,744 L366,900 L384,1162 L342,1158 L326,880Z', K.denim[0]);                     // its lit edge
    s += P('M392,900 L440,940 L400,950Z M410,1050 L478,1086 L414,1098Z', '#3A5966');                    // fold marks
    s += P('M190,740 L318,744 L322,872 L304,1146 C258,1166 168,1166 118,1146Z', K.denim[0]);              // near leg (lit)
    s += P('M318,744 L322,872 L304,1146 L272,1150 L280,1000 L266,900Z', K.denim[1]);                      // inner shadow
    s += P('M186,900 L254,926 L196,942Z M150,1010 L226,1048 L156,1068Z M130,1100 L232,1122 L124,1136Z', K.denim[1]); // angular folds
    s += P('M120,1132 C170,1146 262,1148 306,1134 L304,1146 C258,1166 168,1166 118,1146Z', K.denim[1]);  // hem turn-up
    s += S('M230,764 C234,796 244,816 258,826', '#1f3540', 3) + S('M362,764 C358,792 350,810 338,820', '#1f3540', 3); // pocket openings

    // sneakers: sole (ink), midsole (cream), upper (cream + ink panel + small accent)
    function shoe(x, y, flip, far) {
      var sx = flip ? -1 : 1, base = far ? K.cream[1] : K.cream[0];
      var g = '<g transform="translate(' + x + ',' + y + ') scale(' + sx + ',1)">';
      g += P('M-92,58 C-96,74 -78,82 -40,82 L60,82 C76,82 82,72 78,58Z', K.ink);
      g += P('M-90,40 L78,40 L80,60 L-92,60Z', base);
      g += P('M-88,42 C-90,14 -64,-2 -30,-4 L40,-10 C66,-10 80,10 80,42Z', base);
      g += P('M-40,6 L20,-6 L52,20 L-10,32Z', K.ink);
      g += P('M30,-10 L56,-12 L70,10 L48,14Z', far ? '#9a7a76' : '#D9A5A0');
      g += S('M-20,-2 L-6,8 M-2,-6 L12,4', far ? '#9C8E86' : '#C9B6A8', 4);
      return g + '</g>';
    }
    s += '<g transform="translate(430,1150) scale(1.25) translate(-430,-1150)">' + shoe(430, 1144, true, true) + '</g>' + '<g transform="translate(200,1150) scale(1.3) translate(-200,-1150)">' + shoe(200, 1136, false, false) + '</g>';

    // jersey: oversized body, big shadow on the far side, stripes at the hem
    s += P('M200,402 C250,382 362,382 408,398 L442,474 L452,756 C390,778 250,780 176,758 L188,474Z', K.teal[0]);
    s += P('M344,394 C386,398 410,412 420,432 L452,756 C420,770 384,774 352,776 C364,640 368,492 344,394Z', K.teal[1]);
    s += P('M178,700 C250,722 384,720 451,700 L451,726 C384,746 250,748 177,726Z', K.cream[0]);
    s += P('M177,726 C250,748 384,746 451,726 L452,756 C390,778 250,780 176,758Z', K.ink);
    s += P('M352,714 C392,712 426,706 451,700 L451,726 C426,734 392,742 354,744Z', K.cream[1]);         // stripe in shadow
    // big number, drawn as chunky strokes, foreshortened toward the far side
    s += '<g transform="translate(44,4)" fill="none" stroke="' + K.orange[0] + '" stroke-width="20" stroke-linejoin="miter" stroke-linecap="butt">';
    s += '<path d="M212,612 L244,612 L252,602 L252,512 L244,504 L218,504 L210,512 L210,546 L218,554 L252,554"/>';
    s += '<path d="M272,504 L306,504 L314,514 L314,544 L304,552 L286,552 M304,552 L316,562 L316,598 L306,610 L272,610"/>';
    s += '</g>';
    // V-neck and collar
    s += P('M262,392 C280,388 324,388 340,392 L302,446Z', K.cream[0]) + S('M270,396 L302,440 L332,396', K.ink, 5) + P('M318,390 L340,392 L306,444 L302,440Z', K.cream[1]);

    // near arm: oversized sleeve with cream/ink stripes, forearm going into the pocket
    s += P('M184,650 L224,652 L240,782 L208,788Z', sk[0]) + P('M210,652 L224,652 L240,782 L228,786Z', sk[1]);
    s += P('M196,776 C214,770 238,772 252,782 L256,810 L198,812Z', K.denim[0]) + S('M200,790 C220,782 240,784 254,794', '#1f3540', 3); // pocket lip over the wrist
    s += P('M204,404 C170,428 156,520 158,656 L234,660 C234,560 238,470 248,420Z', K.teal[0]);
    s += P('M222,412 C238,418 246,424 248,420 C238,470 234,560 234,660 L214,658 C216,560 218,470 222,412Z', K.teal[1]);
    s += P('M158,598 L234,602 L234,620 L158,616Z', K.cream[0]) + P('M158,616 L234,620 L234,640 L158,636Z', K.ink) + P('M158,636 L234,640 L234,660 L158,656Z', K.cream[0]);

    // neck
    s += P('M290,350 L330,350 L334,398 L292,400Z', sk[1]);
    s += '<g transform="translate(312,380) scale(1.3) translate(-312,-380)">';

    // head: skull, then the shadow side, ear, face features
    s += P('M236,252 C236,200 280,182 320,182 C372,186 394,226 392,272 C390,322 362,354 322,362 C290,368 258,358 246,338 C238,324 236,302 236,282Z', sk[0]);
    s += P('M340,192 C380,206 394,242 392,276 C388,326 360,354 322,362 C304,364 292,358 290,352 C334,334 352,292 346,252Z', sk[1]);
    s += P('M330,270 C346,258 368,264 368,286 C368,306 352,316 336,310 C330,300 328,284 330,270Z', sk[0]) + P('M338,276 C350,272 358,280 356,292 C354,302 346,304 340,300Z', sk[1]);
    s += '<circle cx="348" cy="322" r="9" fill="none" stroke="' + K.gold + '" stroke-width="4"/>';
    // freckles
    s += '<circle cx="296" cy="314" r="2.4" fill="' + sk[1] + '"/><circle cx="305" cy="319" r="2.4" fill="' + sk[1] + '"/><circle cx="293" cy="322" r="2.4" fill="' + sk[1] + '"/>';
    // eyes: half-moon whites, a flat upper lid line with a flick, small pupils looking aside
    function eye(cx, cy, w, h, pr, flick) {
      var e = '', id = 'e' + Math.round(cx), top = cy - h * .45 + f.lid * h * .9;
      e += '<clipPath id="' + id + '"><path d="M' + (cx - w / 2) + ',' + (cy - h * .45) + ' L' + (cx + w / 2) + ',' + (cy - h * .55) + ' C' + (cx + w / 2 + 2) + ',' + (cy + h * .45) + ' ' + (cx - w / 2 - 2) + ',' + (cy + h * .5) + ' ' + (cx - w / 2) + ',' + (cy - h * .45) + 'Z"/></clipPath>';
      e += '<g clip-path="url(#' + id + ')"><rect x="' + (cx - w) + '" y="' + (cy - h) + '" width="' + w * 2 + '" height="' + h * 2 + '" fill="' + K.cream[0] + '"/>';
      e += '<circle cx="' + (cx + f.look) + '" cy="' + (cy + 2) + '" r="' + pr + '" fill="' + K.ink + '"/>';
      e += '</g>';
      // the upper lid: skin drawn over the top of the eye (outside the clip, so no thin seams), then the ink lash line
      e += P('M' + (cx - w / 2 - 6) + ',' + (cy - h) + ' L' + (cx + w / 2 + 6) + ',' + (cy - h) + ' L' + (cx + w / 2 + 6) + ',' + (top - 6) + ' L' + (cx - w / 2 - 6) + ',' + (top + 2) + 'Z', sk[0]);
      e += P('M' + (cx - w / 2 - 4) + ',' + (top + 1) + ' L' + (cx + w / 2 + 2) + ',' + (top - 6) + ' L' + (cx + w / 2 + flick) + ',' + (top - 11) + ' L' + (cx + w / 2 + 4) + ',' + (top + 1) + ' L' + (cx - w / 2 - 2) + ',' + (top + 6) + 'Z', K.ink);
      return e;
    }
    s += eye(284, 288, 52, 38, 6.5, 12) + eye(240, 286, 28, 32, 5, 6);
    // brows: thick short slabs, low
    var bl = f.brow[0], bt = f.brow[1];
    s += '<g transform="translate(0,' + bl + ') rotate(' + bt + ' 284 262)">' + P('M258,250 L310,240 L312,251 L260,261Z', K.ink) + '</g>';
    s += '<g transform="translate(0,' + bl + ') rotate(' + (-bt * .6) + ' 240 266)">' + P('M222,255 L250,251 L251,260 L224,264Z', K.ink) + '</g>';
    // nose: big rounded bulb breaking the face edge, shadow on its underside
    s += P('M242,298 C224,292 198,296 192,314 C188,330 204,340 226,336 C240,334 250,324 250,312Z', sk[0]);
    s += P('M194,322 C200,336 222,340 238,332 C246,328 250,320 250,314 C232,326 210,328 194,322Z', sk[1]);
    // mouth
    var m = { smirk: 'M236,346 C248,350 262,348 270,340', smile: 'M232,342 C246,356 266,354 274,338', flat: 'M236,348 L268,346', down: 'M236,352 C248,344 262,344 270,350', o: '' }[f.mouth];
    if (f.mouth === 'o') s += '<ellipse cx="252" cy="348" rx="8" ry="10" fill="' + K.ink + '"/>'; else s += S(m, K.ink, 3.5);
    // cap: dome, shadow side, brim, the shadow it casts on the forehead, seams and button
    s += P('M234,246 C280,236 360,236 398,244 L396,256 C356,248 282,250 238,262Z', sk[1]);
    s += P('M230,240 C228,178 272,148 322,148 C374,148 402,186 398,240 C360,226 280,226 230,240Z', K.orange[0]);
    s += P('M346,152 C380,162 402,194 398,240 C384,236 368,232 352,230 C360,206 358,176 346,152Z', K.orange[1]);
    s += P('M232,234 C204,234 172,244 160,258 C192,264 228,256 252,244Z', K.orange[1]);
    s += S('M300,150 C292,180 290,206 292,230', '#8C2204', 3) + '<ellipse cx="322" cy="150" rx="10" ry="5" fill="' + K.orange[1] + '"/>';
    s += '</g>';
    return s;
  };
})();
