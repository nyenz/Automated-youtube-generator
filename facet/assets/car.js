function draw(F) {
  // ASSET: small car, side view, facing right. Exaggerations: huge wheels, giant bubble cabin, stubby body, tiny overhangs.
  F.begin({ width: 1080, height: 1080, bg: '#c0612c', seed: 12 });
  const BODY = '#3f6f73', GLASS = '#e6ded1', TYRE = '#2e2622', HUB = '#d3ccbd', TRIM = '#d3ccbd', LIGHT = '#f0d9a8', TAIL = '#cc5321';
  F.groundShadow(560, 905, 820);
  // cabin: a bubble almost as tall as the body below it
  F.part([[290,650],[345,480],[420,428],[690,424],[770,462],[860,650]], F.shade(BODY, .04), { ridge: [[400,440],[380,640]], contrast: .24, step: 90 });
  // windows: pale opaque glass, darker strip at the bottom (same trick as the glasses)
  F.flat([[338,640],[384,500],[430,470],[548,468],[548,640]], GLASS);
  F.flat([[566,640],[566,468],[684,466],[738,494],[800,640]], GLASS);
  F.flat([[338,620],[548,620],[548,640],[338,640]], F.shade(GLASS, -.12)); F.flat([[566,620],[808,620],[800,640],[566,640]], F.shade(GLASS, -.12));
  // body: short and fat, rounded corners
  F.part([[165,790],[168,700],[200,660],[260,642],[880,640],[935,668],[952,720],[948,790]], BODY, { ridge: [[260,655],[250,785]], contrast: .26, step: 100 });
  F.flat([[555,648],[563,648],[563,780],[555,780]], F.shade(BODY, -.25));                      // door line
  F.flat([[590,676],[628,676],[628,686],[590,686]], F.shade(BODY, .25));                        // door handle
  F.flat([[180,722],[940,722],[940,730],[180,730]], F.shade(BODY, -.15));                        // body crease
  // bumpers and lights
  F.part([[930,752],[962,752],[966,792],[926,794]], TRIM, { contrast: .16, step: 30 });
  F.part([[150,752],[182,752],[184,794],[146,792]], TRIM, { contrast: .16, step: 30 });
  F.part(F.disc(920, 694, 20, 22, 8), LIGHT, { contrast: .14, step: 20 });
  F.part([[168,682],[186,680],[186,712],[168,714]], TAIL, { contrast: .16, step: 20 });
  // wheel arches (dark), then oversized wheels in front of the body
  [[330, 800], [770, 800]].forEach(([x, y]) => {
    F.flat(F.disc(x, y - 6, 116, 112, 12), F.shade(BODY, -.45));
    F.part(F.disc(x, y, 104, 104, 10), TYRE, { ridge: [[x - 40, y - 40]], contrast: .22, step: 60 });
    F.part(F.disc(x, y, 46, 46, 8), HUB, { ridge: [[x - 14, y - 14]], contrast: .2, step: 30 });
    F.flat(F.disc(x, y, 12, 12, 6), F.shade(HUB, -.3));
  });
  return F.render('Papercraft-style small car with huge wheels');
}
