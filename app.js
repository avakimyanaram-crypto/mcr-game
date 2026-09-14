const HERO_IMAGES = {"zam": "./assets/zam.webp?v=2.5", "first": "./assets/first.webp?v=2.5", "bif": "./assets/bif.webp?v=2.7", "school21": "./assets/school21.webp?v=2.5", "sitcenter": "./assets/sitcenter.webp?v=2.5", "mfc": "./assets/mfc.webp?v=2.5"};
const HEROES = {"zam": {"name": "Зам", "power": "Поглощение задач", "desc": "6 секунд задачи поглощаются автоматически."}, "first": {"name": "Первый зам", "power": "Многозадачность", "desc": "7 секунд ловит задачи сразу в расширенной зоне."}, "bif": {"name": "БИФ", "power": "Так не договаривались", "desc": "Мгновенно отменяет всю текущую волну задач."}, "school21": {"name": "Школа 21", "power": "Возражение", "desc": "Задачи разворачиваются обратно."}, "sitcenter": {"name": "Ситцентр", "power": "Замедление", "desc": "Резко замедляет время вокруг."}, "mfc": {"name": "МФЦ", "power": "Голосовой робот", "desc": "Робот несколько секунд перехватывает задачи."}};
const RANKED = ["Москва", "Республика Татарстан", "Московская область", "Санкт-Петербург", "Краснодарский край", "Свердловская область", "Нижегородская область", "Республика Башкортостан", "Ростовская область", "Самарская область", "Челябинская область", "Новосибирская область", "Тюменская область", "Пермский край", "Воронежская область", "Ленинградская область", "Калужская область", "Тульская область", "Липецкая область", "Курская область", "Орловская область", "Тамбовская область", "Брянская область", "Ярославская область", "Владимирская область", "Рязанская область", "Пензенская область", "Саратовская область", "Ульяновская область", "Смоленская область", "Республика Адыгея", "Республика Алтай", "Республика Бурятия", "Республика Дагестан", "Донецкая Народная Республика", "Республика Ингушетия", "Кабардино-Балкарская Республика", "Республика Калмыкия", "Карачаево-Черкесская Республика", "Республика Карелия", "Республика Коми", "Республика Крым", "Луганская Народная Республика", "Республика Марий Эл", "Республика Мордовия", "Республика Саха (Якутия)", "Республика Северная Осетия - Алания", "Республика Тыва", "Удмуртская Республика", "Республика Хакасия", "Чеченская Республика", "Чувашская Республика", "Алтайский край", "Забайкальский край", "Камчатский край", "Красноярский край", "Приморский край", "Ставропольский край", "Хабаровский край", "Амурская область", "Архангельская область", "Астраханская область", "Волгоградская область", "Вологодская область", "Запорожская область", "Ивановская область", "Иркутская область", "Калининградская область", "Кемеровская область - Кузбасс", "Кировская область", "Костромская область", "Курганская область", "Магаданская область", "Мурманская область", "Новгородская область", "Омская область", "Оренбургская область", "Псковская область", "Сахалинская область", "Тверская область", "Томская область", "Херсонская область", "Севастополь", "Еврейская автономная область", "Ненецкий автономный округ", "Ханты-Мансийский автономный округ - Югра", "Чукотский автономный округ", "Ямало-Ненецкий автономный округ"];
const TOTAL_RANKS = 89;
const POWER_META = {
  absorb:  {name:'Поглощение задач', icon:'🌀', cls:'fx-absorb'},
  multi:   {name:'Многозадачность',  icon:'⚙️', cls:'fx-multi'},
  disagree:{name:'Так не договаривались', icon:'💬', cls:'fx-disagree'},
  reverse: {name:'Возражение',       icon:'↩️', cls:'fx-reverse'},
  slow:    {name:'Замедление',       icon:'⏳', cls:'fx-slow'},
  robot:   {name:'Голосовой робот',  icon:'🤖', cls:'fx-robot'}
};
const POWER_CLASSES = Object.values(POWER_META).map(x=>x.cls);

