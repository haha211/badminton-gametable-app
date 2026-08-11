/**
 * 배드민턴 스마트 복식 대진 생성기 (성별 가중치 반영)
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
 * 4명의 선수로 최적의 2대2 팀 조합(실력 차 최소화) 반환
 */
export function getBestDoubleMatch(players4) {
  if (!players4 || players4.length !== 4) return null;

  const [p1, p2, p3, p4] = players4;

  const combinations = [
    { team1: [p1, p2], team2: [p3, p4] },
    { team1: [p1, p3], team2: [p2, p4] },
    { team1: [p1, p4], team2: [p2, p3] },
  ];

  let bestCombo = null;
  let minDiff = Infinity;

  combinations.forEach((combo) => {
    const t1Score = getPlayerScore(combo.team1[0]) + getPlayerScore(combo.team1[1]);
    const t2Score = getPlayerScore(combo.team2[0]) + getPlayerScore(combo.team2[1]);
    const diff = Math.abs(t1Score - t2Score);

    if (diff < minDiff) {
      minDiff = diff;
      bestCombo = {
        team1: combo.team1,
        team2: combo.team2,
        t1Score: Math.round(t1Score * 10) / 10,
        t2Score: Math.round(t2Score * 10) / 10,
        scoreDiff: Math.round(diff * 10) / 10,
      };
    }
  });

  return bestCombo;
}

/**
 * 전체 참석자 중 활성화된 코트들에 대해 대진 생성
 */
export function generateMatches(players = [], enabledCourts = [1, 2, 3]) {
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

  // 정렬 순서: 1) 경기 수 적은 사람 2) 연속 휴식 많은 사람 3) 연속 출전 적은 사람
  const sortedPlayers = [...activePlayers].sort((a, b) => {
    const gDiff = (a.gamesPlayed || 0) - (b.gamesPlayed || 0);
    if (gDiff !== 0) return gDiff;

    const rDiff = (b.consecutiveRest || 0) - (a.consecutiveRest || 0);
    if (rDiff !== 0) return rDiff;

    return (a.consecutivePlayed || 0) - (b.consecutivePlayed || 0);
  });

  const selectedPlayers = sortedPlayers.slice(0, maxPlayersNeeded);
  const restingPlayers = sortedPlayers.slice(maxPlayersNeeded);

  const courts = [];
  let pIdx = 0;

  for (const courtId of enabledCourts) {
    if (pIdx + 4 <= selectedPlayers.length) {
      const courtFour = selectedPlayers.slice(pIdx, pIdx + 4);
      const match = getBestDoubleMatch(courtFour);

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

      pIdx += 4;
    }
  }

  return {
    success: true,
    courts,
    restingPlayers,
  };
}

/**
 * 다음 라운드 예비 대진표 예측
 */
export function predictNextRound(players = [], currentActiveCourts = [], enabledCourts = [1, 2, 3]) {
  const activeList = players.filter((p) => p && p.isPresent !== false);
  if (activeList.length < 4) return [];

  // 다음 라운드 예상 출전수/휴식수 가상 시뮬레이션
  const playingIds = new Set(
    currentActiveCourts.flatMap((c) => [...(c.team1 || []), ...(c.team2 || [])].map((p) => p.id))
  );

  const simPlayers = activeList.map((p) => {
    if (playingIds.has(p.id)) {
      return { ...p, gamesPlayed: (p.gamesPlayed || 0) + 1, consecutiveRest: 0 };
    } else {
      return { ...p, consecutiveRest: (p.consecutiveRest || 0) + 1 };
    }
  });

  const sortedSim = [...simPlayers].sort((a, b) => {
    const gDiff = (a.gamesPlayed || 0) - (b.gamesPlayed || 0);
    if (gDiff !== 0) return gDiff;
    return (b.consecutiveRest || 0) - (a.consecutiveRest || 0);
  });

  const courtCount = enabledCourts.length;
  const predictedCourts = [];
  let idx = 0;

  for (const courtId of enabledCourts) {
    if (idx + 4 <= sortedSim.length) {
      const four = sortedSim.slice(idx, idx + 4);
      const match = getBestDoubleMatch(four);

      predictedCourts.push({
        id: courtId,
        name: `${courtId}번 코트`,
        team1: match.team1,
        team2: match.team2,
        scoreDiff: match.scoreDiff,
      });

      idx += 4;
    }
  }

  return predictedCourts;
}
