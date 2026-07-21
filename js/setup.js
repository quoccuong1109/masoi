import { ROLES, WOLF_ROLES, VIL_ROLES, POWER, calcBalance } from './data.js';
import { sfx } from './audio.js?v=2';
import { st, freshNc } from './state.js';
import { goScreen, showToast, ri } from './ui.js';

function shuffle(a) { for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;} }

// ===== ROLE CONFIG =====
export function suggestRoles(n) {
  var wolves = n<=6?1:n<=9?2:n<=12?3:n<=16?4:n<=20?5:6;
  var cfg = {}; WOLF_ROLES.concat(VIL_ROLES).forEach(function(k){cfg[k]=0;}); cfg.villager=0;
  cfg.wolf = wolves;
  if(n>=8){cfg.alphawolf=1;cfg.wolf=Math.max(0,wolves-1);}
  if(n>=13)cfg.cub=1; if(n>=22)cfg.whitewolf=1; if(n>=16)cfg.humanwolf=1;
  if(n>=20){cfg.gangleader=1;cfg.wolf=Math.max(0,cfg.wolf-1);}
  if(n>=5)cfg.seer=1; if(n>=10)cfg.hunter=1; if(n>=10)cfg.witch=1;
  if(n>=14)cfg.cupid=1; if(n>=16)cfg.guard=1;
  if(n>=18){cfg.sheriff=1;cfg.fool=1;} if(n>=20)cfg.medium=1; if(n>=24)cfg.priest=1;
  if(n>=12)cfg.doctor=1; if(n>=15)cfg.detective=1; if(n>=14)cfg.matchmaker=1;
  var sp = WOLF_ROLES.concat(VIL_ROLES).reduce(function(a,k){return a+(cfg[k]||0);},0);
  cfg.villager = Math.max(2, n-sp);
  return cfg;
}

export function randomRoles() {
  var n = st.n;
  var minW = Math.max(1, Math.round(n*0.22));
  var maxW = Math.min(Math.floor(n*0.33), n-3);
  var bestCfg = null, bestDiff = Infinity;
  for (var attempt=0; attempt<200; attempt++) {
    var cfg = {}; WOLF_ROLES.concat(VIL_ROLES).forEach(function(k){cfg[k]=0;}); cfg.villager=0;
    Object.keys(st.pinnedRoles).forEach(function(k){if(st.pinnedRoles[k])cfg[k]=st.roles[k]||0;});
    var pinnedW = WOLF_ROLES.reduce(function(a,k){return a+(st.pinnedRoles[k]?cfg[k]:0);},0);
    var targetW = minW + Math.floor(Math.random()*(maxW-minW+1));
    var wLeft = Math.max(0, targetW-pinnedW);
    var freeW = WOLF_ROLES.filter(function(k){return !st.pinnedRoles[k];});
    shuffle(freeW);
    var wPool = [];
    freeW.forEach(function(k){ if(k==='wolf'){for(var x=0;x<Math.ceil(targetW*0.6);x++)wPool.push(k);}else{wPool.push(k);} });
    shuffle(wPool);
    wPool.slice(0,wLeft).forEach(function(k){cfg[k]++;});
    var totW = WOLF_ROLES.reduce(function(a,k){return a+(cfg[k]||0);},0);
    if(!st.pinnedRoles['seer'] && ((cfg.humanwolf||0)>0 || totW>=2)) cfg.seer = Math.max(cfg.seer||0,1);
    var wScore = WOLF_ROLES.reduce(function(a,k){return a+POWER[k]*(cfg[k]||0);},0)*1.5;
    var targetV = wScore + (Math.random()*4-1);
    var vUsed = VIL_ROLES.reduce(function(a,k){return a+POWER[k]*(cfg[k]||0);},0);
    var freeV = VIL_ROLES.filter(function(k){return !st.pinnedRoles[k]&&!(cfg[k]>0);});
    freeV.sort(function(a,b){return POWER[b]-POWER[a];});
    for(var vi=0;vi<freeV.length;vi++){
      if(vUsed>=targetV) break;
      var sp2 = WOLF_ROLES.concat(VIL_ROLES).reduce(function(a,k){return a+(cfg[k]||0);},0);
      if(n-sp2<=2) break;
      cfg[freeV[vi]]=1; vUsed+=POWER[freeV[vi]];
    }
    var spTotal = WOLF_ROLES.concat(VIL_ROLES).reduce(function(a,k){return a+(cfg[k]||0);},0);
    cfg.villager = Math.max(2, n-spTotal);
    var total = Object.values(cfg).reduce(function(a,b){return a+b;},0);
    if(total !== n) continue;
    if((cfg.villager||0)<2) continue;
    var bal = calcBalance(cfg);
    if(bal.ratio<0.20||bal.ratio>0.36) continue;
    if(bal.diff < bestDiff) {
      bestDiff = bal.diff;
      bestCfg = JSON.parse(JSON.stringify(cfg));
      if(bestDiff<2.5) break;
    }
  }
  if(!bestCfg){showToast('⚠️ Không tìm được combo cân bằng, thử lại!');return;}
  st.roles = bestCfg;
  buildRoleSections();
  var bal = calcBalance(bestCfg);
  var wCnt = WOLF_ROLES.reduce(function(a,k){return a+(bestCfg[k]||0);},0);
  var label = bal.diff<2?'⚖️ Rất cân bằng':bal.diff<4?'✅ Cân bằng tốt':'⚠️ Hơi lệch';
  showToast('🎲 Random xong! '+label+'<br><span style="font-size:.76rem;color:var(--muted)">🐺 '+wCnt+' Sói · 👥 '+(st.n-wCnt)+' Dân · Chênh: '+bal.diff.toFixed(1)+'đ</span>', 3500);
  sfx('deal');
}

