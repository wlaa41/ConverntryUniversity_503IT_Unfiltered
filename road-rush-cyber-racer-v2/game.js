requireLogin();nav();
const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
const modal=document.getElementById('quizModal'),endModal=document.getElementById('endModal'),cin=document.getElementById('cinematic');
const progress=get(LS.progress,{unlocked:1,level:1}); if(progress.level>progress.unlocked) location.href='dashboard.html';
const prefs=get(LS.prefs,{car:'classic',gender:'female'});
const LEVELS={
 1:{name:'Level 1: Safe Password City',target:7000,speed:2.45,spawn:1320,traffic:3,mission:'Reach 7,000m and clear 5 cyber checkpoints. Questions are spaced out for a longer, more playable race.'},
 2:{name:'Level 2: Phishing Highway',target:9000,speed:3.0,spawn:1180,traffic:4,mission:'Reach 9,000m, survive faster traffic and clear 5 phishing checkpoints. Complete Level 1 first to unlock this.'},
 3:{name:'Level 3: Dark Web Rush',target:11000,speed:3.45,spawn:1080,traffic:5,mission:'Reach 11,000m through the cyber storm and clear 5 advanced checkpoints. This is the final mission.'}
};
const QUESTIONS={
 1:[['Which password is the strongest?',['rain123','Password2026','R@in!92#Blue','12345678'],2],['What should you do before clicking an unknown link?',['Click quickly','Check sender and link carefully','Forward it to everyone','Enter your password'],1],['Why is two-factor authentication useful?',['It adds a second layer of security','It makes your phone slower','It deletes old accounts','It shares passwords'],0],['Which one is personal data?',['Favourite colour only','Full name, address or email','A random emoji','A game score only'],1],['What is safest on public Wi‑Fi?',['Use banking without care','Avoid sensitive logins or use VPN','Share your password','Turn off all updates'],1]],
 2:[['A bank email asks for your PIN. What is it likely to be?',['Phishing','A normal receipt','A safe update','A newsletter'],0],['Which URL looks safest?',['http://bank-login-free.com','https://officialbank.co.uk','bank.verify-now.net','bit.ly/free-prize'],1],['A “free iPhone” page asks for card details. What should you do?',['Pay the fee','Ignore/report it','Share it with friends','Use your main password'],1],['Social engineering means:',['Tricking people into revealing information','Designing social media icons','Buying software','Posting videos'],0],['If an email creates panic, first you should:',['React instantly','Verify using an official source','Download the attachment','Send your password'],1]],
 3:[['What is malware?',['Software designed to harm systems','A password manager','A safe update','A browser theme'],0],['After an account hack, what should you do first?',['Ignore it','Change password, enable 2FA and report it','Post your password','Use the same login'],1],['Why should software be updated?',['To receive security patches','To get more adverts','To lose files','No reason'],0],['Ransomware usually:',['Encrypts files and demands payment','Makes your laptop faster','Cleans your desktop','Sends friendly emails'],0],['Best privacy habit?',['Overshare live location','Limit personal info and review settings','Accept all strangers','Use one password everywhere'],1]]
};
const HINTS={
 1:[
  'Look for length, symbols and mixed characters, not simple words.',
  'Unknown links should be checked before you trust them.',
  'Think about an extra check after the password.',
  'Personal data can identify or contact a real person.',
  'Public Wi-Fi is risky for private logins.'
 ],
 2:[
  'Real banks do not ask for your PIN by email.',
  'Official HTTPS websites are safer than strange domains or shortened prize links.',
  'Too-good-to-be-true prizes are usually scams.',
  'This attack targets people, not only computers.',
  'Pressure and panic are common scam techniques.'
 ],
 3:[
  'Malware is malicious software.',
  'Secure the account first, then report the issue.',
  'Updates often fix security weaknesses.',
  'Ransomware locks or encrypts files for money.',
  'Privacy means sharing less and checking settings.'
 ]
};
const CAR_COLORS={classic:['#ffffff','#aef8ff'],neon:['#38e8ff','#ff4fd8'],shadow:['#29314e','#8a7cff'],gold:['#ffd84a','#ff8b3d']};
let L=LEVELS[progress.level],running=false,paused=false,last=0,distance=0,score=0,coins=0,lives=3,shield=0,nitro=1,manualGear=1,questionsAnswered=0,correct=0,invuln=0,shake=0,spawnTimer=0,itemTimer=0,roadOffset=0,keys={},entities=[];
let W=0,H=0,road={left:0,right:0,topLeft:0,topRight:0},player={x:0,y:0,w:70,h:105,vx:0,target:null};
let currentQuestion=null,hintUsed=false,quizTimer=null,quizTimeLeft=0; const HINT_UNLOCK_SCORE=1200; const QUIZ_LIMITS={1:20,2:30,3:60};
document.getElementById('levelName').textContent=L.name;document.getElementById('missionText').textContent=L.mission;
function resize(){const box=document.getElementById('gameArea').getBoundingClientRect();canvas.width=Math.floor(box.width*devicePixelRatio);canvas.height=Math.floor(box.height*devicePixelRatio);canvas.style.width=box.width+'px';canvas.style.height=box.height+'px';ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);W=box.width;H=box.height;road.left=W*.08;road.right=W*.92;road.topLeft=W*.32;road.topRight=W*.68;player.w=Math.max(62,Math.min(82,W*.075));player.h=player.w*1.52;player.y=H-player.h-36;if(!player.x)player.x=W/2-player.w/2;clampPlayer()}window.addEventListener('resize',resize);resize();
let audioCtx=null,engine=null,music=null,ambientBeat=0;function tone(f=440,d=.1,type='sine',g=.05,delay=0){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),gain=audioCtx.createGain();o.connect(gain);gain.connect(audioCtx.destination);o.type=type;o.frequency.setValueAtTime(f,audioCtx.currentTime+delay);gain.gain.setValueAtTime(g,audioCtx.currentTime+delay);gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+delay+d);o.start(audioCtx.currentTime+delay);o.stop(audioCtx.currentTime+delay+d+.03)}catch(e){}}
function sound(s){if(s==='start'){[180,260,380,560].forEach((f,i)=>tone(f,.12,'triangle',.055,i*.08));startEngine();startMusic()} if(s==='checkpoint'){tone(740,.12,'sine',.06);tone(980,.18,'triangle',.05,.1)} if(s==='coin'){tone(1050,.08,'sine',.05);tone(1450,.1,'sine',.04,.06)} if(s==='hit'){tone(130,.18,'sawtooth',.08);tone(70,.28,'square',.05,.08)} if(s==='ok'){tone(530,.1,'triangle',.05);tone(790,.14,'triangle',.05,.08)} if(s==='bad'){tone(210,.14,'sawtooth',.06);tone(110,.25,'sawtooth',.045,.09)} if(s==='nitro'){tone(450,.08,'sawtooth',.04);tone(900,.28,'square',.035,.08)} if(s==='lap'){tone(620,.08,'triangle',.035);tone(760,.10,'triangle',.03,.08)} if(s==='win'){[523,659,784,1046].forEach((f,i)=>tone(f,.16,'triangle',.055,i*.11))} if(s==='speed'){tone(680,.08,'sawtooth',.035);tone(920,.08,'sawtooth',.025,.05)} if(s==='brake'){tone(260,.12,'sine',.04);tone(170,.12,'sine',.035,.07)}}
function startEngine(){if(engine)return;engine=setInterval(()=>{if(running&&!paused)tone((48+Math.random()*24)*manualGear,.055,'sawtooth',.012)},95)}
function startMusic(){if(music)return;music=setInterval(()=>{if(running&&!paused){const seq=[196,247,294,247,330,294,247,220];tone(seq[ambientBeat%seq.length],.09,'triangle',.014);if(ambientBeat%4===0)tone(98,.08,'sine',.016);ambientBeat++;}},280)}
function stopMusic(){if(music){clearInterval(music);music=null}}
function stopEngine(){if(engine){clearInterval(engine);engine=null}stopMusic()}
document.getElementById('beginBtn').onclick=()=>{running=true;paused=false;last=performance.now();sound('start');document.getElementById('beginBtn').disabled=true;requestAnimationFrame(loop)};
window.onkeydown=e=>{const k=e.key.toLowerCase(); keys[k]=true; if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();};window.onkeyup=e=>{keys[e.key.toLowerCase()]=false};
function setTarget(clientX){const r=canvas.getBoundingClientRect();player.target=clientX-r.left-player.w/2}canvas.onmousemove=e=>{if(running&&!paused)setTarget(e.clientX)};canvas.ontouchmove=e=>{if(running&&!paused)setTarget(e.touches[0].clientX);e.preventDefault()};
function hold(id,key){const b=document.getElementById(id);b.onmousedown=b.ontouchstart=e=>{keys[key]=true;e.preventDefault()};b.onmouseup=b.onmouseleave=b.ontouchend=()=>keys[key]=false}hold('leftBtn','arrowleft');hold('rightBtn','arrowright');hold('upBtn','arrowup');hold('downBtn','arrowdown');
function roadWidthAt(y){const t=y/H;return {l:road.topLeft+(road.left-road.topLeft)*t,r:road.topRight+(road.right-road.topRight)*t}}function clampPlayer(){const b=roadWidthAt(player.y+player.h*.75);player.x=Math.max(b.l+14,Math.min(b.r-player.w-14,player.x))}
function drawRoad(){ctx.save();ctx.fillStyle='#071022';ctx.fillRect(0,0,W,H);let sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#111b46');sky.addColorStop(.65,'#071022');sky.addColorStop(1,'#050612');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);for(let i=0;i<26;i++){let x=(i*81+roadOffset*.08)%W,h=70+((i*41)%160);ctx.fillStyle=i%2?'rgba(56,232,255,.18)':'rgba(255,79,216,.14)';ctx.fillRect(x,H*.15-h,42,h);ctx.fillStyle='rgba(255,255,255,.10)';for(let wy=H*.15-h+16;wy<H*.15-10;wy+=22){ctx.fillRect(x+8,wy,6,8);ctx.fillRect(x+24,wy,6,8)}}drawScenery();ctx.beginPath();ctx.moveTo(road.topLeft,0);ctx.lineTo(road.topRight,0);ctx.lineTo(road.right,H);ctx.lineTo(road.left,H);ctx.closePath();let rg=ctx.createLinearGradient(0,0,0,H);rg.addColorStop(0,'#31343d');rg.addColorStop(1,'#151515');ctx.fillStyle=rg;ctx.fill();ctx.lineWidth=8;ctx.strokeStyle='#ffd84a';ctx.beginPath();ctx.moveTo(road.topLeft,0);ctx.lineTo(road.left,H);ctx.moveTo(road.topRight,0);ctx.lineTo(road.right,H);ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.75)';ctx.lineWidth=5;ctx.setLineDash([34,30]);ctx.lineDashOffset=-roadOffset;for(let p of [.33,.5,.67]){ctx.beginPath();ctx.moveTo(road.topLeft+(road.topRight-road.topLeft)*p,0);ctx.lineTo(road.left+(road.right-road.left)*p,H);ctx.stroke()}ctx.setLineDash([]);ctx.restore()}
function drawScenery(){
  for(let i=0;i<20;i++){
    let y=((i*150+(roadOffset*1.15))%(H+220))-110;
    let t=Math.max(0,Math.min(1,y/H));
    let size=18+t*46;
    let b=roadWidthAt(y);
    let leftX=b.l-45-t*90, rightX=b.r+18+t*75;
    if(i%4===0){drawBillboard(leftX-70,y,size*1.35,i);drawBillboard(rightX+18,y,size*1.25,i+1)}
    else if(i%3===0){drawLamp(leftX+18,y,size);drawLamp(rightX+12,y,size)}
    else{drawTree(leftX,y,size);drawTree(rightX,y,size*.96)}
  }
  for(let i=0;i<13;i++){
    let y=((i*210+(roadOffset*.92))%(H+180))-90;
    let b=roadWidthAt(y), t=Math.max(0,Math.min(1,y/H));
    ctx.fillStyle='rgba(255,216,74,.38)';
    ctx.fillRect(b.l-20-t*26,y,10+t*4,52+t*52);
    ctx.fillRect(b.r+10+t*22,y,10+t*4,52+t*52);
  }
}
function drawTree(x,y,s){
  ctx.save();ctx.globalAlpha=.9;ctx.fillStyle='#13220f';ctx.fillRect(x+s*.42,y+s*.58,s*.14,s*.55);
  let g=ctx.createRadialGradient(x+s*.5,y+s*.38,2,x+s*.5,y+s*.38,s*.55);g.addColorStop(0,'#55ff9d');g.addColorStop(.45,'#187c45');g.addColorStop(1,'rgba(7,30,20,.55)');ctx.fillStyle=g;
  ctx.beginPath();ctx.arc(x+s*.5,y+s*.35,s*.38,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawLamp(x,y,s){
  ctx.save();ctx.strokeStyle='rgba(180,230,255,.75)';ctx.lineWidth=Math.max(2,s*.055);ctx.beginPath();ctx.moveTo(x,y+s*.9);ctx.lineTo(x+s*.10,y+s*.15);ctx.lineTo(x+s*.36,y+s*.12);ctx.stroke();
  ctx.fillStyle='#eaffff';ctx.shadowColor='#38e8ff';ctx.shadowBlur=20;ctx.beginPath();ctx.arc(x+s*.39,y+s*.12,s*.09,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawBillboard(x,y,s,i){
  ctx.save();ctx.fillStyle='rgba(5,10,25,.88)';ctx.strokeStyle=i%2?'#38e8ff':'#ff4fd8';ctx.lineWidth=2;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=12;ctx.fillRect(x,y,s*1.55,s*.72);ctx.strokeRect(x,y,s*1.55,s*.72);
  ctx.shadowBlur=0;ctx.fillStyle='#f8fbff';ctx.font=Math.max(9,s*.18)+'px system-ui';ctx.fillText(i%2?'2FA ON':'STAY SAFE',x+s*.12,y+s*.42);ctx.fillStyle='rgba(255,255,255,.4)';ctx.fillRect(x+s*.2,y+s*.82,s*.08,s*.6);ctx.fillRect(x+s*1.2,y+s*.82,s*.08,s*.6);ctx.restore();
}
function drawCar(x,y,w,h,c1,c2,enemy=false){ctx.save();ctx.translate(x+w/2,y+h/2);ctx.shadowColor=enemy?'rgba(255,36,85,.55)':'rgba(56,232,255,.55)';ctx.shadowBlur=18;let grd=ctx.createLinearGradient(-w/2,-h/2,w/2,h/2);grd.addColorStop(0,c1);grd.addColorStop(1,c2);roundRect(-w/2,-h/2,w,h,18,grd);roundRect(-w*.27,-h*.31,w*.54,h*.34,12,enemy?'#ff9eb0':'rgba(5,12,28,.72)');ctx.shadowBlur=0;ctx.fillStyle='#05070e';roundRect(-w*.62,-h*.26,w*.18,h*.28,8);roundRect(w*.44,-h*.26,w*.18,h*.28,8);roundRect(-w*.62,h*.16,w*.18,h*.28,8);roundRect(w*.44,h*.16,w*.18,h*.28,8);ctx.fillStyle=enemy?'#ffccd5':'#eaffff';roundRect(-w*.25,h*.34,w*.16,h*.06,5);roundRect(w*.09,h*.34,w*.16,h*.06,5);ctx.restore()}
function roundRect(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill()}
function spawn(type){let b=roadWidthAt(-20),x=b.l+30+Math.random()*(b.r-b.l-100),w=type==='enemy'?64:42,h=type==='enemy'?98:42;entities.push({type,x,y:-120,w,h,speed:1+Math.random()*.7,kind:['💰','🛡️','⚡','💾'][Math.floor(Math.random()*4)]})}
function loop(t){if(!running||paused)return;let dt=Math.min(32,t-last);last=t;updateManualGear(dt);let currentSpeed=L.speed*nitro*manualGear;roadOffset+=dt*(currentSpeed*.22);distance+=dt*currentSpeed/22;score+=Math.floor(currentSpeed);spawnTimer+=dt;itemTimer+=dt;if(spawnTimer>L.spawn){spawn('enemy');if(progress.level>1&&Math.random()<.22)spawn('enemy');spawnTimer=0}if(itemTimer>1350){spawn('item');itemTimer=0}let input=(keys.arrowright?1:0)-
          (keys.arrowleft?1:0); 
if(player.target!=null){
  // Mouse/touch control now glides gently instead of snapping across the road.
  player.x+=(player.target-player.x)*.045;
  if(Math.abs(player.target-player.x)<3)player.target=null;
}else{
  // Keyboard steering is acceleration-based with a safe speed cap for enjoyable control.
  player.vx=player.vx*.88+input*.24;
  player.vx=Math.max(-3.8,Math.min(3.8,player.vx));
  player.x+=player.vx*dt/5.2;
}
clampPlayer();if(nitro>1){nitro-=.004;if(nitro<1)nitro=1}if(invuln>0)invuln-=dt;if(shake>0)shake-=dt;updateEntities(dt);checkQuestionGate();if(distance-lastLapSound>500){lastLapSound=distance;sound('lap')}draw();updateHud();requestAnimationFrame(loop)}
function updateManualGear(dt){let old=manualGear;if(keys.a)manualGear+=dt*.00055;else if(keys.d)manualGear-=dt*.0008;else manualGear+=(1-manualGear)*.018;manualGear=Math.max(.55,Math.min(1.45,manualGear));if(old<1.18&&manualGear>=1.18)sound('speed');if(old>.82&&manualGear<=.82)sound('brake')}
function updateEntities(dt){for(let i=entities.length-1;i>=0;i--){let e=entities[i];let sp=(L.speed*nitro*manualGear*dt/5.8)*e.speed;e.y+=sp;let b=roadWidthAt(e.y+e.h);e.x=Math.max(b.l+15,Math.min(b.r-e.w-15,e.x));if(rect(player,e)){if(e.type==='item'){collect(e);entities.splice(i,1);continue}else if(invuln<=0){crash();entities.splice(i,1);continue}}if(e.y>H+150)entities.splice(i,1)}}
function rect(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}function collect(e){coins+=e.kind==='💰'?5:12;score+=150;if(e.kind==='🛡️')shield=1;if(e.kind==='⚡'){nitro=1.28;sound('nitro')}else sound('coin')}
function crash(){if(shield){shield=0;toast('Shield blocked the crash!');sound('ok');return}lives--;invuln=1500;shake=420;sound('hit');if(lives<=0)gameOver('You lost all lives before completing the cyber mission.')} 
function checkQuestionGate(){let next=(questionsAnswered+1)/6*L.target;if(questionsAnswered<5&&distance>=next)showQuestion(false);if(distance>=L.target&&questionsAnswered>=5){if(correct>=3)win();else gameOver('You reached the finish, but you need at least 3 correct cyber answers to unlock the next level.')}}
function showQuestion(){
  paused=true;clearInterval(quizTimer);quizTimer=null;cin.classList.add('show');setTimeout(()=>cin.classList.remove('show'),650);sound('checkpoint');
  let q=QUESTIONS[progress.level][questionsAnswered]; currentQuestion=q; hintUsed=false;
  modal.classList.add('active');
  document.getElementById('quizTitle').textContent=`Cyber Checkpoint ${questionsAnswered+1} / 5`;
  document.getElementById('quizQuestion').textContent=q[0];
  quizTimeLeft=QUIZ_LIMITS[progress.level]||20; updateQuizTimer();
  quizTimer=setInterval(()=>{quizTimeLeft--;updateQuizTimer();if(quizTimeLeft<=0){clearInterval(quizTimer);answer(-1,q[2]);}},1000);
  document.getElementById('quizAnswers').innerHTML=q[1].map((a,i)=>`<button class="answer" onclick="answer(${i},${q[2]})">${a}</button>`).join('');
  const hintBtn=document.getElementById('hintBtn'),hintText=document.getElementById('hintText');
  hintText.textContent='';
  if(score>=HINT_UNLOCK_SCORE){hintBtn.disabled=false;hintBtn.textContent='Use Hint';}
  else{hintBtn.disabled=true;hintBtn.textContent=`Hint unlocks at ${HINT_UNLOCK_SCORE} score`; }
}
function updateQuizTimer(){const el=document.getElementById('quizTimer');if(el)el.textContent=`⏱️ Time left: ${quizTimeLeft}s`;}
function showHint(){
  const hintBtn=document.getElementById('hintBtn'),hintText=document.getElementById('hintText');
  if(hintUsed||score<HINT_UNLOCK_SCORE)return;
  hintUsed=true;
  const hint=(HINTS[progress.level]&&HINTS[progress.level][questionsAnswered])||'Read the question carefully and choose the safest cyber-security action.';
  hintText.textContent='💡 Hint: '+hint;
  hintBtn.textContent='Hint used';
  hintBtn.disabled=true;
  sound('coin');
}

function answer(i,correctIdx){clearInterval(quizTimer);quizTimer=null;modal.classList.remove('active');questionsAnswered++;let users=get(LS.users,[]),u=activeUser();users=users.map(x=>x.email===u.email?{...x,totalQuestions:(x.totalQuestions||0)+1,correctQuestions:(x.correctQuestions||0)+(i===correctIdx?1:0)}:x);set(LS.users,users);if(i===correctIdx){correct++;score+=500;coins+=20;nitro=1.28;sound('ok');toast('Correct! Nitro boost unlocked.')}else{lives--;sound('bad');toast('Wrong answer: you lost 1 life.');if(lives<=0)return gameOver('Cyber checkpoint failed and no lives remain.')}paused=false;last=performance.now();requestAnimationFrame(loop)}
function draw(){ctx.save();if(shake>0)ctx.translate((Math.random()-.5)*10,(Math.random()-.5)*7);drawRoad();entities.forEach(e=>{if(e.type==='enemy')drawCar(e.x,e.y,e.w,e.h,'#ff2455','#870015',true);else{ctx.font='34px serif';ctx.shadowColor='rgba(80,255,157,.8)';ctx.shadowBlur=16;ctx.fillText(e.kind,e.x,e.y+35);ctx.shadowBlur=0}});let cols=CAR_COLORS[prefs.car]||CAR_COLORS.classic;if(invuln>0&&Math.floor(invuln/120)%2===0){ctx.globalAlpha=.45}drawCar(player.x,player.y,player.w,player.h,cols[0],cols[1]);ctx.globalAlpha=1;if(shield){ctx.strokeStyle='rgba(80,255,157,.8)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(player.x+player.w/2,player.y+player.h/2,player.h*.62,0,Math.PI*2);ctx.stroke()}drawMiniDriver();ctx.restore()}
function drawMiniDriver(){ctx.font='26px serif';ctx.fillText(prefs.gender==='male'?'👦':'👧',18,38)}
let lastLapSound=0;
function updateHud(){document.getElementById('lives').textContent='❤️'.repeat(Math.max(0,lives))+(shield?' 🛡️':'');document.getElementById('questions').textContent=`${questionsAnswered} / 5`;document.getElementById('score').textContent=score;document.getElementById('coins').textContent=coins;document.getElementById('speed').textContent=(nitro*manualGear).toFixed(1)+'x';const ms=document.getElementById('manualSpeed'); if(ms)ms.textContent=manualGear>1.15?'Boost':manualGear<.85?'Braking':'Normal';let pct=Math.min(100,distance/L.target*100);document.getElementById('distanceFill').style.width=pct+'%';document.getElementById('distanceText').textContent=`${Math.floor(distance)}m / ${L.target}m`}
function saveResult(won){let users=get(LS.users,[]),u=activeUser();users=users.map(x=>x.email===u.email?{...x,coins:(x.coins||0)+coins,bestScore:Math.max(x.bestScore||0,score)}:x);set(LS.users,users);if(won){let p=get(LS.progress,{unlocked:1,level:1});if(progress.level<3)set(LS.progress,{...p,unlocked:Math.max(p.unlocked,progress.level+1),level:progress.level+1})}}
function win(){running=false;stopEngine();saveResult(true);sound('win');document.getElementById('endTitle').textContent='Mission Complete!';document.getElementById('endMsg').textContent=progress.level<3?`Excellent driving! You cleared 5 questions with ${correct}/5 correct and unlocked Level ${progress.level+1}. Score: ${score}. Coins earned: ${coins}.`:`You completed all 3 cyber racing missions with ${correct}/5 correct in this level. Score: ${score}. Coins earned: ${coins}.`;endModal.classList.add('active')}
function gameOver(msg){running=false;paused=true;stopEngine();saveResult(false);document.getElementById('endTitle').textContent='Game Over';document.getElementById('endMsg').textContent=`${msg} Score: ${score}. Coins earned: ${coins}. Questions cleared: ${questionsAnswered}/5. Correct answers: ${correct}/5.`;endModal.classList.add('active')}
updateHud();draw();
