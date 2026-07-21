import { ROLES, WOLF_ROLES, VIL_ROLES, SKIPPABLE } from './data.js';
import { sfx, startNightBgm, stopBgm, narrate } from './audio.js?v=2';
import { st, freshNc } from './state.js';
import { goScreen, showToast, ri } from './ui.js';

var NARRATE_MAP = {
  'sleep':       'Màn đêm buông xuống. Tất cả nhắm mắt, cúi đầu, giữ im lặng tuyệt đối.',
  'cupid':       'Thần Tình Yêu, hãy mở mắt và chọn hai người yêu nhau.',
  'matchmaker':  'Mối Giới, hãy mở mắt.',
  'sheriff':     'Cảnh Sát Trưởng, hãy nhận biết nhau.',
  'wolf':        'Phe Ma Sói, hãy mở mắt. Hãy thống nhất và chọn nạn nhân đêm nay.',
  'whitewolf':   'Sói Trắng, hãy mở mắt.',
  'gangleader':  'Trùm Sói, hãy mở mắt và chọn người điều tra.',
  'seer':        'Tiên Tri, hãy mở mắt và chọn người để soi bói.',
  'detective':   'Thám Tử, hãy mở mắt và chọn hai người để điều tra.',
  'guard':       'Bảo Vệ, hãy mở mắt và chọn người bạn muốn bảo vệ đêm nay.',
  'doctor':      'Bác Sĩ, hãy mở mắt và chọn người bạn muốn cứu đêm nay.',
  'witch':       'Phù Thủy, hãy mở mắt.',
  'medium':      'Đồng Cốt, hãy mở mắt và hỏi hồn ma một câu.',
  'wake':        'Bình minh đã đến. Tất cả hãy mở mắt!'
};

// Injected by main.js to break circular dep with day.js
var _startDay = null;
export function setStartDay(fn) { _startDay = fn; }

export function logN(msg) { if(st.currentLogRound) st.currentLogRound.night.push(msg); }

