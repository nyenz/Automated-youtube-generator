import sys, numpy as np, cv2, potrace
from PIL import Image
src,x,y,w,h,K,out=sys.argv[1],*map(int,sys.argv[2:6]),int(sys.argv[6]),sys.argv[7]
SC=6
full=np.asarray(Image.open(src).convert('RGB'))
bg=np.median(np.concatenate([full[5:30,5:30].reshape(-1,3),full[-30:-5,-30:-5].reshape(-1,3)]),0)
pad=6;x0,y0,x1,y1=x-pad,y-pad,x+w+pad,y+h+pad
crop=full[y0:y1,x0:x1]
im=cv2.resize(crop,None,fx=SC,fy=SC,interpolation=cv2.INTER_LANCZOS4)
im=cv2.bilateralFilter(im,9,40,9)
im=cv2.pyrMeanShiftFiltering(im,14,30)
labc=cv2.cvtColor(im,cv2.COLOR_RGB2LAB).reshape(-1,3).astype(np.float32)
_,l,cen=cv2.kmeans(labc,K,None,(cv2.TERM_CRITERIA_EPS+cv2.TERM_CRITERIA_MAX_ITER,40,.3),4,cv2.KMEANS_PP_CENTERS)
hh,ww=im.shape[:2];l=l.reshape(hh,ww)
rgb=cv2.cvtColor(cen.reshape(1,-1,3).astype(np.uint8),cv2.COLOR_LAB2RGB).reshape(-1,3)
for _ in range(3):
    oh=np.stack([cv2.GaussianBlur((l==i).astype(np.float32),(0,0),5) for i in range(K)],0);l=oh.argmax(0)
bgl=np.argmin([np.abs(c.astype(int)-bg).sum() for c in rgb])
near=cv2.GaussianBlur((np.abs(cv2.resize(crop,(ww,hh),interpolation=cv2.INTER_CUBIC).astype(int)-bg).sum(2)<42).astype(np.float32),(0,0),4)>.5
l[near]=bgl
paths=[]
for i in range(K):
    if i==bgl: continue
    m=(l==i).astype(np.uint8);a=int(m.sum(dtype=np.int64))
    if a<500: continue
    m=cv2.dilate(m,np.ones((3,3),np.uint8))
    pl=potrace.Bitmap(~m.astype(bool)).trace(turdsize=120,turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,alphamax=1.15,opticurve=True,opttolerance=.5)
    d=[]
    for c in pl:
        sp=c.start_point;d.append('M%.2f,%.2f'%(sp.x/SC+x0,sp.y/SC+y0))
        for s in c.segments:
            if s.is_corner: d.append('L%.2f,%.2f L%.2f,%.2f'%(s.c.x/SC+x0,s.c.y/SC+y0,s.end_point.x/SC+x0,s.end_point.y/SC+y0))
            else: d.append('C%.2f,%.2f %.2f,%.2f %.2f,%.2f'%(s.c1.x/SC+x0,s.c1.y/SC+y0,s.c2.x/SC+x0,s.c2.y/SC+y0,s.end_point.x/SC+x0,s.end_point.y/SC+y0))
        d.append('Z')
    paths.append((a,'#%02x%02x%02x'%tuple(rgb[i]),''.join(d)))
paths.sort(key=lambda p:-p[0])
g=''.join('<path fill="%s" d="%s"/>'%(c,d) for _,c,d in paths)
open(out,'w').write(g);print(out,[p[1] for p in paths])
