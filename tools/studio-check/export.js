const { chromium } = require('playwright'); const SP=process.argv[2]; const fs=require('fs');
const R=[]; const ok=(c,m)=>{R.push((c?'PASS ':'FAIL ')+m)};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1366,height:860},acceptDownloads:true,permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const clear=()=>p.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));
// one prompt mode (the default): one reply per job; a reply with LINT problems is put in use with "Use this reply"
async function pasteIn(card,which,text){await clear();await p.locator('.pitem',{hasText:card}).locator('button:has-text("Paste reply"), button:has-text("Replace reply")').first().click();await p.fill('.modal textarea',text);await p.click('.modal .btn.primary');await p.waitForFunction(()=>!document.querySelector('.veil')||document.querySelector('.veil .rep'),null,{timeout:60000});if(await p.locator('.veil').count())await p.click('.modal .x');await p.waitForTimeout(300)}
async function useIt(id){const pid=await p.evaluate(()=>STORE.list().then(a=>a.filter(x=>x.name==='Export test')[0].id));await p.goto('http://localhost:8125/#/'+pid+'/pick/'+id);await p.waitForTimeout(900);if(await p.locator('.panel button:has-text("Use this reply")').count())await p.click('.panel button:has-text("Use this reply")');await p.waitForTimeout(600)}
await p.goto('http://localhost:8125/');await p.waitForTimeout(700);await p.click('.newcard');await p.fill('.modal input','Export test');await p.press('.modal input','Enter');await p.waitForTimeout(700);await p.click('text=Use Gilded');await p.waitForTimeout(600);
await p.fill('textarea',fs.readFileSync(SP+'/script-short.txt','utf8'));await p.setInputFiles('input[type=file]',SP+'/a.wav');await p.waitForTimeout(1200);await p.click('text=Listen and split into parts');await p.waitForSelector('.tl',{timeout:120000});
ok(await p.locator('.pitem').count()===1,'a 22 s narration is one part');
await p.addScriptTag({path:SP+'/fixtures.js'});
await p.click('.side .stage:has-text("Prompts")');await p.waitForTimeout(700);
await pasteIn('The plan','A','```json\n{"parts":[{"id":1,"title":"The reading","place":"pond","time":"night","moods":["night"],"cast":["boy","medic"],"assets":["pine","hills"],"in":"dip","out":"none"}],"continuity":{}}\n```');
await useIt('plan');
await p.click('.side .stage:has-text("Prompts")');await p.waitForTimeout(700);
const t=await p.locator('.pitem b').allInnerTexts();ok(t.length===2&&/Part 1/.test(t[1]),'library people and assets need no new jobs: '+t.join(' | '));
const fx=await p.evaluate(async()=>{const tpl=await (await fetch('styles/gilded-kasumi/project.html')).text();const P=(await STORE.list()).filter(x=>x.name==='Export test')[0];const plan=GK.plan(P);return FIX.scene(tpl,plan.parts[0],P.timing.words,plan,1)});
await pasteIn('Part 1','A',fx);
await useIt('scene-1');
await p.click('.side .stage:has-text("Sound")');await p.waitForTimeout(600);await p.setInputFiles('.card input[type=file]',SP+'/a.wav');await p.waitForTimeout(1000);
await p.click('.side .stage:has-text("Watch")');await p.waitForTimeout(3000);
ok((await p.locator('.panel .muted').first().innerText()).includes('All 1 parts are built')||(await p.locator('.panel').first().innerText()).includes('All 1 parts'),'the part is built');
const t0=Date.now();
const [dl]=await Promise.all([p.waitForEvent('download',{timeout:600000}),p.click('button:has-text("Make the MP4")')]);
const f=await dl.path();const size=fs.statSync(f).size;fs.copyFileSync(f,SP+'/export.'+(dl.suggestedFilename().split('.').pop()));
ok(size>100000,'video made: '+dl.suggestedFilename()+' '+(size/1048576).toFixed(1)+' MB in '+((Date.now()-t0)/1000).toFixed(0)+' s');
console.log(R.join('\n'));console.log('PAGE ERRORS',JSON.stringify(errs.slice(0,5)));await b.close();})();
