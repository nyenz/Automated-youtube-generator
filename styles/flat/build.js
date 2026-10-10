// node styles/flat/build.js  ->  styles/flat/flat-cartoon.html (one self-contained page)
const fs = require('fs'), path = require('path'), D = __dirname;
let lab = fs.readFileSync(path.join(D, 'lab.html'), 'utf8');
const kit = fs.readFileSync(path.join(D, 'flat-kit.js'), 'utf8');
const ref = fs.readFileSync(path.join(D, 'reference.html'), 'utf8');
const inner = ref.match(/<svg[^>]*>([\s\S]*)<\/svg>/)[1].replace(/<rect width="1012" height="1346" fill="#b99f84"\/>/, '<rect width="1100" height="1400" fill="#b99f84"/>');
lab = lab.replace('<script id="kit-src" src="flat-kit.js"></script>', '<template id="ref-svg"><svg xmlns="http://www.w3.org/2000/svg">' + inner + '</svg></template>\n<script>\n' + kit + '\n</script>');
fs.writeFileSync(path.join(D, 'flat-cartoon.html'), lab);
console.log('wrote flat-cartoon.html', lab.length);
