function draw(F) {
  // ASSET: woman holding a child on her hip.
  F.begin({ width: 1080, height: 1080, bg: '#c0612c', seed: 5 });
  F.groundShadow(520, 1000, 340);
  // mother: arms drawn later, so they wrap IN FRONT of the child
  const motherArms = F.person({ x: 500, ground: 1000, height: 900, build: 'woman', skin: '#ece3d6',
    hair: { style: 'long', colour: '#c9a25e' }, top: '#d3ccbd', bottom: { type: 'skirt', colour: '#4e5242' }, shoes: '#5a3124',
    arms: { L: [-2, -62], R: [30, -122] }, deferArms: true });
  // child sits on her right hip (viewer right): a person of 360 units tall, its crotch at her waist
  F.person({ x: 676, ground: 770, height: 430, build: 'child', skin: '#efe2d2', eyes: 'dots',
    hair: { style: 'tuft', colour: '#9a6a44' }, top: '#cc5321', bottom: { type: 'trousers', colour: '#3e3f42' }, shoes: '#e7e0d4',
    arms: { L: [-70, -50], R: [14, 6] } });
  motherArms();
  return F.render('Papercraft-style woman holding a child on her hip');
}
