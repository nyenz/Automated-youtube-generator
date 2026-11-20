const { chromium } = require('playwright'); const SP=process.argv[2]; const fs=require('fs');
const R=[]; const ok=(c,m)=>{R.push((c?'PASS ':'FAIL ')+m)};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1300,height:860},acceptDownloads:true,permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|fonts|404/.test(m.text()))errs.push(m.text())});
const toastHas=async(t)=>{await p.waitForTimeout(250);return (await p.locator('.toast').allInnerTexts()).join(' | ').includes(t)};
const clearToasts=()=>p.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));
await p.goto('http://localhost:8125/');await p.waitForTimeout(900);
ok(await p.locator('.brand .logo svg').count()===1,'logo drawn inline in the top bar');
ok((await p.locator('.side .foot').innerText()).includes('Version 2026'),'version shown');
// new video validation
await p.click('.newcard');await p.click('.modal .btn.primary');ok(await p.locator('.modal input.field-bad').count()===1,'empty name is marked');
await p.fill('.modal input','Test One');await p.press('.modal input','Enter');await p.waitForTimeout(900);
ok(p.url().includes('/style'),'Enter creates and opens the style page');
// style page
await p.click('.collapse-head');await p.waitForTimeout(200);ok(await p.locator('.mini').count()===3,'three set-aside styles listed');
await p.click('.mini >> nth=0');await p.waitForTimeout(400);ok((await p.locator('.demo iframe').getAttribute('src')).includes('facet'),'preview switches to Paper Figures demo');
await p.click('.mini >> nth=1 >> button');await p.waitForTimeout(300);ok(await p.locator('.modal').count()===1,'unfinished style warns first');
await p.click('.modal >> text=Keep Gilded');await p.waitForTimeout(400);
await p.click('text=Use Gilded');await p.waitForTimeout(900);ok(p.url().includes('/audio'),'Use Gilded goes to Script & audio');
// guards
await clearToasts();await p.click('text=Listen and split into parts');ok(await toastHas('Paste the script first'),'needs script first');
await p.click('text=Timing & parts');ok(await toastHas('Listen and split'),'parts tab locked before timing');
const script=fs.readFileSync(SP+'/script-long.txt','utf8');await p.fill('textarea',script);await p.waitForTimeout(700);
await clearToasts();await p.click('text=Listen and split into parts');ok(await toastHas('Add the narration audio first'),'needs audio first');
await clearToasts();await p.setInputFiles('input[type=file]',SP+'/notes.txt');ok(await toastHas('not audio'),'rejects a non-audio file');
await p.click('.seg >> text=Long video');await p.waitForTimeout(500);ok(await p.locator('.seg button.on').innerText()==='Long video','format switch');
await p.setInputFiles('input[type=file]',SP+'/long.wav');await p.waitForTimeout(1500);
{const wb=fs.readFileSync(SP+'/long.wav'),dur=Math.round((wb.length-44)/wb.readUInt32LE(28)),want=Math.floor(dur/60)+' min '+(dur%60)+' s',got=await p.locator('.audio-line').innerText();ok(got.includes(want),'audio length shown ('+want+')');}
// persistence after reload
await p.reload();await p.waitForTimeout(1200);
ok((await p.locator('textarea').inputValue()).length>1000,'script kept after reload');ok(await p.locator('.seg button.on').innerText()==='Long video','format kept after reload');
ok(await p.locator('.audio-line').count()===1,'audio kept after reload');
// analyse
await p.click('text=Listen and split into parts');await p.waitForSelector('.tl',{timeout:120000});await p.waitForTimeout(800);
const n0=await p.locator('.pitem').count();ok(n0===5,'split into 5 parts ('+n0+')');
await clearToasts();
await p.locator('.tl .cut.cand').first().click();await p.waitForTimeout(600);ok(await p.locator('.pitem').count()===n0+1,'clicking a dashed pause adds a cut');
await p.locator('.tl .cut:not(.cand)').first().click();await p.waitForTimeout(600);ok(await p.locator('.pitem').count()===n0,'clicking a cut joins parts');
await p.click('text=Split again automatically');await p.waitForTimeout(600);ok(await p.locator('.pitem').count()===n0,'split again automatically');
await p.click('.pitem >> nth=1');await p.waitForTimeout(400);ok((await p.locator('.panel h2').first().innerText()).includes('Part 2'),'selecting a part shows its detail');
await p.click('.words span >> nth=2');await p.waitForTimeout(400);const before=await p.locator('.glass .mono.muted').first().innerText();
await p.click('.nudger >> text=Later >> nth=0');await p.waitForTimeout(400);const after=await p.locator('.glass .mono.muted').first().innerText();ok(before!==after,'word nudge moves its time ('+before+' -> '+after+')');
// plan
await p.click('text=More');await p.click('.menu >> text=Copy the plan');await p.waitForTimeout(300);
const clip=await p.evaluate(()=>navigator.clipboard.readText());let plan=null;try{plan=JSON.parse(clip)}catch(e){}
ok(plan&&plan.parts.length===5&&plan.stage==='wide'&&plan.audio.words.length===290&&plan.parts[0].start===0,'plan copied in rulebook shape');
ok(plan&&Math.abs(plan.parts[plan.parts.length-1].end-plan.audio.length)<.01,'last part ends at the audio length');
ok(plan&&plan.parts.every((x,i)=>i===0||x.start===plan.parts[i-1].end),'parts touch: no gaps, no overlaps');
await p.click('text=More');const [dl]=await Promise.all([p.waitForEvent('download'),p.click('.menu >> text=Download the plan')]);ok(/plan\.json$/.test(dl.suggestedFilename()),'plan downloads');
await p.click('text=More');await p.click('.menu >> text=Undo');await p.waitForTimeout(500);const nv=await p.locator('.modal .btn').count();ok(nv>=2,'earlier versions listed ('+nv+')');
await p.locator('.modal .btn >> text=Go back to this').last().click();await p.waitForTimeout(800);ok(await toastHas('Went back'),'going back to a version works');
// menu stays on screen near the bottom
await p.goto('http://localhost:8125/#/');await p.waitForTimeout(800);
await p.setViewportSize({width:1300,height:420});await p.waitForTimeout(300);
await p.click('.vcard .more button');await p.waitForTimeout(250);const mb=await p.locator('.menu').boundingBox();ok(mb&&mb.y>=0&&mb.y+mb.height<=420,'menu opens where there is room');
await p.keyboard.press('Escape');await p.mouse.click(5,5);await p.setViewportSize({width:1300,height:860});
// rename, duplicate, trash, restore, delete
await p.click('.vcard .more button');await p.click('.menu >> text=Rename');await p.fill('.modal input','Renamed Video');await p.click('.modal .btn.primary');await p.waitForTimeout(600);
ok((await p.locator('.vcard .name').allInnerTexts()).includes('Renamed Video'),'rename');
await p.click('.vcard .more button');await p.click('.menu >> text=Duplicate');await p.waitForTimeout(900);ok(await p.locator('.vcard').count()===2,'duplicate');
const dupHasAudio=await p.evaluate(()=>STORE.list().then(a=>Promise.all(a.map(x=>STORE.getBlob(x.id+':audio')))).then(bs=>bs.every(Boolean)));ok(dupHasAudio,'duplicate keeps the audio');
await p.click('.vcard >> nth=0 >> .more button');await p.click('.menu >> text=Move to trash');await p.waitForTimeout(600);ok(await p.locator('.vcard').count()===1,'move to trash');
await p.click('.tabs >> text=Trash');await p.waitForTimeout(300);ok(await p.locator('.vcard').count()===1,'trash lists it');
await p.click('.vcard .more button');await p.click('.menu >> text=Restore');await p.waitForTimeout(600);await p.click('.tabs >> text=Videos');await p.waitForTimeout(300);ok(await p.locator('.vcard').count()===2,'restore');
await p.click('.vcard >> nth=0 >> .more button');await p.click('.menu >> text=Move to trash');await p.waitForTimeout(500);await p.click('.tabs >> text=Trash');await p.waitForTimeout(300);
await p.click('.vcard .more button');await p.click('.menu >> text=Delete for good');await p.waitForTimeout(200);await p.click('.modal .btn.danger');await p.waitForTimeout(600);ok(await p.locator('.vcard').count()===0,'delete for good');
// deep link + unknown id
const id=await p.evaluate(()=>STORE.list().then(a=>a[0].id));await p.goto('http://localhost:8125/#/'+id+'/audio');await p.waitForTimeout(1000);ok(await p.locator('.tl').count()===1,'deep link opens a video on its stage');
await p.goto('http://localhost:8125/#/nope/audio');await p.waitForTimeout(900);ok(p.url().endsWith('#/'),'unknown video goes home with a message');
// offline
await p.goto('http://localhost:8125/');await p.waitForTimeout(1500);await ctx.setOffline(true);await p.reload();await p.waitForTimeout(1200);ok(await p.locator('.brand').count()===1,'opens offline');await ctx.setOffline(false);
// narrow widths
for (const w of [360,390,768,1024]){await p.setViewportSize({width:w,height:800});await p.goto('http://localhost:8125/#/'+id+'/audio');await p.waitForTimeout(900);
 const ov=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth||[...document.querySelectorAll('.top > *')].some(e=>e.getBoundingClientRect().right>innerWidth+1));ok(!ov,'no overflow at '+w+'px');await p.screenshot({path:SP+'/w'+w+'.png'})}
console.log(R.join('\n'));console.log('PAGE ERRORS',JSON.stringify(errs));await b.close();})();
