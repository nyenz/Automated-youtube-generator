// Special shots (rulebook section 30): the ZOOM calls in the engine draw and move; the plan, scene prompts, reply checks and improve prompts know them.
const { chromium } = require('playwright'); const SP=process.argv[2]; const fs=require('fs');
const R=[]; const ok=(c,m)=>{R.push((c?'PASS ':'FAIL ')+m); if(!c) console.log('FAIL '+m)};
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:1366,height:860},permissions:['clipboard-read','clipboard-write']});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
// ---------- 1. the engine ----------
await p.goto('http://localhost:8125/styles/gilded-kasumi/project.html');await p.waitForTimeout(800);
const E=await p.evaluate(()=>{
  const o={};
  const scene=(t,X)=>X.lay(1,`<rect x="-3000" y="-2" width="7000" height="1400" fill="url(#gnd)"/>`+place(CAST.medic,-40,0,poseAt('stand',t),faceAt('worried',t),X.who('normal')),'mbAll');
  const inner=t=>`<rect width="${STAGE.W}" height="${STAGE.H}" fill="#3A1020"/><circle cx="${200+40*Math.sin(t)}" cy="400" r="60" fill="#C8402F"/>`;
  const modes={dive:(t,X)=>ZOOM.dive(t,1,1.2,scene(t,X),inner(t),{x:300,y:450,r:24}),pull:(t,X)=>ZOOM.pull(t,1,1.2,inner(t),scene(t,X),{x:300,y:450,w:120,h:200}),
    xray:(t,X)=>ZOOM.xray(t,1,3,scene(t,X),X.lay(1,ZOOM.bones(-40,0,340,{organs:true,hurt:'armF',beat:t})),{x:260,y:470,r:120}),
    cutaway:(t,X)=>ZOOM.cutaway(t,1,3,scene(t,X),'<rect x="150" y="400" width="80" height="100" fill="#D9B45A"/>',{x:90,y:340,w:360,h:220}),
    lens:(t,X)=>ZOOM.lens(t,1,3,scene(t,X),{path:[[1,150,470],[3,380,500]]}),
    exploded:(t,X)=>scene(t,X)+X.lay(1,ZOOM.exploded(t,1,[{svg:'<rect x="-40" y="-200" width="80" height="60" fill="#C8402F"/>',dx:0,dy:-120,label:'lid',ax:0,ay:-200}])),
    scale:(t,X)=>scene(t,X)+X.lay(1,ZOOM.scale(t,1,{x:0,y:0,h:900,ref:'bus',label:'5 m'}))};
  const L0=LINT();o.lint0=L0['part 1'].every(r=>r.ok);let id=80;for(const m in modes){const P=PART({id:++id,of:1,AUDIO_START:0,AUDIO_END:5,SEG:[[0,5,'shot test words']],KEYS:[[0,0,40,1.2],[5,0,40,1.3]],draw:(t,X)=>modes[m](t,X)});
    try{const a=P.render(.5),b=P.render(1.7),c=P.render(2.6);o[m]={err:null,moved:a!==b,len:b.length,ids:(b.match(/id="z\d+"/g)||[]).length,c:c.length};}catch(e){o[m]={err:e.message};}}
  o.diveEnd=ZOOM.dive(5,1,1.2,'OUT','IN',{})==='IN'&&ZOOM.dive(0,1,1.2,'OUT','IN',{})==='OUT';
  o.pullEnds=ZOOM.pull(0,1,1.2,'IN','OUT',{})==='IN'&&ZOOM.pull(5,1,1.2,'IN','OUT',{})==='OUT';
  o.xrayClosed=ZOOM.xray(4,1,3,'OUT','IN',{})==='OUT';
  o.refs=Object.keys(ZOOM.REFS).every(n=>ZOOM.ref(n,0,0).length>40);
  o.lint=o.lint0;
  o.rule=/## 30\. Special shots/.test(document.getElementById('rulebook').textContent)&&/\| 8 \| Special shots/.test(document.getElementById('rulebook').textContent);
  return o;});
for(const m of ['dive','pull','xray','cutaway','lens','exploded','scale'])ok(E[m]&&!E[m].err&&E[m].moved&&E[m].len>500,'engine: ZOOM.'+m+' draws and moves'+(E[m]&&E[m].err?' ('+E[m].err+')':''));
ok(E.dive.ids>=1&&E.xray.ids>=1,'engine: windows use their own clip ids');
ok(E.diveEnd,'engine: before a dive only the outside, after it only the inside');
ok(E.pullEnds,'engine: a pull starts inside and ends outside');
ok(E.xrayClosed,'engine: the x-ray window closes at its end time');
ok(E.refs,'engine: every grey reference thing draws');
ok(E.lint,'engine: the worked example still passes LINT');
ok(E.rule,'rulebook: section 30 and the version 8 entry');

