/**
 * 배드민턴 스마트 복식 대진 생성기 (최근 3경기 파트너 중복 100% 회피 적용)
 */

export const TIER_SCORES = {
  A: 3.0,
  B: 2.0,
  C: 1.0,
};

export const GENDER_WEIGHT = {
  M: 0.5, // 남성이 약 +0.5pt 체력/파워 실력 보정
  F: 0.0,
};

export const TIER_COLORS = {
  A: 'bg-[#e8f3ff] text-[#1b64da] border border-blue-200',
  B: 'bg-amber-50 text-amber-800 border border-amber-200',
  C: 'bg-gray-100 text-gray-700 border border-gray-200',
};

/**
 * 선수의 종합 실력 점수 계산 (등급 점수 + 성별 보정)
 */
export function getPlayerScore(player) {
  if (!player) return 2.0;
  const baseTierScore = TIER_SCORES[player.tier] || 2.0;
  const genderBonus = player.gender === 'M' ? GENDER_WEIGHT.M : GENDER_WEIGHT.F;
  return baseTierScore + genderBonus;
}

/**
 * 4명의 선수로 최적의 2대2 팀 조합 (점수차 최소화 + 최근 3경기 파트너 중복 회피)
 */
export function getBestDoubleMatch(players4, history = []) {
  if (!players4 || players4.length !== 4) return null;

  const [p1, p2, p3, p4] = players4;

  const combinations = [
    { team1: [p1, p2], team2: [p3, p4] },
    { team1: [p1, p3], team2: [p2, p4] },
    { team1: [p1, p4], team2: [p2, p3] },
  ];

  // 최근 3라운드 경기 기록 추출
  const recent3Matches = Array.isArray(history) ? history.slice(-3) : [];

  const isRecentPartner = (idA, idB) => {
    return recent3Matches.some((courtMatch) => {
      const t1 = (courtMatch.team1 || []).map((p) => p.id);
      const t2 = (courtMatch.team2 || []).map((p) => p.id);
      const inT1 = t1.includes(idA) && t1.includes(idB);
      const inT2 = t2.includes(idA) && t2.includes(idB);
      return inT1 || inT2;
    });
  };

  let bestCombo = null;
  let minCost = Infinity;

  combinations.forEach((combo) => {
    const t1Score = getPlayerScore(combo.team1[0]) + getPlayerScore(combo.team1[1]);
    const t2Score = getPlayerScore(combo.team2[0]) + getPlayerScore(combo.team2[1]);
    const scoreDiff = Math.abs(t1Score - t2Score);

    // 최근 3경기 파트너 중복 체크
    const t1Recent = isRecentPartner(combo.team1[0].id, combo.team1[1].id);
    const t2Recent = isRecentPartner(combo.team2[0].id, combo.team2[1].id);

    // 최근 3경기 이내 겹치면 패널티 +100pt 부여하여 무조건 회피
    const recentPenalty = (t1Recent ? 100 : 0) + (t2Recent ? 100 : 0);

    // 과거 파트너 누적 횟수
    const p1P2History = (combo.team1[0].partnerHistory?.[combo.team1[1].id] || 0) +
                         (combo.team2[0].partnerHistory?.[combo.team2[1].id] || 0);

    const cost = scoreDiff + recentPenalty + p1P2History * 0.3;

    if (cost < minCost) {
      minCost = cost;
      bestCombo = {
        team1: combo.team1,
        team2: combo.team2,
        t1Score: Math.round(t1Score * 10) / 10,
        t2Score: Math.round(t2Score * 10) / 10,
        scoreDiff: Math.round(scoreDiff * 10) / 10,
      };
    }
  });

  return bestCombo;
}

/**
 * 전체 참석자 중 활성화된 코트들에 대해 100% 공평 대진 생성
 */
