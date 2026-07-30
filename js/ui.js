import { st } from './state.js?v=3';
import { ROLES } from './data.js?v=3';
import { sfx } from './audio.js?v=3';

var _onFnavShow = null;
export function setFnavCallback(fn) { _onFnavShow = fn; }

export function goScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
  var showFnav = ['s-night','s-day'].includes(id);
  document.getElementById('fnav').style.display = showFnav ? 'flex' : 'none';
  if(showFnav && _onFnavShow) _onFnavShow();
  if(id !== 's-home') sfx('whoosh');
}

export function showToast(msg, dur) {
  dur = dur || 2600;
  var t = document.getElementById('toast');
  t.innerHTML = msg; t.style.display = 'block';
  clearTimeout(t._t);
  t._t = setTimeout(function(){t.style.display='none';}, dur);
}

export function goBack() { goScreen(st.prevScreen); }

export function ri(role) { return ROLES[role] || ROLES.villager; }
