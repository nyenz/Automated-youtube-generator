const { chromium } = require('playwright'); const SP=process.argv[2]; const fs=require('fs');
const R=[]; const ok=(c,m)=>{R.push((c?'PASS ':'FAIL ')+m); if(!c) console.log('FAIL '+m)};
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const ctx=await b.newContext({viewport:{width:1366,height:860},acceptDownloads:true,permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|fonts|404|ERR_INTERNET/.test(m.text()))errs.push(m.text())});
const shot=n=>p.screenshot({path:SP+'/e-'+n+'.png'});
const toasts=async()=>(await p.locator('.toast').allInnerTexts()).join(' | ');
const clear=()=>p.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));
async function paste(btnText,text){await clear();await p.click('button:has-text("'+btnText+'")');await p.fill('.modal textarea',text);await p.click('.modal .btn.primary');await p.waitForSelector('.veil',{state:'detached',timeout:60000});await p.waitForTimeout(300)}
async function newVideo(name,script,audio){await p.goto('http://localhost:8125/');await p.waitForTimeout(700);await p.click('.newcard');await p.fill('.modal input',name);await p.press('.modal input','Enter');await p.waitForTimeout(700);await p.click('text=Use Gilded');await p.waitForTimeout(600);
 await p.fill('textarea',fs.readFileSync(SP+'/'+script,'utf8'));await p.setInputFiles('input[type=file]',SP+'/'+audio);await p.waitForTimeout(1200);await p.click('text=Listen and split into parts');await p.waitForSelector('.tl',{timeout:120000});await p.waitForTimeout(500)}