export function generateMatches(players = [], enabledCourts = [1, 2, 3], history = []) {
  const activePlayers = players.filter((p) => p && p.isPresent !== false);

  if (activePlayers.length < 4) {
    return {
      success: false,
      message: '참석자 인원이 최소 4명 이상이어야 경기를 생성할 수 있습니다.',
      courts: [],
      restingPlayers: [],
    };
  }

  const courtCount = enabledCourts.length;
  const maxPlayersNeeded = courtCount * 4;

  // 1단계: 출전 순번 정렬 (덜 뛴 사람 최우선)
  const sortedPlayers = [...activePlayers].sort((a, b) => {
    const gDiff = (a.gamesPlayed || 0) - (b.gamesPlayed || 0);
    if (gDiff !== 0) return gDiff;

    const restA = (a.totalRestCount || 0) + (a.consecutiveRest || 0);
    const restB = (b.totalRestCount || 0) + (b.consecutiveRest || 0);
    if (restB !== restA) return restB - restA;

    return (a.consecutivePlayed || 0) - (b.consecutivePlayed || 0);
  });

  const selectedPlayers = sortedPlayers.slice(0, maxPlayersNeeded);
  const restingPlayers = sortedPlayers.slice(maxPlayersNeeded);

  // 2단계: 코트별 4명 그룹 밸런스 분배 (실력 점수 순 정렬 후 스네이크 배분)
  const sortedBySkill = [...selectedPlayers].sort((a, b) => getPlayerScore(b) - getPlayerScore(a));

  const courtGroups = Array.from({ length: courtCount }, () => []);

  for (let i = 0; i < sortedBySkill.length; i++) {
    const round = Math.floor(i / courtCount);
    const posInRound = i % courtCount;

    const targetCourtIndex = round % 2 === 0 ? posInRound : courtCount - 1 - posInRound;
    if (courtGroups[targetCourtIndex].length < 4) {
      courtGroups[targetCourtIndex].push(sortedBySkill[i]);
    }
  }

  const courts = [];
  for (let i = 0; i < enabledCourts.length; i++) {
    const courtId = enabledCourts[i];
    const courtFour = courtGroups[i] || [];

    if (courtFour.length === 4) {
      const match = getBestDoubleMatch(courtFour, history);
      courts.push({
        id: courtId,
        name: `${courtId}번 코트`,
        status: 'playing',
        team1: match.team1,
        team2: match.team2,
        t1Score: match.t1Score,
        t2Score: match.t2Score,
        scoreDiff: match.scoreDiff,
      });
    }
  }

  return {
    success: true,
    courts,
    restingPlayers,
  };
}

/**
 * 다음 라운드 예비 대진 예측
 */
export function predictNextRound(players = [], currentActiveCourts = [], enabledCourts = [1, 2, 3], history = []) {
  const activeList = players.filter((p) => p && p.isPresent !== false);
  if (activeList.length < 4) return [];

  const playingIds = new Set(
    currentActiveCourts.flatMap((c) => [...(c.team1 || []), ...(c.team2 || [])].map((p) => p.id))
  );

  const simPlayers = activeList.map((p) => {
    if (playingIds.has(p.id)) {
      return { ...p, gamesPlayed: (p.gamesPlayed || 0) + 1, consecutiveRest: 0 };
    } else {
      return {
        ...p,
        totalRestCount: (p.totalRestCount || 0) + 1,
        consecutiveRest: (p.consecutiveRest || 0) + 1,
      };
    }
  });

  const sortedSim = [...simPlayers].sort((a, b) => {
    const gDiff = (a.gamesPlayed || 0) - (b.gamesPlayed || 0);
    if (gDiff !== 0) return gDiff;
    const restA = (a.totalRestCount || 0) + (a.consecutiveRest || 0);
    const restB = (b.totalRestCount || 0) + (b.consecutiveRest || 0);
    return restB - restA;
  });

  const courtCount = enabledCourts.length;
  const maxNeeded = courtCount * 4;
  const selectedSim = sortedSim.slice(0, maxNeeded);

  const sortedBySkill = [...selectedSim].sort((a, b) => getPlayerScore(b) - getPlayerScore(a));
  const courtGroups = Array.from({ length: courtCount }, () => []);

  for (let i = 0; i < sortedBySkill.length; i++) {
    const round = Math.floor(i / courtCount);
    const posInRound = i % courtCount;
    const targetCourtIndex = round % 2 === 0 ? posInRound : courtCount - 1 - posInRound;
    if (courtGroups[targetCourtIndex].length < 4) {
      courtGroups[targetCourtIndex].push(sortedBySkill[i]);
    }
  }

  const predictedCourts = [];
  for (let i = 0; i < enabledCourts.length; i++) {
    const courtId = enabledCourts[i];
    const four = courtGroups[i] || [];

    if (four.length === 4) {
      const match = getBestDoubleMatch(four, history);
      predictedCourts.push({
        id: courtId,
        name: `${courtId}번 코트`,
        team1: match.team1,
        team2: match.team2,
        scoreDiff: match.scoreDiff,
      });
    }
  }

  return predictedCourts;
}