// ===== NIGHT ORDER =====
export function buildNightOrder() {
  var r=st.roles, ord=[];
  ord.push({icon:'😴',name:'Tất cả nhắm mắt',action:'Yêu cầu mọi người nhắm mắt, cúi đầu, giữ im lặng tuyệt đối.',step:'sleep'});
  if(st.round===1&&(r.cupid||0)>0) ord.push({icon:'💘',name:'Thần Tình Yêu thức dậy',action:'Thần Tình Yêu mở mắt và chọn 2 người yêu nhau. Nhắm mắt lại.',step:'cupid'});
  if(!st.nc.matchmakerUsed&&(r.matchmaker||0)>0) ord.push({icon:'🤝',name:'Mối Giới thức dậy',action:'Mối Giới mở mắt. Chọn 2 người kết đôi yêu nhau (1 lần duy nhất trong ván). Có thể bỏ qua để dùng đêm khác. Nhắm mắt lại.',step:'matchmaker'});
  if(st.round===1&&(r.sheriff||0)>0) ord.push({icon:'⭐',name:'Cảnh Sát Trưởng thức dậy',action:'Cảnh Sát Trưởng mở mắt. Quản trò ghi nhận (phiếu gấp đôi). Nhắm mắt lại.',step:'sheriff'});
  if(WOLF_ROLES.some(function(k){return (r[k]||0)>0;})) ord.push({icon:'🐺',name:'Phe Ma Sói thức dậy',action:'Ma Sói mở mắt, nhận ra nhau. Chọn 1 nạn nhân (hoặc bỏ qua) rồi nhắm mắt lại.',step:'wolf'});
  if((r.whitewolf||0)>0&&st.round%2===0) ord.push({icon:'🤍',name:'Sói Trắng chọn thêm',action:'Đêm chẵn — Sói Trắng có thể tiêu diệt thêm 1 người (kể cả đồng đội). Hoặc bỏ qua.',step:'whitewolf'});
  if((r.gangleader||0)>0) ord.push({icon:'🤴',name:'Trùm Sói điều tra',action:'Trùm Sói mở mắt. Chọn 1 người để điều tra — Quản trò báo người đó có phải Dân Làng thường không. Nhắm mắt lại.',step:'gangleader'});
  if((r.seer||0)>0) ord.push({icon:'🔮',name:'Tiên Tri thức dậy',action:'Tiên Tri chọn 1 người để điều tra. Quản trò gật (Ma Sói — trừ Người Sói) hoặc lắc (Dân). Nhắm mắt lại.',step:'seer'});
  if((r.detective||0)>0) ord.push({icon:'🕵️',name:'Thám Tử thức dậy',action:'Thám Tử mở mắt. Chọn 2 người — Quản trò báo CÓ hay KHÔNG có ít nhất 1 Ma Sói trong 2 người đó. Nhắm mắt lại.',step:'detective'});
  if((r.guard||0)>0) ord.push({icon:'🛡️',name:'Bảo Vệ thức dậy',action:'Bảo Vệ chọn 1 người bảo vệ đêm nay (không trùng đêm trước). Hoặc bỏ qua.',step:'guard'});
  if((r.doctor||0)>0) ord.push({icon:'🩺',name:'Bác Sĩ thức dậy',action:'Bác Sĩ mở mắt. Chọn 1 người để cứu tối nay (kể cả bản thân). Không biết ai bị cắn — phán đoán! Hoặc bỏ qua.',step:'doctor'});
  if((r.witch||0)>0) ord.push({icon:'🧙',name:'Phù Thủy thức dậy',action:'Phù Thủy mở mắt. Xem nạn nhân và quyết định dùng thuốc.',step:'witch'});
  if((r.medium||0)>0&&st.players.some(function(p){return !p.alive;})) ord.push({icon:'👻',name:'Đồng Cốt thức dậy',action:'Đồng Cốt mở mắt, chỉ 1 hồn ma. Quản trò gật/lắc 1 câu hỏi có/không. Nhắm mắt lại.',step:'medium'});
  ord.push({icon:'🌅',name:'Tất cả thức dậy!',action:'Chào buổi sáng! Kết quả đêm qua được công bố.',step:'wake'});
  return ord;
}

// ===== START NIGHT =====
export function startNight() {
  st.nc = freshNc(st.nc);
  st.nightStep = 0;
  st.nightOrder = buildNightOrder();
  document.getElementById('night-round-num').textContent = st.round;
  var cont = document.getElementById('night-order'); cont.innerHTML='';
  st.nightOrder.forEach(function(s,i){
    var d=document.createElement('div'); d.className='night-step';
    d.innerHTML='<div class="step-num">'+(i+1)+'</div><span style="font-size:.88rem">'+s.icon+'</span><span style="font-size:.8rem">'+s.name+'</span>';
    cont.appendChild(d);
  });
  st.currentLogRound = {round:st.round, night:[], day:null};
  sfx('night'); startNightBgm();
  goScreen('s-night'); updateNight();
}

// ===== PICKER =====
export function showDeadRoleNotice(icon, msg) {
  document.getElementById('night-picker-area').innerHTML = '<div class="info-box" style="color:var(--muted);text-align:center">'+icon+' '+msg+'</div>';
}