let selectedId = 'first';
let state = {
  running:false, paused:false, score:0, misses:0, rank:89, combo:0,
  elapsed:0, spawnAcc:0, nextSpawn:0.72, last:0, playerX:.5, moveDir:0,
  bossX:.5, bossDir:1, tasks:[], raf:0,
  power:null, powerUntil:0, powerReadyAt:0, sound:true, audio:null, drag:false,
  ratingEvent:false, ratingEventPending:false, nextRatingEvent:18+Math.random()*12
};

function el(id){ return document.getElementById(id); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }

window.pickHero = function(id){
  if(!HEROES[id]) return;
  selectedId=id;
  document.querySelectorAll('.hero-card').forEach(c=>c.classList.toggle('selected',c.dataset.id===id));
  beep(340,.04,'sine');
};

window.startGame = function(){
  const start=el('startScreen'), game=el('gameScreen');
  if(!start || !game) return;
  start.classList.add('hidden');
  game.classList.remove('hidden');

  if(el('playerPortrait')) el('playerPortrait').src=HERO_IMAGES[selectedId] || HERO_IMAGES.zam;
  el('playerName').textContent=HEROES[selectedId].name;
  el('powerName').textContent=HEROES[selectedId].power;

  resetGame();
  state.running=true;
  state.paused=false;
  state.last=performance.now();
  state.raf=requestAnimationFrame(loop);
  toast('Белгородская область вступает в гонку!');
  beep(520,.07,'square');
};

function resetGame(){
  state.tasks.forEach(t=>t.node?.remove());
  Object.assign(state,{
    score:0,misses:0,rank:89,combo:0,elapsed:0,spawnAcc:0,nextSpawn:0.72,
    playerX:.5,bossX:.5,bossDir:1,tasks:[],power:null,powerUntil:0,powerReadyAt:0,
    ratingEvent:false,ratingEventPending:false,nextRatingEvent:18+Math.random()*12
  });
  el('gameOver')?.classList.add('hidden'); el('ratingChangeEvent')?.classList.add('hidden');
  el('pauseOverlay')?.classList.add('hidden');
  applyPowerVisual(null); updateHUD(); updateRanking(); updatePlayer(); updateBoss(); updatePower(performance.now());
}

function loop(now){
  if(!state.running) return;
  if(state.paused){ state.last=now; state.raf=requestAnimationFrame(loop); return; }

  let dt=Math.min(.035,(now-state.last)/1000 || 0);
  state.last=now;
  state.elapsed+=dt;

  const slow = state.power==='slow' && now<state.powerUntil;
  const worldDt = dt*(slow ? .34 : 1);
  const difficulty = 1 + Math.min(6.5,state.elapsed/16) + Math.min(2.8,state.score/18);

  state.playerX=clamp(state.playerX + state.moveDir*dt*.82,.02,.86);
  updatePlayer();

  // Когда пришло время изменения расчета рейтинга, новые задачи больше не создаются.
  // Уже летящие задачи должны закончиться, и только после этого событие появляется.
  if(!state.ratingEvent && !state.ratingEventPending && state.elapsed>=state.nextRatingEvent){
    state.ratingEventPending=true;
  }

  if(state.ratingEventPending && state.tasks.length===0 && !state.ratingEvent){
    triggerRatingChangeEvent();
  }

  if(!state.ratingEvent && !state.ratingEventPending){
    state.spawnAcc += worldDt;
    if(state.spawnAcc >= state.nextSpawn){
      state.spawnAcc = 0;

      const roll = Math.random();
      let burst = 1;
      if(difficulty > 1.8 && roll < .31) burst = 2;
      if(difficulty > 3.2 && roll < .14) burst = 3;
      if(difficulty > 5.0 && roll < .045) burst = 4;

      const longPause = Math.random() < .17;
      const quickRepeat = Math.random() < .16;
      const baseGap = Math.max(.23, 1.00 - state.elapsed*.0075 - Math.min(.27,state.score*.004));
      state.nextSpawn =
        baseGap * (.58 + Math.random()*1.22) +
        (longPause ? .55 + Math.random()*.95 : 0) -
        (quickRepeat ? .12 : 0);

      for(let n=0;n<burst;n++){
        const delay = n===0 ? 0 : (55 + Math.random()*170)*n + Math.random()*90;
        setTimeout(()=>{
          if(state.running && !state.paused && !state.ratingEvent && !state.ratingEventPending){
            spawnTask(difficulty, burst>1);
          }
        }, delay);
      }

      if(difficulty > 2.8 && Math.random() < .12){
        setTimeout(()=>{
          if(state.running && !state.paused && !state.ratingEvent && !state.ratingEventPending){
            spawnTask(difficulty,true);
          }
        }, 260 + Math.random()*620);
      }
    }
  }

  updateTasks(worldDt,now,difficulty);
  updatePower(now);

  if(state.misses>=9) return endGame(false);
  if(state.rank<=1) return endGame(true);

  state.raf=requestAnimationFrame(loop);
}

