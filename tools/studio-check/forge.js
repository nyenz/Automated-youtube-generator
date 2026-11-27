// Code-made sound effects (studio/forge.js, rules in docs/SOUND-GUIDE.md):
// every recipe at every control end, several takes and with each layer off must pass all number checks; words find the right sound;
// the Code sounds window (hear, shape, layers, takes, checks) and "Use for this effect"; the code sound goes into the mix; fits 1366 x 720 and a phone.
const { chromium } = require('playwright'); const SP=process.argv[2]; const fs=require('fs');
const R=[]; const ok=(c,m)=>{R.push((c?'PASS ':'FAIL ')+m); if(!c) console.log('FAIL '+m)};
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:1366,height:720},permissions:['clipboard-read','clipboard-write']});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const clear=()=>p.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));
await p.goto('http://localhost:8125/');await p.waitForTimeout(700);

// ---------- the engine ----------
const eng=await p.evaluate(async()=>{
  const out={fails:[],n:0,layers:[],det:true,takes:true,count:0};
  const sets=[{}];for(const k of ['size','distance','bright','room'])for(const v of [0,1])sets.push({[k]:v});sets.push({length:.5},{length:2},{size:1,distance:.9,length:2,bright:1,room:1},{size:0,distance:0,length:.5,bright:0,room:0});
  for(const t of [2,3,4])sets.push({take:t});
  for(const rc of FORGE.list()){
    out.count++; if(rc.layers.length>5) out.layers.push(rc.name);
    for(const L of rc.layers.length>1?rc.layers:[]){const buf=await FORGE.render(rc.name,{mute:[L.name]});const m=FORGE.measure(buf);if(!(m.peakDb<=-.9&&m.rmsDb>-80))out.fails.push(rc.name+' without '+L.name+' does not render')}
    const list=sets;
    for(const pr of list){out.n++;const buf=await FORGE.render(rc.name,pr);const c=FORGE.check(buf,rc.name,pr);if(!c.pass)out.fails.push(rc.name+' '+JSON.stringify(pr)+': '+c.lines.filter(l=>!l.ok).map(l=>l.label+' = '+l.val).join('; '))}
    const a=await FORGE.render(rc.name,{take:1}),a2=await FORGE.render(rc.name,{take:1}),c2=await FORGE.render(rc.name,{take:2});
    const d=(x,y)=>{const X=x.getChannelData(0),Y=y.getChannelData(0);let s=0;const n=Math.min(X.length,Y.length);for(let i=0;i<n;i++)s+=Math.abs(X[i]-Y[i]);return s/n};
    if(d(a,a2)>1e-7) out.det=false; if(['beep','click','heartbeat','siren','riser'].indexOf(rc.name)<0 && d(a,c2)<1e-4) out.takes=false;
  }
  // WAV file: right header, and the browser can read it back
  const buf=await FORGE.render('explosion',{});const w=FORGE.wav(buf);const ab=await w.arrayBuffer();const hd=new TextDecoder().decode(new Uint8Array(ab.slice(0,4)))+new TextDecoder().decode(new Uint8Array(ab.slice(8,12)));
  const back=await new OfflineAudioContext(2,48000,48000).decodeAudioData(ab.slice(0));
  out.wav=hd==='RIFFWAVE'&&Math.abs(back.duration-buf.duration)<.01&&back.numberOfChannels===2;
  return out});
ok(eng.count>=19,'19 code sounds exist ('+eng.count+')');
ok(!eng.layers.length,'every sound has at most 5 layers '+eng.layers.join(','));
ok(!eng.fails.length,'all '+eng.n+' renders pass every check (each control at both ends, 4 takes); each layer can be turned off'+(eng.fails.length?': '+eng.fails.slice(0,4).join(' | '):''));
ok(eng.det,'the same take always gives exactly the same sound (preview = MP4)');
ok(eng.takes,'another take gives a different variation');
ok(eng.wav,'the WAV file is valid and reads back at the same length, in stereo');
// physics: far is duller, bigger is lower
const phy=await p.evaluate(async()=>{const m=async(n,pr)=>FORGE.measure(await FORGE.render(n,pr));
  return {farDull:(await m('explosion',{distance:.9})).highs<(await m('explosion',{distance:0})).highs*.7, bigLow:(await m('impact',{size:1})).bright<(await m('impact',{size:0})).bright, bigLong:(await m('impact',{size:1})).length>(await m('impact',{size:0})).length, brightUp:(await m('footsteps',{bright:1})).bright>(await m('footsteps',{bright:0})).bright, longer:(await m('wind',{length:2})).length>(await m('wind',{length:.5})).length}});
