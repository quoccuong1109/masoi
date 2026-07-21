var AC = new (window.AudioContext || window.webkitAudioContext)();

// ===== BGM STATE =====
var _bgmActive = false;
var _bgmSources = [];
var _bgmGains   = [];
var _bgmTimers  = [];

// ===== NIGHT BGM =====
export function startNightBgm() {
  stopBgm();
  try {
    if (AC.state === 'suspended') AC.resume();
    _bgmActive = true;
    var n = AC.currentTime;

    // — Low sawtooth drone with LFO tremolo —
    var drone = AC.createOscillator();
    var dFilter = AC.createBiquadFilter();
    var dGain = AC.createGain();
    var lfo = AC.createOscillator();
    var lfoG = AC.createGain();
    drone.type = 'sawtooth'; drone.frequency.value = 55;
    dFilter.type = 'lowpass'; dFilter.frequency.value = 200;
    lfo.type = 'sine'; lfo.frequency.value = 0.28;
    lfoG.gain.value = 0.028;
    drone.connect(dFilter); dFilter.connect(dGain);
    lfo.connect(lfoG); lfoG.connect(dGain.gain);
    dGain.connect(AC.destination);
    dGain.gain.setValueAtTime(0, n);
    dGain.gain.linearRampToValueAtTime(0.055, n + 4);
    drone.start(n); lfo.start(n);
    _bgmSources.push(drone, lfo); _bgmGains.push(dGain);

    // — Second harmonic (octave up, softer) —
    var d2 = AC.createOscillator(), d2G = AC.createGain();
    d2.type = 'sine'; d2.frequency.value = 110;
    d2.connect(d2G); d2G.connect(AC.destination);
    d2G.gain.setValueAtTime(0, n); d2G.gain.linearRampToValueAtTime(0.018, n + 7);
    d2.start(n);
    _bgmSources.push(d2); _bgmGains.push(d2G);

    // — Wind noise (bandpass-filtered white noise) —
    var bufLen = AC.sampleRate * 3;
    var noiBuf = AC.createBuffer(1, bufLen, AC.sampleRate);
    var bd = noiBuf.getChannelData(0);
    for (var i = 0; i < bufLen; i++) bd[i] = Math.random() * 2 - 1;
    var wind = AC.createBufferSource();
    wind.buffer = noiBuf; wind.loop = true;
    var wF = AC.createBiquadFilter(); wF.type = 'bandpass'; wF.frequency.value = 280; wF.Q.value = 0.35;
    var wG = AC.createGain();
    wG.gain.setValueAtTime(0, n); wG.gain.linearRampToValueAtTime(0.022, n + 6);
    wind.connect(wF); wF.connect(wG); wG.connect(AC.destination);
    wind.start(n);
    _bgmSources.push(wind); _bgmGains.push(wG);

    // — Eerie periodic notes (random minor intervals) —
    var ef = [233, 277, 311, 370, 415, 466];
    function scheduleEerie() {
      if (!_bgmActive) return;
      try {
        var t = AC.currentTime;
        var o = AC.createOscillator(), g = AC.createGain();
        o.type = 'sine'; o.frequency.value = ef[Math.floor(Math.random() * ef.length)];
        o.connect(g); g.connect(AC.destination);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.038, t + 1.5);
        g.gain.linearRampToValueAtTime(0, t + 4.5);
        o.start(t); o.stop(t + 5);
      } catch(e) {}
      if (_bgmActive) _bgmTimers.push(setTimeout(scheduleEerie, 3500 + Math.random() * 5000));
    }
    _bgmTimers.push(setTimeout(scheduleEerie, 2000));
  } catch(e) {}
}

export function stopBgm() {
  _bgmActive = false;
  _bgmTimers.forEach(clearTimeout); _bgmTimers = [];
  if (window.speechSynthesis) { try { speechSynthesis.cancel(); } catch(e) {} }
  try {
    var t = AC.currentTime;
    _bgmGains.forEach(function(g) {
      try {
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.linearRampToValueAtTime(0, t + 0.8);
      } catch(e) {}
    });
  } catch(e) {}
  var srcs = _bgmSources.slice();
  setTimeout(function() { srcs.forEach(function(s) { try { s.stop(); } catch(e) {} }); }, 950);
  _bgmSources = []; _bgmGains = [];
}

