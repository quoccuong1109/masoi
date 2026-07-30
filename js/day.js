import { WOLF_ROLES } from './data.js?v=6';
import { sfx, stopBgm } from './audio.js?v=6';
import { st } from './state.js?v=6';
import { goScreen, showToast, ri } from './ui.js?v=6';

function processDeath() {
  if(st.hunterQueue.length) { processHunterQueue(); return; }
  if(st.sheriffPassQueue.length) { processSheriffPassQueue(); return; }
  checkWin();
}

// ===== START DAY =====
export function startDay() {
  stopBgm();
  st.round++;
  document.getElementById('day-round').textContent = st.round-1;
  var nc = st.nc;
  var guardedIdx = (nc.guardProtect>=0&&nc.guardProtect!==-99) ? nc.guardProtect : -1;
  var wolfGuardedIdx = (nc.wolfGuardProtect>=0&&nc.wolfGuardProtect!==-99) ? nc.wolfGuardProtect : -1;
  st.nc.guardLastNight = guardedIdx;
  var hadDoubleKill = st.wolfDoubleKill;

  var events=[];

  if(nc.wolfVictim>=0&&nc.wolfVictim!==-99){
    var v=nc.wolfVictim;
    var shieldParts=[];
    if(v===guardedIdx)shieldParts.push('🛡️ Bảo Vệ');
    if(nc.witchSave){shieldParts.push('🧙 Phù Thủy cứu');nc.witchSaveUsed=true;}
    if(nc.exorcistBlock>=0&&nc.exorcistBlock!==-99&&v===nc.exorcistBlock){shieldParts.push('☯️ Thầy Trừ Tà');nc.exorcistUsed=true;}
    var shielded=shieldParts.length>0;
    if(!shielded&&st.players[v].role==='elder'&&!st.players[v].elderHit){
      st.players[v].elderHit=true; shielded=true; shieldParts=['🧓 Người Già (1 HP còn lại)'];
    }
    if(shielded){
      events.push({type:'safe',idx:v,reason:'Bị cắn nhưng '+shieldParts.join(' + ')+' — an toàn!'});
      logDay('🐺 Sói cắn '+st.players[v].name+' → '+shieldParts.join(', ')+' cứu');
    } else {
      st.players[v].alive=false;
      events.push({type:'dead',idx:v,reason:'🐺 Bị Ma Sói cắn'});
      logDay('💀 '+st.players[v].name+' chết do Sói cắn');
      checkLovers(v,events); triggerOnDeath(v);
    }
  } else if(nc.wolfVictim===-99){
    logDay('🐺 Ma Sói bỏ qua đêm nay');
  }

  if(hadDoubleKill){
    if(nc.wolfVictim2>=0&&nc.wolfVictim2!==-99){
      var v2=nc.wolfVictim2;
      if(st.players[v2]&&st.players[v2].alive){
        var shielded2=v2===guardedIdx;
        if(!shielded2&&st.players[v2].role==='elder'&&!st.players[v2].elderHit){
          st.players[v2].elderHit=true; shielded2=true;
        }
        if(shielded2){
          var bl2=v2===guardedIdx?'🛡️ Bảo Vệ':'🧓 Người Già';
          events.push({type:'safe',idx:v2,reason:'🐶 Sói cắn lần 2 nhưng '+bl2+' che chắn'});
          logDay(bl2+' chặn Sói cắn thứ 2 khỏi '+st.players[v2].name);
        } else {
          st.players[v2].alive=false;
          events.push({type:'dead',idx:v2,reason:'🐶 Bị Ma Sói cắn lần 2 (Sói Con báo thù)'});
          logDay('💀 '+st.players[v2].name+' chết do Sói cắn lần 2 (Sói Con)');
          checkLovers(v2,events); triggerOnDeath(v2);
        }
      }
    }
    st.wolfDoubleKill=false;
  }

  if(nc.whitewolfVictim>=0&&nc.whitewolfVictim!==-99){
    var wi=nc.whitewolfVictim;
    var shieldedWW=wi===guardedIdx||wi===wolfGuardedIdx;
    if(!shieldedWW&&st.players[wi].role==='elder'&&!st.players[wi].elderHit){
      st.players[wi].elderHit=true; shieldedWW=true;
    }
    if(shieldedWW){
      var blockerWW=wi===guardedIdx?'🛡️ Bảo Vệ':wi===wolfGuardedIdx?'🛡️🐺 Sói Bảo Vệ':'🧓 Người Già';
      events.push({type:'safe',idx:wi,reason:'🤍 Sói Trắng tấn công nhưng '+blockerWW+' che chắn'});
      logDay(blockerWW+' chặn Sói Trắng khỏi '+st.players[wi].name);
    } else if(st.players[wi].alive){
      st.players[wi].alive=false;
      events.push({type:'dead',idx:wi,reason:'🤍 Bị Sói Trắng tiêu diệt'});
      logDay('💀 '+st.players[wi].name+' chết do Sói Trắng');
      checkLovers(wi,events); triggerOnDeath(wi);
    }
  }

  if(nc.witchPoison>=0&&nc.witchPoison!==-99){
    nc.witchPoisonUsed=true;
    var pi=nc.witchPoison;
    if(pi===guardedIdx||pi===wolfGuardedIdx){
      var blockerP=pi===guardedIdx?'🛡️ Bảo Vệ':'🛡️🐺 Sói Bảo Vệ';
      events.push({type:'safe',idx:pi,reason:'☠️ Bị đầu độc nhưng '+blockerP+' che chắn'});
      logDay(blockerP+' chặn thuốc độc khỏi '+st.players[pi].name);
    } else if(st.players[pi].alive){
      st.players[pi].alive=false;
      events.push({type:'dead',idx:pi,reason:'☠️ Bị Phù Thủy đầu độc'});
      logDay('💀 '+st.players[pi].name+' chết do thuốc độc');
      checkLovers(pi,events); triggerOnDeath(pi);
    }
  }

  if(nc.whiteWitchRevive>=0&&nc.whiteWitchRevive!==-99){
    nc.whiteWitchUsed=true;
    var ri2=nc.whiteWitchRevive;
    st.players[ri2].alive=true;
    events.push({type:'revive',idx:ri2,reason:'🌟 Phù Thủy Trắng hồi sinh'});
    logDay('🌟 Phù Thủy Trắng hồi sinh '+st.players[ri2].name);
  }

  if(nc.demonWolfRevive>=0&&nc.demonWolfRevive!==-99){
    nc.demonWolfUsed=true;
    var dwr=nc.demonWolfRevive;
    st.players[dwr].alive=true;
    events.push({type:'revive',idx:dwr,reason:'😈 Ác Quỷ hồi sinh'});
    logDay('😈 Ác Quỷ hồi sinh '+st.players[dwr].name);
  }

  updateHUD();
  if(!events.length) { events.push({type:'quiet'}); logDay('✨ Đêm bình yên'); }

  var box=document.getElementById('night-result-box');
  var cont=document.getElementById('night-result-content');
  box.style.display='block';
  cont.innerHTML=events.map(function(e){
    if(e.type==='quiet')return '<div class="result-row quiet-row"><span>✨</span><span>Đêm bình yên — không ai chết!</span></div>';
    var p=st.players[e.idx], r=ri(p.role);
    if(e.type==='dead')return '<div class="result-row dead-row"><span style="font-size:1rem">'+r.emoji+'</span><div><strong>'+p.name+'</strong><br><span style="font-size:.74rem;color:var(--muted)">'+e.reason+'</span><br><span style="font-size:.72rem;color:var(--rose)">Vai: '+r.name+'</span></div></div>';
    if(e.type==='revive'){var rIcon=e.reason&&e.reason.startsWith('😈')?'😈':'🌟';return '<div class="result-row safe-row"><span style="font-size:1rem">'+rIcon+'</span><div><strong>'+p.name+'</strong><br><span style="font-size:.74rem;color:var(--teal)">'+(e.reason||'✨ Được hồi sinh!')+'</span></div></div>';}
    return '<div class="result-row safe-row"><span style="font-size:1rem">'+r.emoji+'</span><div><strong>'+p.name+'</strong><br><span style="font-size:.74rem;color:var(--teal)">'+e.reason+'</span></div></div>';
  }).join('');

  events.some(function(e){return e.type==='dead';})?sfx('dead'):sfx('confirm');
  buildVoteTable();
  updatePriestCard();
  document.getElementById('vote-result-card').style.display='none';
  clearInterval(st.timerIv); st.timerRunning=false; setTimer(180);
  goScreen('s-day');
  setTimeout(processDeath, 700);
}

