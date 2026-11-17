// runs in the page: makes realistic "Sonnet replies" for testing
window.FIX = {
  plan: function (parts, variant) {
    return '```json\n' + JSON.stringify({ parts: parts.map(function (p, i) { return { id: p.id, title: 'Part ' + p.id + (variant ? ' B' : ''), place: 'frozen pond', time: 'night', moods: ['night', 'heavy'], cast: i % 2 ? ['boy', 'nurse'] : ['boy', 'medic'], assets: variant ? ['pine', 'hills', 'crate', 'lantern'] : ['pine', 'hills', 'crate'], in: i ? 'whip' : 'dip', out: i === parts.length - 1 ? 'none' : 'whip', starts_on: 'wide', ends_on: 'close', job: i ? 'climb' : 'hook', beats: ['a', 'b'] } }),
      continuity: { boy: 'red coat' }, assets_info: { crate: { note: 'a wooden crate', band: 'subject', level: 1 }, lantern: { note: 'a lantern', band: 'subject', level: 2 } }, cast_info: { nurse: { note: 'a nurse in teal', level: 2 } } }, null, 1) + '\n```';
  },
  asset: function (name, col) { return 'MODE: ASSETS\nWHAT I MADE: one asset\nCODE:\n```js\nASSET(\'' + name + '\',{band:\'subject\',note:\'test ' + name + '\',box:[-70,-90,140,100],demo:{}},({x=0})=>`<g transform="translate(${x} 0)"><rect x="-50" y="-70" width="100" height="70" fill="' + col + '"/><path d="M-50,-70H50" stroke="#D9B45A" stroke-width="3"/></g>`);\n```' },
  cast: function (col) { return '```js\nCAST.nurse={name:\'Nurse\',scale:.95,headK:1,skin:\'#EDCDAB\',hair:\'#3A2416\',coat:\'' + col + '\',coatLen:30,legs:P.indigo,boots:P.bark,hat:\'bun\',kind:\'mother\'};\n```' },
  scene: function (tpl, part, words, plan, zoomK) {
    var b0 = tpl.indexOf('<script data-part="1">'), b1 = tpl.indexOf('</script>', b0), code = tpl.slice(tpl.indexOf('>', b0) + 1, b1);
    var ws = words.filter(function (w) { return w[1] >= part.start - .001 && w[1] < part.end - .001 }), seg = [], cur = null;
    ws.forEach(function (w, i) { var gap = i ? w[1] - ws[i - 1][2] : 1; if (!cur || gap >= .12 || cur.n >= 4 || /[.,!?]$/.test(ws[i - 1] ? ws[i - 1][0] : '')) { cur = { s: w[1], e: w[2], t: [w[0]], n: 1 }; seg.push(cur) } else { cur.e = w[2]; cur.t.push(w[0]); cur.n++ } });
    var SEG = '[' + seg.map(function (x) { return '[' + x.s + ',' + x.e + ',' + JSON.stringify(x.t.join(' ')) + ']' }).join(',') + ']';
    var head = 'const P=PART({id:' + part.id + ',of:' + plan.parts.length + ',title:"Test part ' + part.id + '",\n AUDIO_START:' + part.start + ',AUDIO_END:' + part.end + ',\n SEG:' + SEG + ',\n KEY:/^(ice|cold|pulse|limp)/i});';
    var a = code.indexOf('const P=PART({'), e = code.indexOf('const T=P.T');
    code = code.slice(0, a) + head + '\n' + code.slice(e);
    code = code.replace("T('shouts')", "T('pulse')").replace("T('trapped')", "T('ice')").replace("T('after')", "T('limp')");
    code = code.replace("P.IN='dip';P.OUT='dip';", "P.IN=" + JSON.stringify(part.in) + ";P.OUT=" + JSON.stringify(part.out) + ";");
    // keys were written for a 22.9 s part: squeeze them to this END
    code = code.replace('const T=P.T,END=P.END;', 'const T=P.T,END=P.END,__k=END/22.92;');
    code = code.replace(/\[END,-102,240,3\.72\]\];/, '[END,-102,240,' + (3.72 * zoomK).toFixed(2) + ']];P.KEYS=P.KEYS.map((k,i,a)=>[i===a.length-1?END:Math.min(k[0]*__k,END-.01*(a.length-i)),k[1],k[2],k[3]]).sort((x,y)=>x[0]-y[0]);P.HITS=P.HITS.map(h=>[Math.min(h[0],END-.1),h[1]]);');
    return 'SYNC part ' + part.id + '\nCODE:\n```html\n<script data-part="' + part.id + '">\n' + code + '\n</script>\n```';
  }
};
