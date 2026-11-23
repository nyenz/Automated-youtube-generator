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
  const more={frame:(t,X)=>scene(t,X)+FRAME.show('tv',inner(t),{x:270,y:300,w:300,text:'NEWS'}),framePull:(t,X)=>{const b=FRAME.box('tv',270,300,300);return ZOOM.pull(t,1,1.2,inner(t),scene(t,X)+FRAME.show('tv',inner(t),b),b)},
    kinds:(t,X)=>FRAME.KINDS.map((k,i)=>FRAME.show(k,inner(t),{x:100+(i%4)*110,y:200+Math.floor(i/4)*300,w:90,text:'x'})).join(''),
    waterline:(t,X)=>MOVE.waterline(t,1,1.2,scene(t,X),inner(t),{from:900,to:-40}),through:(t,X)=>MOVE.through(t,1,1.2,scene(t,X),inner(t)),wall:(t,X)=>MOVE.through(t,1,1.2,scene(t,X),inner(t),{dir:'right',edge:'wall'}),wipe:(t,X)=>MOVE.wipe(t,1,1.2,scene(t,X),inner(t)),morph:(t,X)=>MOVE.morph(t,1,1.2,scene(t,X),inner(t)),
    flashback:(t,X)=>TIME.flashback(t,1,3,scene(t,X)),date:(t,X)=>scene(t,X)+TIME.card(t,1,3,'March 1999',{sub:'Norway'}),calendar:(t,X)=>scene(t,X)+TIME.calendar(t,1,1.2,['MON 3','TUE 4','WED 5']),clock:(t,X)=>scene(t,X)+TIME.clock(t,1,1.2,9,33),
    counter:(t,X)=>scene(t,X)+TIME.counter(t,1,1.2,1950,2024),rewind:(t,X)=>scene(TIME.back(t,1,1.2,3),X)+TIME.rewind(t,1,1.2),timeline:(t,X)=>scene(t,X)+TIME.timeline(t,1,1.2,{marks:['1990','2000','2024']}),
    map:(t,X)=>scene(t,X)+PLACE.map(t,1,1.2,{points:[[.2,.3,'A'],[.8,.4,'B']]}),place:(t,X)=>scene(t,X)+PLACE.card(t,1,3,'Oslo','Norway'),globe:(t,X)=>PLACE.globe(t,1,1.2,{pinAt:[.2,-.2]}),
    tag:(t,X)=>{const sp=X.screen(-40,-340);return scene(t,X)+SHOW.tag(t,1,3,{name:'Dr. Hansen',role:'doctor',x:sp[0],y:sp[1]})},callout:(t,X)=>scene(t,X)+SHOW.callout(t,1,3,{x:300,y:500,text:'7 C'}),gauge:(t,X)=>scene(t,X)+SHOW.gauge(t,1,3,{min:0,max:40,from:37,value:14}),
    split:(t,X)=>SHOW.split(t,1,scene(t,X),inner(t),{labels:['A','B']}),inset:(t,X)=>SHOW.inset(t,1,3,scene(t,X),inner(t)),diagram:(t,X)=>scene(t,X)+SHOW.draw(t,1,1,['M10,10 L300,300']),spot:(t,X)=>scene(t,X)+SHOW.spot(t,1,3,{x:300,y:500}),iris:(t,X)=>scene(t,X)+SHOW.iris(t,1,1.2,{}),
    slow:(t,X)=>scene(SHOW.slowT(t,1,3,.3),X),match:(t,X)=>SHOW.match(t,1.6,scene(t,X),inner(t)),shake:(t,X)=>SHOW.shake(t,1.5,scene(t,X),14),hush:(t,X)=>scene(t,X)+SHOW.hush(t,1,3),
    page:(t,X)=>TURN.go('page',t,1,1.2,scene(t,X),inner(t)),fold:(t,X)=>TURN.go('fold',t,1,1.2,scene(t,X),inner(t)),flats:(t,X)=>TURN.go('flats',t,1,1.2,scene(t,X),inner(t)),ink:(t,X)=>TURN.go('ink',t,1,1.2,scene(t,X),inner(t))};
  o.more={};for(const m in more){const P=PART({id:++id,of:1,AUDIO_START:0,AUDIO_END:5,SEG:[[0,5,'shot test words']],KEYS:[[0,0,40,1.2],[5,0,40,1.3]],draw:(t,X)=>more[m](t,X)});
    try{const a=P.render(.5),b=P.render(1.7);o.more[m]=a!==b?'ok':'still';}catch(e){o.more[m]='error: '+e.message;}}
  o.keys=MOVE.keys('crane',1,3,[0,60,2]).length===2&&MOVE.keys('crane',1,3,[0,60,2])[1][3]<2;
  o.backT=Math.abs(TIME.back(2.2,1,1.2,3)-(1-3))<.01&&TIME.back(.5,1,1.2,3)===.5&&SHOW.slowT(2,1,3,.5)===1.5;
  {const J=PART({id:++id,of:3,AUDIO_START:0,AUDIO_END:5,SEG:[[0,5,'join test words']],IN:'ink',OUT:'page',draw:(t,X)=>scene(t,X)});const s0=J.render(.05),s1=J.render(2),s2=J.render(4.95);o.joins=s0.length>s1.length&&s2.length>s1.length&&/#F3E4BE/.test(s2);}
  {const P1=PART({id:++id,of:1,AUDIO_START:0,AUDIO_END:5,SEG:[[0,5,'pass test words']],KEYS:[[0,0,60,1.5],[5,0,-700,1.5]],draw:(t,X)=>PASS.water(t,X,'ABOVE','BELOW',{level:0})});
   const a=P1.render(0),b=P1.render(2.5),c=P1.render(5);o.water=/ABOVE/.test(a)&&/ABOVE/.test(b)&&/BELOW/.test(b)&&!/ABOVE/.test(c)&&/BELOW/.test(c);
   const P2=PART({id:++id,of:1,AUDIO_START:0,AUDIO_END:5,SEG:[[0,5,'pass test words']],KEYS:[[0,0,60,1.5],[5,0,-900,1.5]],draw:(t,X)=>PASS.ground(t,X,'TOP','UNDER',{level:0,depth:160})});
   o.ground=/TOP/.test(P2.render(0))&&!/TOP/.test(P2.render(5))&&/UNDER/.test(P2.render(5));
   const P3=PART({id:++id,of:1,AUDIO_START:0,AUDIO_END:5,SEG:[[0,5,'pass test words']],KEYS:[[0,0,60,1.5],[5,1200,60,1.5]],draw:(t,X)=>PASS.wall(t,X,'LEFT','RIGHT',{at:300,thick:120})});
   o.wall=/LEFT/.test(P3.render(0))&&!/RIGHT/.test(P3.render(0))&&/RIGHT/.test(P3.render(5))&&!/LEFT/.test(P3.render(5));
   const P4=PART({id:++id,of:1,AUDIO_START:0,AUDIO_END:5,SEG:[[0,5,'pass test words']],KEYS:[[0,0,60,1.3],[2,300,250,2.6],[5,300,250,2.6]],draw:(t,X)=>PASS.into(t,X,2,1.2,'OUT','IN',{wx:300,wy:-250,w:120,h:100})});
   o.into=P4.render(1)==='OUT'||/OUT/.test(P4.render(1));o.into=o.into&&/IN/.test(P4.render(4.9));
   const P5=PART({id:++id,of:2,AUDIO_START:0,AUDIO_END:3,SEG:[[0,3,'carry test words']],IN:'carry',OUT:'carry',draw:()=>'<rect width="10" height="10"/>'});o.carry=!/opacity="1.00"/.test(P5.render(0))&&P5.render(0).indexOf('translate(0.0 0)')>=0;}
  o.diveEnd=ZOOM.dive(5,1,1.2,'OUT','IN',{})==='IN'&&ZOOM.dive(0,1,1.2,'OUT','IN',{})==='OUT';
  o.pullEnds=ZOOM.pull(0,1,1.2,'IN','OUT',{})==='IN'&&ZOOM.pull(5,1,1.2,'IN','OUT',{})==='OUT';
  o.xrayClosed=ZOOM.xray(4,1,3,'OUT','IN',{})==='OUT';
  o.refs=Object.keys(ZOOM.REFS).every(n=>ZOOM.ref(n,0,0).length>40);
  o.lint=o.lint0;
  o.rule=/## 30\. Special shots/.test(document.getElementById('rulebook').textContent)&&/\| 8 \| Special shots/.test(document.getElementById('rulebook').textContent)&&/## 33\. Explaining and emphasis/.test(document.getElementById('rulebook').textContent)&&/\| 9 \| Frames/.test(document.getElementById('rulebook').textContent)&&/## 34\. One take/.test(document.getElementById('rulebook').textContent);
  return o;});
