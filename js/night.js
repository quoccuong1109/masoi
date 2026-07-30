import { ROLES, WOLF_ROLES, VIL_ROLES, SKIPPABLE } from './data.js?v=6';
import { sfx, startNightBgm, stopBgm, narrate } from './audio.js?v=6';
import { st, freshNc } from './state.js?v=6';
import { goScreen, showToast, ri } from './ui.js?v=6';

var NARRATE_MAP = {
  'sleep':       'Màn đêm buông xuống. Tất cả nhắm mắt, cúi đầu, giữ im lặng tuyệt đối.',
  'cupid':       'Thần Tình Yêu, hãy mở mắt và chọn hai người yêu nhau.',
  'matchmaker':  'Mối Giới, hãy mở mắt.',
  'sheriff':     'Cảnh Sát Trưởng, hãy nhận biết nhau.',
  'wolf':        'Phe Ma Sói, hãy mở mắt. Hãy thống nhất và chọn nạn nhân đêm nay.',
  'wolf2':       'Sói Con đã chết. Phe Ma Sói, hãy chọn thêm nạn nhân thứ hai để báo thù!',
  'whitewolf':   'Sói Trắng, hãy mở mắt.',
  'gangleader':  'Trùm Sói, hãy mở mắt và chọn người điều tra.',
  'sorcerer':    'Pháp Sư, hãy mở mắt và chọn người điều tra.',
  'seducer':     'Kẻ Cám Dỗ, hãy mở mắt và chọn người bị mê hoặc đêm nay.',
  'wolfGuard':   'Sói Bảo Vệ, hãy mở mắt và chọn đồng đội cần bảo vệ đêm nay.',
  'wolfSpy':     'Thám Tử Sói, hãy mở mắt và chọn người điều tra.',
  'demonWolf':   'Ác Quỷ, hãy mở mắt.',
  'seer':        'Tiên Tri, hãy mở mắt và chọn người để soi bói.',
  'detective':   'Thám Tử, hãy mở mắt và chọn hai người để điều tra.',
  'guard':       'Bảo Vệ, hãy mở mắt và chọn người bạn muốn bảo vệ đêm nay.',
  'witch':       'Phù Thủy, hãy mở mắt.',
  'medium':      'Đồng Cốt, hãy mở mắt và hỏi hồn ma một câu.',
  'wildchild':   'Trẻ Em Hoang Dã, hãy mở mắt và chọn hình mẫu của mình.',
  'fox':         'Cáo, hãy mở mắt và chọn ba người để điều tra.',
  'whiteWitch':  'Phù Thủy Trắng, hãy mở mắt.',
  'witness':     'Quản trò báo bí mật cho Người Chứng Kiến.',
  'exorcist':    'Thầy Trừ Tà, hãy mở mắt và chọn người cần bảo vệ đêm nay.',
  'oracle':      'Bói Toán, hãy mở mắt và chọn hồn ma để đọc vai.',
  'wake':        'Bình minh đã đến. Tất cả hãy mở mắt!'
};

// Injected by main.js to break circular dep with day.js
var _startDay = null;
export function setStartDay(fn) { _startDay = fn; }

export function logN(msg) { if(st.currentLogRound) st.currentLogRound.night.push(msg); }

function logNReplace(prefix, msg) {
  if(!st.currentLogRound) return;
  st.currentLogRound.night = st.currentLogRound.night.filter(function(e){ return !e.startsWith(prefix); });
  st.currentLogRound.night.push(msg);
}

