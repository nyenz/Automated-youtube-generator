// node styles/clean/build2.js -> styles/clean/clean-style-test-02.html (self-contained)
const fs = require('fs'), path = require('path'), D = __dirname, T = path.join(D, 'traced');
const b64 = f => 'data:image/jpeg;base64,' + fs.readFileSync(path.join(T, f)).toString('base64');
let html = fs.readFileSync(path.join(D, 'demo2.html'), 'utf8');
html = html.replace('__CAST__', fs.readFileSync(path.join(T, 'cast.svg'), 'utf8'))
  .replace('__PROPS__', fs.readFileSync(path.join(T, 'props.svg'), 'utf8'))
  .replace('__CASTREF__', b64('cast-ref.jpg')).replace('__PROPSREF__', b64('props-ref.jpg'));
fs.writeFileSync(path.join(D, 'clean-style-test-02.html'), html);
console.log('wrote clean-style-test-02.html', (html.length / 1048576).toFixed(2), 'MB');