export function buildRoleSections() {
  function makeRow(k) {
    var r = ROLES[k], cnt = st.roles[k]||0, pinned = st.pinnedRoles[k];
    var div = document.createElement('div');
    div.className = 'num-row' + (pinned?' pinned':'');
    div.innerHTML = '<div class="num-left"><span class="num-emoji">'+r.emoji+'</span><div class="num-label-wrap"><div class="num-label '+(r.team==='wolf'?'team-wolf':'team-special')+'">'+r.name+(r.immuneSeer?'<span style="font-size:.6rem;color:var(--rose);margin-left:4px">👁 miễn nhiễm</span>':'')+'</div><div class="num-desc">'+r.desc.substring(0,48)+'…</div></div></div><div style="display:flex;align-items:center;gap:5px;flex-shrink:0"><button class="info-btn" onclick="openRolePopup(\''+k+'\')">?</button><button class="pin-btn'+(pinned?' active':'')+'" id="pin-'+k+'" onclick="togglePin(\''+k+'\')">'+(pinned?'📌':'📍')+'</button><div class="num-ctrl"><button onclick="chRole(\''+k+'\',-1)">−</button><span id="rc-'+k+'">'+cnt+'</span><button onclick="chRole(\''+k+'\',1)">+</button></div></div>';
    return div;
  }
  var ws = document.getElementById('wolf-section'); ws.innerHTML='';
  WOLF_ROLES.forEach(function(k){ws.appendChild(makeRow(k));});
  var vs = document.getElementById('village-section'); vs.innerHTML='';
  VIL_ROLES.forEach(function(k){vs.appendChild(makeRow(k));});
  syncVil();
}

export function togglePin(k) {
  st.pinnedRoles[k] = !st.pinnedRoles[k];
  var btn=document.getElementById('pin-'+k);
  if(btn){btn.textContent=st.pinnedRoles[k]?'📌':'📍';btn.className='pin-btn'+(st.pinnedRoles[k]?' active':'');}
  var row=btn?btn.closest('.num-row'):null;
  if(row)row.className='num-row'+(st.pinnedRoles[k]?' pinned':'');
  sfx('click');
}