function logDay(msg) { if(st.currentLogRound) st.currentLogRound.night.push(msg); }

export function checkLovers(deadIdx, events) {
  [st.nc.loverPair, st.nc.matchmakerPair].forEach(function(lp){
    if(lp.length===2&&lp.includes(deadIdx)){
      var other=lp.find(function(x){return x!==deadIdx;});
      if(st.players[other]&&st.players[other].alive){
        st.players[other].alive=false;
        events.push({type:'dead',idx:other,reason:'💘 Người yêu chết — chết theo vì tình'});
        logDay('💘 '+st.players[other].name+' chết theo người yêu');
        triggerOnDeath(other);
      }
    }
  });
}

export function triggerOnDeath(idx) {
  var role=st.players[idx].role;
  if(role==='hunter') st.hunterQueue.push({idx:idx,type:'hunter'});
  if(role==='alphawolf') st.hunterQueue.push({idx:idx,type:'alphawolf'});
  if(role==='cub') {
    st.wolfDoubleKill=true;
    showToast('🐶 Sói Con chết — Ma Sói được cắn 2 người đêm sau!',3500);
    logDay('🐶 Sói Con chết → Ma Sói cắn đôi đêm tiếp theo');
  }
  if(st.sheriffIdx===idx) st.sheriffPassQueue.push(idx);
  if(idx===st.wildchildRoleModel) {
    var wcIdx=st.players.findIndex(function(p){return p.alive&&p.role==='wildchild';});
    if(wcIdx>=0){
      st.players[wcIdx].role='wolf';
      updateHUD();
      showToast('🧒→🐺 Trẻ Em Hoang Dã mất hình mẫu — bí mật gia nhập Ma Sói!',4000);
      logDay('🐺 Trẻ Em Hoang Dã đổi phe sang Ma Sói (hình mẫu '+st.players[idx].name+' chết)');
    }
  }
}

