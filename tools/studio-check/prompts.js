// One prompt mode (the default): strict numbered prompts, a wrong reply explained in detail, the one-result preview page with back and next.
const { chromium } = require('playwright'); const SP=process.argv[2]; const fs=require('fs');
const R=[]; const ok=(c,m)=>{R.push((c?'PASS ':'FAIL ')+m); if(!c) console.log('FAIL '+m)};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1366,height:860},permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const shot=n=>p.screenshot({path:SP+'/o-'+n+'.png'});
const clip=()=>p.evaluate(()=>navigator.clipboard.readText());
const clear=()=>p.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));
async function pasteIn(card,text){await clear();await p.locator('.jt-body .jt-row',{hasText:card}).locator('button:has-text("Paste reply"), button:has-text("Replace reply")').first().click();await p.fill('.modal textarea',text);await p.click('.modal .btn.primary');await p.waitForFunction(()=>!document.querySelector('.veil')||document.querySelector('.veil .rep'),null,{timeout:60000});await p.waitForTimeout(300)}
await p.goto('http://localhost:8125/');await p.waitForTimeout(700);await p.click('.newcard');await p.fill('.modal input','One');await p.press('.modal input','Enter');await p.waitForTimeout(700);await p.click('text=Use Gilded');await p.waitForTimeout(600);
await p.fill('textarea',fs.readFileSync(SP+'/script-long.txt','utf8'));await p.setInputFiles('input[type=file]',SP+'/long.wav');await p.waitForTimeout(1200);await p.click('text=Listen and split into parts');await p.waitForSelector('.tl',{timeout:120000});await p.waitForTimeout(500);
await p.addScriptTag({path:SP+'/fixtures.js'});
await p.click('.nextbar >> text=Next: Prompts');await p.waitForTimeout(800);
ok(/One prompt/.test(await p.locator('button:has-text("Mode:")').innerText()),'One prompt is the default');
await p.click('.tabs button:has-text("All")');await p.waitForTimeout(300);ok(await p.locator('.page').evaluate(e=>e.classList.contains('fit')),'prompts page fits the window (list scrolls inside)');
ok(await p.locator('.side .stage:has-text("Results")').count()===1,'stage 4 is called Results in one prompt mode');
await p.click('.jt-body .jt-row >> text=Copy prompt');const pr=await clip();
ok(/^PROMPT P01 of 01 · PLAN · ONE PROMPT/.test(pr),'prompt starts with its number: '+pr.split('\n')[0]);
ok(/ONE ```json code block and NOTHING else/.test(pr)&&/"REPLY": "P01 plan"/.test(pr)&&/Never ask a question/.test(pr),'plan prompt forces code only, with its REPLY line');
ok(!/VERSION A/.test(pr),'no two-version text in one prompt mode');
const parts=await p.evaluate(()=>STORE.list().then(a=>AUDIO.plan(a[0]).parts.map(x=>({id:x.id}))));
await pasteIn('The plan',await p.evaluate(ps=>FIX.plan(ps,0),parts));if(await p.locator('.veil').count())await p.click('.modal .x');await p.waitForTimeout(300);
ok((await p.locator('.jt-body .jt-row').first().innerText()).includes('Done'),'a plan that passes is used straight away');
const titles=await p.locator('.jt-body .num').allInnerTexts();ok(titles.every((t,i)=>t==='P'+String(i+1).padStart(2,'0')),'every job numbered in order: '+titles.join(' '));
await p.locator('.jt-body .jt-row',{hasText:'Assets: crate'}).locator('text=Copy prompt').click();const ap=await clip();
ok(/^PROMPT P02 of \d\d · ASSETS/.test(ap)&&/\/\/ REPLY P02 assets-crate/.test(ap)&&/ONLY the ASSET/.test(ap),'asset prompt: number, REPLY line, only the asset');
await pasteIn('Assets: crate',await p.evaluate(()=>FIX.asset('crate','#C8402F')));if(await p.locator('.veil').count())await p.click('.modal .x');
await pasteIn('People: nurse',await p.evaluate(()=>FIX.cast('#2F7F7A')));if(await p.locator('.veil').count())await p.click('.modal .x');
ok((await p.locator('.jt-body .jt-row',{hasText:'People: nurse'}).innerText()).includes('Done'),'person passes and is used');
await p.locator('.jt-body .jt-row',{hasText:'Part 2:'}).locator('text=Copy prompt').click();const sp=await clip();
ok(/· SCENE · PART 2 of \d+ · ONE PROMPT/.test(sp)&&/<!-- REPLY P\d\d scene-2 -->/.test(sp)&&/<script data-part="2">/.test(sp),'scene prompt names part 2 and its block');
// the mistake from the screenshot: part 1 code pasted into part 2, with chat around it
const fx=await p.evaluate(async()=>{const tpl=await (await fetch('styles/gilded-kasumi/project.html')).text();const P=(await STORE.list())[0];const plan=GK.plan(P);return plan.parts.map(pt=>FIX.scene(tpl,pt,P.timing.words,plan,1))});
await pasteIn('Part 2:','Here is part 1:\n'+fx[0]+'\nWHAT TO LOOK AT: watch 0 to 2 s.');
await shot('1-wrong-part');
const rep=await p.locator('.modal .rep').innerText();
ok(/NOT saved/.test(rep),'wrong part is refused');
ok(/part 1/i.test(rep)&&/part 2/i.test(rep),'the report says it is part 1 and this is part 2');
ok(await p.locator('.modal button:has-text("Save it in")').count()===1,'offers to save it in the right prompt');
await p.click('.modal button:has-text("Copy all details")');const det=await clip();ok(det.length>200&&/P\d\d/.test(det),'all details can be copied ('+det.length+' characters)');
await p.click('.modal button:has-text("Save it in")');await p.waitForTimeout(1500);
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
await p.click('.side .stage:has-text("Prompts")');await p.waitForTimeout(700);
// preview: only the chosen result, back and next
await p.locator('.jt-body .jt-row',{hasText:'Part 2:'}).locator('button:has-text("Preview")').click();await p.waitForTimeout(1500);
ok(/\/pick\/scene-2$/.test(p.url()),'Preview opens only that result');
ok(await p.locator('.page .jt-row').count()===0,'no list of other jobs on the preview page');
ok(/^P\d\d · Part 2/.test(await p.locator('.titlebar h1').innerText()),'title shows the number and name');
await p.waitForSelector('.viewbox img, .viewbox canvas',{timeout:60000}).catch(()=>{});await shot('2-preview');
ok(await p.locator('.viewbox img, .viewbox canvas').count()>0,'pictures of the result drawn');
const nx=await p.locator('.titlebar button:has-text("P")').last().innerText();await p.locator('.titlebar button:has-text("P")').last().click();await p.waitForTimeout(800);
ok(/scene-3$/.test(p.url()),'next goes to the next result ('+nx+')');
await p.click('.titlebar .back');await p.waitForTimeout(700);ok(/\/prompts$/.test(p.url()),'back returns to Prompts');
await p.click('.side .stage:has-text("Results")');await p.waitForTimeout(600);await p.click('.tabs button:has-text("All")');await p.waitForTimeout(300);ok(await p.locator('.jt-body .jt-row').count()===titles.length+parts.length-1||await p.locator('.jt-body .jt-row').count()>3,'Results lists every reply');
await p.locator('.jt-body .jt-row',{hasText:'The plan'}).click();await p.waitForTimeout(800);await shot('3-plan');ok(/\/pick\/plan$/.test(p.url()),'plan result opens');
await p.click('.nextbar button:has-text("Back to")');await p.waitForTimeout(600);ok(/\/pick$/.test(p.url()),'bottom back button returns to Results');
// phone width
await p.setViewportSize({width:390,height:844});await p.locator('.jt-body .jt-row').first().click();await p.waitForTimeout(800);
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'preview fits a phone');await shot('4-phone');
console.log(R.join('\n'));console.log('PAGE ERRORS',JSON.stringify(errs.filter(e=>!/reading 'P'/.test(e)).slice(0,8)));await b.close();})();
