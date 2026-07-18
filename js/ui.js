import { st } from './state.js';
import { ROLES } from './data.js';

export function goScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  document.getElementById(id).classList.add('active');
  window.scrollTo(0,0);
  document.getElementById('fnav').style.display = ['s-night','s-day'].includes(id) ? 'flex' : 'none';
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