// ---------- 2. the app ----------
const promptOf=t=>t.includes('</project_file>')?t.slice(t.indexOf('</project_file>')+15).trim():t;
const clipP=async()=>{await p.waitForTimeout(1200);return promptOf(await p.evaluate(()=>navigator.clipboard.readText()))};
const clear=()=>p.evaluate(()=>document.querySelectorAll('.toast').forEach(t=>t.remove()));
async function pasteIn(card,text){await clear();await p.locator('.jt-body .jt-row',{hasText:card}).locator('button:has-text("Paste reply"), button:has-text("Replace reply")').first().click();await p.fill('.modal textarea',text);await p.click('.modal .btn.primary');for(let k=0;k<120;k++){if(await p.evaluate(()=>!document.querySelector('.veil')||!!document.querySelector('.veil .rep')))break;await p.waitForTimeout(500)}await p.waitForTimeout(300)}
await p.goto('http://localhost:8125/');await p.waitForTimeout(700);await p.click('.newcard');await p.fill('.modal input','Shots');await p.press('.modal input','Enter');await p.waitForTimeout(700);await p.click('text=Use Gilded');await p.waitForTimeout(600);
await p.fill('textarea',fs.readFileSync(SP+'/script-long.txt','utf8'));await p.setInputFiles('input[type=file]',SP+'/long.wav');await p.waitForTimeout(1200);await p.click('text=Listen and split into parts');await p.waitForSelector('.tl',{timeout:120000});await p.waitForTimeout(500);
await p.addScriptTag({path:SP+'/fixtures.js'});
await p.click('.nextbar >> text=Next: Prompts');await p.waitForTimeout(800);await p.click('.tabs button:has-text("All")');await p.waitForTimeout(300);
await p.click('.jt-body .jt-row >> text=Copy prompt');const pp=await clipP();
ok(/SPECIAL SHOTS \(section 30\)/.test(pp)&&/"shots": \[\{"part": 2/.test(pp)&&/dive \(dive in\)/.test(pp),'plan prompt: special shots rules and the "shots" field');
const parts=await p.evaluate(()=>STORE.list().then(a=>AUDIO.plan(a[0]).parts.map(x=>({id:x.id}))));
const plan=await p.evaluate(ps=>{const t=FIX.plan(ps,0),j=JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1));j.shots=[{part:2,word:'pulse',shot:'dive',what:'into the chest to the slow heart'},{part:3,word:'ice',shot:'teleport',what:'x'}];return '```json\n'+JSON.stringify(j)+'\n```'},parts);
await pasteIn('The plan',plan);
const rep=await p.evaluate(()=>document.querySelector('.modal')?document.querySelector('.modal').innerText:'');
ok(/Unknown special shots: teleport/.test(rep)||await p.evaluate(()=>STORE.list().then(a=>JSON.stringify(a[0].jobs.plan.A.check.problems).includes('Unknown special shots'))),'plan check: an unknown shot name is flagged');
if(await p.locator('.veil').count())await p.click('.modal .x');
await pasteIn('Assets: crate',await p.evaluate(()=>FIX.asset('crate','#C8402F')));if(await p.locator('.veil').count())await p.click('.modal .x');
await pasteIn('People: nurse',await p.evaluate(()=>FIX.cast('#2F7F7A')));if(await p.locator('.veil').count())await p.click('.modal .x');
await p.locator('.jt-body .jt-row',{hasText:'Part 2:'}).locator('text=Copy prompt').click();const sp=await clipP();
ok(/SPECIAL SHOTS FOR THIS PART/.test(sp)&&/at T\('pulse'\): Dive in/.test(sp)&&/Use ZOOM\.dive\(\.\.\.\)/.test(sp),'scene prompt: the planned shot with its word and call');
await p.locator('.jt-body .jt-row',{hasText:'Part 1:'}).locator('text=Copy prompt').click();const sp1=await clipP();ok(!/SPECIAL SHOTS FOR THIS PART/.test(sp1),'scene prompt: no shot text where none is planned');
const fx=await p.evaluate(async()=>{const tpl=await (await fetch('styles/gilded-kasumi/project.html')).text();const P=(await STORE.list())[0];const plan=GK.plan(P);return plan.parts.map(pt=>FIX.scene(tpl,pt,P.timing.words,plan,1))});
await pasteIn('Part 2:',fx[1]);
const sc=await p.evaluate(()=>STORE.list().then(a=>JSON.stringify(a[0].jobs['scene-2'].A.check.problems)));
ok(/The planned dive shot is missing/.test(sc)&&/ZOOM\.dive/.test(sc),'scene check: a missing planned shot is flagged with the call to add');
if(await p.locator('.veil').count())await p.click('.modal .x');
const withDive=fx[1].replace('P.draw=(t,X)=>{','P.draw=(t,X)=>{if(t>T(\'pulse\')&&t<T(\'pulse\')+1.4)return ZOOM.dive(t,T(\'pulse\'),1.2,surface(t,X),`<rect width="${STAGE.W}" height="${STAGE.H}" fill="#3A1020"/>`,{x:280,y:470,r:24});');
ok(withDive!==fx[1],'test reply with the dive differs');
await pasteIn('Part 2:',withDive);
const sc2=await p.evaluate(()=>STORE.list().then(a=>JSON.stringify(a[0].jobs['scene-2'].A.check)));
ok(!/The planned dive shot is missing/.test(sc2),'scene check: the shot is found when the call is there');
ok(!/script-error/.test(sc2),'the dive runs inside a real part without errors');
console.log(R.join('\n'));console.log('PAGE ERRORS',JSON.stringify(errs.slice(0,8)));await b.close();})();
