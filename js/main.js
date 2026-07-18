import { goScreen, showToast, goBack } from './ui.js';
import {
  randomRoles, buildRoleSections, togglePin, chRole, chVil, syncVil,
  openRolePopup, goSetupPlayers, clearNameInputs, startGame,
  removePlayer, fillFromSaved, flipCard, nextDeal, initSlider
} from './setup.js';
import { startNight, nightSkip, nightNext, setStartDay } from './night.js';
import {
  startDay, buildVoteTable, chVote, showVoteResult, executeVote, noExecution,
  setTimer, toggleTimer, showStatus, showHistory, checkWin,
  priestSkip, priestActivate, hunterShoot, hunterSkip, killPlayer, fullReset
} from './day.js';

// Break circular dependency: night calls startDay
setStartDay(startDay);

// ===== STARS =====
(function() {
  var s = document.getElementById('stars');
  for (var i=0; i<55; i++) {
    var d = document.createElement('div');
    d.className = 'star';
    var sz = Math.random()*2+.5;
    d.style.cssText = 'width:'+sz+'px;height:'+sz+'px;top:'+Math.random()*100+'%;left:'+Math.random()*100+'%;animation-delay:'+Math.random()*4+'s;animation-duration:'+(2+Math.random()*3)+'s';
    s.appendChild(d);
  }
})();

// ===== INIT =====
initSlider();

// ===== EXPOSE GLOBALS for HTML onclick handlers =====
window.goScreen      = goScreen;
window.showToast     = showToast;
window.goBack        = goBack;

window.randomRoles   = randomRoles;
window.chRole        = chRole;
window.chVil         = chVil;
window.togglePin     = togglePin;
window.openRolePopup = openRolePopup;
window.goSetupPlayers = goSetupPlayers;
window.clearNameInputs = clearNameInputs;
window.startGame     = startGame;
window.removePlayer  = removePlayer;
window.fillFromSaved = fillFromSaved;
window.flipCard      = flipCard;
window.nextDeal      = nextDeal;

window.startNight    = startNight;
window.nightSkip     = nightSkip;
window.nightNext     = nightNext;

window.startDay      = startDay;
window.priestSkip    = priestSkip;
window.priestActivate = priestActivate;
window.setTimer      = setTimer;
window.toggleTimer   = toggleTimer;
window.showVoteResult = showVoteResult;
window.chVote        = chVote;
window.executeVote   = executeVote;
window.noExecution   = noExecution;
window.showStatus    = showStatus;
window.showHistory   = showHistory;
window.checkWin      = checkWin;
window.hunterShoot   = hunterShoot;
window.hunterSkip    = hunterSkip;
window.killPlayer    = killPlayer;
window.fullReset     = fullReset;