// ===== HUNTER/ALPHA/CUB POPUP =====
export function processHunterQueue() {
  if(!st.hunterQueue.length)return;
  var item=st.hunterQueue.shift();
  var p=st.players[item.idx];
  var isAlpha=item.type==='alphawolf';
  document.getElementById('hunter-icon').textContent=isAlpha?'👑':'🏹';
  document.getElementById('hunter-title').textContent=isAlpha?'👑 '+p.name+' — Sói Đầu Đàn kéo theo!':'🏹 '+p.name+' — Thợ Săn kích hoạt!';
  document.getElementById('hunter-sub').textContent=isAlpha?p.name+' bị loại. Họ có thể kéo thêm 1 người chết theo!':p.name+' đã chết. Họ có thể bắn 1 người trước khi ra đi.';
  document.getElementById('hunter-pick-label').textContent=isAlpha?'Chọn người bị kéo theo:':'Chọn người muốn bắn:';
  var list=document.getElementById('hunter-list'); list.innerHTML='';
  st.players.forEach(function(pl,i){
    if(!pl.alive||i===item.idx)return;
    var r=ri(pl.role);
    var btn=document.createElement('button'); btn.className='victim-btn';
    btn.innerHTML='<span class="v-emoji">'+r.emoji+'</span><span class="v-name">'+pl.name+'</span><span class="v-check">✓</span>';
    btn.onclick=function(){hunterShoot(item,i);};
    list.appendChild(btn);
  });
  document.getElementById('hunter-popup').style.display='flex'; sfx('wolf');
}

export function updateHUD() {
  var wolves = st.players.filter(function(p){ return p.alive && WOLF_ROLES.includes(p.role); }).length;
  var vil = st.players.filter(function(p){ return p.alive && !WOLF_ROLES.includes(p.role); }).length;
  var dead = st.players.filter(function(p){ return !p.alive; }).length;
  var hw = document.getElementById('hud-wolves');
  var hv = document.getElementById('hud-vil');
  var hd = document.getElementById('hud-dead');
  if(hw) hw.textContent = wolves;
  if(hv) hv.textContent = vil;
  if(hd) hd.textContent = dead;
}

export function hunterShoot(item, targetIdx) {
  sfx('hang');
  var t=st.players[targetIdx];
  if(t.role==='wolfElder'&&!t.elderWolfHit){
    t.elderWolfHit=true;
    var isAlpha2=item.type==='alphawolf';
    showToast((isAlpha2?'👑':'🏹')+' '+st.players[item.idx].name+' → '+t.name+' bị nhắm nhưng Sói Già sống sót! (Lần 1)',3500);
    logDay((isAlpha2?'👑 Sói Đầu Đàn':'🏹 Thợ Săn')+' '+st.players[item.idx].name+' → '+t.name+' (Sói Già) sống sót lần 1');
    document.getElementById('hunter-popup').style.display='none';
    setTimeout(processDeath,1200);
    return;
  }
  t.alive=false;
  updateHUD();
  document.getElementById('hunter-popup').style.display='none';
  var r=ri(t.role), shooter=st.players[item.idx];
  var isAlpha=item.type==='alphawolf';
  var prefix=isAlpha?'👑':'🏹';
  var label=isAlpha?'👑 Sói Đầu Đàn '+shooter.name:'🏹 Thợ Săn '+shooter.name;
  showToast(prefix+' '+shooter.name+' → '+t.name+' chết!<br><span style="color:var(--acc)">'+r.emoji+' '+r.name+'</span>',3500);
  logDay(label+' → '+t.name+' chết');
  checkLovers(targetIdx,[]); triggerOnDeath(targetIdx);
  setTimeout(processDeath,1200);
}

export function hunterSkip() {
  sfx('click');
  document.getElementById('hunter-popup').style.display='none';
  showToast('Chọn không kéo theo/bắn ai.');
  setTimeout(processDeath,800);
}

