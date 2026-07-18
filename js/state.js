export function freshNc(prev) {
  prev = prev || {};
  return {
    wolfVictim: -1,
    whitewolfVictim: -1,
    guardProtect: -1,
    guardLastNight: (typeof prev.guardLastNight === 'number') ? prev.guardLastNight : -1,
    witchSave: false,
    witchPoison: -1,
    witchSaveUsed: prev.witchSaveUsed || false,
    witchPoisonUsed: prev.witchPoisonUsed || false,
    priestUsed: prev.priestUsed || false,
    seerCheck: -1,
    cupidPair: [],
    loverPair: prev.loverPair || []
  };
}

export var st = {
  n: 10,
  roles: {},
  pinnedRoles: {},
  players: [],
  assigned: [],
  dealIdx: 0,
  cardFlipped: false,
  nightStep: 0,
  nightOrder: [],
  nc: freshNc(),
  voteMap: {},
  voteTopIdx: -1,
  timerSec: 180,
  timerTotal: 180,
  timerRunning: false,
  timerIv: null,
  prevScreen: 's-day',
  round: 1,
  gameLog: [],
  currentLogRound: null,
  hunterQueue: [],
  gameOver: false
};
