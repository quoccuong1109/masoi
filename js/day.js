import { WOLF_ROLES } from './data.js';
import { sfx } from './audio.js';
import { st } from './state.js';
import { goScreen, showToast, ri } from './ui.js';

// ===== START DAY =====
export function startDay() {
  st.round++;
  document.getElementById('day-round').textContent = st.round-1;
  var nc = st.nc;
  var guardedIdx = (nc.guardProtect>=0&&nc.guardProtect!==-99) ? nc.guardProtect : -1;
  st.nc.guardLastNight = guardedIdx;

  var events=[];

  if(nc.wolfVictim>=0&&nc.wolfVictim!==-99){
    var v=nc.wolfVictim;
    var shielded=(v===guardedIdx)||nc.witchSave;
    if(shielded){
      var r=[];
      if(v===guardedIdx)r.push('🛡️ Bảo Vệ');
      if(nc.witchSave){r.push('🧙 Phù Thủy cứu');nc.witchSaveUsed=true;}
      events.push({type:'safe',idx:v,reason:'Bị cắn nhưng '+r.join(' + ')+' — an toàn!'});
      logDay('🐺 Sói cắn '+st.players[v].name+' → '+r.join(', ')+' cứu');
    } else {
      st.players[v].alive=false;
      events.push({type:'dead',idx:v,reason:'🐺 Bị Ma Sói cắn'});
      logDay('💀 '+st.players[v].name+' chết do Sói cắn');
      checkLovers(v,events); triggerOnDeath(v);
    }
  } else if(nc.wolfVictim===-99){
    logDay('🐺 Ma Sói bỏ qua đêm nay');
  }

  if(nc.whitewolfVictim>=0&&nc.whitewolfVictim!==-99){
    var wi=nc.whitewolfVictim;
    if(wi===guardedIdx){
      events.push({type:'safe',idx:wi,reason:'🤍 Sói Trắng tấn công nhưng 🛡️ Bảo Vệ che chắn'});
      logDay('🛡️ Bảo Vệ chặn Sói Trắng khỏi '+st.players[wi].name);
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
    if(pi===guardedIdx){
      events.push({type:'safe',idx:pi,reason:'☠️ Bị đầu độc nhưng 🛡️ Bảo Vệ che chắn'});
      logDay('🛡️ Bảo Vệ chặn thuốc độc khỏi '+st.players[pi].name);
    } else if(st.players[pi].alive){
      st.players[pi].alive=false;
      events.push({type:'dead',idx:pi,reason:'☠️ Bị Phù Thủy đầu độc'});
      logDay('💀 '+st.players[pi].name+' chết do thuốc độc');
      checkLovers(pi,events); triggerOnDeath(pi);
    }
  }

  if(!events.length) { events.push({type:'quiet'}); logDay('✨ Đêm bình yên'); }

  var box=document.getElementById('night-result-box');
  var cont=document.getElementById('night-result-content');
  box.style.display='block';
  cont.innerHTML=events.map(function(e){
    if(e.type==='quiet')return '<div class="result-row quiet-row"><span>✨</span><span>Đêm bình yên — không ai chết!</span></div>';
    var p=st.players[e.idx], r=ri(p.role);
    if(e.type==='dead')return '<div class="result-row dead-row"><span style="font-size:1rem">'+r.emoji+'</span><div><strong>'+p.name+'</strong><br><span style="font-size:.74rem;color:var(--muted)">'+e.reason+'</span><br><span style="font-size:.72rem;color:var(--rose)">Vai: '+r.name+'</span></div></div>';
    return '<div class="result-row safe-row"><span style="font-size:1rem">'+r.emoji+'</span><div><strong>'+p.name+'</strong><br><span style="font-size:.74rem;color:var(--teal)">'+e.reason+'</span></div></div>';
  }).join('');

  events.some(function(e){return e.type==='dead';})?sfx('dead'):sfx('confirm');
  buildVoteTable();
  updatePriestCard();
  document.getElementById('vote-result-card').style.display='none';
  clearInterval(st.timerIv); st.timerRunning=false; setTimer(180);
  goScreen('s-day');
  processHunterQueue();
  setTimeout(checkWin, 700);
}

function logDay(msg) { if(st.currentLogRound) st.currentLogRound.night.push(msg); }

export function checkLovers(deadIdx, events) {
  var lp=st.nc.loverPair;
  if(lp.length===2&&lp.includes(deadIdx)){
    var other=lp.find(function(x){return x!==deadIdx;});
    if(st.players[other]&&st.players[other].alive){
      st.players[other].alive=false;
      events.push({type:'dead',idx:other,reason:'💘 Người yêu chết — chết theo vì tình'});
      logDay('💘 '+st.players[other].name+' chết theo người yêu');
      triggerOnDeath(other);
    }
  }
}

export function triggerOnDeath(idx) {
  var role=st.players[idx].role;
  if(role==='hunter') st.hunterQueue.push({idx:idx,type:'hunter'});
  if(role==='alphawolf') st.hunterQueue.push({idx:idx,type:'alphawolf'});
}

// ===== HUNTER/ALPHA POPUP =====
export function processHunterQueue() {
  if(!st.hunterQueue.length)return;
  var item=st.hunterQueue.shift();
  var p=st.players[item.idx];
  var isAlpha=item.type==='alphawolf';
  document.getElementById('hunter-icon').textContent=isAlpha?'👑':'🏹';
  document.getElementById('hunter-title').textContent=(isAlpha?'👑 '+p.name+' — Sói Đầu Đàn kéo theo!':'🏹 '+p.name+' — Thợ Săn kích hoạt!');
  document.getElementById('hunter-sub').textContent=(isAlpha?p.name+' bị loại. Họ có thể kéo thêm 1 người chết theo!':p.name+' đã chết. Họ có thể bắn 1 người trước khi ra đi.');
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

export function hunterShoot(item, targetIdx) {
  sfx('hang');
  var t=st.players[targetIdx]; t.alive=false;
  document.getElementById('hunter-popup').style.display='none';
  var r=ri(t.role), shooter=st.players[item.idx], isAlpha=item.type==='alphawolf';
  showToast((isAlpha?'👑':'🏹')+' '+shooter.name+' → '+t.name+' chết theo!<br><span style="color:var(--acc)">'+r.emoji+' '+r.name+'</span>',3500);
  logDay((isAlpha?'👑 Sói Đầu Đàn':'🏹 Thợ Săn')+' '+shooter.name+' → '+t.name+' chết');
  checkLovers(targetIdx,[]); triggerOnDeath(targetIdx);
  setTimeout(function(){processHunterQueue();checkWin();},1200);
}

export function hunterSkip() {
  sfx('click');
  document.getElementById('hunter-popup').style.display='none';
  showToast('Chọn không kéo theo/bắn ai.');
  setTimeout(function(){processHunterQueue();checkWin();},800);
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
    p.alive=false;
    showToast('✝️ '+p.name+' bị thánh hóa — là MA SÓI! '+r.emoji+' '+r.name+' bị loại!',4000);
    logDay('✝️ Linh Mục thánh hóa '+p.name+' ('+r.name+') → MA SÓI, bị loại');
    triggerOnDeath(idx); checkLovers(idx,[]);
    buildVoteTable();
    setTimeout(function(){processHunterQueue();checkWin();},1200);
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
  st.players.forEach(function(p,i){
    if(!p.alive)return;
    st.voteMap[i]=0;
    var r=ri(p.role);
    var tr=document.createElement('tr');
    tr.innerHTML='<td>'+r.emoji+'</td><td style="font-weight:500">'+p.name+'</td><td><div class="vote-input-wrap"><button onclick="chVote('+i+',-1)">−</button><span id="vi-'+i+'">0</span><button onclick="chVote('+i+',1)">+</button></div></td>';
    tbl.appendChild(tr);
  });
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
  else if(tops.length>1){exSec.style.display='block';exLbl.textContent='Hoà '+tops.length+' người! Không treo cổ ai.';st.voteTopIdx=-1;}
  else{st.voteTopIdx=tops[0].i;exSec.style.display='block';exLbl.innerHTML='⚡ <strong>'+tops[0].name+'</strong> nhiều phiếu nhất ('+maxV+' phiếu)';}
  document.getElementById('vote-result-card').style.display='block';
  document.getElementById('vote-result-card').scrollIntoView({behavior:'smooth',block:'nearest'});
}

export function executeVote() {
  if(st.voteTopIdx<0)return;
  sfx('hang');
  var p=st.players[st.voteTopIdx]; p.alive=false;
  var r=ri(p.role);
  if(st.currentLogRound)st.currentLogRound.day={voted:st.voteTopIdx,executed:true,name:p.name,role:r.name};
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
  setTimeout(function(){processHunterQueue();checkWin();},1200);
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
        sfx('alarm');showToast('⏰ HẾT GIỜ THẢO LUẬN!',3500);
        document.getElementById('ttext').style.color='var(--rose)';
        setTimeout(function(){document.getElementById('ttext').style.color='var(--gold)';},3000);
        return;
      }
      st.timerSec--;updTimer();
      if(st.timerSec===30||st.timerSec===10)sfx('click');
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
    d.innerHTML='<div class="p-avatar">'+r.emoji+'</div><div class="p-name">'+p.name+'</div><div class="p-role">'+r.name+'</div>'+(p.alive?'<button class="p-kill" onclick="killPlayer('+i+')">💀</button>':'<span style="color:var(--rose);font-size:.72rem">Chết</span>');
    l.appendChild(d);
  });
  goScreen('s-status');document.getElementById('fnav').style.display='none';
}

export function killPlayer(i) {
  sfx('dead');st.players[i].alive=false;
  triggerOnDeath(i);checkLovers(i,[]);
  showToast('💀 '+st.players[i].name+' đã chết');
  showStatus();
  setTimeout(function(){processHunterQueue();checkWin();},800);
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
  var wolves = alive.filter(function(p){return WOLF_ROLES.includes(p.role);}).length;
  var villagers = alive.length - wolves;
  if(wolves === 0){
    sfx('win');
    setWin('🎉','DÂN LÀNG THẮNG!','Tiêu diệt toàn bộ Ma Sói sau '+st.round+' vòng!');
  } else if(wolves >= villagers){
    sfx('wolf');
    setWin('🐺','MA SÓI THẮNG!','Ma Sói chiếm đa số sau '+st.round+' vòng!');
  } else {
    showToast('🐺 '+wolves+' Ma Sói  |  👥 '+villagers+' Dân còn lại');
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

export function fullReset() {
  clearInterval(st.timerIv);
  st.gameOver = false; st.players=[];st.assigned=[];st.dealIdx=0;st.round=1;
  st.gameLog=[];st.currentLogRound=null;st.hunterQueue=[];
  st.nc={};st.voteMap={};
  goScreen('s-home');
}
