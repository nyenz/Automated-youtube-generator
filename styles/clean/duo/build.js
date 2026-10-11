const fs = require('fs'), path = require('path'), D = __dirname;
let h = fs.readFileSync(path.join(D, 'duo.html'), 'utf8');
h = h.replace('__WM__', () => JSON.stringify(fs.readFileSync(path.join(D, 'wm_g.txt'), 'utf8'))).replace('__WF__', () => JSON.stringify(fs.readFileSync(path.join(D, 'wf_g.txt'), 'utf8'))).replace('__DUO__', () => fs.readFileSync(path.join(D, 'duo.js'), 'utf8'));
fs.writeFileSync(path.join(D, 'the-couple.html'), h); console.log('wrote', h.length);