for(const m of ['dive','pull','xray','cutaway','lens','exploded','scale'])ok(E[m]&&!E[m].err&&E[m].moved&&E[m].len>500,'engine: ZOOM.'+m+' draws and moves'+(E[m]&&E[m].err?' ('+E[m].err+')':''));
ok(E.dive.ids>=1&&E.xray.ids>=1,'engine: windows use their own clip ids');
ok(E.diveEnd,'engine: before a dive only the outside, after it only the inside');
ok(E.pullEnds,'engine: a pull starts inside and ends outside');
ok(E.xrayClosed,'engine: the x-ray window closes at its end time');
ok(E.refs,'engine: every grey reference thing draws');
ok(E.lint,'engine: the worked example still passes LINT');
for(const m in E.more)ok(E.more[m]==='ok','engine (sections 31 to 33): '+m+' draws and moves'+(E.more[m]!=='ok'?' ('+E.more[m]+')':''));
ok(E.keys,'engine: MOVE.keys gives camera keys for a crane');
ok(E.backT,'engine: rewind and slow motion clocks');
ok(E.joins,'engine: paper joins (ink in, page out) are drawn by the engine');
ok(E.water,'one take: PASS.water follows the camera through the surface');ok(E.ground,'one take: PASS.ground follows the camera into the earth');ok(E.wall,'one take: PASS.wall follows the camera through the wall');ok(E.into,'one take: PASS.into opens the window after the camera flies up');ok(E.carry,'one take: a carry join draws no dip and no slide');
ok(E.rule,'rulebook: sections 30 to 33 and the version 8 and 9 entries');

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
ok(/SPECIAL SHOTS \(sections 30 to 33\)/.test(pp)&&/"shots": \[\{"part": 2/.test(pp)&&/zoom and inside views/.test(pp)&&/flashback/.test(pp)&&/paper join: page, fold, flats, ink/.test(pp)&&/carry \(the same place flowing on/.test(pp)&&/ONE TAKE/.test(pp),'plan prompt: special shots rules, groups, joins and the "shots" field');
const parts=await p.evaluate(()=>STORE.list().then(a=>AUDIO.plan(a[0]).parts.map(x=>({id:x.id}))));
const plan=await p.evaluate(ps=>{const t=FIX.plan(ps,0),j=JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1));j.parts[0].out='carry';j.parts[1].in='carry';j.shots=[{part:2,word:'pulse',shot:'dive',what:'into the chest to the slow heart'},{part:3,word:'ice',shot:'teleport',what:'x'}];return '```json\n'+JSON.stringify(j)+'\n```'},parts);
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
await pasteIn('Part 1:',fx[0]);if(await p.locator('.veil').count())await p.click('.modal .x');
await p.locator('.jt-body .jt-row',{hasText:'Part 2:'}).locator('text=Copy prompt').click();const cp=await clipP();ok(/CARRY JOIN IN \(one take\)/.test(cp)&&/The first camera key is exactly \[0, -?[\d.]+, -?[\d.]+, [\d.]+\]/.test(cp),'carry join: part 2 prompt says exactly where part 1 camera stopped');ok(/ONE TAKE \(section 34/.test(cp),'scene prompt carries the one take rule');
await pasteIn('Part 2:',fx[1]);
const sc=await p.evaluate(()=>STORE.list().then(a=>JSON.stringify(a[0].jobs['scene-2'].A.check.problems)));
ok(/does not start where part 1 ends/.test(sc),'carry join: a part that starts somewhere else is flagged with the key to use');
ok(/The planned dive shot is missing/.test(sc)&&/ZOOM\.dive/.test(sc),'scene check: a missing planned shot is flagged with the call to add');
if(await p.locator('.veil').count())await p.click('.modal .x');
const withDive=fx[1].replace('P.draw=(t,X)=>{','P.draw=(t,X)=>{if(t>T(\'pulse\')&&t<T(\'pulse\')+1.4)return ZOOM.dive(t,T(\'pulse\'),1.2,surface(t,X),`<rect width="${STAGE.W}" height="${STAGE.H}" fill="#3A1020"/>`,{x:280,y:470,r:24});');
ok(withDive!==fx[1],'test reply with the dive differs');
await pasteIn('Part 2:',withDive);
const sc2=await p.evaluate(()=>STORE.list().then(a=>JSON.stringify(a[0].jobs['scene-2'].A.check)));
ok(!/The planned dive shot is missing/.test(sc2),'scene check: the shot is found when the call is there');
ok(!/script-error/.test(sc2),'the dive runs inside a real part without errors');
console.log(R.join('\n'));console.log('PAGE ERRORS',JSON.stringify(errs.slice(0,8)));await b.close();})();