await newVideo('Pipeline','script-long.txt','long.wav');
await p.addScriptTag({path:SP+'/fixtures.js'});
await p.click('.nextbar >> text=Next: Prompts');await p.waitForTimeout(800);
ok(p.url().endsWith('/prompts'),'Next goes to Prompts');
await shot('1-prompts');
const jobsN=await p.locator('.pitem').count();ok(jobsN===1,'only the plan job before a plan ('+jobsN+')');
await p.click('.pitem >> text=Copy prompt');const pr=await p.evaluate(()=>navigator.clipboard.readText());
ok(/MODE: PROJECT/.test(pr)&&/FULL SCRIPT/.test(pr)&&/assets_info/.test(pr),'plan prompt is complete');
ok(await p.locator('.pitem button:has-text("Paste B")').count()===1,'two chats: Paste A and Paste B');
// plan A and B
const parts=await p.evaluate(()=>STORE.list().then(a=>{const P=a[0];return AUDIO.plan(P).parts.map((x,i,all)=>({id:x.id}))}));
await paste('Paste A',await p.evaluate(ps=>FIX.plan(ps,0),parts));
await paste('Paste B',await p.evaluate(ps=>FIX.plan(ps,1),parts));
ok((await p.locator('.pitem').first().innerText()).includes('Ready to pick'),'plan is ready to pick');
await p.click('.pitem >> text=Pick the best');await p.waitForTimeout(700);ok(p.url().endsWith('/pick'),'goes to Pick the best');
await shot('2-pick-plan');
ok(await p.locator('text=Plan A').count()===1,'plan A and B are compared side by side');
await p.click('.panel .btn:has-text("Use A")');await p.waitForTimeout(700);
await p.click('.side .stage:has-text("Prompts")');await p.waitForTimeout(800);
const titles=await p.locator('.pitem b').allInnerTexts();ok(titles.some(t=>/Assets: crate/.test(t))&&titles.some(t=>/People: nurse/.test(t))&&titles.filter(t=>/^Part /.test(t)).length===5,'jobs made from the plan: '+titles.join(' | '));
ok((await p.locator('.pitem:has-text("Part 1")').innerText()).includes('Finish the assets'),'scenes wait for assets and people');
await shot('3-jobs');
// asset + cast A/B
async function pasteIn(card,which,text){await clear();await p.locator('.pitem',{hasText:card}).locator('button:has-text("Paste '+which+'"), button:has-text("Replace '+which+'")').first().click();await p.fill('.modal textarea',text);await p.click('.modal .btn.primary');await p.waitForSelector('.veil',{state:'detached',timeout:60000});await p.waitForTimeout(300)}
await pasteIn('Assets: crate','A',await p.evaluate(()=>FIX.asset('crate','#C8402F')));
await pasteIn('Assets: crate','B',await p.evaluate(()=>FIX.asset('crate','#2E4A7A')));
const at=await p.locator('.pitem',{hasText:'Assets: crate'}).innerText();console.log('ISSUES',JSON.stringify(await p.evaluate(()=>STORE.list().then(a=>{const j=a[0].jobs;return Object.keys(j).map(k=>[k,j[k].A&&j[k].A.check,j[k].B&&j[k].B.check])}))));ok(at.includes('A: checks pass'),'asset A is checked and draws: '+at.replace(/\n/g,' / '));
await pasteIn('People: nurse','A',await p.evaluate(()=>FIX.cast('#2F7F7A')));
await pasteIn('People: nurse','B',await p.evaluate(()=>FIX.cast('#7A2F55')));
ok((await p.locator('.pitem',{hasText:'People: nurse'}).innerText()).includes('B: checks pass'),'person B is checked and draws');
// a broken reply is caught
await clear();await p.locator('.pitem',{hasText:'Assets: crate'}).locator('button:has-text("Replace B")').click();await p.fill('.modal textarea','sorry I cannot');await p.click('.modal .btn.primary');await p.waitForTimeout(600);const tb=await p.locator('.modal').count();ok(tb===1&&(await p.locator('.modal .t-bad').innerText()).length>5,'a reply without code is refused with a reason');await p.click('.modal .x');
// pick
await p.click('.side .stage:has-text("Pick the best")');await p.waitForTimeout(600);
await p.locator('.pitem',{hasText:'Assets: crate'}).click();await p.waitForTimeout(300);
await p.click('text=Draw A and B');await p.waitForSelector('.panel img',{timeout:60000});await p.waitForTimeout(400);
await shot('4-sheet-assets');ok(await p.locator('.panel img').count()===1,'asset comparison picture drawn');
await p.click('.panel .btn:has-text("Use A")');await p.waitForTimeout(500);
await p.locator('.pitem',{hasText:'People: nurse'}).click();await p.waitForTimeout(300);
await p.click('text=Draw A and B');await p.waitForSelector('.panel img',{timeout:60000});await p.waitForTimeout(300);await shot('5-sheet-cast');
// Sonnet critic path
await p.click('.seg >> text=Sonnet (copy-paste)');await p.waitForTimeout(300);
await p.click('text=Copy critic prompt');await p.waitForTimeout(500);const cp=await p.evaluate(()=>navigator.clipboard.readText());ok(/winner/.test(cp)&&/Automatic checks/.test(cp),'critic prompt has the checks and the JSON shape');
await p.click('text=Paste critic answer');await p.fill('.modal textarea','{"winner":"B","score_a":6,"score_b":8,"why":"B reads better.","fix_for_winner":"more contrast"}');await p.click('.modal .btn.primary');await p.waitForTimeout(700);
ok((await p.locator('.panel').first().innerText()).includes('Sonnet picks B'),'critic verdict shown and B picked');
// scenes
await p.click('.side .stage:has-text("Prompts")');await p.waitForTimeout(700);
ok(!(await p.locator('.pitem:has-text("Part 1")').innerText()).includes('Finish the assets'),'scenes unlock after assets and people are picked');
await p.locator('.pitem',{hasText:'Part 1'}).locator('text=Copy prompt').click();const sp=await p.evaluate(()=>navigator.clipboard.readText());ok(/MODE: SCENE/.test(sp)&&/SCRIPT FOR THIS PART/.test(sp)&&/AUDIO_START \(0\)/.test(sp),'scene prompt has the part, words and times');
const fx=await p.evaluate(async()=>{const tpl=await (await fetch('styles/gilded-kasumi/project.html')).text();const P=(await STORE.list())[0];const plan=GK.plan(P);return plan.parts.map(pt=>[FIX.scene(tpl,pt,P.timing.words,plan,1),FIX.scene(tpl,pt,P.timing.words,plan,.85)])});
for(let i=0;i<fx.length;i++){await pasteIn('Part '+(i+1)+':','A',fx[i][0]);await pasteIn('Part '+(i+1)+':','B',fx[i][1]);}
const s1=await p.locator('.pitem',{hasText:'Part 1:'}).innerText();ok(/A: (checks pass|\d+ problem)/.test(s1),'scene A checked: '+s1.split('\n').slice(-1)[0]);
await shot('6-scenes');
await p.click('.side .stage:has-text("Pick the best")');await p.waitForTimeout(600);
await p.locator('.pitem',{hasText:'Part 2'}).click();await p.waitForTimeout(300);
await p.click('text=Draw A and B');await p.waitForSelector('.panel img',{timeout:90000});await p.waitForTimeout(400);await shot('7-sheet-scene');
ok(await p.locator('.panel img').count()===1,'scene frames drawn for A and B');
for(let i=1;i<=5;i++){await p.locator('.pitem',{hasText:'Part '+i}).first().click();await p.waitForTimeout(250);await p.click('.panel .btn:has-text("Use A")');await p.waitForTimeout(350)}
ok(await p.evaluate(()=>STORE.list().then(a=>JOBS.list(a[0]).every(j=>JOBS.picked(j)))),'every job picked');
// sound
await p.click('.side .stage:has-text("Sound")');await p.waitForTimeout(700);
await p.click('text=Find moments');await p.waitForTimeout(3000);const nc=await p.locator('.card .pitem').count();ok(nc>0,'moments found from whips and hits ('+nc+')');
await p.setInputFiles('.card input[type=file]',SP+'/a.wav');await p.waitForTimeout(1200);ok((await p.locator('.drop .big').first().innerText()).includes('a.wav'),'music added');
await p.locator('.range').first().fill('0.5');await p.waitForTimeout(300);
await p.click('text=Play the mix');await p.waitForTimeout(1500);const mt=await p.locator('.panel .mono').first().innerText();ok(!/^0:00.0/.test(mt),'mix plays ('+mt+')');
await p.click('.panel button:has-text("Pause")');await p.waitForTimeout(300);ok(await p.locator('text=Play the mix').count()===1,'mix pauses');
await p.click('button:has-text("Find sounds")');await p.waitForTimeout(800);ok((await toasts()).includes('No sound found')||(await toasts()).includes('Finding'),'no source: plain message');
await shot('8-sound');
// thumbnails
await p.click('.side .stage:has-text("Thumbnails")');await p.waitForTimeout(600);
await p.click('text=Copy prompt for Sonnet');const tp=await p.evaluate(()=>navigator.clipboard.readText());ok(/thumbnails/.test(tp)&&/1080 x 1920/.test(tp),'thumbnail prompt fits the short format');
await p.click('text=Paste designs');await p.fill('.modal textarea','{"thumbnails":[{"name":"The hole","idea":"danger","image_prompt":"a boy under ice","text":"2 HOURS","text_place":"top"},{"name":"Number","idea":"fact","image_prompt":"thermometer 7.0","text":"7°C"},{"name":"Face","idea":"emotion","image_prompt":"mother crying","text":""}]}');await p.click('.modal .btn.primary');await p.waitForTimeout(600);
ok(await p.locator('.grid .panel').count()===3,'three designs shown');
await p.locator('.grid .panel').first().locator('input[type=file]').setInputFiles('/home/claude/automated-youtube-generator/icons/logo-ink-512.png');await p.waitForTimeout(800);
ok(await p.locator('.grid .panel img').count()===1,'picture added to a design');
await p.locator('.grid .panel').first().locator('text=Make favourite').click();await p.waitForTimeout(500);ok(await p.locator('text=Favourite').count()>=1,'favourite picked');
await shot('9-thumbs');
// export page: watch
await p.click('.side .stage:has-text("Watch")');await p.waitForTimeout(4000);await shot('10-watch');
ok((await p.locator('.panel .muted').first().innerText()).includes('All 5 parts are built'),'all parts built and joined');
await p.click('.player [aria-label=Play]');await p.waitForTimeout(2500);const wt=await p.locator('.player .time').innerText();ok(!/^0:00.0/.test(wt),'joined video plays with sound ('+wt+')');
await p.click('.player [aria-label=Pause]');await p.waitForTimeout(400);await shot('11-watch-playing');
const px=await p.evaluate(()=>{const c=document.querySelector('canvas');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=0;for(let i=0;i<d.length;i+=4000)s+=d[i]+d[i+1]+d[i+2];return s});ok(px>1000,'the video frame is drawn (not black)');
await p.click('text=Improve this moment');await p.waitForTimeout(400);ok((await p.locator('.modal h3').innerText()).startsWith('Improve part'),'improve this moment opens');
await p.click('.modal >> text=Copy prompt');const ip=await p.evaluate(()=>navigator.clipboard.readText());ok(/MODE: IMPROVE/.test(ip),'improve prompt copied');await p.click('.modal .x');
await p.click('text=Copy prompt for Sonnet');const upp=await p.evaluate(()=>navigator.clipboard.readText());ok(/6 title options/.test(upp),'upload package prompt');
const [dl]=await Promise.all([p.waitForEvent('download'),p.click('.titlebar >> text=Project file')]);const fp=await dl.path();const ftxt=fs.readFileSync(fp,'utf8');
ok(/data-example-part="1"/.test(ftxt)&&(ftxt.match(/<script data-part="\d/g)||[]).length===5&&/data-assets data-job=/.test(ftxt)&&!/studio-bridge/.test(ftxt),'downloaded project file: 5 parts, example off, no app bridge');
fs.writeFileSync(SP+'/joined.html',ftxt);
console.log(R.join('\n'));console.log('PAGE ERRORS',JSON.stringify(errs.slice(0,8)));await b.close();})();
