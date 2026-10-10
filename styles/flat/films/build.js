// node styles/flat/films/build.js  ->  styles/flat/films/the-longest-fall.html (one self-contained page)
const fs = require('fs'), path = require('path'), D = __dirname, ROOT = path.join(D, '..', '..', '..');
const parts = [path.join(D, '..', 'flat-kit.js'), path.join(D, 'elevator-script.js'), path.join(D, 'elevator-film.js'), path.join(ROOT, 'kit', 'piano.js'), path.join(ROOT, 'kit', 'sound.js')];
const bundle = parts.map(p => fs.readFileSync(p, 'utf8')).join('\n;\n').replace(/<\/script/gi, '<\\/script');
let html = fs.readFileSync(path.join(D, 'elevator.html'), 'utf8');
html = html.replace('<script id="film-src" src="film-bundle.js"></script>', '<script>\n' + bundle + '\n</script>');
fs.writeFileSync(path.join(D, 'the-longest-fall.html'), html);
console.log('wrote the-longest-fall.html', html.length);