ok(phy.farDull,'physics: a far explosion has far fewer highs than a close one');ok(phy.bigLow&&phy.bigLong,'physics: a bigger impact is lower and longer');ok(phy.brightUp,'Brightness adds crunch to footsteps');ok(phy.longer,'Length makes wind longer');
// words find the right sound and set the controls
const words=await p.evaluate(()=>{const t=[['distant explosion','explosion',m=>m.p.distance>=.7],['car door','door'],['car engine start','engine'],['footsteps snow','footsteps',m=>m.p.bright>=.8],['body fall','thud'],['deep boom impact sub','impact',m=>m.p.size>=.85],['heartbeat','heartbeat'],['thermometer beep','beep',m=>m.p.count===3],['ice crack','ice'],['water splash','splash'],['ambulance siren distant','siren',m=>m.p.distance>=.7],['cold wind','wind'],['whoosh swish transition','whoosh'],['breath gasp','breath'],['ocean waves','waves'],['page turn','paper'],['bell chime','ding'],['button click','click'],['tension riser','riser'],['soft hit thud','thud'],['glowing zorbtron',null]];
  return t.map(([q,want,f])=>{const m=FORGE.match(q);const got=m?m.name:null;return {q,ok:got===want&&(!f||f(m)),got}})});
const wbad=words.filter(w=>!w.ok);ok(!wbad.length,'search words find the right code sound ('+words.length+' checked)'+(wbad.length?': '+wbad.map(w=>w.q+' -> '+w.got).join(', '):''));
ok(await p.evaluate(()=>['whoosh swish transition','impact hit boom cinematic','deep boom impact sub','soft hit thud','heartbeat','ice crack','water splash','ambulance siren distant','cold wind','click beep','car door','car engine start','footsteps snow','breath gasp'].every(q=>FORGE.match(q))),'every automatic cue word list of the app has a code sound');

