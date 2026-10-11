# trace every figure on a sheet into clean flat vector, one SVG for the whole sheet
import sys, numpy as np, cv2, potrace
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
K = int(sys.argv[3]) if len(sys.argv) > 3 else 14
MINH = int(sys.argv[4]) if len(sys.argv) > 4 else 90
SC = 4
full = np.asarray(Image.open(src).convert('RGB'))
H0, W0 = full.shape[:2]
bg = np.median(np.concatenate([full[5:30, 5:30].reshape(-1, 3), full[-30:-5, -30:-5].reshape(-1, 3)]), 0)
fgm = (np.abs(full.astype(int) - bg).sum(2) > 50).astype(np.uint8)
fgm = cv2.morphologyEx(fgm, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
n, lab, stats, _ = cv2.connectedComponentsWithStats(fgm)
boxes = [tuple(stats[i][:4]) for i in range(1, n) if stats[i][3] >= MINH and stats[i][2] >= 20]
def trace_box(x, y, w, h):
    pad = 6; x0, y0, x1, y1 = max(0, x - pad), max(0, y - pad), min(W0, x + w + pad), min(H0, y + h + pad)
    im = cv2.resize(full[y0:y1, x0:x1], None, fx=SC, fy=SC, interpolation=cv2.INTER_CUBIC)
    im = cv2.pyrMeanShiftFiltering(im, 10, 22)
    labc = cv2.cvtColor(im, cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(np.float32)
    _, l, cen = cv2.kmeans(labc, K, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, .5), 3, cv2.KMEANS_PP_CENTERS)
    hh, ww = im.shape[:2]; l = l.reshape(hh, ww)
    rgb = cv2.cvtColor(cen.reshape(1, -1, 3).astype(np.uint8), cv2.COLOR_LAB2RGB).reshape(-1, 3)
    for _ in range(2):
        oh = np.stack([cv2.blur((l == i).astype(np.float32), (9, 9)) for i in range(K)], 0); l = oh.argmax(0)
    bgl = np.argmin([np.abs(c.astype(int) - bg).sum() for c in rgb])
    near = cv2.blur((np.abs(cv2.resize(full[y0:y1, x0:x1], (ww, hh), interpolation=cv2.INTER_CUBIC).astype(int) - bg).sum(2) < 42).astype(np.float32), (7, 7)) > .5
    l[near] = bgl
    paths = []
    for i in range(K):
        if i == bgl: continue
        m = (l == i).astype(np.uint8)
        a = int(m.sum(dtype=np.int64))
        if a < 300: continue
        m = cv2.dilate(m, np.ones((3, 3), np.uint8))
        pl = potrace.Bitmap(~m.astype(bool)).trace(turdsize=50, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.1, opticurve=True, opttolerance=.4)
        d = []
        for c in pl:
            sp = c.start_point; d.append('M%.1f,%.1f' % (sp.x / SC + x0, sp.y / SC + y0))
            for s in c.segments:
                if s.is_corner: d.append('L%.1f,%.1f L%.1f,%.1f' % (s.c.x / SC + x0, s.c.y / SC + y0, s.end_point.x / SC + x0, s.end_point.y / SC + y0))
                else: d.append('C%.1f,%.1f %.1f,%.1f %.1f,%.1f' % (s.c1.x / SC + x0, s.c1.y / SC + y0, s.c2.x / SC + x0, s.c2.y / SC + y0, s.end_point.x / SC + x0, s.end_point.y / SC + y0))
            d.append('Z')
        paths.append((a, '#%02x%02x%02x' % tuple(rgb[i]), ''.join(d)))
    paths.sort(key=lambda p: -p[0])
    return ''.join('<path fill="%s" d="%s"/>' % (c, d) for _, c, d in paths)
body = ''.join('<g data-box="%d,%d,%d,%d">' % tuple(int(v) for v in b) + trace_box(*b) + '</g>' for b in boxes)
svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d"><rect width="100%%" height="100%%" fill="#AE9675"/>%s</svg>' % (W0, H0, body)
open(out, 'w').write(svg); print(out, len(boxes), 'figures', len(svg) // 1024, 'KB')
