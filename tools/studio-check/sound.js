// Sound page: music start point, live levels, play the mix, Freesound (faked in the browser), blocked Freesound, folder pick without the folder picker (Brave).
const { chromium } = require('playwright'); const SP=process.argv[2]; const fs=require('fs');
const R=[]; const ok=(c,m)=>{R.push((c?'PASS ':'FAIL ')+m); if(!c) console.log('FAIL '+m)};
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:1366,height:720},permissions:['clipboard-read','clipboard-write']});
await ctx.addInitScript(()=>{ delete window.showDirectoryPicker; }); // like Brave
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
let fsMode='ok'; const wav=fs.readFileSync(SP+'/a.wav');
await p.route('https://freesound.org/**',r=>{ if(fsMode==='blocked') return r.abort(); if(fsMode==='badkey') return r.fulfill({status:401,body:'{}'});
  const q=new URL(r.request().url()).searchParams.get('query'); if(/zorbtron|glowing/.test(q)) return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:'{"results":[]}'}); return r.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({results:[{id:1,name:q+' one',username:'tester',duration:1,previews:{'preview-hq-mp3':'https://cdn.freesound.org/previews/1.wav'}},{id:2,name:q+' two',username:'tester',duration:1,previews:{'preview-hq-mp3':'https://cdn.freesound.org/previews/2.wav'}}]})})});