// ---------- the app ----------
await p.click('.newcard');await p.fill('.modal input','Forge test');await p.press('.modal input','Enter');await p.waitForTimeout(700);await p.click('text=Use Gilded');await p.waitForTimeout(600);
await p.fill('textarea',fs.readFileSync(SP+'/script-long.txt','utf8'));await p.setInputFiles('input[type=file]',SP+'/long.wav');await p.waitForTimeout(1200);await p.click('text=Listen and split into parts');await p.waitForSelector('.tl',{timeout:120000});
await p.click('.side .stage:has-text("Sound")');await p.waitForTimeout(800);
await p.click('.tabs button:has-text("Sound effects")');await p.waitForTimeout(400);
await p.click('button:has-text("Sonnet prompt")');await p.waitForTimeout(700);const sp=await p.evaluate(()=>navigator.clipboard.readText());
ok(/made by code and always available/.test(sp)&&/explosion \(a real blast/.test(sp),'the Sonnet sound prompt lists the code sounds');
// the window on its own
await p.click('button:has-text("Code sounds")');await p.waitForSelector('.fl');await p.waitForFunction(()=>/Passes all/.test(document.querySelector('.fl').innerText),null,{timeout:15000}).catch(()=>{});
ok(await p.locator('.fl-item').count()===eng.count,'the window lists every code sound');
ok(/Passes all 9 checks/.test(await p.locator('.fl').innerText()),'the checks show live: '+(await p.locator('.fl-status').innerText()));
await p.click('.fl-item:has-text("Explosion")');await p.waitForFunction(()=>/Explosion/.test(document.querySelector('.fl-head h4').innerText)&&/Passes all/.test(document.querySelector('.fl-status').innerText),null,{timeout:15000}).catch(()=>{});
ok((await p.locator('.fl-layer').count())===5&&/crack/.test(await p.locator('.fl-layer').first().innerText()),'explosion shows its 5 layers with their jobs');
const d1=await p.locator('.fl-status').innerText();
await p.locator('.fl-row input[type=range]').first().fill('1');await p.waitForTimeout(1500);const d2=await p.locator('.fl-status').innerText();
ok(d1!==d2&&/Passes all/.test(d2),'Size changes the sound and it still passes ('+d1+' -> '+d2+')');
await p.locator('.fl-layer').nth(3).click();await p.waitForTimeout(900);ok((await p.locator('.fl-layer.on').count())===4,'a layer can be turned off');
for(let i=0;i<5;i++){await p.locator('.fl-layer.on').first().click();await p.waitForTimeout(150)}
ok((await p.locator('.fl-layer.on').count())===1,'at least one layer always stays on');
await p.click('button[aria-label="Next take"]');await p.waitForTimeout(600);ok(/Take 2/.test(await p.locator('.fl-take').innerText()),'next take');
await clear();await p.click('.fl-head .btn.primary');await p.waitForTimeout(400);ok(/Stop/.test(await p.locator('.fl-head .btn.primary').innerText())&&!(await p.locator('.toast.bad').count()),'Play plays the sound');
await p.click('.fl-head .btn.primary');ok(/Play/.test(await p.locator('.fl-head .btn.primary').innerText()),'Stop stops it');
const mb=await p.locator('.modal').boundingBox();ok(mb.y>=0&&mb.y+mb.height<=720,'the window fits 1366 x 720 ('+Math.round(mb.height)+' px)');
await p.screenshot({path:SP+'/forge-1.png'});
await p.keyboard.press('Escape');await p.waitForTimeout(300);ok(!(await p.locator('.fl').count()),'Escape closes the window');
// shape a cue
await p.click('button:has-text("Paste cues")');await p.fill('.modal textarea','{"cues":[{"time":4,"label":"House explodes","search":"distant explosion"}]}');await p.click('.modal .btn.primary');
await p.waitForFunction(()=>[...document.querySelectorAll('.card .pitem')].some(r=>/Explosion \(made by code, take 1\)/.test(r.innerText)),null,{timeout:20000}).catch(()=>{});
ok(/Explosion \(made by code, take 1\)/.test(await p.locator('.card .pitem',{hasText:'House explodes'}).innerText()),'a pasted cue gets a code-made explosion by itself');
const before=await p.evaluate(()=>STORE.list().then(a=>{const P=a.filter(x=>x.name==='Forge test')[0];const c=P.sound.cues[0];return STORE.getBlob(P.id+':sfx:'+c.id).then(b=>({size:b.size,dist:c.code.p.distance}))}));
ok(before.size>1000&&before.dist>=.7,'the sound is saved in the project as a WAV, and "distant" set Distance ('+before.dist+')');
await p.locator('.card .pitem',{hasText:'House explodes'}).locator('button:has-text("Shape")').click();await p.waitForSelector('.fl');await p.waitForTimeout(1200);
ok(/Shape the sound at 0:04/.test(await p.locator('.modal h3').innerText())&&/Explosion/.test(await p.locator('.fl-head h4').innerText()),'Shape opens the window on this cue\'s sound');
ok(Math.abs(+(await p.locator('.fl-row input[type=range]').nth(1).inputValue())-before.dist)<.01,'the window starts from the cue\'s own settings');
await p.locator('.fl-row input[type=range]').nth(0).fill('0.9');await p.click('button[aria-label="Next take"]');await p.waitForTimeout(1500);
await p.click('.modal button:has-text("Use for this effect")');await p.waitForTimeout(1500);
const after=await p.evaluate(()=>STORE.list().then(a=>{const P=a.filter(x=>x.name==='Forge test')[0];const c=P.sound.cues[0];return STORE.getBlob(P.id+':sfx:'+c.id).then(b=>({size:b.size,take:c.code.p.take,s:c.code.p.size,name:c.pickName}))}));
ok(after.take===2&&Math.abs(after.s-.9)<.01&&after.size!==before.size&&/take 2/.test(await p.locator('.card .pitem',{hasText:'House explodes'}).innerText()),'Use for this effect keeps the new sound and its settings ('+after.name+')');
// into the mix (the same path the MP4 uses)
const mix=await p.evaluate(()=>STORE.list().then(a=>{const P=a.filter(x=>x.name==='Forge test')[0];const c=P.sound.cues[0];return STORE.getBlob(P.id+':sfx:'+c.id).then(blob=>SOUND.mix(P,8,{narr:null,music:null,sfx:{[c.id]:blob}})).then(buf=>{const d=buf.getChannelData(0);let pre=0,post=0;for(let i=0;i<4*48000;i++)pre=Math.max(pre,Math.abs(d[i]));for(let i=4*48000;i<d.length;i++)post=Math.max(post,Math.abs(d[i]));return {pre,post}})}));
ok(mix.pre<.01&&mix.post>.1,'the code sound plays at its cue time in the mix (silent before 4 s, loud after)');
ok(/take 2/.test(await p.locator('.card .pitem',{hasText:'House explodes'}).innerText()),'still there after the mix');
await p.reload();await p.waitForTimeout(1200);await p.click('.side .stage:has-text("Sound")').catch(()=>{});await p.waitForTimeout(600);await p.click('.tabs button:has-text("Sound effects")').catch(()=>{});await p.waitForTimeout(400);
ok(/Explosion \(made by code, take 2\)/.test(await p.locator('.card').innerText()),'kept after closing and opening the app');
ok(await p.evaluate(()=>{const m=document.querySelector('.main');return m.scrollHeight<=m.clientHeight+2}),'sound page still fits the window');
// phone
await p.setViewportSize({width:390,height:780});await p.waitForTimeout(400);await p.click('button:has-text("Code sounds")');await p.waitForSelector('.fl');await p.waitForTimeout(1200);
ok(await p.evaluate(()=>{const m=document.querySelector('.modal');return m.scrollWidth<=m.clientWidth+2&&document.documentElement.scrollWidth<=392}),'phone: the window has no sideways spill');
await p.screenshot({path:SP+'/forge-2-phone.png'});
ok(!errs.length,'no page errors '+errs.join(' | '));
console.log(R.join('\n'));await b.close()})();
