const STORAGE_KEY = 'badminton_gameboard_session_v1';
const LAST_DATE_KEY = 'badminton_gameboard_last_date';

/**
 * 24시간 자정 경과 여부 확인 및 자동 리셋
 */
export function checkAndAutoResetMidnight() {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const lastSavedDate = localStorage.getItem(LAST_DATE_KEY);

  if (lastSavedDate && lastSavedDate !== today) {
    localStorage.setItem(LAST_DATE_KEY, today);
    return true; // 자정 지나 리셋 수행 필요
  }

  localStorage.setItem(LAST_DATE_KEY, today);
  return false;
}

/**
 * 로컬스토리지에서 세션 데이터 로드
 */
export function loadFullSession() {
  const isMidnightReset = checkAndAutoResetMidnight();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialDefaultSession();

    const parsed = JSON.parse(raw);

    if (isMidnightReset) {
      return {
        ...parsed,
        players: clearAllSessionData(parsed.players),
        activeCourts: [],
        nextCourts: [],
        restingPlayers: [],
        history: [],
        autoResetOccurred: true,
      };
    }

    return parsed;
  } catch (e) {
    console.error('Failed to parse local storage session:', e);
    return getInitialDefaultSession();
  }
}

/**
 * 로컬스토리지에 세션 데이터 저장
 */
export function saveFullSession(sessionData) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(LAST_DATE_KEY, today);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
  } catch (e) {
    console.error('Failed to save session to local storage:', e);
  }
}

/**
 * 모든 참가자의 경기수, 휴식수(totalRestCount, consecutiveRest), 전적 초기화 (명백한 버그 수정완료)
 */
export function clearAllSessionData(players = []) {
  if (!Array.isArray(players)) return [];

  return players.map((p) => ({
    ...p,
    gamesPlayed: 0,
    consecutivePlayed: 0,
    consecutiveRest: 0,
    totalRestCount: 0, // 쉰 횟수 0으로 완벽 초기화
    wins: 0,
    losses: 0,
    partnerHistory: {},
    opponentHistory: {},
  }));
}

/**
 * 기본 예시 참가자 데이터 생성 (성별 M/F 및 초기화)
 */
export function getInitialDefaultSession() {
  const defaultNames = [
    { name: '김양', gender: 'F', tier: 'A' },
    { name: '경민', gender: 'F', tier: 'A' },
    { name: '정익', gender: 'M', tier: 'B' },
    { name: '동현', gender: 'M', tier: 'B' },
    { name: '지훈', gender: 'M', tier: 'B' },
    { name: '수진', gender: 'F', tier: 'B' },
    { name: '민우', gender: 'M', tier: 'C' },
    { name: '하은', gender: 'F', tier: 'C' },
  ];

  const players = defaultNames.map((item, idx) => ({
    id: `p_init_${idx}_${Math.random().toString(36).substr(2, 4)}`,
    name: item.name,
    gender: item.gender,
    tier: item.tier,
    isPresent: true,
    gamesPlayed: 0,
    consecutivePlayed: 0,
    consecutiveRest: 0,
    totalRestCount: 0,
    wins: 0,
    losses: 0,
    partnerHistory: {},
    opponentHistory: {},
  }));

  return {
    players,
    activeCourts: [],
    nextCourts: [],
    restingPlayers: [],
    history: [],
    settings: {
      enabledCourts: [1, 2, 3],
    },
  };
}