export function buildPicker(cfg) {
  var area = document.getElementById('night-picker-area'); area.innerHTML='';
  if(!cfg||!cfg.players||!cfg.players.length) return;
  var wrap = document.createElement('div'); wrap.className='picker-section';
  if(cfg.label){var lbl=document.createElement('div');lbl.className='picker-label';lbl.textContent=cfg.label;wrap.appendChild(lbl);}
  cfg.players.forEach(function(p){
    var i=p._idx;
    var btn=document.createElement('button');
    btn.className='victim-btn'+(st.nc[cfg.selKey]===i?' '+cfg.selClass:'');
    btn.innerHTML='<span class="v-emoji">'+ri(p.role).emoji+'</span><span class="v-name">'+p.name+'</span><span class="v-check">✓</span>';
    btn.onclick=function(){
      st.nc[cfg.selKey]=i; sfx(cfg.sfx||'select');
      wrap.querySelectorAll('.victim-btn:not([data-dead])').forEach(function(b){b.className='victim-btn';});
      btn.className='victim-btn '+cfg.selClass;
      if(cfg.onSelect)cfg.onSelect(i,p);
    };
    wrap.appendChild(btn);
  });
  var dead = st.players.map(function(p,i){return Object.assign({},p,{_idx:i});}).filter(function(p){return !p.alive;});
  if(dead.length){
    var sep=document.createElement('div');sep.style.cssText='font-size:.63rem;color:var(--muted);text-transform:uppercase;margin:.5rem 0 .25rem;opacity:.5';sep.textContent='— Đã chết (chỉ xem) —';wrap.appendChild(sep);
    dead.forEach(function(p){
      var btn=document.createElement('button');btn.className='victim-btn';btn.disabled=true;btn.setAttribute('data-dead','1');
      btn.style.cssText='opacity:.22;cursor:not-allowed;filter:grayscale(1);margin-bottom:.25rem;';
      btn.innerHTML='<span class="v-emoji">'+ri(p.role).emoji+'</span><span class="v-name">'+p.name+' ✝</span>';
      wrap.appendChild(btn);
    });
  }
  area.appendChild(wrap);
}

// ===== DETECTIVE PICKER =====
export function buildDetectivePicker(alive) {
  var area=document.getElementById('night-picker-area');area.innerHTML='';
  var wrap=document.createElement('div');wrap.className='picker-section';
  var lbl=document.createElement('div');lbl.className='picker-label';lbl.textContent='🕵️ Chọn 2 người để điều tra:';wrap.appendChild(lbl);
  alive.forEach(function(p){
    var i=p._idx, sel=st.nc.detectiveCheck.includes(i);
    var btn=document.createElement('button');btn.className='victim-btn'+(sel?' sel-acc':'');btn.id='dt-'+i;
    btn.innerHTML='<span class="v-emoji">'+ri(p.role).emoji+'</span><span class="v-name">'+p.name+'</span><span class="v-check">✓</span>';
    btn.onclick=function(){
      sfx('select');
      if(st.nc.detectiveCheck.includes(i)) st.nc.detectiveCheck=st.nc.detectiveCheck.filter(function(x){return x!==i;});
      else if(st.nc.detectiveCheck.length<2) st.nc.detectiveCheck.push(i);
      else{showToast('Chỉ chọn 2 người!');return;}
      wrap.querySelectorAll('.victim-btn').forEach(function(b){b.classList.remove('sel-acc');});
      st.nc.detectiveCheck.forEach(function(idx){var el=document.getElementById('dt-'+idx);if(el)el.classList.add('sel-acc');});
      if(st.nc.detectiveCheck.length===2){
        var n1=st.players[st.nc.detectiveCheck[0]].name, n2=st.players[st.nc.detectiveCheck[1]].name;
        var hasWolf=st.nc.detectiveCheck.some(function(idx){return WOLF_ROLES.includes(st.players[idx].role)&&!ROLES[st.players[idx].role].immuneSeer;});
        showToast(hasWolf?'🔴 TRONG 2 NGƯỜI ĐÓ: CÓ MA SÓI!':'⚪ Không có Ma Sói trong 2 người đó.',4000);
        sfx(hasWolf?'wolf':'confirm');
        logN('🕵️ Thám Tử kiểm tra ['+n1+', '+n2+'] → '+(hasWolf?'Có Ma Sói':'Không có Ma Sói'));
      }
    };
    wrap.appendChild(btn);
  });
  area.appendChild(wrap);
}

