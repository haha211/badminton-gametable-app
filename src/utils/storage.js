/**
 * 스마트 세션 저장소 및 24시간 자동 리셋 유틸리티 (방어적 코드 적용)
 */

export const INITIAL_PLAYERS = [
  { id: 'p1', name: '김민준', tier: 'A', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p2', name: '박서준', tier: 'A', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p3', name: '이도현', tier: 'A', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p4', name: '최유진', tier: 'A', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p5', name: '정지훈', tier: 'B', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p6', name: '강하늘', tier: 'B', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p7', name: '윤아름', tier: 'B', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p8', name: '임성민', tier: 'B', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p9', name: '한소희', tier: 'B', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p10', name: '오세훈', tier: 'B', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p11', name: '서예지', tier: 'C', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p12', name: '권지용', tier: 'C', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p13', name: '송중기', tier: 'C', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p14', name: '배수지', tier: 'C', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p15', name: '안효섭', tier: 'C', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
  { id: 'p16', name: '신세경', tier: 'C', isPresent: true, gamesPlayed: 0, consecutivePlayed: 0, consecutiveRest: 0, wins: 0, losses: 0, partnerHistory: {}, opponentHistory: {} },
];

const KEYS = {
  PLAYERS: 'badminton_players_v4',
  ACTIVE_COURTS: 'badminton_active_courts_v4',
  NEXT_COURTS: 'badminton_next_courts_v4',
  RESTING: 'badminton_resting_v4',
  HISTORY: 'badminton_history_v4',
  SETTINGS: 'badminton_settings_v4',
  LAST_DATE: 'badminton_last_date_v4',
};

function getTodayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function loadFullSession() {
  const today = getTodayString();
  let savedDate = null;
  try {
    savedDate = localStorage.getItem(KEYS.LAST_DATE);
  } catch (e) {}

  const isNewDay = savedDate && savedDate !== today;

  let players = INITIAL_PLAYERS;
  try {
    const raw = localStorage.getItem(KEYS.PLAYERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        players = parsed.map((p) => ({
          id: p.id || `p_${Date.now()}_${Math.random()}`,
          name: p.name || '무명',
          tier: ['A', 'B', 'C'].includes(p.tier) ? p.tier : 'B',
          isPresent: p.isPresent !== false,
          gamesPlayed: typeof p.gamesPlayed === 'number' ? p.gamesPlayed : 0,
          consecutivePlayed: typeof p.consecutivePlayed === 'number' ? p.consecutivePlayed : 0,
          consecutiveRest: typeof p.consecutiveRest === 'number' ? p.consecutiveRest : 0,
          wins: typeof p.wins === 'number' ? p.wins : 0,
          losses: typeof p.losses === 'number' ? p.losses : 0,
          partnerHistory: p.partnerHistory || {},
          opponentHistory: p.opponentHistory || {},
          avatar: p.avatar || null,
        }));
      }
    }
  } catch (e) {}

  if (isNewDay) {
    players = players.map((p) => ({
      ...p,
      gamesPlayed: 0,
      consecutivePlayed: 0,
      consecutiveRest: 0,
      wins: 0,
      losses: 0,
    }));

    try {
      localStorage.setItem(KEYS.LAST_DATE, today);
      localStorage.removeItem(KEYS.ACTIVE_COURTS);
      localStorage.removeItem(KEYS.NEXT_COURTS);
      localStorage.removeItem(KEYS.RESTING);
      localStorage.removeItem(KEYS.HISTORY);
    } catch (e) {}

    return {
      autoResetOccurred: true,
      players,
      activeCourts: [],
      nextCourts: [],
      restingPlayers: [],
      history: [],
      settings: { enabledCourts: [1, 2, 3] },
    };
  }

  let activeCourts = [];
  let nextCourts = [];
  let restingPlayers = [];
  let history = [];
  let settings = { enabledCourts: [1, 2, 3] };

  try {
    const ac = localStorage.getItem(KEYS.ACTIVE_COURTS);
    if (ac) activeCourts = JSON.parse(ac);

    const nc = localStorage.getItem(KEYS.NEXT_COURTS);
    if (nc) nextCourts = JSON.parse(nc);

    const rp = localStorage.getItem(KEYS.RESTING);
    if (rp) restingPlayers = JSON.parse(rp);

    const h = localStorage.getItem(KEYS.HISTORY);
    if (h) history = JSON.parse(h);

    const s = localStorage.getItem(KEYS.SETTINGS);
    if (s) settings = JSON.parse(s);
  } catch (e) {}

  try {
    localStorage.setItem(KEYS.LAST_DATE, today);
  } catch (e) {}

  return {
    autoResetOccurred: false,
    players,
    activeCourts: Array.isArray(activeCourts) ? activeCourts : [],
    nextCourts: Array.isArray(nextCourts) ? nextCourts : [],
    restingPlayers: Array.isArray(restingPlayers) ? restingPlayers : [],
    history: Array.isArray(history) ? history : [],
    settings: settings && Array.isArray(settings.enabledCourts) ? settings : { enabledCourts: [1, 2, 3] },
  };
}

export function saveFullSession({ players, activeCourts, nextCourts, restingPlayers, history, settings }) {
  try {
    const today = getTodayString();
    localStorage.setItem(KEYS.LAST_DATE, today);
    if (players) localStorage.setItem(KEYS.PLAYERS, JSON.stringify(players));
    if (activeCourts) localStorage.setItem(KEYS.ACTIVE_COURTS, JSON.stringify(activeCourts));
    if (nextCourts) localStorage.setItem(KEYS.NEXT_COURTS, JSON.stringify(nextCourts));
    if (restingPlayers) localStorage.setItem(KEYS.RESTING, JSON.stringify(restingPlayers));
    if (history) localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
    if (settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {}
}

export function clearAllSessionData(players) {
  try {
    localStorage.removeItem(KEYS.ACTIVE_COURTS);
    localStorage.removeItem(KEYS.NEXT_COURTS);
    localStorage.removeItem(KEYS.RESTING);
    localStorage.removeItem(KEYS.HISTORY);
  } catch (e) {}

  const resetPlayers = (players || INITIAL_PLAYERS).map((p) => ({
    ...p,
    gamesPlayed: 0,
    consecutivePlayed: 0,
    consecutiveRest: 0,
    wins: 0,
    losses: 0,
  }));

  try {
    localStorage.setItem(KEYS.PLAYERS, JSON.stringify(resetPlayers));
  } catch (e) {}

  return resetPlayers;
}
