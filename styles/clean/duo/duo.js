/* "The Couple" — 8 s test: two characters made only by recolouring and animating traced art (no new drawing). */
(function () {
  var D = window.DUO = {};
  D.DUR = 8;
  // recolour rules: [fromColours, y0, y1, x0, x1, toColour] — first match wins, applied as clipped copies
  var MAN = { src: 'wm', box: [429, 87, 192, 404], neck: 166, hip: 302, cx: 515, eyes: [[517, 131, 12, 6], [497, 136, 6, 4]], skin: '#ed7d55', mouth: [500, 153], rules: [
    [['#f5ece0', '#e7c59a'], 204, 228, 524, 560, '#3b5683'],
    [['#2f2b32', '#24202b', '#1c1820'], 0, 128, 0, 9999, '#2d3e5e'],
    [['#2f2b32'], 128, 306, 0, 9999, '#3b5683'], [['#24202b'], 128, 306, 0, 9999, '#2c4166'], [['#1c1820'], 128, 306, 0, 9999, '#22334f'],
    [['#5a4538', '#81695a'], 160, 306, 0, 9999, '#4a6898'], [['#06050a'], 160, 306, 0, 9999, '#1b2840'],
    [['#2f2b32'], 306, 452, 0, 9999, '#8a7b4f'], [['#24202b'], 306, 452, 0, 9999, '#6d6140'], [['#1c1820'], 306, 452, 0, 9999, '#575033'],
    [['#5a4538', '#81695a'], 306, 452, 0, 9999, '#9b8b5c'], [['#06050a'], 306, 452, 0, 9999, '#3d3826'],
    [['#e7c59a'], 0, 9999, 0, 9999, '#a8784e'], [['#5a4538', '#81695a'], 0, 160, 0, 9999, '#7a5236']
  ] };
  var WOMAN = { src: 'wf', box: [632, 116, 177, 377], neck: 200, hip: 300, cx: 745, eyes: [[745, 161, 12, 6.5]], skin: '#e87149', mouth: [737, 188], rules: [
    [['#cf4684'], 0, 9999, 0, 9999, '#c7894f'],
    [['#f7d499'], 0, 9999, 0, 9999, '#c0643a'], [['#d4b598'], 0, 9999, 0, 9999, '#c9a27c'], [['#8d6d54', '#5e483f'], 0, 300, 0, 9999, '#7c3f22'],
    [['#3a353c', '#201b21'], 285, 350, 0, 712, '#7a4a2c'], [['#0d090e'], 285, 350, 0, 712, '#5c3520'],
    [['#3a353c'], 0, 300, 0, 9999, '#b8875a'], [['#201b21'], 0, 300, 0, 9999, '#93673f'], [['#0d090e'], 196, 300, 0, 9999, '#5a3a26'],
    [['#3a353c'], 300, 455, 0, 9999, '#6a4a38'], [['#201b21'], 300, 455, 0, 9999, '#4e3427'], [['#0d090e'], 300, 455, 0, 9999, '#2e1d16'],
    [['#8d6d54', '#5e483f'], 300, 455, 0, 9999, '#5a3c2c']
  ] };
  D.PEOPLE = [WOMAN, MAN];

  var UID = 0;
  function recolour(P, raw) {
    var out = '', defs = '';
    raw.replace(/<path fill="(#\w+)" d="([^"]+)"\/>/g, function (_, col, d) {
      var hits = P.rules.filter(function (r) { return r[0].indexOf(col) >= 0 });
      if (!hits.length) { out += '<path fill="' + col + '" d="' + d + '"/>'; return }
      // base copy (original colour) outside every rule region, then one clipped copy per rule
      var id = 'r' + (UID++);
      defs += '<clipPath id="' + id + 'o" clip-rule="evenodd"><path d="M-9999,-9999H9999V9999H-9999Z' + hits.map(function (r) { return 'M' + r[3] + ',' + r[1] + 'H' + Math.min(r[4], 9000) + 'V' + Math.min(r[2], 9000) + 'H' + r[3] + 'Z' }).join('') + '"/></clipPath>';
      out += '<path fill="' + col + '" d="' + d + '" clip-path="url(#' + id + 'o)"/>';
      hits.forEach(function (r, k) { defs += '<clipPath id="' + id + '_' + k + '"><rect x="' + r[3] + '" y="' + r[1] + '" width="' + (Math.min(r[4], 9000) - r[3]) + '" height="' + (Math.min(r[2], 9000) - r[1]) + '"/></clipPath>'; out += '<path fill="' + r[5] + '" d="' + d + '" clip-path="url(#' + id + '_' + k + ')"/>' });
    });
    return { defs: defs, body: out };
  }
  D.init = function (raw) { // raw: { wm: '<path…>', wf: '<path…>' }
    var defs = '';
    D.PEOPLE.forEach(function (P, i) {
      var r = recolour(P, raw[P.src]); P.gid = 'p' + i;
      defs += r.defs + '<g id="' + P.gid + '">' + r.body + '</g>';
      var b = P.box;
      defs += '<clipPath id="' + P.gid + 'L"><rect x="' + (b[0] - 60) + '" y="' + P.hip + '" width="' + (b[2] + 120) + '" height="400"/></clipPath>';
      defs += '<clipPath id="' + P.gid + 'T"><rect x="' + (b[0] - 60) + '" y="' + P.neck + '" width="' + (b[2] + 120) + '" height="' + (P.hip - P.neck + 4) + '"/></clipPath>';
      defs += '<clipPath id="' + P.gid + 'H"><rect x="' + (b[0] - 60) + '" y="' + (b[1] - 80) + '" width="' + (b[2] + 120) + '" height="' + (P.neck - b[1] + 88) + '"/></clipPath>';
    });
    D.defs = '<defs>' + defs + '</defs>';
  };

  // timeline: who talks / nods / blinks
  var TALK = [[0, .7, 3.1], [1, 3.6, 6.0]], NOD = [[0, 4.4, .9], [1, 1.9, .8], [0, 6.6, .8], [1, 6.7, .8]], BLINK = [[0, 1.3], [1, 2.6], [0, 5.2], [1, 6.3], [0, 7.4]];
  function talking(i, t) { return TALK.some(function (q) { return q[0] === i && t >= q[1] && t < q[2] }) }
  function nod(i, t) { var v = 0; NOD.forEach(function (q) { if (q[0] === i && t >= q[1] && t < q[1] + q[2]) v += Math.sin((t - q[1]) / q[2] * Math.PI * 2) * 3 }); return v }
  function blink(i, t) { return BLINK.some(function (q) { return q[0] === i && t >= q[1] && t < q[1] + .14 }) }
  function laugh(t) { return t > 6.5 ? Math.abs(Math.sin((t - 6.5) * 9)) * Math.min(1, (8 - t) * 2) : 0 }

  function person(P, i, t, x, ground, s, look, flip) {
    var b = P.box, a = Math.sin(t * 1.1 + i * 2), sway = Math.sin(t * .8 + i) * .5, tilt = (look || 0) + nod(i, t) + a * 1.2;
    var lift = -laugh(t + i * .1) * 2.2 - (talking(i, t) ? Math.abs(Math.sin(t * 7)) * .6 : 0);
    var head = '<g transform="rotate(' + (tilt + sway).toFixed(2) + ' ' + P.cx + ' ' + P.neck + ') translate(0,' + lift.toFixed(2) + ')"><use href="#' + P.gid + '"/>';
    if (blink(i, t)) P.eyes.forEach(function (e) { head += '<ellipse cx="' + e[0] + '" cy="' + e[1] + '" rx="' + e[2] + '" ry="' + e[3] + '" fill="' + P.skin + '"/><path d="M' + (e[0] - e[2]) + ',' + (e[1] + 1) + ' Q' + e[0] + ',' + (e[1] + e[3] * .7) + ' ' + (e[0] + e[2]) + ',' + (e[1] + .5) + '" fill="none" stroke="#0d090e" stroke-width="1.4" stroke-linecap="round"/>' });
    if (talking(i, t)) { var o = Math.abs(Math.sin(t * 11 + i)) * 2.4 + .3; head += '<ellipse cx="' + P.mouth[0] + '" cy="' + (P.mouth[1] + o * .4) + '" rx="2.6" ry="' + o.toFixed(2) + '" fill="#3a0d10"/>' }
    head += '</g>';
    var cx = b[0] + b[2] / 2, foot = b[1] + b[3];
    var s0 = '<g transform="translate(' + x + ',' + ground + ') scale(' + (flip ? -s : s) + ',' + s + ') translate(' + (-cx) + ',' + (-foot) + ')">';
    s0 += '<g clip-path="url(#' + P.gid + 'L)"><use href="#' + P.gid + '"/></g>';
    s0 += '<g clip-path="url(#' + P.gid + 'T)"><g transform="rotate(' + sway.toFixed(2) + ' ' + P.cx + ' ' + P.hip + ')"><use href="#' + P.gid + '"/></g></g>';
    s0 += '<g clip-path="url(#' + P.gid + 'H)"><g transform="rotate(' + sway.toFixed(2) + ' ' + P.cx + ' ' + P.hip + ')">' + head + '</g></g>';
    return s0 + '</g>';
  }
  D.frame = function (t) {
    var k = t / D.DUR, e = k * k * (3 - 2 * k), z = 1.12 + .22 * e, cy = 1180 - 330 * e;
    var s = D.defs + '<rect width="1080" height="1920" fill="#AE9675"/>';
    s += '<g transform="translate(540,960) scale(' + z.toFixed(4) + ') translate(-540,' + (-cy).toFixed(1) + ')">';
    s += '<path d="M110,1662 L990,1662 L1010,1684 L130,1684Z" fill="#4E4236" opacity=".55"/>';
    s += person(D.PEOPLE[0], 0, t, 350, 1672, 2.55, t > .7 && t < 3.2 ? 2 : 0) + person(D.PEOPLE[1], 1, t, 735, 1672, 2.55, t > 3.6 && t < 6 ? -2 : 0);
    s += '</g>';
    return s;
  };
})();