// ===== SHERIFF BADGE PASSING =====
export function processSheriffPassQueue() {
  if(!st.sheriffPassQueue.length) return;
  st.sheriffPassQueue.shift();
  var list=document.getElementById('sheriff-list'); list.innerHTML='';
  st.players.forEach(function(pl,i){
    if(!pl.alive) return;
    var r=ri(pl.role);
    var btn=document.createElement('button'); btn.className='victim-btn';
    btn.innerHTML='<span class="v-emoji">'+r.emoji+'</span><span class="v-name">'+pl.name+'</span><span class="v-check">✓</span>';
    btn.onclick=function(){sheriffPassBadge(i);};
    list.appendChild(btn);
  });
  document.getElementById('sheriff-popup').style.display='flex'; sfx('click');
}

export function sheriffPassBadge(targetIdx) {
  st.sheriffIdx=targetIdx;
  document.getElementById('sheriff-popup').style.display='none';
  showToast('⭐ '+st.players[targetIdx].name+' nhận huy hiệu Cảnh Sát Trưởng!',3000);
  buildVoteTable();
  setTimeout(processDeath,600);
}

export function sheriffSkipPass() {
  st.sheriffIdx=-1;
  document.getElementById('sheriff-popup').style.display='none';
  showToast('⭐ Huy hiệu Cảnh Sát Trưởng bị thu hồi.');
  buildVoteTable();
  setTimeout(processDeath,600);
}

// ===== PRIEST =====
export function updatePriestCard() {
  var hasPriest=(st.roles.priest||0)>0;
  var priestAlive=st.players.some(function(p){return p.role==='priest'&&p.alive;});
  var card=document.getElementById('priest-card');
  if(!hasPriest||!priestAlive||st.nc.priestUsed){card.style.display='none';return;}
  card.style.display='block';
  var picker=document.getElementById('priest-picker'); picker.innerHTML='';
  var alive=st.players.map(function(p,i){return Object.assign({},p,{_idx:i});}).filter(function(p){return p.alive&&p.role!=='priest';});
  alive.forEach(function(p){
    var r=ri(p.role);
    var btn=document.createElement('button'); btn.className='victim-btn';
    btn.innerHTML='<span class="v-emoji">'+r.emoji+'</span><span class="v-name">'+p.name+'</span><span class="v-check">✓</span>';
    btn.onclick=function(){
      sfx('select');
      picker.querySelectorAll('.victim-btn').forEach(function(b){b.className='victim-btn';});
      btn.className='victim-btn sel-acc';
      setTimeout(function(){priestActivate(p._idx);},200);
    };
    picker.appendChild(btn);
  });
}

export function priestActivate(idx) {
  var p=st.players[idx], r=ri(p.role);
  var isWolf=WOLF_ROLES.includes(p.role);
  st.nc.priestUsed=true;
  sfx(isWolf?'hang':'click');
  if(isWolf){
    if(p.role==='wolfElder'&&!p.elderWolfHit){
      p.elderWolfHit=true;
      sfx('click');
      showToast('✝️ '+p.name+' bị thánh hóa nhưng SỐNG SÓT! Là Sói Già — lần 2 mới chết.',3500);
      logDay('✝️ Linh Mục thánh hóa '+p.name+' (Sói Già) → sống sót lần đầu');
      document.getElementById('priest-card').style.display='none';
      return;
    }
    p.alive=false;
    updateHUD();
    showToast('✝️ '+p.name+' bị thánh hóa — là MA SÓI! '+r.emoji+' '+r.name+' bị loại!',4000);
    logDay('✝️ Linh Mục thánh hóa '+p.name+' ('+r.name+') → MA SÓI, bị loại');
    triggerOnDeath(idx); checkLovers(idx,[]);
    buildVoteTable();
    setTimeout(processDeath,1200);
  } else {
    showToast('✝️ '+p.name+' bị thánh hóa — là DÂN LÀNG. Quyền năng tiêu hao.',3500);
    logDay('✝️ Linh Mục thánh hóa '+p.name+' ('+r.name+') → Dân, không có gì xảy ra');
  }
  document.getElementById('priest-card').style.display='none';
}

export function priestSkip() {
  sfx('click');
  document.getElementById('priest-card').style.display='none';
  showToast('✝️ Linh Mục không dùng hôm nay.');
}

// ===== VOTE =====
export function buildVoteTable() {
  var tbl=document.getElementById('vote-table'); tbl.innerHTML=''; st.voteMap={};
  var sheriffAlive = st.sheriffIdx>=0 && st.players[st.sheriffIdx] && st.players[st.sheriffIdx].alive;
  st.players.forEach(function(p,i){
    if(!p.alive)return;
    st.voteMap[i]=0;
    var r=ri(p.role);
    var isSheriff = (i===st.sheriffIdx);
    var nameTd = p.name + (isSheriff ? ' <span style="color:var(--gold);font-size:.75rem" title="Phiếu đôi">⭐×2</span>' : '');
    var tr=document.createElement('tr');
    tr.innerHTML='<td>'+r.emoji+'</td><td style="font-weight:500">'+nameTd+'</td><td><div class="vote-input-wrap"><button onclick="chVote('+i+',-1)">−</button><span id="vi-'+i+'">0</span><button onclick="chVote('+i+',1)">+</button></div></td>';
    tbl.appendChild(tr);
  });
  var note = document.getElementById('sheriff-vote-note');
  if(note) note.style.display = sheriffAlive ? 'block' : 'none';
}