// ===== MATCHMAKER PICKER =====
export function buildMatchmakerPicker(alive) {
  var area=document.getElementById('night-picker-area');area.innerHTML='';
  var wrap=document.createElement('div');wrap.className='picker-section';
  var lbl=document.createElement('div');lbl.className='picker-label';lbl.textContent='🤝 Chọn 2 người yêu nhau:';wrap.appendChild(lbl);
  alive.forEach(function(p){
    var i=p._idx, sel=st.nc.matchmakerNightPair.includes(i);
    var btn=document.createElement('button');btn.className='victim-btn'+(sel?' sel-acc':'');btn.id='mm-'+i;
    btn.innerHTML='<span class="v-emoji">'+ri(p.role).emoji+'</span><span class="v-name">'+p.name+'</span><span class="v-check">✓</span>';
    btn.onclick=function(){
      sfx('select');
      if(st.nc.matchmakerNightPair.includes(i)) st.nc.matchmakerNightPair=st.nc.matchmakerNightPair.filter(function(x){return x!==i;});
      else if(st.nc.matchmakerNightPair.length<2) st.nc.matchmakerNightPair.push(i);
      else{showToast('Chỉ chọn 2 người!');return;}
      wrap.querySelectorAll('.victim-btn').forEach(function(b){b.classList.remove('sel-acc');});
      st.nc.matchmakerNightPair.forEach(function(idx){var el=document.getElementById('mm-'+idx);if(el)el.classList.add('sel-acc');});
      if(st.nc.matchmakerNightPair.length===2){
        var n1=st.players[st.nc.matchmakerNightPair[0]].name, n2=st.players[st.nc.matchmakerNightPair[1]].name;
        st.nc.matchmakerPair=[].concat(st.nc.matchmakerNightPair);
        st.nc.matchmakerUsed=true;
        showToast('🤝 '+n1+' & '+n2+' yêu nhau!'); sfx('confirm');
        logN('🤝 Mối Giới ghép đôi '+n1+' & '+n2);
      }
    };
    wrap.appendChild(btn);
  });
  area.appendChild(wrap);
}

// ===== CUPID PICKER =====
export function buildCupidPicker(alive) {
  var area=document.getElementById('night-picker-area');area.innerHTML='';
  var wrap=document.createElement('div');wrap.className='picker-section';
  var lbl=document.createElement('div');lbl.className='picker-label';lbl.textContent='💘 Chọn 2 người yêu nhau:';wrap.appendChild(lbl);
  alive.forEach(function(p){
    var i=p._idx, sel=st.nc.cupidPair.includes(i);
    var btn=document.createElement('button');btn.className='victim-btn'+(sel?' sel-acc':'');btn.id='cp-'+i;
    btn.innerHTML='<span class="v-emoji">'+ri(p.role).emoji+'</span><span class="v-name">'+p.name+'</span><span class="v-check">✓</span>';
    btn.onclick=function(){
      sfx('select');
      if(st.nc.cupidPair.includes(i))st.nc.cupidPair=st.nc.cupidPair.filter(function(x){return x!==i;});
      else if(st.nc.cupidPair.length<2)st.nc.cupidPair.push(i);
      else{showToast('Chỉ chọn 2 người!');return;}
      wrap.querySelectorAll('.victim-btn').forEach(function(b){b.classList.remove('sel-acc');});
      st.nc.cupidPair.forEach(function(idx){var el=document.getElementById('cp-'+idx);if(el)el.classList.add('sel-acc');});
      if(st.nc.cupidPair.length===2){
        var n1=st.players[st.nc.cupidPair[0]].name, n2=st.players[st.nc.cupidPair[1]].name;
        st.nc.loverPair=[].concat(st.nc.cupidPair);
        showToast('💘 '+n1+' & '+n2+' yêu nhau!'); sfx('confirm');
        logN('💘 Cupid ghép đôi '+n1+' & '+n2);
      }
    };
    wrap.appendChild(btn);
  });
  area.appendChild(wrap);
}

