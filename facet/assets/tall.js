function draw(F) {
  // ASSET: height line-up. Same `height` (= head size) for all; `stretch` makes the body longer, never the head.
  F.begin({ width: 1620, height: 1080, bg: '#c0612c', seed: 4 });
  const base = { ground: 1000, height: 600, skin: '#ece3d6', shoes: '#5a3124', arms: { L: [7, 2], R: [7, 2] } };
  F.groundShadow(330, 1000, 260); F.groundShadow(800, 1000, 260); F.groundShadow(1270, 1000, 260);
  F.person(Object.assign({}, base, { x: 330, build: 'adult', hair: { style: 'cap', colour: '#7a4231' }, beard: '#6e3a2b', glasses: '#5e3326',
    top: '#d3ccbd', vest: '#6c6052', tie: '#cc5321', bottom: { type: 'trousers', colour: '#4e5242' } }));          // normal (stretch 1)
  F.person(Object.assign({}, base, { x: 800, build: 'adult', stretch: 1.5, hair: { style: 'cap', colour: '#2e2220' },
    top: '#3c4660', bottom: { type: 'trousers', colour: '#b9a78a' } }));                                           // very tall
  F.person(Object.assign({}, base, { x: 1270, build: 'woman', stretch: 1.3, hair: { style: 'long', colour: '#c9a25e' },
    top: '#d3ccbd', bottom: { type: 'skirt', colour: '#6c6052' } }));                                              // tall woman
  return F.render('Height line-up: normal man, very tall man, tall woman');
}
