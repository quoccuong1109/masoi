import { goScreen, showToast, goBack, setFnavCallback } from './ui.js?v=2';
import {
  randomRoles, buildRoleSections, togglePin, chRole, chVil, syncVil,
  openRolePopup, goSetupPlayers, clearNameInputs, startGame,
  removePlayer, fillFromSaved, flipCard, nextDeal, initSlider,
  renderPresets, savePresetUI, applyPreset
} from './setup.js?v=2';
import { startNight, nightSkip, nightNext, nightBack, setStartDay } from './night.js?v=2';
import {
  startDay, buildVoteTable, chVote, showVoteResult, executeVote, noExecution,
  setTimer, toggleTimer, showStatus, showHistory, checkWin, showRecap,
  priestSkip, priestActivate, hunterShoot, hunterSkip, killPlayer, revivePlayer, fullReset,
  processSheriffPassQueue, sheriffPassBadge, sheriffSkipPass, updateHUD
} from './day.js?v=2';

// Break circular dependency: night calls startDay
setStartDay(startDay);
// HUD callback: refresh wolf/vil count whenever s-day or s-night becomes active
setFnavCallback(updateHUD);

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

// ===== PWA INSTALL =====
(function() {
  var deferredPrompt = null;
  // Android/Chrome: intercept install prompt
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    var banner = document.getElementById('pwa-banner');
    if(banner) banner.style.display = 'block';
    var btn = document.getElementById('pwa-install-btn');
    if(btn) btn.onclick = function() {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(function() { deferredPrompt = null; banner.style.display = 'none'; });
    };
  });
  // iOS Safari: show manual tip
  var isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var isInApp = window.navigator.standalone;
  if(isIos && !isInApp) {
    var tip = document.getElementById('pwa-ios-tip');
    if(tip) tip.style.display = 'block';
  }
  // Hide banner if already installed
  window.addEventListener('appinstalled', function() {
    var banner = document.getElementById('pwa-banner');
    var tip = document.getElementById('pwa-ios-tip');
    if(banner) banner.style.display = 'none';
    if(tip) tip.style.display = 'none';
  });
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
window.nightBack     = nightBack;

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
window.showRecap     = showRecap;
window.hunterShoot   = hunterShoot;
window.hunterSkip    = hunterSkip;
window.killPlayer    = killPlayer;
window.revivePlayer  = revivePlayer;
window.fullReset     = fullReset;
window.sheriffPassBadge = sheriffPassBadge;
window.sheriffSkipPass  = sheriffSkipPass;

window.renderPresets = renderPresets;
window.savePresetUI  = savePresetUI;
window.applyPreset   = applyPreset;