export function syncVil() {
  document.getElementById('rc-villager').textContent = st.roles.villager||0;
  var total = Object.values(st.roles).reduce(function(a,b){return a+b;},0);
  document.getElementById('total-check').textContent = total;
  document.getElementById('total-max').textContent = st.n;
  var ok = total===st.n;
  document.getElementById('total-ok').textContent = ok?'✓ Khớp':'✗ Chưa khớp';
  document.getElementById('total-ok').style.color = ok?'var(--teal)':'var(--rose)';
  document.getElementById('role-warn').style.display = ok?'none':'block';
}

export function chRole(k, d) {
  st.roles[k] = Math.max(0,(st.roles[k]||0)+d);
  var el=document.getElementById('rc-'+k);
  if(el)el.textContent=st.roles[k];
  syncVil(); sfx('click');
}

export function chVil(d) {
  st.roles.villager = Math.max(0,(st.roles.villager||0)+d);
  syncVil(); sfx('click');
}

export function openRolePopup(k) {
  sfx('click');
  var r = ROLES[k]||ROLES.villager;
  document.getElementById('pp-emoji').textContent = r.emoji;
  document.getElementById('pp-name').textContent = r.name;
  var pt = document.getElementById('pp-team');
  var wolf = r.team==='wolf';
  pt.textContent = wolf?'Phe Ma Sói':'Phe Dân Làng';
  pt.style.cssText = wolf?'background:rgba(251,113,133,.12);color:#fb7185;border:1px solid rgba(251,113,133,.3);':'background:rgba(167,139,250,.12);color:#a78bfa;border:1px solid rgba(167,139,250,.3);';
  document.getElementById('pp-desc').textContent = r.desc;
  var tipEl = document.getElementById('pp-tip');
  tipEl.innerHTML = r.tip?('<strong>💡 Mẹo:</strong> '+r.tip):'';
  tipEl.style.display = r.tip?'block':'none';
  document.getElementById('role-popup').style.display = 'flex';
}

// ===== SAVED PLAYERS =====
var selectedSaved = [];

export function loadSavedPlayers() { try{return JSON.parse(localStorage.getItem('masoi_players')||'[]');}catch(e){return[];} }

export function savePlayers(names) {
  var saved = loadSavedPlayers();
  names.forEach(function(n){if(n&&!saved.includes(n))saved.push(n);});
  if(saved.length>30)saved=saved.slice(-30);
  try{localStorage.setItem('masoi_players',JSON.stringify(saved));}catch(e){}
}

export function removePlayer(name) {
  var saved = loadSavedPlayers().filter(function(n){return n!==name;});
  try{localStorage.setItem('masoi_players',JSON.stringify(saved));}catch(e){}
  renderSavedChips();
}

export function renderSavedChips() {
  var saved = loadSavedPlayers(); selectedSaved = [];
  var cont = document.getElementById('saved-chips'); cont.innerHTML='';
  saved.forEach(function(name){
    var chip = document.createElement('span'); chip.className='saved-player-chip';
    chip.innerHTML = name+' <span onclick="event.stopPropagation();removePlayer(\''+name+'\')" style="color:var(--rose);font-size:.8rem;margin-left:3px">×</span>';
    chip.onclick = function(){
      sfx('click'); chip.classList.toggle('sel');
      if(chip.classList.contains('sel'))selectedSaved.push(name);
      else selectedSaved=selectedSaved.filter(function(n){return n!==name;});
    };
    cont.appendChild(chip);
  });
}

export function fillFromSaved() {
  sfx('confirm');
  var used=0;
  for(var i=0;i<st.n&&used<selectedSaved.length;i++){
    var inp=document.getElementById('pn-'+i);
    if(inp&&!inp.value){inp.value=selectedSaved[used++];}
  }
}

export function goSetupPlayers() {
  var total = Object.values(st.roles).reduce(function(a,b){return a+b;},0);
  if(total!==st.n){showToast('⚠️ Tổng vai ('+total+') ≠ số người ('+st.n+')!');return;}
  var saved = loadSavedPlayers();
  var card = document.getElementById('saved-players-card');
  card.style.display = saved.length ? 'block' : 'none';
  renderSavedChips();
  var cont = document.getElementById('name-inputs'); cont.innerHTML='';
  for(var i=0;i<st.n;i++){
    var inp = document.createElement('input');
    inp.className='inp';
    inp.placeholder='Người chơi '+(i+1);
    inp.id='pn-'+i;
    if(saved[i]) inp.value = saved[i];
    cont.appendChild(inp);
  }
  goScreen('s-players');
}