await p.route('https://cdn.freesound.org/**',r=>fsMode==='blocked'?r.abort():r.fulfill({status:200,contentType:'audio/wav',headers:{'access-control-allow-origin':'*'},body:wav}));
const clear=()=>p.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));
await p.goto('http://localhost:8125/');await p.waitForTimeout(700);await p.click('.newcard');await p.fill('.modal input','Sound test');await p.press('.modal input','Enter');await p.waitForTimeout(700);await p.click('text=Use Gilded');await p.waitForTimeout(600);
await p.fill('textarea',fs.readFileSync(SP+'/script-long.txt','utf8'));await p.setInputFiles('input[type=file]',SP+'/long.wav');await p.waitForTimeout(1200);await p.click('text=Listen and split into parts');await p.waitForSelector('.tl',{timeout:120000});
await p.click('.side .stage:has-text("Sound")');await p.waitForTimeout(800);
// music
await p.setInputFiles('.card input[type=file]',SP+'/a.wav');await p.waitForTimeout(1500);
ok(await p.locator('.songwave').count()===1,'song picture shown after adding music');
await p.waitForFunction(()=>/Song length/.test(document.body.innerText),null,{timeout:15000}).catch(()=>{});
ok(/Song length 0:22/.test(await p.locator('.card').innerText()),'song length read');
const box=await p.locator('.songwave').boundingBox();await p.mouse.click(box.x+box.width*.5,box.y+box.height/2);await p.waitForTimeout(2000);
const ms=await p.evaluate(()=>STORE.list().then(a=>a.filter(x=>x.name==='Sound test')[0].sound.musicStart));ok(ms>9&&ms<13,'click on the song sets where it starts ('+ms.toFixed(1)+' s)');
await p.click('button:has-text("Hear the song from here")');await p.waitForTimeout(600);ok(!(await p.locator('.toast.bad').count()),'hear the song from here plays');await p.click('.fieldgroup button:has-text("Stop")');
// play the mix, change volume live
await p.click('button:has-text("Play the mix")');await p.waitForFunction(()=>/Pause/.test(document.querySelector('.panel.short .btn.primary').innerText),null,{timeout:15000}).catch(()=>{});
ok(/Pause/.test(await p.locator('.panel.short .btn.primary').innerText()),'play the mix starts');
const t1=await p.evaluate(()=>SOUND.now());await p.waitForTimeout(1200);const t2=await p.evaluate(()=>SOUND.now());ok(t2>t1+.5,'mix time moves ('+t1.toFixed(1)+' to '+t2.toFixed(1)+')');
await p.locator('.card input[type=range]').nth(1).fill('0.8');await p.waitForTimeout(2000);
const t3=await p.evaluate(()=>SOUND.now());ok(t3>t2,'still playing after the volume changed');
{const mv=await p.evaluate(()=>STORE.list().then(a=>a.filter(x=>x.name==='Sound test')[0].sound.musicVol));const rv=await p.locator('.card input[type=range]').evaluateAll(l=>l.map(x=>x.value));ok(mv===0.8,'music volume saved ('+mv+') ranges '+rv.join(','));}
await p.locator('.panel.short input[type=range]').fill('30');await p.waitForTimeout(900);const t4=await p.evaluate(()=>SOUND.now());ok(t4>=29&&t4<33,'seek bar moves the mix ('+t4.toFixed(1)+' s)');
await p.click('.panel.short .btn.primary');await p.waitForTimeout(300);ok(/Play the mix/.test(await p.locator('.panel.short .btn.primary').innerText()),'pause works');
// effects
await p.click('.tabs button:has-text("Sound effects")');await p.waitForTimeout(400);
await p.click('button:has-text("Paste cues")');await p.fill('.modal textarea','{"cues":[{"time":1.0,"label":"Thermometer beeps","search":"thermometer beep"},{"time":8,"label":"Arm drops","search":"body fall"},{"time":15,"label":"Ice cracks","search":"ice crack"}]}');await p.click('.modal .btn.primary');await p.waitForTimeout(800);
ok((await p.locator('.card .pitem').count())===3,'3 cues pasted');
// no key, no folder: clear reason
await clear();await p.locator('.card .pitem').first().locator('button:has-text("Find")').click();await p.waitForTimeout(800);
ok(/No sound folder and no Freesound key/.test(await p.locator('.card .pitem').first().innerText()),'no source: the row says what to do');
// folder pick without the folder picker
ok(await p.locator('button:has-text("Pick sound folder")').count()===1,'folder button shown even without the folder picker (Brave)');
const [fc]=await Promise.all([p.waitForEvent('filechooser'),p.click('button:has-text("Pick sound folder")')]);await fc.setFiles(SP+'/sfxdir');await p.waitForTimeout(800);
ok(/1 sounds in your folder/.test(await p.locator('.card').innerText()),'folder read with a normal folder upload');
await p.waitForFunction(()=>[...document.querySelectorAll('.card .pitem')].some(r=>/Your folder: thermometer-beep.wav/.test(r.innerText)),null,{timeout:15000}).catch(()=>{});
ok(/Your folder: thermometer-beep.wav/.test(await p.locator('.card .pitem',{hasText:'Thermometer'}).innerText()),'after picking a folder, sounds are found by themselves (no button)');
// freesound blocked
await p.evaluate(()=>SOUND.setFsKey('testkey'));fsMode='blocked';await p.click('.tabs button:has-text("Background music")');await p.click('.tabs button:has-text("Sound effects")');await p.waitForTimeout(300);
await clear();await p.locator('.card .pitem',{hasText:'Ice cracks'}).locator('button:has-text("Find")').click();await p.waitForTimeout(1200);
ok(/Shields/.test(await p.locator('.card .pitem',{hasText:'Ice cracks'}).innerText()),'blocked Freesound: the row explains Brave Shields');
// freesound works
fsMode='ok';await clear();await p.click('button:has-text("Find sounds")');await p.waitForFunction(()=>[...document.querySelectorAll('.toast')].some(t=>/Found/.test(t.innerText)),null,{timeout:20000}).catch(()=>{});
ok(/Found a sound for all 2 cues/.test((await p.locator('.toast').allInnerTexts()).join('|')),'Find sounds: summary of what was found');
ok(/Freesound: ice crack one/.test(await p.locator('.card .pitem',{hasText:'Ice cracks'}).innerText()),'Freesound sound picked');
await p.locator('.card .pitem',{hasText:'Ice cracks'}).locator('button:has-text("Redo")').click();await p.waitForTimeout(1200);
ok(/ice crack two/.test(await p.locator('.card .pitem',{hasText:'Ice cracks'}).innerText()),'Redo gives the next sound');
await p.locator('.card .pitem',{hasText:'Ice cracks'}).locator('button[title="Hear it"]').click();await p.waitForTimeout(500);ok(!(await p.locator('.toast.bad').count()),'hear one effect');
// the key test in Settings
fsMode='badkey';await clear();await p.click('button:has-text("Settings")');await p.waitForTimeout(400);await p.click('.modal button:has-text("Test key")');await p.waitForTimeout(800);
ok(/did not accept the key/.test((await p.locator('.toast').allInnerTexts()).join('|')),'Test key: a wrong key is explained');
fsMode='ok';await clear();await p.click('.modal button:has-text("Test key")');await p.waitForTimeout(800);ok(/key works/.test((await p.locator('.toast').allInnerTexts()).join('|')),'Test key: a good key works');
await p.click('.modal .x');
// cues pasted with a key: sounds are found by themselves; a strange search falls back to a related sound
await clear();await p.click('button:has-text("Paste cues")');await p.fill('.modal textarea','{"cues":[{"time":20,"label":"Glowing zorbtron","search":"glowing zorbtron"}]}');await p.click('.modal .btn.primary');
await p.waitForFunction(()=>[...document.querySelectorAll('.card .pitem')].some(r=>/zorbtron/i.test(r.innerText)&&/related sound/.test(r.innerText)),null,{timeout:20000}).catch(()=>{});
ok(/related sound \(searched "impact"\)/.test(await p.locator('.card .pitem',{hasText:'zorbtron'}).innerText()),'pasted cue found automatically, with a related sound when the words find nothing');
// edit: new search words fetch a new sound
await p.locator('.card .pitem',{hasText:'zorbtron'}).locator('button:has-text("Edit")').click();await p.fill('.modal input >> nth=2','door slam');await p.click('.modal button:has-text("+0.1 s")');await p.click('.modal .btn.primary');await p.waitForTimeout(1500);
const ed=await p.locator('.card .pitem',{hasText:'zorbtron'}).innerText();ok(/door slam one/.test(ed)&&/0:20\.1/.test(ed),'Edit: time nudged and new search words give a new sound');
// listen choices
await p.click('.chip.toggle:has-text("Music")');await p.click('.chip.toggle:has-text("Effects")');await p.waitForTimeout(1800);
ok(await p.evaluate(()=>STORE.list().then(a=>{const L=a.filter(x=>x.name==='Sound test')[0].sound.listen;return L.voice&&!L.music&&!L.sfx})),'listen choices saved');
await p.click('.panel.short .btn.primary');await p.waitForTimeout(1500);ok(/Pause/.test(await p.locator('.panel.short .btn.primary').innerText()),'plays voice only');
await p.click('.chip.toggle:has-text("Voice")');await p.click('.chip.toggle:has-text("Effects")');await p.waitForTimeout(900);ok(await p.evaluate(()=>SOUND.now()!=null),'switching to effects only while playing keeps playing');
await p.click('.panel.short .btn.primary');await p.waitForTimeout(300);
await p.click('.chip.toggle:has-text("Effects")');await clear();await p.click('.panel.short .btn.primary');await p.waitForTimeout(800);ok(/all off/.test((await p.locator('.toast').allInnerTexts()).join('|')),'all three off: a clear message');
await p.click('.chip.toggle:has-text("Voice")');await p.click('.chip.toggle:has-text("Music")');await p.click('.chip.toggle:has-text("Effects")');
await p.locator('.card .pitem',{hasText:'Ice cracks'}).locator('button:has-text("In mix")').click();await p.waitForTimeout(1500);const im=await p.evaluate(()=>SOUND.now());ok(im>12.5&&im<16,'In mix plays from 2 s before the effect ('+(im||0).toFixed(1)+' s)');
await p.click('.panel.short .btn.primary');await p.screenshot({path:SP+'/snd-1.png'});
await p.click('.tabs button:has-text("Background music")');await p.waitForTimeout(500);await p.screenshot({path:SP+'/snd-2.png'});
ok(await p.evaluate(()=>{const m=document.querySelector('.main');return m.scrollHeight<=m.clientHeight+2}),'sound page fits the window');
console.log(R.join('\n'));console.log('PAGE ERRORS',JSON.stringify(errs.slice(0,6)));await b.close();})();