function spawnTask(difficulty,burst=false){
  const area=el('gameArea'); if(!area) return;
  const r=area.getBoundingClientRect();
  const node=document.createElement('div');
  node.className='task';
  const words=['ЗАДАЧА','СРОЧНО','НА ВЧЕРА','ОТЧЁТ','ПИСЬМО','ПОКАЗАТЕЛЬ','СОВЕЩАНИЕ','ПОРУЧЕНИЕ','ТАБЛИЦА','ПРАВКА','СВОДКА','ДОКЛАД'];
  node.textContent=words[(Math.random()*words.length)|0];
  area.appendChild(node);

  const w=76;
  const h=44;
  const y=260;

  const originX = r.width*.5 - w*.5;
  const x = clamp(originX + (Math.random()-.5)*18,4,r.width-w-4);

  const margin=14;
  let targetX = margin + Math.random()*Math.max(1,r.width-w-margin*2);

  if(burst && Math.random()<.68){
    targetX = Math.random()<.5
      ? margin + Math.random()*Math.max(20,r.width*.28)
      : r.width-w-margin-Math.random()*Math.max(20,r.width*.28);
  }

  const vy = 145 + Math.random()*95 + difficulty*(20+Math.random()*8);
  const travel = Math.max(.75,(r.height-y-105)/vy);
  let vx = (targetX-x)/travel;

  if(Math.random()<.11){
    vx += (Math.random()<.5?-1:1)*(55+Math.random()*90);
  }
  vx = clamp(vx,-220-difficulty*8,220+difficulty*8);

  const task={node,x,y,vx,vy,w,h};
  state.tasks.push(task);
  drawTask(task);

  const boss=el('boss');
  if(boss){
    boss.classList.remove('throwing');
    void boss.offsetWidth;
    boss.classList.add('throwing');
    clearTimeout(boss._throwTimer);
    boss._throwTimer=setTimeout(()=>boss.classList.remove('throwing'),120);
  }
}

function drawTask(t){
  t.node.style.transform=`translate3d(${t.x}px,${t.y}px,0) rotate(${Math.sin(t.y*.025)*3}deg)`;
}

function updateTasks(dt,now,difficulty){
  const area=el('gameArea'), player=el('player'); if(!area||!player) return;
  const ar=area.getBoundingClientRect(), pr=player.getBoundingClientRect();
  const ax=ar.left, ay=ar.top;

  for(let i=state.tasks.length-1;i>=0;i--){
    const t=state.tasks[i];

    if((state.power==='absorb'||state.power==='robot') && now<state.powerUntil){
      catchTask(i,true); continue;
    }

    if(state.power==='reverse' && now<state.powerUntil){
      t.y -= Math.max(180,t.vy)*dt;
      t.x += t.vx*dt*.3;
      if(t.y<180){ catchTask(i,true); continue; }
      drawTask(t); continue;
    }

    t.y += t.vy*dt;
    t.x += t.vx*dt;
    if(t.x<2 || t.x>ar.width-t.w-2) t.vx*=-1;

    const tl=ax+t.x, tr=tl+t.w, tt=ay+t.y, tb=tt+t.h;
    const multiActive = state.power==='multi' && now<state.powerUntil;
    const extra = multiActive ? Math.min(105,ar.width*.22) : 0;
    const overlap = tr>pr.left+8-extra && tl<pr.right-8+extra && tb>pr.top+8 && tt<pr.bottom-8;
    if(overlap){ catchTask(i,false); continue; }

    if(t.y > ar.height-5){ missTask(i); continue; }
    drawTask(t);
  }
}