// ===== WITCH PICKER =====
export function buildWitchPicker(alive) {
  var area=document.getElementById('night-picker-area');area.innerHTML='';
  var wrap=document.createElement('div');wrap.className='picker-section';
  var vIdx=st.nc.wolfVictim;
  var vName=(vIdx>=0&&vIdx!==-99)?st.players[vIdx].name:'(không có)';
  var info=document.createElement('div');
  info.style.cssText='font-size:.8rem;color:var(--muted);margin-bottom:.6rem;background:var(--surf2);padding:.4rem .7rem;border-radius:8px;';
  info.innerHTML='Nạn nhân bị cắn: <strong style="color:var(--rose)">'+vName+'</strong>';
  wrap.appendChild(info);
  if(!st.nc.witchSaveUsed&&vIdx>=0&&vIdx!==-99){
    var sb=document.createElement('button');sb.className='victim-btn'+(st.nc.witchSave?' sel-teal':'');
    sb.innerHTML='<span class="v-emoji">💊</span><span class="v-name">Dùng thuốc cứu — cứu '+vName+'</span><span class="v-check">✓</span>';
    sb.onclick=function(){st.nc.witchSave=!st.nc.witchSave;sfx(st.nc.witchSave?'protect':'click');sb.className='victim-btn'+(st.nc.witchSave?' sel-teal':'');};
    wrap.appendChild(sb);
  } else {
    var sd=document.createElement('div');sd.style.cssText='font-size:.76rem;color:var(--muted);padding:.35rem .6rem;background:var(--surf2);border-radius:8px;margin-bottom:.3rem;';
    sd.textContent=st.nc.witchSaveUsed?'💊 Đã dùng thuốc cứu rồi':'💊 Không có nạn nhân để cứu';
    wrap.appendChild(sd);
  }
  if(!st.nc.witchPoisonUsed){
    var plbl=document.createElement('div');plbl.className='picker-label';plbl.style.marginTop='.6rem';
    plbl.textContent='☠️ Thuốc độc (chỉ người còn sống):';wrap.appendChild(plbl);
    alive.forEach(function(p){
      var i=p._idx;
      var btn=document.createElement('button');btn.className='victim-btn'+(st.nc.witchPoison===i?' sel-red':'');btn.setAttribute('data-pois','1');
      btn.innerHTML='<span class="v-emoji">☠️</span><span class="v-name">'+p.name+'</span><span class="v-check">✓</span>';
      btn.onclick=function(){
        st.nc.witchPoison=st.nc.witchPoison===i?-1:i; sfx('wolf');
        wrap.querySelectorAll('[data-pois]').forEach(function(b){b.classList.remove('sel-red');});
        if(st.nc.witchPoison===i)btn.classList.add('sel-red');
        showToast(st.nc.witchPoison===i?'☠️ Sẽ đầu độc '+p.name:'Huỷ thuốc độc');
      };
      wrap.appendChild(btn);
    });
    var nb=document.createElement('button');nb.className='victim-btn'+(st.nc.witchPoison===-99?' sel-acc':'');
    nb.innerHTML='<span class="v-emoji">—</span><span class="v-name">Không dùng thuốc độc</span><span class="v-check">✓</span>';
    nb.onclick=function(){st.nc.witchPoison=-99;sfx('click');wrap.querySelectorAll('[data-pois]').forEach(function(b){b.classList.remove('sel-red');});nb.className='victim-btn sel-acc';};
    wrap.appendChild(nb);
  } else {
    var pd=document.createElement('div');pd.style.cssText='font-size:.76rem;color:var(--muted);padding:.35rem .6rem;background:var(--surf2);border-radius:8px;margin-top:.3rem;';pd.textContent='☠️ Đã dùng thuốc độc rồi';wrap.appendChild(pd);
  }
  area.appendChild(wrap);
}

