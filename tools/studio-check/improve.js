// Stage 7, Watch & improve: player, timeline, problem finder, improve prompts (I01...), before/after report, keep/undo, review R01, fit and phone.
const { chromium } = require('playwright'); const SP=process.argv[2]; const fs=require('fs');
const R=[]; const ok=(c,m)=>{R.push((c?'PASS ':'FAIL ')+m); if(!c) console.log('FAIL '+m)};
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const ctx=await b.newContext({viewport:{width:1366,height:720},permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/ERR_TUNNEL|fonts|404|ERR_INTERNET/.test(m.text()))errs.push(m.text())});
const shot=n=>p.screenshot({path:SP+'/w-'+n+'.png'});
const clipRaw=async()=>{await p.waitForTimeout(1200);return p.evaluate(()=>navigator.clipboard.readText())};
const promptOf=t=>t.includes('</project_file>')?t.slice(t.indexOf('</project_file>')+15).trim():t;
const clear=()=>p.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));
const W=()=>p.evaluate(()=>STORE.list().then(a=>a[0].workshop||{items:[]}));
async function pasteIn(card,text){await clear();await p.locator('.jt-body .jt-row',{hasText:card}).locator('button:has-text("Paste reply"), button:has-text("Replace reply")').first().click();await p.fill('.modal textarea',text);await p.click('.modal .btn.primary');for(let k=0;k<120;k++){if(await p.evaluate(()=>!document.querySelector('.veil')||!!document.querySelector('.veil .rep')))break;await p.waitForTimeout(500)}await p.waitForTimeout(300);if(await p.locator('.veil').count())await p.click('.modal .x')}
async function waitFor(fn,ms){for(let k=0;k<(ms||60000)/300;k++){if(await p.evaluate(fn))return true;await p.waitForTimeout(300)}return false}
// a video with every part built (one prompt mode)
await p.goto('http://localhost:8125/');await p.waitForTimeout(700);await p.click('.newcard');await p.fill('.modal input','Workshop');await p.press('.modal input','Enter');await p.waitForTimeout(700);await p.click('text=Use Gilded');await p.waitForTimeout(600);
await p.fill('textarea',fs.readFileSync(SP+'/script-long.txt','utf8'));await p.setInputFiles('input[type=file]',SP+'/long.wav');await p.waitForTimeout(1200);await p.click('text=Listen and split into parts');await p.waitForSelector('.tl',{timeout:120000});await p.waitForTimeout(500);
await p.addScriptTag({path:SP+'/fixtures.js'});
await p.click('.nextbar >> text=Next: Prompts');await p.waitForTimeout(800);await p.click('.tabs button:has-text("All")');await p.waitForTimeout(300);
const parts=await p.evaluate(()=>STORE.list().then(a=>AUDIO.plan(a[0]).parts.map(x=>({id:x.id}))));
await pasteIn('The plan',await p.evaluate(ps=>FIX.plan(ps,0),parts));
await pasteIn('Assets: crate',await p.evaluate(()=>FIX.asset('crate','#C8402F')));
await pasteIn('People: nurse',await p.evaluate(()=>FIX.cast('#2F7F7A')));
const fx=await p.evaluate(async()=>{const tpl=await (await fetch('styles/gilded-kasumi/project.html')).text();const P=(await STORE.list())[0];const plan=GK.plan(P);return plan.parts.map(pt=>FIX.scene(tpl,pt,P.timing.words,plan,1))});
for(let i=0;i<fx.length;i++)await pasteIn('Part '+(i+1)+':',fx[i]);
const pid=await p.evaluate(()=>STORE.list().then(a=>a[0].id));
for(const id of await p.evaluate(()=>STORE.list().then(a=>JOBS.list(a[0]).filter(j=>!JOBS.picked(j)).map(j=>j.id)))){await p.goto('http://localhost:8125/#'+pid+'/pick/'+id);await p.waitForTimeout(900);await p.click('.panel button:has-text("Use this reply")');await p.waitForTimeout(500)}
ok(await p.evaluate(()=>STORE.list().then(a=>JOBS.list(a[0]).every(j=>JOBS.picked(j)))),'set-up: every job in use');