// ===== NARRATION =====
export function narrate(text) {
  if (!window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN'; u.rate = 0.82; u.pitch = 0.88; u.volume = 1;
    speechSynthesis.speak(u);
  } catch(e) {}
}

// ===== SFX =====
export function sfx(t) {
  try {
    if (AC.state === 'suspended') AC.resume();
    var n = AC.currentTime;

    if (t === 'click') {
      var o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);
      o.frequency.setValueAtTime(880,n);o.frequency.exponentialRampToValueAtTime(440,n+.08);
      g.gain.setValueAtTime(.1,n);g.gain.exponentialRampToValueAtTime(.001,n+.1);o.start(n);o.stop(n+.1);
    }
    else if (t === 'select') {
      var o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);
      o.type='sine';o.frequency.setValueAtTime(660,n);o.frequency.exponentialRampToValueAtTime(880,n+.12);
      g.gain.setValueAtTime(.13,n);g.gain.exponentialRampToValueAtTime(.001,n+.15);o.start(n);o.stop(n+.15);
    }
    else if (t === 'confirm') {
      [523,659,784].forEach(function(f,i){var o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.1,n+i*.1);g.gain.exponentialRampToValueAtTime(.001,n+i*.1+.2);o.start(n+i*.1);o.stop(n+i*.1+.22);});
    }
    else if (t === 'deal') {
      for(var i=0;i<5;i++){var o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.type='triangle';o.frequency.value=300+i*80;g.gain.setValueAtTime(.07,n+i*.06);g.gain.exponentialRampToValueAtTime(.001,n+i*.06+.1);o.start(n+i*.06);o.stop(n+i*.06+.12);}
    }
    else if (t === 'flip') {
      var o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.type='triangle';
      o.frequency.setValueAtTime(200,n);o.frequency.exponentialRampToValueAtTime(800,n+.3);
      g.gain.setValueAtTime(.13,n);g.gain.exponentialRampToValueAtTime(.001,n+.35);o.start(n);o.stop(n+.35);
    }
    else if (t === 'night') {
      [220,196,174,165].forEach(function(f,i){var o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.09,n+i*.18);g.gain.exponentialRampToValueAtTime(.001,n+i*.18+.35);o.start(n+i*.18);o.stop(n+i*.18+.4);});
    }
    else if (t === 'wolf') {
      var o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.type='sawtooth';
      o.frequency.setValueAtTime(120,n);o.frequency.exponentialRampToValueAtTime(60,n+.6);
      g.gain.setValueAtTime(.14,n);g.gain.exponentialRampToValueAtTime(.001,n+.65);o.start(n);o.stop(n+.65);
    }
    else if (t === 'protect') {
      [523,659,784,1047].forEach(function(f,i){var o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.08,n+i*.07);g.gain.exponentialRampToValueAtTime(.001,n+i*.07+.16);o.start(n+i*.07);o.stop(n+i*.07+.18);});
    }
    else if (t === 'vote') {
      var o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.type='square';o.frequency.setValueAtTime(440,n);
      g.gain.setValueAtTime(.07,n);g.gain.exponentialRampToValueAtTime(.001,n+.3);o.start(n);o.stop(n+.3);
    }
    else if (t === 'hang') {
      var o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.type='sawtooth';
      o.frequency.setValueAtTime(300,n);o.frequency.exponentialRampToValueAtTime(80,n+.8);
      g.gain.setValueAtTime(.16,n);g.gain.exponentialRampToValueAtTime(.001,n+.85);o.start(n);o.stop(n+.85);
    }
    else if (t === 'win') {
      [523,659,784,1047,1319].forEach(function(f,i){var o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.1,n+i*.12);g.gain.exponentialRampToValueAtTime(.001,n+i*.12+.28);o.start(n+i*.12);o.stop(n+i*.12+.32);});
    }
    else if (t === 'dead') {
      [220,196,185,165].forEach(function(f,i){var o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.09,n+i*.15);g.gain.exponentialRampToValueAtTime(.001,n+i*.15+.28);o.start(n+i*.15);o.stop(n+i*.15+.32);});
    }
    else if (t === 'alarm') {
      for(var i=0;i<6;i++){var o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);o.type='square';o.frequency.value=i%2===0?880:660;g.gain.setValueAtTime(.18,n+i*.18);g.gain.exponentialRampToValueAtTime(.001,n+i*.18+.15);o.start(n+i*.18);o.stop(n+i*.18+.18);}
    }

    // ===== NEW SFX =====
    else if (t === 'whoosh') {
      // Quick screen-transition whoosh
      var bLen = Math.floor(AC.sampleRate * 0.22);
      var buf = AC.createBuffer(1, bLen, AC.sampleRate);
      var bd = buf.getChannelData(0);
      for (var i = 0; i < bLen; i++) bd[i] = (Math.random()*2-1) * Math.pow(1-i/bLen, 1.8);
      var src = AC.createBufferSource(); src.buffer = buf;
      var f = AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1600; f.Q.value=1.1;
      var g = AC.createGain(); g.gain.value=0.16;
      src.connect(f); f.connect(g); g.connect(AC.destination); src.start(n);
    }
    else if (t === 'sunrise') {
      // Bright ascending arpeggio — bình minh
      [262,330,392,523,659,784,1047].forEach(function(f,i){
        var o=AC.createOscillator(),g=AC.createGain();
        o.type='sine'; o.frequency.value=f;
        o.connect(g); g.connect(AC.destination);
        g.gain.setValueAtTime(0, n+i*.09);
        g.gain.linearRampToValueAtTime(.09, n+i*.09+.07);
        g.gain.exponentialRampToValueAtTime(.001, n+i*.09+.55);
        o.start(n+i*.09); o.stop(n+i*.09+.6);
      });
    }
    else if (t === 'heartbeat') {
      // Ba-dum — last 10s of timer
      [[80,0],[68,0.15]].forEach(function(p){
        var o=AC.createOscillator(),g=AC.createGain();
        o.type='sine'; o.frequency.value=p[0];
        o.connect(g); g.connect(AC.destination);
        g.gain.setValueAtTime(.2, n+p[1]);
        g.gain.exponentialRampToValueAtTime(.001, n+p[1]+.12);
        o.start(n+p[1]); o.stop(n+p[1]+.14);
      });
    }
    else if (t === 'alarm_epic') {
      // 3 staccato warning beeps
      for (var i=0;i<3;i++){
        var o=AC.createOscillator(),g=AC.createGain();
        o.type='square'; o.frequency.value=900;
        o.connect(g); g.connect(AC.destination);
        g.gain.setValueAtTime(.22, n+i*.16);
        g.gain.exponentialRampToValueAtTime(.001, n+i*.16+.13);
        o.start(n+i*.16); o.stop(n+i*.16+.15);
      }
      // Descending "time's up" sting
      [784,698,622,523,440].forEach(function(f,i){
        var o=AC.createOscillator(),g=AC.createGain();
        o.type='sawtooth'; o.frequency.value=f;
        o.connect(g); g.connect(AC.destination);
        g.gain.setValueAtTime(.14, n+.62+i*.13);
        g.gain.exponentialRampToValueAtTime(.001, n+.62+i*.13+.22);
        o.start(n+.62+i*.13); o.stop(n+.62+i*.13+.25);
      });
    }
    else if (t === 'reveal') {
      // Dramatic reveal sting — lộ mặt
      [330,415,523,659,830,1047].forEach(function(f,i){
        var o=AC.createOscillator(),g=AC.createGain();
        o.type='sine'; o.frequency.value=f;
        o.connect(g); g.connect(AC.destination);
        g.gain.setValueAtTime(0, n+i*.065);
        g.gain.linearRampToValueAtTime(.11, n+i*.065+.04);
        g.gain.exponentialRampToValueAtTime(.001, n+i*.065+.32);
        o.start(n+i*.065); o.stop(n+i*.065+.35);
      });
    }
  } catch(e) {}
}
