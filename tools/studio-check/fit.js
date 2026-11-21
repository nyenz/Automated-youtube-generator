// Little scrolling: every stage page must fit a 1366 x 720 window (long lists scroll inside their own box), and nothing may spill sideways on a 390 px phone.
const { chromium } = require('playwright'); const SP=process.argv[2]; const fs=require('fs');
const R=[]; const ok=(c,m)=>{R.push((c?'PASS ':'FAIL ')+m); if(!c) console.log('FAIL '+m)};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1366,height:720},permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const shot=n=>p.screenshot({path:SP+'/o-'+n+'.png'});
const clip=()=>p.evaluate(()=>navigator.clipboard.readText());const promptOf=t=>t.includes('</project_file>')?t.slice(t.indexOf('</project_file>')+15).trim():t;const clipP=async()=>{await p.waitForTimeout(1200);return promptOf(await p.evaluate(()=>navigator.clipboard.readText()))};const clipRaw=async()=>{await p.waitForTimeout(1200);return p.evaluate(()=>navigator.clipboard.readText())};

const clear=()=>p.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));
async function pasteIn(card,text){await clear();await p.locator('.jt-body .jt-row',{hasText:card}).locator('button:has-text("Paste reply"), button:has-text("Replace reply")').first().click();await p.fill('.modal textarea',text);await p.click('.modal .btn.primary');await p.waitForFunction(()=>!document.querySelector('.veil')||document.querySelector('.veil .rep'),null,{timeout:60000});await p.waitForTimeout(300)}
await p.goto('http://localhost:8125/');await p.waitForTimeout(700);await p.click('.newcard');await p.fill('.modal input','One');await p.press('.modal input','Enter');await p.waitForTimeout(700);await p.click('text=Use Gilded');await p.waitForTimeout(600);
await p.fill('textarea',fs.readFileSync(SP+'/script-long.txt','utf8'));await p.setInputFiles('input[type=file]',SP+'/long.wav');await p.waitForTimeout(1200);await p.click('text=Listen and split into parts');await p.waitForSelector('.tl',{timeout:120000});await p.waitForTimeout(500);
await p.addScriptTag({path:SP+'/fixtures.js'});
await p.click('.nextbar >> text=Next: Prompts');await p.waitForTimeout(800);
ok(/One prompt/.test(await p.locator('button:has-text("Mode:")').innerText()),'One prompt is the default');
await p.click('.tabs button:has-text("All")');await p.waitForTimeout(300);ok(await p.locator('.page').evaluate(e=>e.classList.contains('fit')),'prompts page fits the window (list scrolls inside)');
ok(await p.locator('.side .stage:has-text("Results")').count()===1,'stage 4 is called Results in one prompt mode');
await p.click('.jt-body .jt-row >> text=Copy prompt');const raw=await clipRaw();const pr=promptOf(raw);
ok(/^PROMPT P01 of P01 · PLAN · ONE PROMPT/.test(pr),'prompt starts with its number: '+pr.split('\n')[0]);
ok(/ONE ```json code block and NOTHING else/.test(pr)&&/"REPLY": "P01 plan"/.test(pr)&&/Never ask a question/.test(pr),'plan prompt forces code only, with its REPLY line');
ok(!/VERSION A/.test(pr),'no two-version text in one prompt mode');
const parts=await p.evaluate(()=>STORE.list().then(a=>AUDIO.plan(a[0]).parts.map(x=>({id:x.id}))));
await pasteIn('The plan',await p.evaluate(ps=>FIX.plan(ps,0),parts));if(await p.locator('.veil').count())await p.click('.modal .x');await p.waitForTimeout(300);
ok((await p.locator('.jt-body .jt-row').first().innerText()).includes('Done'),'a plan that passes is used straight away');
const titles=await p.locator('.jt-body .num').allInnerTexts();{const cnt={};const okN=titles.every(t=>{const L=t[0],n=+t.slice(1);cnt[L]=(cnt[L]||0)+1;return /^[PACS]\d\d$/.test(t)&&(L==='S'||n===cnt[L])});ok(okN&&titles[0]==='P01'&&titles.includes('A01')&&titles.includes('C01')&&titles.includes('S01'),'numbers start at 1 in each group (P, A, C, S): '+titles.join(' '));}
await p.locator('.jt-body .jt-row',{hasText:'Assets: crate'}).locator('text=Copy prompt').click();const ap=await clipP();
ok(/^PROMPT A01 of A\d\d · ASSETS/.test(ap)&&/\/\/ REPLY A01 assets-crate/.test(ap)&&/ONLY the ASSET/.test(ap),'asset prompt: number, REPLY line, only the asset');
await pasteIn('Assets: crate',await p.evaluate(()=>FIX.asset('crate','#C8402F')));if(await p.locator('.veil').count())await p.click('.modal .x');
await pasteIn('People: nurse',await p.evaluate(()=>FIX.cast('#2F7F7A')));if(await p.locator('.veil').count())await p.click('.modal .x');
ok((await p.locator('.jt-body .jt-row',{hasText:'People: nurse'}).innerText()).includes('Done'),'person passes and is used');
await p.locator('.jt-body .jt-row',{hasText:'Part 2:'}).locator('text=Copy prompt').click();const sp=await clipP();
ok(/· SCENE · PART 2 of \d+ · ONE PROMPT/.test(sp)&&/^PROMPT S02 of S\d\d · SCENE/.test(sp)&&/<!-- REPLY S02 scene-2 -->/.test(sp)&&/<script data-part="2">/.test(sp),'scene prompt names part 2 and its block');
// the mistake from the screenshot: part 1 code pasted into part 2, with chat around it
const fx=await p.evaluate(async()=>{const tpl=await (await fetch('styles/gilded-kasumi/project.html')).text();const P=(await STORE.list())[0];const plan=GK.plan(P);return plan.parts.map(pt=>FIX.scene(tpl,pt,P.timing.words,plan,1))});
await pasteIn('Part 2:','Here is part 1:\n'+fx[0]+'\nWHAT TO LOOK AT: watch 0 to 2 s.');
await shot('1-wrong-part');
const rep=await p.locator('.modal .rep').innerText();
ok(/NOT saved/.test(rep),'wrong part is refused');
ok(/part 1/i.test(rep)&&/part 2/i.test(rep),'the report says it is part 1 and this is part 2');
ok(await p.locator('.modal button:has-text("Save it in")').count()===1,'offers to save it in the right prompt');
await p.click('.modal button:has-text("Copy all details")');const det=await clip();ok(det.length>200&&/[PACS]\d\d/.test(det),'all details can be copied ('+det.length+' characters)');
await p.click('.modal button:has-text("Save it in")');for(let k=0;k<40;k++){if(await p.evaluate(()=>STORE.list().then(a=>!!a[0].jobs['scene-1'].A)))break;await p.waitForTimeout(500)}
ok(await p.evaluate(()=>STORE.list().then(a=>!!a[0].jobs['scene-1'].A)),'moved reply saved in part 1');
// cut-off reply gives a fix message
await pasteIn('Part 2:',fx[1].slice(0,Math.floor(fx[1].length*.6)));
const rep2=await p.locator('.modal .rep').innerText();ok(/NOT saved|needs a fix/.test(rep2)&&/(cut off|not closed|incomplete|ends)/i.test(rep2),'a cut-off reply is explained');
await p.click('.modal .x');await p.waitForTimeout(300);
for(let i=1;i<fx.length;i++){await pasteIn('Part '+(i+1)+':',fx[i]);if(await p.locator('.veil').count())await p.click('.modal .x');}
ok(await p.evaluate(()=>STORE.list().then(a=>JOBS.list(a[0]).every(j=>j.A))),'every job has its one reply');
const open=await p.evaluate(()=>STORE.list().then(a=>JOBS.list(a[0]).filter(j=>!JOBS.picked(j)).map(j=>j.id)));
for(const id of open){await p.goto('http://localhost:8125/#'+(await p.evaluate(()=>STORE.list().then(a=>a[0].id)))+'/pick/'+id);await p.waitForTimeout(900);await p.click('.panel button:has-text("Use this reply")');await p.waitForTimeout(500)}
ok(await p.evaluate(()=>STORE.list().then(a=>JOBS.list(a[0]).every(j=>JOBS.picked(j)))),'every job in use ('+open.length+' through "Use this reply")');

await p.evaluate(()=>document.querySelectorAll('.toasts').forEach(t=>t.remove()));
const M=async n=>{await p.waitForTimeout(1200);const r=await p.evaluate(()=>{const m=document.querySelector('.main');return [m.scrollHeight,m.clientHeight]});ok(r[0]<=r[1]+2,'page fits 1366x720 without scrolling: '+n+' ('+r[0]+' / '+r[1]+')');await p.screenshot({path:SP+'/m-'+n+'.png'})};
for(const [n,st] of [['style','Style'],['audio','Script'],['prompts','Prompts'],['results','Results'],['sound','Sound'],['thumbs','Thumbnails'],['export','Watch']]){await p.click('.side .stage:has-text("'+st+'")');await M(n)}
await p.click('.side .stage:has-text("Sound")');await p.click('.tabs button:has-text("Sound effects")');await M('sound-sfx');
await p.click('.side .stage:has-text("Script")');await p.click('.tabs button:has-text("Script & audio")');await M('audio-inputs');
await p.click('.side .stage:has-text("Results")');await p.click('.tabs button:has-text("All")');await p.locator('.jt-body .jt-row',{hasText:'Part 1'}).click();await M('result-scene');
await p.click('.tabs button:has-text("Problems")').catch(()=>{});await M('result-probs');
await p.click('.side .stage:has-text("Results")');await p.locator('.jt-body .jt-row',{hasText:'Assets'}).first().click();await M('result-asset');
await p.click('.side .stage:has-text("Results")');await p.locator('.jt-body .jt-row',{hasText:'The plan'}).first().click();await M('result-plan');
await p.click('.side .stage:has-text("Thumbnails")');await p.waitForTimeout(500);await p.click('button:has-text("Paste designs")');await p.fill('.modal textarea','{"thumbnails":[{"name":"A","idea":"one line idea here","subject":"x","text":"2 HOURS","text_place":"top"},{"name":"B","idea":"one line","subject":"y","text":"7°C"},{"name":"C","idea":"one line","subject":"z","text":""}]}');await p.click('.modal .btn.primary');await M('thumbs-3');
await p.goto('http://localhost:8125/');await M('home');
// phone: nothing may spill sideways
const pid=await p.evaluate(()=>STORE.list().then(a=>a[0].id));await p.setViewportSize({width:390,height:844});
for(const r of ['style','audio','prompts','pick','sound','thumbs','export','pick/scene-1']){await p.goto('http://localhost:8125/#/'+pid+'/'+r);await p.waitForTimeout(900);ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&[...document.querySelectorAll('.page *')].every(e=>e.getBoundingClientRect().right<=innerWidth+1||e.closest('.scrollbox,.scroller,.tabs,.side,.jt-body,.chips'))),'phone 390 px, nothing spills sideways: '+r)}
await p.screenshot({path:SP+'/m-phone.png'});
console.log(R.join('\n'));await b.close();})();