// ---------- the page ----------
await p.click('.side .stage:has-text("Watch")');await p.waitForTimeout(2500);
ok((await p.locator('.titlebar h1').innerText()).includes('Watch & improve'),'stage 7 is called Watch & improve');
const fit=await p.evaluate(()=>{const m=document.querySelector('.main');return [m.scrollHeight,m.clientHeight]});ok(fit[0]<=fit[1]+2,'page fits 1366x720 ('+fit[0]+' / '+fit[1]+')');
const bright=await p.evaluate(()=>{const c=document.querySelector('.ws-stage');const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let s=0;for(let i=0;i<d.length;i+=4000)s+=d[i]+d[i+1]+d[i+2];return s});ok(bright>400,'the first picture shows before Play (not black): '+bright);
ok(await p.locator('.ws-cell').count()===parts.length,'timeline: one cell per part ('+parts.length+')');
ok(await waitFor(()=>document.querySelectorAll('.ws-cell canvas').length&&[...document.querySelectorAll('.ws-cell canvas')].every(c=>c.width>20),90000),'timeline: every part gets a small picture');
ok(await waitFor(()=>document.querySelectorAll('.ws-mark').length>0,30000),'timeline: problem markers ('+(await p.locator('.ws-mark').count())+')');
ok((await p.locator('.ws-words span').count())>3,'word track under the timeline');
// keys and controls
await p.click('.ws-stage');await p.keyboard.press('Shift+ArrowRight');await p.waitForTimeout(300);ok(/^0:01\.0/.test(await p.locator('.ws-controls .time').innerText()),'Shift + → moves one second');
await p.keyboard.press('ArrowRight');await p.waitForTimeout(300);const t1=await p.evaluate(()=>document.querySelector('.ws-controls .time').textContent);ok(/^0:01\.0/.test(t1),'→ moves one frame ('+t1+')');
await p.keyboard.press('ArrowLeft');await p.keyboard.press('Home');await p.waitForTimeout(300);ok(/^0:00\.0/.test(await p.locator('.ws-controls .time').innerText()),'Home goes to the start');
await p.click('.ws-rate button:has-text("0.5x")');await p.click('.ws-controls [aria-label=Play]');await p.waitForTimeout(2000);await p.click('.ws-controls [aria-label=Pause]');
const half=await p.evaluate(()=>{const t=document.querySelector('.ws-controls .time').textContent.split(' ')[0].split(':');return +t[0]*60+ +t[1]});ok(half>.5&&half<1.6,'0.5x plays at half speed ('+half+' s in 2 s)');
await p.click('.ws-rate button:has-text("1x")');
await p.keyboard.press('l');await p.waitForTimeout(200);ok(await p.locator('.ws-controls [aria-label=Loop].on').count()===1,'L turns the loop on');
await p.click('.ws-controls [aria-label=Play]');await p.waitForTimeout(3600);await p.click('.ws-controls [aria-label=Pause]');
const lt=await p.evaluate(()=>{const t=document.querySelector('.ws-controls .time').textContent.split(' ')[0].split(':');return +t[0]*60+ +t[1]});ok(lt<3.05,'the loop keeps playing inside the moment ('+lt+' s after 3.6 s)');
await p.keyboard.press('l');
await shot('1-page');