export function chVote(i, d) {
  st.voteMap[i]=Math.max(0,(st.voteMap[i]||0)+d);
  var el=document.getElementById('vi-'+i); if(el)el.textContent=st.voteMap[i];
  sfx('click');
}

export function showVoteResult() {
  sfx('vote');
  var alive=st.players.map(function(p,i){return Object.assign({},p,{i:i});}).filter(function(p){return p.alive;});
  if(!alive.length)return;
  var maxV=Math.max.apply(null,alive.map(function(p){return st.voteMap[p.i]||0;}));
  var tops=alive.filter(function(p){return (st.voteMap[p.i]||0)===maxV;});
  var rl=document.getElementById('vote-result-list'); rl.innerHTML='';
  alive.slice().sort(function(a,b){return (st.voteMap[b.i]||0)-(st.voteMap[a.i]||0);}).forEach(function(p){
    var v=st.voteMap[p.i]||0, isTop=v===maxV&&maxV>0, r=ri(p.role);
    var pct=maxV>0?Math.round(v/maxV*100):0;
    var div=document.createElement('div'); div.className='vote-result-row '+(isTop?'top':'normal');
    div.innerHTML='<span>'+r.emoji+'</span><span style="font-weight:600;flex:1">'+p.name+'</span><span style="font-size:.83rem;font-weight:700;color:'+(isTop?'var(--rose)':'var(--muted)')+'">'+v+'p</span><div class="vote-bar-wrap"><div class="vote-bar" style="width:'+pct+'%;background:'+(isTop?'var(--rose)':'var(--acc2)')+'"></div></div>';
    rl.appendChild(div);
  });
  var exSec=document.getElementById('vote-execute-section');
  var exLbl=document.getElementById('vote-execute-label');
  if(maxV===0){exSec.style.display='none';}
  else if(tops.length>1){
    var sgAlive=alive.filter(function(p){return p.role==='scapegoat';});
    if(sgAlive.length){
      st.voteTopIdx=sgAlive[0].i;
      exSec.style.display='block';
      exLbl.innerHTML='⚖️ Hoà phiếu! → 🐑 <strong>'+sgAlive[0].name+'</strong> (Vật Tế Thần) tự động bị hành quyết!';
    } else {
      exSec.style.display='block';exLbl.textContent='Hoà '+tops.length+' người! Không treo cổ ai.';st.voteTopIdx=-1;
    }
  }
  else{st.voteTopIdx=tops[0].i;exSec.style.display='block';exLbl.innerHTML='⚡ <strong>'+tops[0].name+'</strong> nhiều phiếu nhất ('+maxV+' phiếu)';}
  document.getElementById('vote-result-card').style.display='block';
  document.getElementById('vote-result-card').scrollIntoView({behavior:'smooth',block:'nearest'});
}

export function executeVote() {
  if(st.voteTopIdx<0)return;
  sfx('hang');
  var p=st.players[st.voteTopIdx]; p.alive=false;
  var r=ri(p.role);
  if(st.currentLogRound)st.currentLogRound.day={voted:st.voteTopIdx,executed:true,name:p.name,role:r.name,roleEmoji:r.emoji,isWolf:WOLF_ROLES.includes(p.role)};
  showToast('🪢 '+p.name+' bị treo cổ!<br><span style="color:var(--acc)">'+r.emoji+' '+r.name+'</span>',3500);
  if(p.role==='fool'){
    setTimeout(function(){sfx('win');setWin('🃏','KẺ NGỐC THẮNG!',p.name+' bị treo cổ đúng kế hoạch! Vòng '+st.round+'.');},1200);
    return;
  }
  triggerOnDeath(st.voteTopIdx); checkLovers(st.voteTopIdx,[]);
  document.getElementById('vote-result-card').style.display='none';
  buildVoteTable();
  if(st.currentLogRound)st.gameLog.push(JSON.parse(JSON.stringify(st.currentLogRound)));
  st.currentLogRound={round:st.round,night:[],day:null};
  setTimeout(processDeath,1200);
}

export function noExecution() {
  showToast('🕊️ Không ai bị treo cổ hôm nay.');
  if(st.currentLogRound)st.currentLogRound.day={executed:false};
  document.getElementById('vote-result-card').style.display='none';
}

// ===== TIMER =====
export function setTimer(s) { clearInterval(st.timerIv);st.timerRunning=false;st.timerSec=s;st.timerTotal=s;updTimer(); }

