// node styles/clean/build.js -> styles/clean/clean-style-test.html (self-contained: kit and reference image inlined)
const fs = require('fs'), path = require('path'), D = __dirname;
let html = fs.readFileSync(path.join(D, 'demo.html'), 'utf8');
const kit = fs.readFileSync(path.join(D, 'clean-kit.js'), 'utf8');
const img = 'data:image/png;base64,' + fs.readFileSync(path.join(D, 'ref-93.png')).toString('base64');
html = html.replace('<script src="clean-kit.js"></script>', '<script>\n' + kit + '\n</script>').replace('src="ref-93.png"', 'src="' + img + '"');
fs.writeFileSync(path.join(D, 'clean-style-test.html'), html);
console.log('wrote clean-style-test.html', html.length);
