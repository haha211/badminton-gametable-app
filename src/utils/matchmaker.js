/**
 * 스마트 배드민턴 대진표 생성 및 밸런싱 알고리즘 (개별 활성 코트 선택 기능 포함)
 */

export const TIER_WEIGHTS = {
  A: 3,
  B: 2,
  C: 1,
};

export const TIER_COLORS = {
  A: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', badge: 'bg-emerald-500' },
  B: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', badge: 'bg-amber-500' },
  C: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40', badge: 'bg-cyan-500' },
};

/**
 * 4명의 플레이어로 최적의 복식 대진(2 vs 2) 구성
 */
export function getBestDoubleMatch(fourPlayers) {
  if (fourPlayers.length !== 4) return null;

  const combos = [
    { team1: [fourPlayers[0], fourPlayers[1]], team2: [fourPlayers[2], fourPlayers[3]] },
    { team1: [fourPlayers[0], fourPlayers[2]], team2: [fourPlayers[1], fourPlayers[3]] },
    { team1: [fourPlayers[0], fourPlayers[3]], team2: [fourPlayers[1], fourPlayers[2]] },
  ];

  let bestMatch = null;
  let minPenalty = Infinity;

  for (const combo of combos) {
    const t1Score = (TIER_WEIGHTS[combo.team1[0].tier] || 2) + (TIER_WEIGHTS[combo.team1[1].tier] || 2);
    const t2Score = (TIER_WEIGHTS[combo.team2[0].tier] || 2) + (TIER_WEIGHTS[combo.team2[1].tier] || 2);
    const scoreDiff = Math.abs(t1Score - t2Score);

    const p1 = combo.team1[0];
    const p2 = combo.team1[1];
    const p3 = combo.team2[0];
    const p4 = combo.team2[1];

    const partnerPenalty = (p1.partnerHistory?.[p2.id] || 0) + (p3.partnerHistory?.[p4.id] || 0);
    const opponentPenalty = 
      (p1.opponentHistory?.[p3.id] || 0) + (p1.opponentHistory?.[p4.id] || 0) +
      (p2.opponentHistory?.[p3.id] || 0) + (p2.opponentHistory?.[p4.id] || 0);

    const totalPenalty = (scoreDiff * 15) + (partnerPenalty * 8) + (opponentPenalty * 3);

    if (totalPenalty < minPenalty) {
      minPenalty = totalPenalty;
      bestMatch = {
        ...combo,
        t1Score,
        t2Score,
        scoreDiff,
        penalty: totalPenalty,
      };
    }
  }

  return bestMatch;
}

/**
 * 활성화 선택된 코트 목록(enabledCourts: [1, 2, 3] 등)에 따라 대진표 생성
 */
export function generateMatches(players, enabledCourts = [1, 2, 3]) {
  const activePlayers = players.filter((p) => p.isPresent !== false);
  const totalActive = activePlayers.length;

  if (totalActive < 4) {
    return {
      success: false,
      message: '경기를 진행하려면 최소 4명의 참석자가 필요합니다.',
      courts: [],
      restingPlayers: activePlayers,
    };
  }

  // 선택된 활성 코트 수
  const sortedEnabledCourts = [...enabledCourts].sort((a, b) => a - b);
  const targetCourtCount = sortedEnabledCourts.length;

  if (targetCourtCount === 0) {
    return {
      success: false,
      message: '최소 1개 이상의 코트를 활성화해주세요.',
      courts: [],
      restingPlayers: activePlayers,
    };
  }

  const maxPossibleCourts = Math.floor(totalActive / 4);
  const actualCount = Math.min(targetCourtCount, maxPossibleCourts);

  if (actualCount === 0) {
    return {
      success: false,
      message: `참석자(${totalActive}명)가 부족하여 코트를 가동할 수 없습니다. (최소 4명 필요)`,
      courts: [],
      restingPlayers: activePlayers,
    };
  }

  const activeCourtList = sortedEnabledCourts.slice(0, actualCount);
  const playersNeeded = actualCount * 4;

  // 1. 플레이어 선택 가중치 정렬 (경기 수 적은 순 -> 연속 휴식 많은 순 -> 연속 출전 적은 순)
  const sortedCandidates = [...activePlayers].sort((a, b) => {
    const playDiff = (a.gamesPlayed || 0) - (b.gamesPlayed || 0);
    if (playDiff !== 0) return playDiff;

    const restDiff = (b.consecutiveRest || 0) - (a.consecutiveRest || 0);
    if (restDiff !== 0) return restDiff;

    const playedDiff = (a.consecutivePlayed || 0) - (b.consecutivePlayed || 0);
    if (playedDiff !== 0) return playedDiff;

    return Math.random() - 0.5;
  });

  const selectedPlayers = sortedCandidates.slice(0, playersNeeded);
  const restingPlayers = sortedCandidates.slice(playersNeeded);

  // 2. 선택된 코트들에 등급 밸런스 분배
  const sortedByTier = [...selectedPlayers].sort((a, b) => {
    return (TIER_WEIGHTS[b.tier] || 2) - (TIER_WEIGHTS[a.tier] || 2);
  });

  const courtGroups = Array.from({ length: actualCount }, () => []);

  let dir = 1;
  let courtIdx = 0;
  for (let i = 0; i < sortedByTier.length; i++) {
    courtGroups[courtIdx].push(sortedByTier[i]);
    courtIdx += dir;
    if (courtIdx >= actualCount) {
      courtIdx = actualCount - 1;
      dir = -1;
    } else if (courtIdx < 0) {
      courtIdx = 0;
      dir = 1;
    }
  }

  const formattedCourts = [];
  for (let i = 0; i < actualCount; i++) {
    const courtId = activeCourtList[i];
    const group = courtGroups[i];
    if (group.length === 4) {
      const match = getBestDoubleMatch(group);
      formattedCourts.push({
        id: courtId,
        name: `${courtId}번 코트`,
        status: 'playing',
        team1: match.team1,
        team2: match.team2,
        t1Score: match.t1Score,
        t2Score: match.t2Score,
        scoreDiff: match.scoreDiff,
        score1: 0,
        score2: 0,
      });
    }
  }

  return {
    success: true,
    actualCourts: actualCount,
    courts: formattedCourts,
    restingPlayers,
  };
}

/**
 * 다음 라운드 미리 지정 대진표 계산 헬퍼
 */
export function predictNextRound(players, currentCourts = [], enabledCourts = [1, 2, 3]) {
  const activePlayers = players.filter((p) => p.isPresent !== false);
  if (activePlayers.length < 4) return [];

  const simulatedPlayers = activePlayers.map((p) => {
    const isCurrentlyPlaying = currentCourts.some((c) =>
      [...c.team1, ...c.team2].some((tp) => tp.id === p.id)
    );

    return {
      ...p,
      gamesPlayed: (p.gamesPlayed || 0) + (isCurrentlyPlaying ? 1 : 0),
      consecutiveRest: isCurrentlyPlaying ? 0 : (p.consecutiveRest || 0) + 1,
      consecutivePlayed: isCurrentlyPlaying ? (p.consecutivePlayed || 0) + 1 : 0,
    };
  });

  const nextResult = generateMatches(simulatedPlayers, enabledCourts);
  return nextResult.courts || [];
}
