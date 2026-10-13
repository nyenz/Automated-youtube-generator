// node codes.js -> prints {name: "KIT.asset(...)"} JSON
global.window = global; require('./assets.js');
const A = window.ICE_ASSETS, out = {};
Object.keys(A).forEach(n => out[n] = "KIT.asset('" + n + "', " + A[n].toString() + ");");
process.stdout.write(JSON.stringify(out));
