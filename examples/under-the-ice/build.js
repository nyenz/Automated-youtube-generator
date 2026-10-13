// node build3.js out.html mode(play|export) res
const fs=require('fs'), R='/home/claude/automated-youtube-generator/';
global.window=global; require(R+'examples/demo3.js');
const D=window.DEMO3, W=JSON.parse(fs.readFileSync('/tmp/claude-0/pwt/ice/words.json','utf8'));
if(process.env.DEBUG){D.shots.I02=D.shots.I02.replace("camera: { framing: 'full', on: ['medic', 'boy'], side: 'front-right', angle: 'high', move: 'pull-out' }","camera: { framing: 'wide', side: 'front', angle: 'top', move: 'static' }")}
const shots=D.cuts.map(c=>({id:c[0],from_line:c[1],to_line:c[2]}));
const mode=process.argv[3]||'play', res=+(process.argv[4]||720);
const pl={mode:mode,standalone:true,aspect:'9:16',sky:'night',name:D.title,cut:{duration:22.4,words:W.words,lines:W.lines,shots:shots},captions:true,res:res,fps:24,
 sizes:{medic:3.1,doctor:3.1,nurse:3.05,therm:.5,clip:.5,mark:.3},look:{film:.8,atmos:.8,fg:true,focus:.8},mix:{narr:1,sfx:.9,music:.3,duck:true}};
const esc=s=>String(s).replace(/<\/script/gi,'<\\/script');
const block=(t,n,c)=>'<script type="text/x-'+t+'" data-name="'+n+'">\n'+esc(c)+'\n</script>';
const kit=['kit/style-kit.js','kit/director.js','kit/piano.js','kit/sound.js','kit/vendor/mp4-muxer.js','kit/vendor/webm-muxer.js','kit/stage.js'].map(f=>'<script>\n'+fs.readFileSync(R+f,'utf8')+'\n</script>').join('\n');
const audio=fs.readFileSync('/tmp/claude-0/pwt/ice/a22.wav').toString('base64');
const html='<!doctype html>\n<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+D.title+'</title></head>\n<body style="margin:0;background:#0d0b10"><div id="msg" style="color:#e9dfc8;font:14px sans-serif;padding:20px">Loading…</div>\n'+
Object.keys(D.assets).map(n=>block('asset',n,D.assets[n])).join('\n')+'\n'+D.cuts.map(c=>block('shot',c[0],D.shots[c[0]])).join('\n')+'\n'+
'<script>window.STAGE_PAYLOAD='+JSON.stringify(pl)+';STAGE_PAYLOAD.assets={};STAGE_PAYLOAD.shots={};[].forEach.call(document.querySelectorAll(\'script[type="text/x-asset"]\'),function(s){STAGE_PAYLOAD.assets[s.dataset.name]=s.textContent});[].forEach.call(document.querySelectorAll(\'script[type="text/x-shot"]\'),function(s){STAGE_PAYLOAD.shots[s.dataset.name]=s.textContent});'+
'var b=atob("'+audio+'"),u=new Uint8Array(b.length);for(var i=0;i<b.length;i++)u[i]=b.charCodeAt(i);STAGE_PAYLOAD.audio=new Blob([u],{type:"audio/wav"});'+
'window.LOG=[];window.STAGE_LISTENER=function(m){if(m.type!=="time")LOG.push(m);if(m.type==="exported")window.EXPORTED=m};</script>\n'+
'<script src="https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js"></script>\n'+kit+'\n</body></html>';
fs.writeFileSync(process.argv[2],html); console.log('wrote',process.argv[2],html.length);
