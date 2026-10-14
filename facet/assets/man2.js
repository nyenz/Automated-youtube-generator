function draw(F) {
  // ASSET: bearded man in glasses — everything comes from F.person, so the proportions are the house ones.
  F.begin({ width: 1080, height: 1080, bg: '#c0612c', seed: 3 });
  F.groundShadow(540, 1000, 360);
  F.person({ x: 540, ground: 1000, height: 900, build: 'adult', skin: '#ece3d6',
    hair: { style: 'cap', colour: '#7a4231' }, beard: '#6e3a2b', glasses: '#5e3326',
    top: '#d3ccbd', vest: '#6c6052', tie: '#cc5321', bottom: { type: 'trousers', colour: '#4e5242' }, shoes: '#5a3124',
    arms: { L: [7, 2], R: [7, 2] } });
  return F.render('Papercraft-style bearded man');
}