export function toggleTimer() {
  sfx('click');
  if(st.timerRunning){clearInterval(st.timerIv);st.timerRunning=false;}
  else {
    st.timerRunning=true;
    st.timerIv=setInterval(function(){
      if(st.timerSec<=0){
        clearInterval(st.timerIv);st.timerRunning=false;
        sfx('alarm_epic');showToast('⏰ HẾT GIỜ THẢO LUẬN!',3500);
        document.getElementById('ttext').style.color='var(--rose)';
        setTimeout(function(){document.getElementById('ttext').style.color='var(--gold)';},3000);
        return;
      }
      st.timerSec--;updTimer();
      if(st.timerSec===30)sfx('click');
      else if(st.timerSec>0&&st.timerSec<=10)sfx('heartbeat');
    },1000);
  }
}

export function updTimer() {
  var m=Math.floor(st.timerSec/60),s=st.timerSec%60;
  document.getElementById('ttext').textContent=m+':'+(s<10?'0':'')+s;
  var pct=st.timerSec/st.timerTotal,C=239;
  document.getElementById('tcircle').style.strokeDashoffset=C*(1-pct);
  document.getElementById('tcircle').style.stroke=pct>.5?'#a78bfa':pct>.2?'#fbbf24':'#fb7185';
}

// ===== STATUS =====
export function showStatus() {
  st.prevScreen=document.querySelector('.screen.active').id;
  var l=document.getElementById('p-list');l.innerHTML='';
  st.players.forEach(function(p,i){
    var r=ri(p.role);
    var d=document.createElement('div');d.className='player-item'+(p.alive?'':' dead');
    var action=p.alive
      ?'<button class="p-kill" onclick="killPlayer('+i+')" title="Đánh dấu chết">💀</button>'
      :'<span style="color:var(--rose);font-size:.72rem">Chết</span><button class="p-kill" onclick="revivePlayer('+i+')" title="Hồi sinh (GM override)" style="margin-left:.4rem;font-size:.8rem;background:rgba(20,184,166,.15);border-color:rgba(20,184,166,.4);color:var(--teal)">↩</button>';
    d.innerHTML='<div class="p-avatar">'+r.emoji+'</div><div class="p-name">'+p.name+'</div><div class="p-role">'+r.name+'</div>'+action;
    l.appendChild(d);
  });
  goScreen('s-status');document.getElementById('fnav').style.display='none';
}

export function killPlayer(i) {
  sfx('dead');st.players[i].alive=false;
  triggerOnDeath(i);checkLovers(i,[]);
  showToast('💀 '+st.players[i].name+' đã chết');
  showStatus();
  setTimeout(processDeath,800);
}

export function revivePlayer(i) {
  sfx('confirm');
  st.players[i].alive=true;
  st.hunterQueue=st.hunterQueue.filter(function(it){return it.idx!==i;});
  showToast('↩ '+st.players[i].name+' được hồi sinh (GM override)');
  showStatus();
}

// ===== HISTORY =====
export function showHistory() {
  st.prevScreen=document.querySelector('.screen.active').id;
  var cont=document.getElementById('history-content');cont.innerHTML='';
  var logs=st.gameLog.slice();
  if(st.currentLogRound&&(st.currentLogRound.night.length||st.currentLogRound.day)){
    var last=logs[logs.length-1];
    if(!last||last.round!==st.currentLogRound.round)logs.push(st.currentLogRound);
  }
  if(!logs.length){
    cont.innerHTML='<div class="info-box" style="text-align:center;color:var(--muted)">Chưa có dữ liệu lịch sử.</div>';
  } else {
    var alive=st.players.filter(function(p){return p.alive;}).length;
    var dead=st.players.filter(function(p){return !p.alive;}).length;
    var hdr=document.createElement('div');hdr.style.cssText='background:var(--surf2);border:1px solid var(--border);border-radius:10px;padding:.65rem 1rem;margin-bottom:.7rem;font-size:.82rem;';
    hdr.innerHTML='<div style="font-weight:700;color:var(--acc);margin-bottom:.3rem">📊 Tổng quan ván đấu</div><div style="color:var(--muted)">Người chơi: <strong style="color:var(--text)">'+st.n+'</strong> &nbsp;|&nbsp; Số vòng: <strong style="color:var(--text)">'+logs.length+'</strong></div><div style="color:var(--muted)">Còn sống: <strong style="color:var(--teal)">'+alive+'</strong> &nbsp;|&nbsp; Đã chết: <strong style="color:var(--rose)">'+dead+'</strong></div>';
    cont.appendChild(hdr);
    logs.forEach(function(log){
      var div=document.createElement('div');div.className='hist-round';
      var hd=document.createElement('div');hd.className='hist-round-hd';
      hd.innerHTML='🌙 Vòng '+log.round+' <span style="font-size:.68rem;color:var(--muted);font-weight:400;margin-left:6px">'+log.night.length+' hành động đêm</span>';
      div.appendChild(hd);
      if(log.night.length){
        log.night.forEach(function(msg){var e=document.createElement('div');e.className='hist-entry hist-action';e.innerHTML='<span style="opacity:.5;margin-right:4px">▸</span>'+msg;div.appendChild(e);});
      } else {
        var e=document.createElement('div');e.className='hist-entry hist-action';e.textContent='✨ Đêm bình yên';div.appendChild(e);
      }
      var dayHd=document.createElement('div');dayHd.style.cssText='background:rgba(251,191,36,.06);border-top:1px solid rgba(251,191,36,.15);padding:.35rem .8rem;font-size:.72rem;font-weight:600;color:var(--gold);letter-spacing:1px;';dayHd.textContent='☀️ BAN NGÀY';div.appendChild(dayHd);
      if(log.day){
        var e=document.createElement('div');e.className='hist-entry';
        e.innerHTML=log.day.executed?'<span class="hist-dead">🪢 '+log.day.name+' bị treo cổ</span> <span style="font-size:.72rem;color:var(--muted)">('+log.day.role+')</span>':'<span class="hist-action">🕊️ Không treo cổ ai</span>';
        div.appendChild(e);
      } else {
        var e=document.createElement('div');e.className='hist-entry hist-action';e.textContent='(Chưa có kết quả)';div.appendChild(e);
      }
      cont.appendChild(div);
    });
    var fd=document.createElement('div');fd.className='hist-round';
    var fhd=document.createElement('div');fhd.className='hist-round-hd';fhd.textContent='🏁 Trạng thái cuối ván';fd.appendChild(fhd);
    st.players.forEach(function(p){
      var r=ri(p.role);
      var e=document.createElement('div');e.className='hist-entry';
      e.innerHTML=(p.alive?'<span style="color:var(--teal)">✓</span>':'<span class="hist-dead">✝</span>')+' '+r.emoji+' '+p.name+' <span style="font-size:.72rem;color:var(--muted)">('+r.name+')</span>';
      fd.appendChild(e);
    });
    cont.appendChild(fd);
  }
  goScreen('s-history');document.getElementById('fnav').style.display='none';
}