// ---------- issues ----------
await p.click('.ws-tabs button:has-text("Issues")');await p.waitForTimeout(400);
ok((await p.locator('.ws-group').count())>=1,'Issues tab groups problems by part');
ok(/Copy review prompt R01/.test(await p.locator('.ws-foot').innerText()),'Issues: review-all prompt');
await p.click('.ws-foot button:has-text("Copy review prompt R01")');const rv=promptOf(await clipRaw());
ok(/^PROMPT R01 · REVIEW/.test(rv)&&/"REPLY": "R01 review"/.test(rv)&&/S01 \(/.test(rv)&&/ONE ```json/.test(rv),'review prompt: number, parts, strict JSON');
const marks0=await p.locator('.ws-mark').count();
await p.click('.ws-foot button:has-text("Paste review")');await p.fill('.modal textarea','```json\n'+JSON.stringify({REPLY:'R01 review',issues:[{part:2,at:1.5,type:'faces',level:'bad',title:'The nurse does not look worried',why:'the boy is hurt',fix:'use worried'},{part:99,at:1,type:'logic',level:'warn',title:'no such part',fix:'x'}]})+'\n```');await p.click('.modal .btn.primary');await p.waitForTimeout(800);
ok((await p.locator('.ws-mark').count())===marks0+1,'review issues become markers (bad part skipped)');
ok(/Sonnet review/.test(await p.locator('.ws-body').innerText()),'review issues are listed in Issues');
await shot('2-issues');

// ---------- improve ----------
await p.click('.ws-cell >> nth=0');await p.waitForTimeout(300);await p.keyboard.press('Home');await p.waitForTimeout(400);
await p.click('.ws-tabs button:has-text("Improve")');await p.waitForTimeout(400);
ok(/S01/.test(await p.locator('.ws-moment').innerText())&&/“/.test(await p.locator('.ws-quote').innerText()),'Improve shows the moment and its words');
ok(await p.locator('.ws-types .chip').count()===9,'nine kinds of improvement');
await p.click('.ws-types .chip:has-text("Faces and acting")');await p.click('.ws-types .chip:has-text("Special shot")');await p.waitForTimeout(200);
await p.click('.ws-shot .btn');await p.click('.menu button:has-text("X-ray")');await p.waitForTimeout(200);ok(/X-ray/.test(await p.locator('.ws-shot').innerText()),'special shot can be picked');
await p.click('text=checks that go into the prompt');await p.waitForTimeout(200);ok((await p.locator('.ws-body .howbox li').count())>=10,'the checks of the chosen kinds can be seen');
// tick 'Nobody reacts' if it is there (an idea, not ticked by default)
const react=p.locator('.ws-issue',{hasText:'Nobody reacts'});const hasReact=await react.count();if(hasReact)await react.locator('.ws-tick').click();
await p.fill('.ws-body textarea','Make the boy look cold and scared.');
await p.click('.ws-foot button:has-text("Copy prompt I01")');const raw=await clipRaw(),ip=promptOf(raw);fs.writeFileSync(SP+'/improve-prompt.txt',ip);
ok(raw.includes('</project_file>'),'improve prompt holds the project file (one paste)');
ok(/^PROMPT I01 · IMPROVE · PART 1 of \d+ \(S01\)/.test(ip),'improve prompt is numbered I01 and names the part');
ok(/MOMENT: video 0\.0 s to 3\.0 s/.test(ip)&&/WORDS IN THE MOMENT: "/.test(ip),'improve prompt: the moment and its words');
ok(/THE PART NOW/.test(ip)&&/<script data-part="1">[\s\S]*PART\(\{id:1/.test(ip),'improve prompt: the current code of the part');
ok(/STATE SHEET/.test(ip),'improve prompt: the state sheet row');
ok(/LOGIC AND CONTINUITY/.test(ip)&&/FACES AND ACTING/.test(ip)&&/SPECIAL SHOT: X-ray/.test(ip),'improve prompt: each chosen kind with its checklist');
ok(/PROBLEMS THE APP FOUND/.test(ip)&&/MY NOTE \(most important\): Make the boy look cold/.test(ip),'improve prompt: ticked problems and the note');
ok(/first line inside the block is exactly: <!-- REPLY I01 scene-1 -->/.test(ip)&&/ONE ```html code block and NOTHING else/.test(ip),'improve prompt: strict output with its REPLY line');
await p.waitForTimeout(400);ok(/Paste reply I01/.test(await p.locator('.ws-foot').innerText()),'Paste reply I01 is ready');
await p.click('.ws-foot button:has-text("Copy prompt I01")');await p.waitForTimeout(800);ok((await W()).items.length===1,'copying again before a reply keeps the same number');
await p.click('.ws-tabs button:has-text("Changes")');await p.waitForTimeout(300);ok(/I01[\s\S]*Waiting for the reply/.test(await p.locator('.ws-body').innerText()),'Changes lists I01 as waiting');
const code1=await p.evaluate(()=>STORE.list().then(a=>JOBS.blocks(a[0]).parts.find(x=>x.id===1).code));
// a reply for another number is refused
await p.click('.ws-change button:has-text("Paste reply")');await p.fill('.modal textarea','```html\n<!-- REPLY I07 scene-1 -->\n<script data-part="1">\n'+code1+'\n</script>\n```');await p.click('.modal .btn.primary');await p.waitForTimeout(500);
ok(/This reply is for I07, not I01/.test(await p.locator('.modal').innerText()),'a reply for another number is refused');
// the same code back: Nothing changed
await p.fill('.modal textarea','```html\n<!-- REPLY I01 scene-1 -->\n<script data-part="1">\n'+code1+'\n</script>\n```');await p.click('.modal .btn.primary');
ok(await waitFor(()=>!!document.querySelector('.ws-compare'),90000),'the before/after report opens');
let rep=await p.locator('.ws-compare').innerText();ok(/Nothing changed/.test(rep)&&/exactly the old code/.test(rep),'same code: Nothing changed');
await p.click('.modal button:has-text("Copy message to send back")');const sb=await clipRaw();ok(/did not change the picture/.test(sb)&&/<!-- REPLY I01 scene-1 -->/.test(sb),'message to send back');
await p.click('.modal .x');await p.waitForTimeout(400);
ok((await W()).items[0].status==='waiting','after sending back, I01 waits for the new reply');
// a real change
const code2=code1.replace("P.MOODS=[[0,'night',0]","P.MOODS=[[0,'day',0]").replace('P.HITS=','/* the boy reacts: react( ) */\nP.HITS=');
ok(code2!==code1,'test reply differs from the old code');
await p.click('.ws-change button:has-text("Paste reply")');await p.fill('.modal textarea','```html\n<!-- REPLY I01 scene-1 -->\n<script data-part="1">\n'+code2+'\n</script>\n```');await p.click('.modal .btn.primary');
ok(await waitFor(()=>!!document.querySelector('.ws-compare'),90000),'the report opens for the new reply');await p.waitForTimeout(1200);
rep=await p.locator('.ws-compare').innerText();fs.writeFileSync(SP+'/improve-report.txt',rep);
ok(/Changed|Partly changed/.test(rep)&&!/Nothing changed/.test(rep),'a real change is seen: '+rep.split('\n')[0]);
ok((await p.locator('.ws-cf.on').count())>=1,'changed pictures are marked ('+(await p.locator('.ws-cf.on').count())+')');
ok(/Before/i.test(rep)&&/After/i.test(rep)&&(await p.locator('.ws-pair canvas').count())===2,'before and after side by side');
ok(/lines changed/.test(rep),'what changed in the code, in plain words');
ok(/still passes its checks|Audio times are the same/.test(rep),'nothing broken around it');
if(hasReact)ok(/Fixed\s+Nobody reacts/.test(rep),'a ticked problem is shown as Fixed');
ok(/Check by eye\s+Faces and acting/.test(rep),'chosen kinds are listed to check by eye');
await p.click('.ws-cctl [aria-label="Play both"]');await p.waitForTimeout(1500);await p.click('.ws-cctl [aria-label=Pause]');ok(!/^0\.(2|3)0 /.test(await p.locator('.ws-cctl .mono').innerText()),'before and after play together ('+(await p.locator('.ws-cctl .mono').innerText())+')');
await shot('3-compare');
await p.click('.modal button:has-text("Keep the new version")');await p.waitForTimeout(2500);
ok(await p.evaluate(()=>STORE.list().then(a=>(a[0].improved||[]).some(x=>x.id===1&&x.by==='I01'))),'Keep: part 1 uses the new version');
ok(await p.evaluate(pid=>STORE.versions(pid).then(v=>v.some(x=>/Before keeping I01/.test(x.label))),pid),'a safe copy is kept before');
await p.click('.ws-tabs button:has-text("Changes")');await p.waitForTimeout(300);ok(/Kept/.test(await p.locator('.ws-change').first().innerText()),'Changes shows I01 kept');
await p.click('.ws-change button:has-text("Undo")');await p.waitForTimeout(2500);
ok(await p.evaluate(()=>STORE.list().then(a=>!(a[0].improved||[]).some(x=>x.id===1))),'Undo: part 1 is back to the old version');
await p.click('.ws-tabs button:has-text("Changes")');await p.waitForTimeout(300);ok(/Undone/.test(await p.locator('.ws-change').first().innerText()),'Changes shows I01 undone');
// export and upload tabs
await p.click('.ws-tabs button:has-text("Export")');await p.waitForTimeout(300);ok(await p.locator('button:has-text("Make the MP4")').count()===1,'Export tab: Make the MP4');
await p.click('.ws-tabs button:has-text("Upload")');await p.waitForTimeout(300);ok(await p.locator('.card:has-text("Upload package")').count()===1,'Upload tab: the upload package');
const fit2=await p.evaluate(()=>{const m=document.querySelector('.main');return [m.scrollHeight,m.clientHeight]});ok(fit2[0]<=fit2[1]+2,'still fits with every tab');
// phone
await p.setViewportSize({width:390,height:844});await p.waitForTimeout(900);
ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&[...document.querySelectorAll('.page *')].every(e=>e.getBoundingClientRect().right<=innerWidth+1||e.closest('.scrollbox,.scroller,.tabs,.side,.jt-body,.chips'))),'phone 390 px: nothing spills sideways');
await shot('4-phone');
console.log('SPILL',JSON.stringify(await p.evaluate(()=>[...document.querySelectorAll('.page *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&!e.closest('.scrollbox,.scroller,.tabs,.side,.jt-body,.chips')).slice(0,8).map(e=>e.className+' '+e.tagName+' '+Math.round(e.getBoundingClientRect().right)))));
console.log(R.join('\n'));console.log('PAGE ERRORS',JSON.stringify(errs.slice(0,8)));await b.close();})();