function catchTask(i,auto){
  const t=state.tasks[i]; if(!t) return;
  t.node.classList.add('caught');
  setTimeout(()=>t.node.remove(),100);
  state.tasks.splice(i,1);

  state.score++;
  state.combo++;
  if(state.score%2===0 || state.combo>=5){ changeRank(-1); state.combo=0; }
  else flashArrow('up');
  updateHUD();
  if(!auto) beep(650,.035,'triangle');
}

function missTask(i){
  const t=state.tasks[i]; if(!t) return;
  t.node.remove(); state.tasks.splice(i,1);

  state.misses++; state.combo=0;
  changeRank(1);
  flashArrow('down');
  updateHUD();
  navigator.vibrate?.(35);
  beep(150,.055,'sawtooth');
}

function triggerRatingChangeEvent(){
  state.ratingEvent=true;
  state.ratingEventPending=false;

  const box=el('ratingChangeEvent');
  const penalty=box?.querySelector('.ratingChangePenalty');
  const oldRank=state.rank;

  changeRank(5);
  flashArrow('down');

  if(penalty){
    penalty.textContent=oldRank===89 ? 'НИЖЕ УЖЕ НЕКУДА' : '−5 МЕСТ';
  }

  if(box){
    box.classList.remove('hidden');
    box.classList.remove('show');
    void box.offsetWidth;
    box.classList.add('show');
  }

  navigator.vibrate?.([80,45,100]);
  beep(115,.16,'sawtooth');

  setTimeout(()=>{
    if(box){
      box.classList.remove('show');
      box.classList.add('hidden');
    }
    state.ratingEvent=false;
    state.spawnAcc=0;
    state.nextSpawn=.55+Math.random()*.35;
    state.nextRatingEvent=state.elapsed+22+Math.random()*16;
  },2000);
}

function changeRank(delta){
  const old=state.rank;
  state.rank=clamp(state.rank+delta,1,TOTAL_RANKS);
  if(state.rank<old) flashArrow('up');
  else if(state.rank>old) flashArrow('down');
  updateRanking(); updateHUD();
}

function flashArrow(dir){
  const a=el('rankArrow'); if(!a) return;
  a.textContent=dir==='up'?'▲':'▼';
  a.className=dir;
  clearTimeout(a._t);
  a._t=setTimeout(()=>{a.textContent='';a.className='';},600);
}

function updateHUD(){
  if(el('rankValue')) el('rankValue').firstChild.nodeValue=state.rank+' ';
  if(el('scoreValue')) el('scoreValue').textContent=state.score;
  if(el('missValue')) el('missValue').textContent=state.misses+'/9';
  if(el('tempoValue')){
    const d=state.elapsed<18?'Бодро':state.elapsed<38?'Быстро':state.elapsed<62?'Очень быстро':'АВРАЛ';
    el('tempoValue').textContent=d;
  }
}

function subjectAt(position){
  if(position===state.rank) return 'Белгородская область';
  const idx = position<state.rank ? position-1 : position-2;
  return RANKED[idx] || 'Субъект РФ';
}

function updateRanking(){
  const box=el('rankingRows'); if(!box) return;
  const size=3;
  let start=clamp(state.rank-1,1,TOTAL_RANKS-size+1);
  if(state.rank>=TOTAL_RANKS-1) start=TOTAL_RANKS-size+1;
  const rows=[];
  for(let p=start;p<start+size;p++){
    rows.push(`<div class="rankRow ${p===state.rank?'me':''}"><b>${p}</b><span>${subjectAt(p)}</span>${p===state.rank?'<i>★</i>':''}</div>`);
  }
  box.innerHTML=rows.join('');
}