// ===== UPDATE NIGHT STEP =====
export function updateNight() {
  var s = st.nightOrder[st.nightStep];
  document.getElementById('ni-icon').textContent = s.icon;
  document.getElementById('ni-name').textContent = s.name;
  document.getElementById('ni-step').textContent = 'Bước '+(st.nightStep+1)+'/'+st.nightOrder.length;
  document.getElementById('ni-action').textContent = s.action;
  var isLast = st.nightStep >= st.nightOrder.length-1;
  document.getElementById('ni-btn').textContent = isLast ? '☀️ Sang ban ngày' : 'Tiếp theo →';
  document.getElementById('ni-skip-btn').style.display = SKIPPABLE.includes(s.step) ? 'block' : 'none';
  document.getElementById('ni-back-btn').style.display = st.nightStep > 0 ? 'block' : 'none';
  document.getElementById('night-picker-area').innerHTML = '';
  var alive = st.players.map(function(p,i){return Object.assign({},p,{_idx:i});}).filter(function(p){return p.alive;});

  if(s.step==='wolf') {
    sfx('wolf');
    buildPicker({label:'🐾 Chọn nạn nhân của Ma Sói:', players:alive, selKey:'wolfVictim', selClass:'sel-red', sfx:'wolf'});
  }
  else if(s.step==='whitewolf') {
    sfx('wolf');
    var wwAlive = st.players.some(function(p){return p.role==='whitewolf'&&p.alive;});
    if(!wwAlive){showDeadRoleNotice('🤍','Sói Trắng đã chết — bỏ qua.');st.nc.whitewolfVictim=-99;}
    else buildPicker({label:'🤍 Sói Trắng chọn thêm người tiêu diệt (kể cả đồng đội):', players:alive, selKey:'whitewolfVictim', selClass:'sel-red', sfx:'wolf', onSelect:function(i,p){showToast('🤍 Sói Trắng nhắm '+p.name);}});
  }
  else if(s.step==='seer') {
    var seerAlive = st.players.some(function(p){return p.role==='seer'&&p.alive;});
    if(!seerAlive){showDeadRoleNotice('🔮','Tiên Tri đã chết — bỏ qua.');return;}
    buildPicker({label:'🔮 Tiên Tri điều tra 1 người:', players:alive, selKey:'seerCheck', selClass:'sel-acc', sfx:'select',
      onSelect:function(i,p){
        var isWolf = WOLF_ROLES.includes(p.role) && !ROLES[p.role].immuneSeer;
        showToast(isWolf?'🔴 '+p.name+' là MA SÓI!':'⚪ '+p.name+' là DÂN LÀNG',3500);
        logN('🔮 Tiên Tri soi '+p.name+' → '+(isWolf?'MA SÓI':'Dân'));
      }
    });
  }
  else if(s.step==='guard') {
    sfx('protect');
    var guardAlive = st.players.some(function(p){return p.role==='guard'&&p.alive;});
    if(!guardAlive){showDeadRoleNotice('🛡️','Bảo Vệ đã chết — bỏ qua.');st.nc.guardProtect=-99;return;}
    var last = st.nc.guardLastNight;
    var avail = alive.filter(function(p){return p._idx!==last;});
    var lbl = '🛡️ Bảo Vệ chọn người bảo vệ:';
    if(last>=0&&st.players[last]) lbl += ' (không chọn lại '+st.players[last].name+')';
    if(!avail.length){showDeadRoleNotice('🛡️','Không còn ai khác để bảo vệ đêm nay.');st.nc.guardProtect=-99;return;}
    buildPicker({label:lbl, players:avail, selKey:'guardProtect', selClass:'sel-sky', sfx:'protect', onSelect:function(i){showToast('🛡️ Đang bảo vệ '+st.players[i].name); logN('🛡️ Bảo Vệ chọn bảo vệ '+st.players[i].name);}});
  }
  else if(s.step==='witch') {
    var witchAlive = st.players.some(function(p){return p.role==='witch'&&p.alive;});
    if(!witchAlive){showDeadRoleNotice('🧙','Phù Thủy đã chết — bỏ qua.');return;}
    buildWitchPicker(alive);
  }
  else if(s.step==='medium') {
    var medAlive = st.players.some(function(p){return p.role==='medium'&&p.alive;});
    if(!medAlive){showDeadRoleNotice('👻','Đồng Cốt đã chết — bỏ qua.');}
  }
  else if(s.step==='cupid') {
    buildCupidPicker(alive);
  }
  else if(s.step==='gangleader') {
    sfx('wolf');
    var glAlive=st.players.some(function(p){return p.role==='gangleader'&&p.alive;});
    if(!glAlive){showDeadRoleNotice('🤴','Trùm Sói đã chết — bỏ qua.');st.nc.gangleaderCheck=-99;return;}
    buildPicker({label:'🤴 Trùm Sói chọn người điều tra:', players:alive, selKey:'gangleaderCheck', selClass:'sel-red', sfx:'select',
      onSelect:function(i,p){
        var isPlain=p.role==='villager';
        showToast(isPlain?'✅ '+p.name+' là DÂN LÀNG THƯỜNG':'❌ '+p.name+' CÓ VAI ĐẶC BIỆT (không phải dân thường)',4000);
        logN('🤴 Trùm Sói kiểm tra '+p.name+' → '+(isPlain?'Dân thường':'Vai đặc biệt'));
      }
    });
  }
  else if(s.step==='detective') {
    var detAlive=st.players.some(function(p){return p.role==='detective'&&p.alive;});
    if(!detAlive){showDeadRoleNotice('🕵️','Thám Tử đã chết — bỏ qua.');return;}
    buildDetectivePicker(alive);
  }
  else if(s.step==='doctor') {
    sfx('protect');
    var docAlive=st.players.some(function(p){return p.role==='doctor'&&p.alive;});
    if(!docAlive){showDeadRoleNotice('🩺','Bác Sĩ đã chết — bỏ qua.');st.nc.doctorProtect=-99;return;}
    var allAlive=st.players.map(function(p,i){return Object.assign({},p,{_idx:i});}).filter(function(p){return p.alive;});
    buildPicker({label:'🩺 Bác Sĩ chọn người cứu tối nay:', players:allAlive, selKey:'doctorProtect', selClass:'sel-teal', sfx:'protect', onSelect:function(i){showToast('🩺 Sẽ cứu '+st.players[i].name+' tối nay'); logN('🩺 Bác Sĩ chọn cứu '+st.players[i].name);}});
  }
  else if(s.step==='matchmaker') {
    var mmAlive=st.players.some(function(p){return p.role==='matchmaker'&&p.alive;});
    if(!mmAlive){showDeadRoleNotice('🤝','Mối Giới đã chết — bỏ qua.');return;}
    buildMatchmakerPicker(alive);
  }
  // Narration + special handling for wake step
  if(s.step==='wake') { stopBgm(); sfx('sunrise'); }
  var narrText = NARRATE_MAP[s.step];
  if(narrText) setTimeout(function(){ narrate(narrText); }, s.step==='wake' ? 200 : 0);
}

export function nightBack() {
  if(st.nightStep<=0) return;
  sfx('click');
  st.nightStep--;
  updateNight();
}

export function nightSkip() {
  sfx('click');
  var s = st.nightOrder[st.nightStep];
  if(s.step==='wolf') st.nc.wolfVictim=-99;
  else if(s.step==='whitewolf') st.nc.whitewolfVictim=-99;
  else if(s.step==='guard') st.nc.guardProtect=-99;
  else if(s.step==='seer') st.nc.seerCheck=-99;
  else if(s.step==='gangleader') st.nc.gangleaderCheck=-99;
  else if(s.step==='doctor') st.nc.doctorProtect=-99;
  else if(s.step==='detective') st.nc.detectiveCheck=[];
  // matchmaker: bỏ qua đêm này nhưng chưa dùng — có thể dùng đêm sau
  showToast('⏭ Bỏ qua: '+s.name);
  if(st.nightStep>=st.nightOrder.length-1){sfx('confirm');_startDay();}
  else{st.nightStep++;updateNight();}
}

export function nightNext() {
  if(st.nightStep>=st.nightOrder.length-1){sfx('confirm');_startDay();}
  else{sfx('click');st.nightStep++;updateNight();}
}