// ===== NIGHT ORDER =====
export function buildNightOrder() {
  var r=st.roles, ord=[];
  ord.push({icon:'😴',name:'Tất cả nhắm mắt',action:'Yêu cầu mọi người nhắm mắt, cúi đầu, giữ im lặng tuyệt đối.',step:'sleep'});
  if(st.round===1&&(r.cupid||0)>0) ord.push({icon:'💘',name:'Thần Tình Yêu thức dậy',action:'Thần Tình Yêu mở mắt và chọn 2 người yêu nhau. Nhắm mắt lại.',step:'cupid'});
  if(st.round===1&&(r.wildchild||0)>0) ord.push({icon:'🧒',name:'Trẻ Em Hoang Dã thức dậy',action:'Trẻ Em Hoang Dã mở mắt, chọn 1 người làm hình mẫu. Nếu hình mẫu chết → Trẻ Em đổi sang phe Ma Sói! Nhắm mắt lại.',step:'wildchild'});
  if(!st.nc.matchmakerUsed&&(r.matchmaker||0)>0) ord.push({icon:'🤝',name:'Mối Giới thức dậy',action:'Mối Giới mở mắt. Chọn 2 người kết đôi yêu nhau (1 lần duy nhất trong ván). Có thể bỏ qua để dùng đêm khác. Nhắm mắt lại.',step:'matchmaker'});
  if(st.round===1&&(r.sheriff||0)>0) ord.push({icon:'⭐',name:'Cảnh Sát Trưởng thức dậy',action:'Cảnh Sát Trưởng mở mắt. Quản trò ghi nhận (phiếu gấp đôi). Nhắm mắt lại.',step:'sheriff'});
  if((r.seducer||0)>0) ord.push({icon:'💋',name:'Kẻ Cám Dỗ thức dậy',action:'Kẻ Cám Dỗ mở mắt. Chọn 1 người bị mê hoặc — người đó mất khả năng đặc biệt đêm nay. Nhắm mắt lại.',step:'seducer'});
  if(WOLF_ROLES.some(function(k){return (r[k]||0)>0;})) ord.push({icon:'🐺',name:'Phe Ma Sói thức dậy',action:'Ma Sói mở mắt, nhận ra nhau. Chọn 1 nạn nhân (hoặc bỏ qua) rồi nhắm mắt lại.',step:'wolf'});
  if(st.wolfDoubleKill) ord.push({icon:'🐶🐺',name:'Ma Sói cắn người thứ 2 (Sói Con)',action:'Sói Con đã chết! Phe Ma Sói được cắn thêm 1 nạn nhân nữa để báo thù. Chọn nạn nhân thứ 2.',step:'wolf2'});
  if((r.whitewolf||0)>0&&st.round%2===0) ord.push({icon:'🤍',name:'Sói Trắng chọn thêm',action:'Đêm chẵn — Sói Trắng có thể tiêu diệt thêm 1 người (kể cả đồng đội). Hoặc bỏ qua.',step:'whitewolf'});
  if((r.witness||0)>0) ord.push({icon:'👁️',name:'Người Chứng Kiến nhận tin',action:'Quản trò âm thầm thông báo riêng cho Người Chứng Kiến biết Ma Sói đêm nay nhắm vào ai.',step:'witness'});
  if((r.wolfGuard||0)>0) ord.push({icon:'🛡️🐺',name:'Sói Bảo Vệ thức dậy',action:'Sói Bảo Vệ mở mắt. Chọn 1 đồng đội Ma Sói để bảo vệ đêm nay (khỏi thuốc độc, Sói Trắng,...). Nhắm mắt lại.',step:'wolfGuard'});
  if((r.wolfSpy||0)>0) ord.push({icon:'🔎',name:'Thám Tử Sói thức dậy',action:'Thám Tử Sói mở mắt. Chọn 1 người — Quản trò tiết lộ vai trò chính xác. Nhắm mắt lại.',step:'wolfSpy'});
  if(!st.nc.demonWolfUsed&&(r.demonWolf||0)>0&&st.players.some(function(p){return !p.alive&&WOLF_ROLES.includes(p.role);})) ord.push({icon:'😈',name:'Ác Quỷ thức dậy',action:'Ác Quỷ mở mắt. Một lần duy nhất: chọn 1 Ma Sói đã chết để hồi sinh vào sáng mai. Hoặc bỏ qua.',step:'demonWolf'});
  if((r.gangleader||0)>0) ord.push({icon:'🤴',name:'Trùm Sói điều tra',action:'Trùm Sói mở mắt. Chọn 1 người để điều tra — Quản trò báo người đó có phải Dân Làng thường không. Nhắm mắt lại.',step:'gangleader'});
  if((r.sorcerer||0)>0) ord.push({icon:'🧿',name:'Pháp Sư [Sói] điều tra',action:'Pháp Sư (phe Sói) mở mắt. Chọn 1 người — Quản trò gật nếu đó là Tiên Tri, lắc nếu không phải. Nhắm mắt lại.',step:'sorcerer'});
  if((r.seer||0)>0) ord.push({icon:'🔮',name:'Tiên Tri thức dậy',action:'Tiên Tri chọn 1 người để điều tra. Quản trò gật (Ma Sói — trừ Người Sói) hoặc lắc (Dân). Nhắm mắt lại.',step:'seer'});
  if((r.detective||0)>0) ord.push({icon:'🕵️',name:'Thám Tử thức dậy',action:'Thám Tử mở mắt. Chọn 2 người — Quản trò báo CÓ hay KHÔNG có ít nhất 1 Ma Sói trong 2 người đó. Nhắm mắt lại.',step:'detective'});
  if((r.guard||0)>0) ord.push({icon:'🛡️',name:'Bảo Vệ thức dậy',action:'Bảo Vệ chọn 1 người bảo vệ đêm nay (không trùng đêm trước). Hoặc bỏ qua.',step:'guard'});
  if(!st.nc.exorcistUsed&&(r.exorcist||0)>0) ord.push({icon:'☯️',name:'Thầy Trừ Tà thức dậy',action:'Thầy Trừ Tà mở mắt. Một lần duy nhất: chọn 1 người để bảo vệ khỏi tấn công của Ma Sói đêm nay. Nhắm mắt lại.',step:'exorcist'});
  if((r.witch||0)>0) ord.push({icon:'🧙',name:'Phù Thủy thức dậy',action:'Phù Thủy mở mắt. Xem nạn nhân và quyết định dùng thuốc.',step:'witch'});
  if((r.medium||0)>0&&st.players.some(function(p){return !p.alive;})) ord.push({icon:'👻',name:'Đồng Cốt thức dậy',action:'Đồng Cốt mở mắt, chỉ 1 hồn ma. Quản trò gật/lắc 1 câu hỏi có/không. Nhắm mắt lại.',step:'medium'});
  if(!st.foxAbilityLost&&(r.fox||0)>0) ord.push({icon:'🦊',name:'Cáo thức dậy',action:'Cáo mở mắt. Chọn 3 người để điều tra — Quản trò báo có Ma Sói trong nhóm đó không. Nhắm mắt lại.',step:'fox'});
  if(!st.nc.whiteWitchUsed&&(r.whiteWitch||0)>0&&st.players.some(function(p){return !p.alive;})) ord.push({icon:'🌟',name:'Phù Thủy Trắng thức dậy',action:'Phù Thủy Trắng mở mắt. Chọn 1 người đã chết để hồi sinh (hoặc bỏ qua). Nhắm mắt lại.',step:'whiteWitch'});
  if((r.oracle||0)>0&&st.players.some(function(p){return !p.alive;})) ord.push({icon:'🌙',name:'Bói Toán thức dậy',action:'Bói Toán mở mắt. Chọn 1 hồn ma — Quản trò tiết lộ vai trò chính xác. Nhắm mắt lại.',step:'oracle'});
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
        if(hasWolf){
          showToast('🔴 TRONG 2 NGƯỜI ĐÓ: CÓ MA SÓI!',4000);
          sfx('wolf');
          logNReplace('🕵️ Thám Tử','🕵️ Thám Tử điều tra ['+n1+', '+n2+'] → Có Ma Sói');
        } else {
          showToast('⚪ Không có Ma Sói trong 2 người đó.',4000);
          sfx('confirm');
          logNReplace('🕵️ Thám Tử','🕵️ Thám Tử điều tra ['+n1+', '+n2+'] → Không có Ma Sói');
        }
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

// ===== FOX PICKER =====
export function buildFoxPicker(alive) {
  var area=document.getElementById('night-picker-area');area.innerHTML='';
  var wrap=document.createElement('div');wrap.className='picker-section';
  var lbl=document.createElement('div');lbl.className='picker-label';lbl.textContent='🦊 Cáo chọn 3 người để điều tra:';wrap.appendChild(lbl);
  alive.forEach(function(p){
    var i=p._idx, sel=st.nc.foxCheck.includes(i);
    var btn=document.createElement('button');btn.className='victim-btn'+(sel?' sel-acc':'');btn.id='fox-'+i;
    btn.innerHTML='<span class="v-emoji">'+ri(p.role).emoji+'</span><span class="v-name">'+p.name+'</span><span class="v-check">✓</span>';
    btn.onclick=function(){
      sfx('select');
      if(st.nc.foxCheck.includes(i))st.nc.foxCheck=st.nc.foxCheck.filter(function(x){return x!==i;});
      else if(st.nc.foxCheck.length<3)st.nc.foxCheck.push(i);
      else{showToast('Chỉ chọn 3 người!');return;}
      wrap.querySelectorAll('.victim-btn').forEach(function(b){b.classList.remove('sel-acc');});
      st.nc.foxCheck.forEach(function(idx){var el=document.getElementById('fox-'+idx);if(el)el.classList.add('sel-acc');});
      if(st.nc.foxCheck.length===3){
        var names=st.nc.foxCheck.map(function(idx){return st.players[idx].name;}).join(', ');
        var hasWolf=st.nc.foxCheck.some(function(idx){return WOLF_ROLES.includes(st.players[idx].role);});
        if(hasWolf){
          showToast('🔴 CÓ Ma Sói trong nhóm ['+names+']!',4000); sfx('wolf');
          logNReplace('🦊 Cáo','🦊 Cáo điều tra ['+names+'] → CÓ Ma Sói');
        } else {
          showToast('⚪ Không có Ma Sói trong nhóm đó. Cáo MẤT khả năng!',4500); sfx('confirm');
          st.foxAbilityLost=true;
          logNReplace('🦊 Cáo','🦊 Cáo điều tra ['+names+'] → Không có Ma Sói → MẤT quyền');
        }
      }
    };
    wrap.appendChild(btn);
  });
  area.appendChild(wrap);
}

// ===== WHITE WITCH PICKER =====
export function buildWhiteWitchPicker() {
  var area=document.getElementById('night-picker-area');area.innerHTML='';
  var wrap=document.createElement('div');wrap.className='picker-section';
  var dead=st.players.map(function(p,i){return Object.assign({},p,{_idx:i});}).filter(function(p){return !p.alive;});
  if(!dead.length){
    var nd=document.createElement('div');nd.style.cssText='font-size:.8rem;color:var(--muted);text-align:center;padding:.5rem';nd.textContent='Chưa có ai chết để hồi sinh.';wrap.appendChild(nd);
    area.appendChild(wrap); return;
  }
  var lbl=document.createElement('div');lbl.className='picker-label';lbl.textContent='🌟 Phù Thủy Trắng chọn người cần hồi sinh:';wrap.appendChild(lbl);
  dead.forEach(function(p){
    var i=p._idx;
    var btn=document.createElement('button');btn.className='victim-btn'+(st.nc.whiteWitchRevive===i?' sel-teal':'');
    btn.innerHTML='<span class="v-emoji">'+ri(p.role).emoji+'</span><span class="v-name">'+p.name+' ✝</span><span class="v-check">✓</span>';
    btn.onclick=function(){
      st.nc.whiteWitchRevive=st.nc.whiteWitchRevive===i?-1:i; sfx('confirm');
      wrap.querySelectorAll('.victim-btn').forEach(function(b){b.classList.remove('sel-teal');});
      if(st.nc.whiteWitchRevive===i)btn.classList.add('sel-teal');
      showToast(st.nc.whiteWitchRevive===i?'🌟 Sẽ hồi sinh '+p.name+' vào sáng mai!':'Huỷ hồi sinh');
    };
    wrap.appendChild(btn);
  });
  var nb=document.createElement('button');nb.className='victim-btn'+(st.nc.whiteWitchRevive===-99?' sel-acc':'');
  nb.innerHTML='<span class="v-emoji">—</span><span class="v-name">Không hồi sinh ai đêm nay</span><span class="v-check">✓</span>';
  nb.onclick=function(){st.nc.whiteWitchRevive=-99;sfx('click');wrap.querySelectorAll('.victim-btn').forEach(function(b){b.classList.remove('sel-teal');});nb.className='victim-btn sel-acc';};
  wrap.appendChild(nb);
  area.appendChild(wrap);
}

// Returns true if the player with the given role has been seduced this night
function roleSeduced(role) {
  var idx = st.nc.seducedIdx;
  if(idx < 0 || idx === -99) return false;
  var p = st.players[idx];
  return p && p.role === role;
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

  // Narrate unconditionally — even for dead roles, so players can't infer death from silence
  if(s.step==='wake') { stopBgm(); sfx('sunrise'); }
  var narrText = NARRATE_MAP[s.step];
  if(narrText) setTimeout(function(){ narrate(narrText); }, s.step==='wake' ? 200 : 0);

  if(s.step==='wolf') {
    sfx('wolf');
    buildPicker({label:'🐾 Chọn nạn nhân của Ma Sói:', players:alive, selKey:'wolfVictim', selClass:'sel-red', sfx:'wolf'});
  }
  else if(s.step==='wolf2') {
    sfx('wolf');
    buildPicker({label:'🐶 Sói Con báo thù — chọn nạn nhân thứ 2:', players:alive, selKey:'wolfVictim2', selClass:'sel-red', sfx:'wolf'});
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
    if(roleSeduced('seer')){showDeadRoleNotice('🔮','💋 Tiên Tri bị cám dỗ — mất khả năng đêm nay!');return;}
    buildPicker({label:'🔮 Tiên Tri điều tra 1 người:', players:alive, selKey:'seerCheck', selClass:'sel-acc', sfx:'select',
      onSelect:function(i,p){
        var isWolf = WOLF_ROLES.includes(p.role) && !ROLES[p.role].immuneSeer;
        showToast(isWolf?'🔴 '+p.name+' là MA SÓI!':'⚪ '+p.name+' là DÂN LÀNG',3500);
        logNReplace('🔮 Tiên Tri', '🔮 Tiên Tri soi '+p.name+' → '+(isWolf?'MA SÓI':'Dân'));
      }
    });
  }
  else if(s.step==='guard') {
    sfx('protect');
    var guardAlive = st.players.some(function(p){return p.role==='guard'&&p.alive;});
    if(!guardAlive){showDeadRoleNotice('🛡️','Bảo Vệ đã chết — bỏ qua.');st.nc.guardProtect=-99;return;}
    if(roleSeduced('guard')){showDeadRoleNotice('🛡️','💋 Bảo Vệ bị cám dỗ — mất khả năng đêm nay!');st.nc.guardProtect=-99;return;}
    var last = st.nc.guardLastNight;
    var avail = alive.filter(function(p){return p._idx!==last;});
    var lbl = '🛡️ Bảo Vệ chọn người bảo vệ:';
    if(last>=0&&st.players[last]) lbl += ' (không chọn lại '+st.players[last].name+')';
    if(!avail.length){showDeadRoleNotice('🛡️','Không còn ai khác để bảo vệ đêm nay.');st.nc.guardProtect=-99;return;}
    buildPicker({label:lbl, players:avail, selKey:'guardProtect', selClass:'sel-sky', sfx:'protect', onSelect:function(i){showToast('🛡️ Đang bảo vệ '+st.players[i].name); logNReplace('🛡️ Bảo Vệ', '🛡️ Bảo Vệ chọn bảo vệ '+st.players[i].name);}});
  }
  else if(s.step==='witch') {
    var witchAlive = st.players.some(function(p){return p.role==='witch'&&p.alive;});
    if(!witchAlive){showDeadRoleNotice('🧙','Phù Thủy đã chết — bỏ qua.');return;}
    if(roleSeduced('witch')){showDeadRoleNotice('🧙','💋 Phù Thủy bị cám dỗ — mất khả năng đêm nay!');return;}
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
        logNReplace('🤴 Trùm Sói', '🤴 Trùm Sói kiểm tra '+p.name+' → '+(isPlain?'Dân thường':'Vai đặc biệt'));
      }
    });
  }
  else if(s.step==='sorcerer') {
    sfx('wolf');
    var sorAlive=st.players.some(function(p){return p.role==='sorcerer'&&p.alive;});
    if(!sorAlive){showDeadRoleNotice('🧿','Pháp Sư đã chết — bỏ qua.');st.nc.sorcererCheck=-99;return;}
    buildPicker({label:'🧿 Pháp Sư chọn người điều tra:', players:alive, selKey:'sorcererCheck', selClass:'sel-red', sfx:'select',
      onSelect:function(i,p){
        var isSeer=p.role==='seer';
        showToast(isSeer?'✅ '+p.name+' ĐÚNG LÀ TIÊN TRI!':'❌ '+p.name+' không phải Tiên Tri',3500);
        sfx(isSeer?'wolf':'click');
        logNReplace('🧿 Pháp Sư','🧿 Pháp Sư kiểm tra '+p.name+' → '+(isSeer?'là Tiên Tri!':'không phải Tiên Tri'));
      }
    });
  }
  else if(s.step==='detective') {
    var detAlive=st.players.some(function(p){return p.role==='detective'&&p.alive;});
    if(!detAlive){showDeadRoleNotice('🕵️','Thám Tử đã chết — bỏ qua.');return;}
    if(roleSeduced('detective')){showDeadRoleNotice('🕵️','💋 Thám Tử bị cám dỗ — mất khả năng đêm nay!');return;}
    buildDetectivePicker(alive);
  }
  else if(s.step==='wildchild') {
    var wcAlive=st.players.some(function(p){return p.role==='wildchild'&&p.alive;});
    if(!wcAlive){showDeadRoleNotice('🧒','Trẻ Em Hoang Dã đã chết — bỏ qua.');return;}
    buildPicker({label:'🧒 Trẻ Em Hoang Dã chọn hình mẫu (đêm đầu):', players:alive, selKey:'wildchildNightPick', selClass:'sel-acc', sfx:'select',
      onSelect:function(i,p){
        st.wildchildRoleModel = i;
        showToast('🧒 Hình mẫu: '+p.name+' — nếu họ chết, Trẻ Em đổi phe!');
        logN('🧒 Trẻ Em Hoang Dã chọn hình mẫu: '+p.name);
      }
    });
  }
  else if(s.step==='matchmaker') {
    var mmAlive=st.players.some(function(p){return p.role==='matchmaker'&&p.alive;});
    if(!mmAlive){showDeadRoleNotice('🤝','Mối Giới đã chết — bỏ qua.');return;}
    if(roleSeduced('matchmaker')){showDeadRoleNotice('🤝','💋 Mối Giới bị cám dỗ — mất khả năng đêm nay!');return;}
    buildMatchmakerPicker(alive);
  }
  else if(s.step==='fox') {
    var foxAlive=st.players.some(function(p){return p.role==='fox'&&p.alive;});
    if(!foxAlive){showDeadRoleNotice('🦊','Cáo đã chết — bỏ qua.');return;}
    if(roleSeduced('fox')){showDeadRoleNotice('🦊','💋 Cáo bị cám dỗ — mất khả năng đêm nay!');return;}
    buildFoxPicker(alive);
  }
  else if(s.step==='whiteWitch') {
    var wwAliveRole=st.players.some(function(p){return p.role==='whiteWitch'&&p.alive;});
    if(!wwAliveRole){showDeadRoleNotice('🌟','Phù Thủy Trắng đã chết — bỏ qua.');return;}
    if(roleSeduced('whiteWitch')){showDeadRoleNotice('🌟','💋 Phù Thủy Trắng bị cám dỗ — mất khả năng đêm nay!');return;}
    buildWhiteWitchPicker();
  }
  else if(s.step==='seducer') {
    sfx('wolf');
    var sedAlive=st.players.some(function(p){return p.role==='seducer'&&p.alive;});
    if(!sedAlive){showDeadRoleNotice('💋','Kẻ Cám Dỗ đã chết — bỏ qua.');st.nc.seducedIdx=-99;return;}
    buildPicker({label:'💋 Kẻ Cám Dỗ chọn người bị mê hoặc đêm nay:', players:alive, selKey:'seducedIdx', selClass:'sel-red', sfx:'wolf',
      onSelect:function(i,p){showToast('💋 Đêm nay '+p.name+' bị cám dỗ — mất khả năng!');logNReplace('💋 Kẻ Cám Dỗ','💋 Kẻ Cám Dỗ mê hoặc '+p.name);}
    });
  }
  else if(s.step==='wolfGuard') {
    sfx('wolf');
    var wgAlive=st.players.some(function(p){return p.role==='wolfGuard'&&p.alive;});
    if(!wgAlive){showDeadRoleNotice('🛡️🐺','Sói Bảo Vệ đã chết — bỏ qua.');st.nc.wolfGuardProtect=-99;return;}
    var aliveWolves=st.players.map(function(p,i){return Object.assign({},p,{_idx:i});}).filter(function(p){return p.alive&&WOLF_ROLES.includes(p.role);});
    if(!aliveWolves.length){showDeadRoleNotice('🛡️🐺','Không còn Ma Sói nào để bảo vệ.');st.nc.wolfGuardProtect=-99;return;}
    buildPicker({label:'🛡️🐺 Sói Bảo Vệ chọn đồng đội cần bảo vệ:', players:aliveWolves, selKey:'wolfGuardProtect', selClass:'sel-red', sfx:'protect',
      onSelect:function(i,p){showToast('🛡️🐺 Bảo vệ '+p.name+' tối nay');logNReplace('🛡️🐺 Sói Bảo Vệ','🛡️🐺 Sói Bảo Vệ chọn bảo vệ '+p.name);}
    });
  }
  else if(s.step==='wolfSpy') {
    sfx('wolf');
    var wsAlive=st.players.some(function(p){return p.role==='wolfSpy'&&p.alive;});
    if(!wsAlive){showDeadRoleNotice('🔎','Thám Tử Sói đã chết — bỏ qua.');st.nc.wolfSpyCheck=-99;return;}
    buildPicker({label:'🔎 Thám Tử Sói chọn người điều tra:', players:alive, selKey:'wolfSpyCheck', selClass:'sel-red', sfx:'select',
      onSelect:function(i,p){
        var r2=ri(p.role);
        showToast('🔎 '+p.name+': '+r2.emoji+' '+r2.name,3500);sfx('select');
        logNReplace('🔎 Thám Tử Sói','🔎 Thám Tử Sói điều tra '+p.name+' → '+r2.name);
      }
    });
  }
  else if(s.step==='demonWolf') {
    sfx('wolf');
    var dwAlive=st.players.some(function(p){return p.role==='demonWolf'&&p.alive;});
    if(!dwAlive){showDeadRoleNotice('😈','Ác Quỷ đã chết — bỏ qua.');return;}
    var deadWolves=st.players.map(function(p,i){return Object.assign({},p,{_idx:i});}).filter(function(p){return !p.alive&&WOLF_ROLES.includes(p.role);});
    if(!deadWolves.length){showDeadRoleNotice('😈','Chưa có Ma Sói nào đã chết để hồi sinh.');return;}
    var area2=document.getElementById('night-picker-area');area2.innerHTML='';
    var wrap2=document.createElement('div');wrap2.className='picker-section';
    var lbl2=document.createElement('div');lbl2.className='picker-label';lbl2.textContent='😈 Ác Quỷ chọn Ma Sói cần hồi sinh (1 lần duy nhất):';wrap2.appendChild(lbl2);
    deadWolves.forEach(function(p){
      var i=p._idx;
      var btn2=document.createElement('button');btn2.className='victim-btn'+(st.nc.demonWolfRevive===i?' sel-red':'');
      btn2.innerHTML='<span class="v-emoji">'+ri(p.role).emoji+'</span><span class="v-name">'+p.name+' ✝</span><span class="v-check">✓</span>';
      btn2.onclick=function(){
        st.nc.demonWolfRevive=st.nc.demonWolfRevive===i?-1:i;sfx('wolf');
        wrap2.querySelectorAll('.victim-btn').forEach(function(b){b.className='victim-btn';});
        if(st.nc.demonWolfRevive===i)btn2.classList.add('sel-red');
        showToast(st.nc.demonWolfRevive===i?'😈 Sẽ hồi sinh '+p.name+' vào sáng mai!':'Huỷ hồi sinh');
        logNReplace('😈 Ác Quỷ','😈 Ác Quỷ sẽ hồi sinh '+p.name);
      };
      wrap2.appendChild(btn2);
    });
    var nb2=document.createElement('button');nb2.className='victim-btn'+(st.nc.demonWolfRevive===-99?' sel-acc':'');
    nb2.innerHTML='<span class="v-emoji">—</span><span class="v-name">Không hồi sinh đêm nay</span><span class="v-check">✓</span>';
    nb2.onclick=function(){st.nc.demonWolfRevive=-99;sfx('click');wrap2.querySelectorAll('.victim-btn').forEach(function(b){b.className='victim-btn';});nb2.className='victim-btn sel-acc';};
    wrap2.appendChild(nb2);
    area2.appendChild(wrap2);
  }
  else if(s.step==='witness') {
    var witAlive=st.players.some(function(p){return p.role==='witness'&&p.alive;});
    if(!witAlive){showDeadRoleNotice('👁️','Người Chứng Kiến đã chết — bỏ qua.');return;}
    var wv=st.nc.wolfVictim;
    var wMsg=wv>=0&&wv!==-99&&st.players[wv]
      ?'👁️ Ma Sói đêm nay nhắm tới: '+st.players[wv].name
      :'👁️ Ma Sói bỏ qua đêm nay (không nhắm ai)';
    showDeadRoleNotice('👁️',wMsg.replace('👁️ ',''));
    if(wv>=0&&wv!==-99)sfx('select');
    logNReplace('👁️ Người Chứng Kiến','👁️ Chứng Kiến: Sói nhắm '+(wv>=0&&wv!==-99&&st.players[wv]?st.players[wv].name:'(không ai)'));
  }
  else if(s.step==='exorcist') {
    var excAlive=st.players.some(function(p){return p.role==='exorcist'&&p.alive;});
    if(!excAlive){showDeadRoleNotice('☯️','Thầy Trừ Tà đã chết — bỏ qua.');st.nc.exorcistBlock=-99;return;}
    if(roleSeduced('exorcist')){showDeadRoleNotice('☯️','💋 Thầy Trừ Tà bị cám dỗ — mất khả năng đêm nay!');st.nc.exorcistBlock=-99;return;}
    buildPicker({label:'☯️ Thầy Trừ Tà chọn người bảo vệ khỏi Ma Sói đêm nay:', players:alive, selKey:'exorcistBlock', selClass:'sel-teal', sfx:'protect',
      onSelect:function(i,p){showToast('☯️ Bảo vệ '+p.name+' khỏi đòn tấn công của Ma Sói');logNReplace('☯️ Thầy Trừ Tà','☯️ Thầy Trừ Tà bảo vệ '+p.name);}
    });
  }
  else if(s.step==='oracle') {
    var orAlive=st.players.some(function(p){return p.role==='oracle'&&p.alive;});
    if(!orAlive){showDeadRoleNotice('🌙','Bói Toán đã chết — bỏ qua.');return;}
    var deadAll=st.players.map(function(p,i){return Object.assign({},p,{_idx:i});}).filter(function(p){return !p.alive;});
    if(!deadAll.length){showDeadRoleNotice('🌙','Chưa có hồn ma nào để bói toán.');return;}
    var oArea=document.getElementById('night-picker-area');oArea.innerHTML='';
    var oWrap=document.createElement('div');oWrap.className='picker-section';
    var oLbl=document.createElement('div');oLbl.className='picker-label';oLbl.textContent='🌙 Bói Toán chọn 1 hồn ma để đọc vai:';oWrap.appendChild(oLbl);
    deadAll.forEach(function(p){
      var i=p._idx;
      var oBtn=document.createElement('button');oBtn.className='victim-btn'+(st.nc.oracleCheck===i?' sel-acc':'');
      oBtn.innerHTML='<span class="v-emoji">'+ri(p.role).emoji+'</span><span class="v-name">'+p.name+' ✝</span><span class="v-check">✓</span>';
      oBtn.onclick=function(){
        st.nc.oracleCheck=i;sfx('select');
        var r2=ri(p.role);
        showToast('🔮 '+p.name+' (hồn ma): '+r2.emoji+' '+r2.name,3500);sfx('reveal');
        logNReplace('🌙 Bói Toán','🌙 Bói Toán: '+p.name+' → '+r2.name);
        oWrap.querySelectorAll('.victim-btn').forEach(function(b){b.className='victim-btn';});
        oBtn.classList.add('sel-acc');
      };
      oWrap.appendChild(oBtn);
    });
    oArea.appendChild(oWrap);
  }
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
  else if(s.step==='wolf2') st.nc.wolfVictim2=-99;
  else if(s.step==='whitewolf') st.nc.whitewolfVictim=-99;
  else if(s.step==='guard') st.nc.guardProtect=-99;
  else if(s.step==='seer') st.nc.seerCheck=-99;
  else if(s.step==='gangleader') st.nc.gangleaderCheck=-99;
  else if(s.step==='sorcerer') st.nc.sorcererCheck=-99;
  else if(s.step==='detective') st.nc.detectiveCheck=[];
  else if(s.step==='fox') st.nc.foxCheck=[];
  else if(s.step==='whiteWitch') st.nc.whiteWitchRevive=-99;
  else if(s.step==='seducer') st.nc.seducedIdx=-99;
  else if(s.step==='wolfGuard') st.nc.wolfGuardProtect=-99;
  else if(s.step==='wolfSpy') st.nc.wolfSpyCheck=-99;
  else if(s.step==='demonWolf') st.nc.demonWolfRevive=-99;
  else if(s.step==='witness') { /* passive, nothing to set */ }
  else if(s.step==='exorcist') st.nc.exorcistBlock=-99;
  else if(s.step==='oracle') st.nc.oracleCheck=-99;
  // matchmaker: bỏ qua đêm này nhưng chưa dùng — có thể dùng đêm sau
  showToast('⏭ Bỏ qua: '+s.name);
  if(st.nightStep>=st.nightOrder.length-1){sfx('confirm');_startDay();}
  else{st.nightStep++;updateNight();}
}

export function nightNext() {
  if(st.nightStep>=st.nightOrder.length-1){sfx('confirm');_startDay();}
  else{sfx('click');st.nightStep++;updateNight();}
}