function updatePlayer(){
  const p=el('player'); if(p) p.style.left=(state.playerX*100)+'%';
}
function updateBoss(){
  const b=el('boss');
  if(b){
    b.style.left='50%';
    b.classList.remove('flip');
  }
}

window.setMove=function(dir){ state.moveDir=dir; };
window.stopMove=function(){ state.moveDir=0; };

window.gamePointerDown=function(e){
  if(!state.running||state.paused||e.target.closest('button')) return;
  state.drag=true; pointerPlayer(e);
};
window.gamePointerMove=function(e){ if(state.drag) pointerPlayer(e); };
window.gamePointerUp=function(){ state.drag=false; };
function pointerPlayer(e){
  const r=el('gameArea').getBoundingClientRect();
  state.playerX=clamp((e.clientX-r.left-34)/Math.max(1,r.width),.02,.86);
  updatePlayer();
}

window.usePower=function(){
  if(!state.running||state.paused) return;
  const now=performance.now();
  if(now<state.powerReadyAt) return;

  // Повтор доступен через 18 секунд с момента нажатия.
  // Отдельно показываем оставшееся время действия самой силы.
  state.powerReadyAt=now+18000;

  if(selectedId==='zam'){
    activatePower('absorb',6000,'Поглощение задач!');
  }
  else if(selectedId==='first'){
    activatePower('multi',7000,'Многозадачность!');
  }
  else if(selectedId==='bif'){
    clearTasks(false);
    activatePower('disagree',1100,'Так не договаривались!');
  }
  else if(selectedId==='school21'){
    activatePower('reverse',7000,'Возражение!');
  }
  else if(selectedId==='sitcenter'){
    activatePower('slow',6500,'Замедление времени!');
  }
  else if(selectedId==='mfc'){
    activatePower('robot',7000,'Голосовой робот принимает задачи!');
  }

  navigator.vibrate?.(45);
  beep(820,.10,'square');
  updatePower(now);
};

function activatePower(type,durationMs,message){
  const now=performance.now();
  state.power=type;
  state.powerUntil=now+durationMs;
  toast(message);
  applyPowerVisual(type);
}

function clearTasks(laptop){
  let n=state.tasks.length;
  while(state.tasks.length) catchTask(state.tasks.length-1,true);
  if(n===0){ state.score++; updateHUD(); }
  if(laptop && n>0){ state.score+=Math.min(3,n); updateHUD(); }
}

function applyPowerVisual(type){
  const area=el('gameArea');
  const player=el('player');
  if(area){
    POWER_CLASSES.forEach(c=>area.classList.remove(c));
    if(type && POWER_META[type]) area.classList.add(POWER_META[type].cls);
  }
  if(player){
    player.dataset.power=type||'';
  }
}

function updatePower(now){
  const btn=el('powerBtn');
  const cd=el('powerCooldown');
  const bar=el('powerBarFill');
  const status=el('powerStatus');
  const statusName=el('powerStatusName');
  const statusIcon=el('powerStatusIcon');
  const activeTimeEl=el('powerActiveTime');
  if(!btn||!cd) return;

  // Если действие закончилось, визуальный эффект снимается,
  // но перезарядка продолжается отдельно.
  if(state.power && now>=state.powerUntil){
    state.power=null;
    state.powerUntil=0;
    applyPowerVisual(null);
  }

  const activeRemain = state.power ? Math.max(0,state.powerUntil-now) : 0;
  const cooldownRemain = Math.max(0,state.powerReadyAt-now);

  if(state.power && activeRemain>0){
    const meta=POWER_META[state.power]||{name:'Суперсила',icon:'⚡'};
    const activeSeconds=(activeRemain/1000).toFixed(1);

    btn.disabled=true;
    btn.classList.add('is-active');
    btn.classList.remove('is-cooldown');
    cd.textContent=`ДЕЙСТВУЕТ ${activeSeconds} с`;

    if(bar){
      const total =
        state.power==='absorb' ? 6000 :
        state.power==='multi' ? 7000 :
        state.power==='reverse' ? 7000 :
        state.power==='slow' ? 6500 :
        state.power==='robot' ? 7000 : 900;
      bar.style.width=`${Math.max(0,Math.min(100,activeRemain/total*100))}%`;
    }

    if(status){
      status.classList.remove('hidden');
      status.classList.add('active');
    }
    if(statusName) statusName.textContent=meta.name;
    if(statusIcon) statusIcon.textContent=meta.icon;
    if(activeTimeEl) activeTimeEl.textContent=`${activeSeconds} с`;
    return;
  }

  btn.classList.remove('is-active');

  if(status){
    status.classList.add('hidden');
    status.classList.remove('active');
  }

  if(cooldownRemain>0){
    btn.disabled=true;
    btn.classList.add('is-cooldown');
    const sec=Math.ceil(cooldownRemain/1000);
    cd.textContent=`ПОВТОР ЧЕРЕЗ ${sec} с`;
    if(bar){
      // 18 секунд полного цикла перезарядки.
      bar.style.width=`${Math.max(0,Math.min(100,(1-cooldownRemain/18000)*100))}%`;
    }
  } else {
    btn.disabled=false;
    btn.classList.remove('is-cooldown');
    cd.textContent='ГОТОВО';
    if(bar) bar.style.width='100%';
  }
}