// ===== WIN =====
export function checkWin() {
  if(document.getElementById('s-win').classList.contains('active')) return;
  var alive = st.players.filter(function(p){return p.alive;});
  var wolves = alive.filter(function(p){return WOLF_ROLES.includes(p.role);});
  var villagers = alive.length - wolves.length;

  if(wolves.length === 0){
    sfx('win');
    setWin('🎉','DÂN LÀNG THẮNG!','Tiêu diệt toàn bộ Ma Sói sau '+st.round+' vòng!');
    return;
  }

  // Sói Trắng thắng một mình: chỉ còn Sói Trắng (không còn sói nào khác)
  var whitewolfAlone = wolves.length===1 && wolves[0].role==='whitewolf';
  if(whitewolfAlone && wolves.length >= villagers){
    sfx('win');
    setWin('🤍','SÓI TRẮNG THẮNG!',wolves[0].name+' đã loại sạch đồng đội và chiếm đa số! Vòng '+st.round+'.');
    return;
  }

  if(wolves.length >= villagers){
    sfx('wolf');
    setWin('🐺','MA SÓI THẮNG!','Ma Sói chiếm đa số sau '+st.round+' vòng!');
  } else {
    showToast('🐺 '+wolves.length+' Ma Sói  |  👥 '+villagers+' Dân còn lại');
  }
}

export function setWin(emoji, title, sub) {
  st.gameOver = true;
  if(st.currentLogRound) st.gameLog.push(JSON.parse(JSON.stringify(st.currentLogRound)));
  document.getElementById('win-emoji').textContent = emoji;
  document.getElementById('win-title').textContent = title;
  document.getElementById('win-sub').textContent = sub;
  goScreen('s-win');
}