export function clearNameInputs() {
  for(var i=0;i<st.n;i++){
    var inp=document.getElementById('pn-'+i);
    if(inp) inp.value='';
  }
  sfx('click');
  showToast('🗑 Đã xóa hết tên, nhập lại từ đầu.');
}

// ===== START GAME =====
export function startGame() {
  st.players=[]; st.gameLog=[]; st.hunterQueue=[];
  st.sheriffIdx=-1; st.sheriffPassQueue=[];
  st.nc = freshNc();
  for(var i=0;i<st.n;i++){
    var v=document.getElementById('pn-'+i).value.trim()||'Người '+(i+1);
    st.players.push({name:v,alive:true,role:null});
  }
  savePlayers(st.players.map(function(p){return p.name;}));
  var deck=[];
  Object.keys(st.roles).forEach(function(k){for(var j=0;j<(st.roles[k]||0);j++)deck.push(k);});
  shuffle(deck);
  st.assigned=deck;
  for(var i=0;i<st.n;i++)st.players[i].role=deck[i];
  st.sheriffIdx = deck.indexOf('sheriff');
  st.dealIdx=0; st.round=1;
  showDeal(); goScreen('s-deal'); sfx('deal');
}

// ===== DEAL =====
export function showDeal() {
  var idx=st.dealIdx;
  if(idx>=st.n){
    document.getElementById('deal-info').textContent='✅ Tất cả đã nhận bài!';
    document.getElementById('c3d').style.visibility='hidden';
    document.getElementById('btn-next-deal').style.display='none';
    document.getElementById('btn-start-night').style.display='block';
    return;
  }
  var p=st.players[idx], r=ri(st.assigned[idx]);
  document.getElementById('deal-info').innerHTML='<strong style="color:var(--acc)">'+p.name+'</strong><br>Che màn hình và bấm xem bài';
  document.getElementById('c-emoji').textContent=r.emoji;
  document.getElementById('c-rname').textContent=r.name;
  var wolf=r.team==='wolf';
  var t=document.getElementById('c-rteam');
  t.textContent=wolf?'Phe Ma Sói':'Phe Dân Làng';
  t.style.cssText=wolf?'background:rgba(251,113,133,.2);color:#fb7185;':'background:rgba(167,139,250,.2);color:#a78bfa;';
  document.getElementById('c-rdesc').textContent=r.desc;
  document.getElementById('c3d').style.visibility='visible';
  st.cardFlipped=false;
  document.getElementById('c3d').classList.remove('flipped');
  document.getElementById('btn-next-deal').style.display='none';
  document.getElementById('btn-start-night').style.display='none';
}

export function flipCard() {
  if(st.cardFlipped)return;
  sfx('flip'); st.cardFlipped=true;
  document.getElementById('c3d').classList.add('flipped');
  var isLast=st.dealIdx>=st.n-1;
  setTimeout(function(){
    if(isLast)document.getElementById('btn-start-night').style.display='block';
    else document.getElementById('btn-next-deal').style.display='block';
  },700);
}

export function nextDeal() {
  sfx('click');
  document.getElementById('c3d').classList.remove('flipped');
  st.cardFlipped=false;
  document.getElementById('btn-next-deal').style.display='none';
  document.getElementById('btn-start-night').style.display='none';
  setTimeout(function(){st.dealIdx++;showDeal();},680);
}

// ===== INIT SLIDER =====
export function initSlider() {
  st.roles = suggestRoles(10); st.pinnedRoles = {}; buildRoleSections();
  document.getElementById('sl-total').oninput = function() {
    st.n = +this.value;
    document.getElementById('total-disp').textContent = st.n;
    st.roles = suggestRoles(st.n);
    buildRoleSections(); sfx('click');
  };
}