window.togglePause=function(){
  if(!state.running) return;
  state.paused=!state.paused;
  el('pauseOverlay')?.classList.toggle('hidden',!state.paused);
  if(state.paused) cancelAnimationFrame(state.raf);
  else { state.last=performance.now(); state.raf=requestAnimationFrame(loop); }
};
window.returnToStart=function(){
  state.running=false; state.paused=false; cancelAnimationFrame(state.raf);
  state.tasks.forEach(t=>t.node.remove()); state.tasks=[]; state.ratingEvent=false; state.ratingEventPending=false; el('ratingChangeEvent')?.classList.add('hidden'); applyPowerVisual(null);
  el('gameScreen')?.classList.add('hidden');
  el('startScreen')?.classList.remove('hidden');
  el('pauseOverlay')?.classList.add('hidden');
  el('gameOver')?.classList.add('hidden');
};
window.restartGame=function(){ state.running=false; cancelAnimationFrame(state.raf); startGame(); };

function endGame(win){
  state.running=false; cancelAnimationFrame(state.raf);
  const ov=el('gameOver'); if(!ov) return;
  el('overTitle').textContent=win?'🥇 Первое место!':'📉 Рабочий день окончен';
  el('overText').textContent=win
    ? `Поймано задач: ${state.score}. Белгородская область добралась до вершины игрового рейтинга.`
    : `Поймано: ${state.score}, пропущено: ${state.misses}.`;
  el('overRank').textContent=state.rank+' место';
  ov.classList.remove('hidden');
  beep(win?880:180,.18,win?'triangle':'sawtooth');
}

window.toggleSound=function(){
  state.sound=!state.sound;
  if(el('soundBtn')) el('soundBtn').textContent=state.sound?'🔊':'🔇';
  if(state.sound) beep(500,.04);
};

function toast(text){
  const t=el('toast'); if(!t) return;
  t.textContent=text; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),900);
}

function beep(freq=440,dur=.05,type='sine'){
  if(!state.sound) return;
  try{
    state.audio ||= new (window.AudioContext||window.webkitAudioContext)();
    const o=state.audio.createOscillator(), g=state.audio.createGain();
    o.type=type; o.frequency.value=freq;
    g.gain.setValueAtTime(.045,state.audio.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,state.audio.currentTime+dur);
    o.connect(g); g.connect(state.audio.destination); o.start(); o.stop(state.audio.currentTime+dur);
  }catch(_){}
}

document.addEventListener('visibilitychange',()=>{ if(document.hidden&&state.running&&!state.paused) togglePause(); });
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'||e.key==='a') setMove(-1);
  if(e.key==='ArrowRight'||e.key==='d') setMove(1);
  if(e.code==='Space'){e.preventDefault();usePower();}
  if(e.key==='Escape') togglePause();
});
document.addEventListener('keyup',e=>{
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='a'||e.key==='d') stopMove();
});