// ===== RECAP =====
export function showRecap() {
  sfx('reveal');
  st.prevScreen = document.querySelector('.screen.active').id;
  var cont = document.getElementById('recap-content');
  cont.innerHTML = '';
  var logs = st.gameLog.slice();
  if(!logs.length){
    cont.innerHTML='<div class="info-box" style="text-align:center;color:var(--muted)">Chưa có dữ liệu để kể lại.</div>';
    goScreen('s-recap'); return;
  }
  var deadCount=st.players.filter(function(p){return !p.alive;}).length;
  var wolfCount=st.players.filter(function(p){return WOLF_ROLES.includes(p.role);}).length;
  var hdr=document.createElement('div');
  hdr.style.cssText='background:var(--surf2);border:1px solid var(--border);border-radius:12px;padding:.8rem 1rem;margin-bottom:.8rem;';
  hdr.innerHTML='<div style="font-size:.72rem;font-weight:700;color:var(--acc);letter-spacing:2px;text-transform:uppercase;margin-bottom:.5rem">📊 Tổng kết ván đấu</div>'+
    '<div style="display:flex;gap:1.2rem;flex-wrap:wrap;">'+
    '<div style="font-size:.82rem"><span style="color:var(--muted)">Người chơi</span><br><strong style="font-size:1.1rem;color:var(--text)">'+st.n+'</strong></div>'+
    '<div style="font-size:.82rem"><span style="color:var(--muted)">Số vòng</span><br><strong style="font-size:1.1rem;color:var(--gold)">'+logs.length+'</strong></div>'+
    '<div style="font-size:.82rem"><span style="color:var(--muted)">Đã chết</span><br><strong style="font-size:1.1rem;color:var(--rose)">'+deadCount+'</strong></div>'+
    '<div style="font-size:.82rem"><span style="color:var(--muted)">Ma Sói</span><br><strong style="font-size:1.1rem;color:var(--rose)">'+wolfCount+'</strong></div>'+
    '</div>';
  cont.appendChild(hdr);
  logs.forEach(function(log){
    var rd=document.createElement('div'); rd.className='recap-round';
    var nhd=document.createElement('div'); nhd.className='recap-night-hd'; nhd.textContent='🌙 Đêm '+log.round; rd.appendChild(nhd);
    if(log.night.length){
      log.night.forEach(function(msg){
        var e=document.createElement('div');
        var cls='recap-event'+( msg.startsWith('💀')||msg.startsWith('🐺 Sói cắn')||msg.startsWith('☠️')||msg.startsWith('🤍')||msg.startsWith('🪢')||msg.startsWith('✝️')||msg.startsWith('💘') ? ' recap-dead' :
          msg.startsWith('🛡️')||msg.startsWith('🩺')||msg.startsWith('💊') ? ' recap-safe' :
          msg.startsWith('🔮')||msg.startsWith('🕵️')||msg.startsWith('🤴')||msg.startsWith('💘 Cupid')||msg.startsWith('🤝') ? ' recap-info' : '');
        e.className=cls; e.innerHTML='<span class="recap-bullet">▸</span> '+msg; rd.appendChild(e);
      });
    } else {
      var e=document.createElement('div'); e.className='recap-event recap-quiet'; e.innerHTML='<span class="recap-bullet">▸</span> ✨ Đêm bình yên'; rd.appendChild(e);
    }
    var dhd=document.createElement('div'); dhd.className='recap-day-hd'; dhd.textContent='☀️ Ngày '+log.round; rd.appendChild(dhd);
    if(log.day&&log.day.executed){
      var iw=log.day.isWolf;
      var de=document.createElement('div'); de.className='recap-event '+(iw?'recap-dead':'recap-miss');
      de.innerHTML='<span class="recap-bullet">▸</span> 🪢 Treo cổ <strong>'+log.day.name+'</strong> '+(log.day.roleEmoji||'')+' <span style="font-size:.76rem;color:var(--muted)">'+log.day.role+'</span> '+
        (iw?'<span class="recap-tag recap-tag-wolf">Sói 🐺</span>':'<span class="recap-tag recap-tag-vil">Dân ✓</span>');
      rd.appendChild(de);
    } else if(log.day&&!log.day.executed){
      var de=document.createElement('div'); de.className='recap-event recap-quiet';
      de.innerHTML='<span class="recap-bullet">▸</span> 🕊️ Không ai bị treo cổ'; rd.appendChild(de);
    } else {
      var de=document.createElement('div'); de.className='recap-event recap-quiet';
      de.innerHTML='<span class="recap-bullet">▸</span> (Chưa có kết quả ngày)'; rd.appendChild(de);
    }
    cont.appendChild(rd);
  });
  var revd=document.createElement('div'); revd.className='recap-round';
  var rvhd=document.createElement('div'); rvhd.className='recap-night-hd recap-reveal-hd'; rvhd.textContent='🎭 Lộ mặt — Toàn bộ vai trò'; revd.appendChild(rvhd);
  st.players.forEach(function(p){
    var r=ri(p.role), iw=WOLF_ROLES.includes(p.role);
    var e=document.createElement('div'); e.className='recap-event';
    e.innerHTML=(p.alive?'<span style="color:var(--teal)">✓</span>':'<span style="color:var(--rose)">✝</span>')+
      ' '+r.emoji+' <strong>'+p.name+'</strong> <span style="font-size:.74rem;color:'+(iw?'var(--rose)':'var(--muted)')+'">'+r.name+'</span>'+
      (iw?' <span class="recap-tag recap-tag-wolf">Sói</span>':'');
    revd.appendChild(e);
  });
  cont.appendChild(revd);
  goScreen('s-recap');
}

export function fullReset() {
  clearInterval(st.timerIv);
  st.gameOver=false; st.players=[];st.assigned=[];st.dealIdx=0;st.round=1;
  st.gameLog=[];st.currentLogRound=null;st.hunterQueue=[];
  st.sheriffIdx=-1; st.sheriffPassQueue=[];
  st.nc={};st.voteMap={};
  st.wolfDoubleKill=false; st.wildchildRoleModel=-1; st.foxAbilityLost=false;
  goScreen('s-home');
  if(window.renderPresets) window.renderPresets();
}
