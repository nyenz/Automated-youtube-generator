function draw(F) {
  // ASSET: sitting fox — proves the same rules work for animals/objects. Canvas 1080 x 1080.
  F.begin({ width: 1080, height: 1080, bg: '#c0612c', seed: 9 });
  const FUR = '#e0762c', WHITE = '#efe6da', DARK = '#3a2418';
  F.groundShadow(540, 960, 420);
  // tail: big curved wedge wrapping the feet, white tip
  F.part([[640,940],[760,900],[830,820],[840,740],[800,700],[780,780],[720,870],[620,900]], FUR, { ridge: [[650,920],[770,850],[815,740]], contrast: .3 });
  F.part([[800,700],[840,740],[848,690],[826,660]], WHITE, { contrast: .2, step: 30 });
  // body: a tall pear, ridge left of centre
  F.part([[470,520],[600,520],[650,640],[680,800],[660,940],[420,940],[400,800],[420,640]], FUR, { ridge: [[520,530],[500,930]], contrast: .3 });
  F.part([[490,560],[580,560],[600,700],[560,820],[520,820],[480,700]], WHITE, { ridge: [[525,570],[520,810]], contrast: .2 });   // chest bib
  // front legs: straight columns with dark socks (exaggerated thin legs, big body)
  [[452,500],[548,596]].forEach(([a, b]) => {
    F.part([[a,780],[b,780],[b - 4,900],[a + 4,900]], FUR, { ridge: [[a + 14,785],[a + 16,895]], contrast: .28 });
    F.part([[a + 4,900],[b - 4,900],[b,950],[a,950]], DARK, { contrast: .25, step: 30 });
  });
  // head: a wedge pointing at the viewer, big triangle ears
  F.part([[410,330],[470,300],[600,300],[660,330],[640,420],[580,480],[536,520],[490,480],[430,420]], FUR, { ridge: [[480,320],[530,510]], contrast: .3 });
  F.part([[460,430],[535,450],[610,430],[580,480],[536,520],[490,480]], WHITE, { ridge: [[520,450],[534,515]], contrast: .2, step: 40 });   // white muzzle
  F.part([[420,330],[440,190],[500,300]], FUR, { ridge: [[440,200]], contrast: .3, step: 40 });
  F.part([[440,300],[448,230],[482,300]], DARK, { contrast: .2, step: 30 });
  F.part([[650,330],[630,190],[570,300]], FUR, { ridge: [[628,200]], contrast: .3, step: 40 });
  F.part([[630,300],[622,230],[588,300]], DARK, { contrast: .2, step: 30 });
  F.part([[520,500],[552,500],[548,522],[524,522]], DARK, { contrast: .15, step: 20 });   // nose
  F.flat([[478,392],[500,384],[508,398],[486,404]], DARK); F.flat([[562,398],[570,384],[592,392],[584,404]], DARK);   // narrow eyes
  return F.render('Papercraft-style sitting fox');
}
