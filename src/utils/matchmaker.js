/**
 * 배드민턴 스마트 복식 대진 생성기 (대진 섞기 먹통 100% 방지 완전 무적 패치)
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
 * 4명의 선수로 최적의 2대2 팀 조합 (점수차 최소화 + 최근 3경기 파트너 중복 회피 - 100% Crash-Free)
 */
export function getBestDoubleMatch(players4, history = []) {
  if (!Array.isArray(players4) || players4.length !== 4) return null;

  const validFour = players4.filter(Boolean);
  if (validFour.length !== 4) return null;

  const [p1, p2, p3, p4] = validFour;

  const combinations = [
    { team1: [p1, p2], team2: [p3, p4] },
    { team1: [p1, p3], team2: [p2, p4] },
    { team1: [p1, p4], team2: [p2, p3] },
  ];

  const recent3Matches = Array.isArray(history) ? history.slice(-6) : [];

  const isRecentPartner = (idA, idB) => {
    if (!idA || !idB) return false;
    return recent3Matches.some((courtMatch) => {
      if (!courtMatch) return false;
      const t1 = Array.isArray(courtMatch.team1)
        ? courtMatch.team1.map((p) => p?.id).filter(Boolean)
        : [];
      const t2 = Array.isArray(courtMatch.team2)
        ? courtMatch.team2.map((p) => p?.id).filter(Boolean)
        : [];
      return (t1.includes(idA) && t1.includes(idB)) || (t2.includes(idA) && t2.includes(idB));
    });
  };

  let bestCombo = null;
  let minCost = Infinity;

  combinations.forEach((combo) => {
    const p1 = combo.team1[0];
    const p2 = combo.team1[1];
    const p3 = combo.team2[0];
    const p4 = combo.team2[1];

    const t1Score = getPlayerScore(p1) + getPlayerScore(p2);
    const t2Score = getPlayerScore(p3) + getPlayerScore(p4);
    const scoreDiff = Math.abs(t1Score - t2Score);

    const t1Recent = isRecentPartner(p1?.id, p2?.id);
    const t2Recent = isRecentPartner(p3?.id, p4?.id);

    // 소인원이거나 어쩔 수 없는 경우 대진 섞기가 멈추지 않도록 유연한 가중치(+3pt) 부여
    const recentPenalty = (t1Recent ? 3.0 : 0) + (t2Recent ? 3.0 : 0);

    const p1P2History = (p1?.partnerHistory?.[p2?.id] || 0) + (p3?.partnerHistory?.[p4?.id] || 0);

    const cost = scoreDiff + recentPenalty + p1P2History * 0.2;

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

  // 만약 비상 상황 발생 시 기본 첫 번째 조합 덤프 반환
  if (!bestCombo) {
    const t1Score = getPlayerScore(p1) + getPlayerScore(p2);
    const t2Score = getPlayerScore(p3) + getPlayerScore(p4);
    bestCombo = {
      team1: [p1, p2],
      team2: [p3, p4],
      t1Score: Math.round(t1Score * 10) / 10,
      t2Score: Math.round(t2Score * 10) / 10,
      scoreDiff: Math.round(Math.abs(t1Score - t2Score) * 10) / 10,
    };
  }

  return bestCombo;
}

/**
 * 전체 참석자 중 활성화된 코트들에 대해 100% 공평 대진 생성 (100% 먹통 방지 안전망)
 */
export function generateMatches(players = [], enabledCourts = [1, 2, 3], history = []) {
  try {
    const safePlayers = Array.isArray(players) ? players : [];
    const activePlayers = safePlayers.filter(
      (p) => p && p.isPresent !== false && p.isWantRest !== true
    );

    if (activePlayers.length < 4) {
      return {
        success: false,
        message: '경기를 가동할 참석자 인원이 부족합니다. (수동 휴식/불참자 제외 후 최소 4명 필요)',
        courts: [],
        restingPlayers: safePlayers.filter((p) => p && (p.isPresent === false || p.isWantRest === true)),
      };
    }

    const courtCount = Array.isArray(enabledCourts) && enabledCourts.length > 0 ? enabledCourts.length : 1;
    const maxPlayersNeeded = courtCount * 4;

    // 1단계: 출전 순번 정렬 (덜 뛴 사람 & 지각자 등록 순서 보장)
    const sortedPlayers = [...activePlayers].sort((a, b) => {
      const gDiff = (a.gamesPlayed || 0) - (b.gamesPlayed || 0);
      if (gDiff !== 0) return gDiff;

      const restA = (a.totalRestCount || 0) + (a.consecutiveRest || 0);
      const restB = (b.totalRestCount || 0) + (b.consecutiveRest || 0);
      if (restB !== restA) return restB - restA;

      const cDiff = (a.consecutivePlayed || 0) - (b.consecutivePlayed || 0);
      if (cDiff !== 0) return cDiff;

      const timeA = a.createdAt || 0;
      const timeB = b.createdAt || 0;
      return timeA - timeB;
    });

    const selectedPlayers = sortedPlayers.slice(0, maxPlayersNeeded);
    const unselectedActive = sortedPlayers.slice(maxPlayersNeeded);
    const wantRestPlayers = safePlayers.filter(
      (p) => p && p.isPresent !== false && p.isWantRest === true
    );
    const restingPlayers = [...unselectedActive, ...wantRestPlayers];

    // 2단계: 코트별 4명 그룹 밸런스 분배 (스네이크 드래프트)
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
    const validEnabledCourts = Array.isArray(enabledCourts) && enabledCourts.length > 0 ? enabledCourts : [1, 2, 3];

    for (let i = 0; i < validEnabledCourts.length; i++) {
      const courtId = validEnabledCourts[i];
      const courtFour = courtGroups[i] || [];

      if (courtFour.length === 4) {
        const match = getBestDoubleMatch(courtFour, history);
        if (match) {
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
    }

    return {
      success: true,
      courts,
      restingPlayers,
    };
  } catch (err) {
    console.error('generateMatches error:', err);
    return {
      success: false,
      message: '대진표 생성 중 오류가 발생하였습니다: ' + err.message,
      courts: [],
      restingPlayers: [],
    };
  }
}

/**
 * 다음 라운드 예비 대진 예측 (Crash-Free 100% 안전)
 */
export function predictNextRound(players = [], currentActiveCourts = [], enabledCourts = [1, 2, 3], history = []) {
  try {
    const safePlayers = Array.isArray(players) ? players : [];
    const activeList = safePlayers.filter((p) => p && p.isPresent !== false && p.isWantRest !== true);
    if (activeList.length < 4) return [];

    const safeActiveCourts = Array.isArray(currentActiveCourts) ? currentActiveCourts : [];
    const playingIds = new Set(
      safeActiveCourts.flatMap((c) =>
        [...(c?.team1 || []), ...(c?.team2 || [])].map((p) => p?.id).filter(Boolean)
      )
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
      if (restB !== restA) return restB - restA;

      const timeA = a.createdAt || 0;
      const timeB = b.createdAt || 0;
      return timeA - timeB;
    });

    const validEnabledCourts = Array.isArray(enabledCourts) && enabledCourts.length > 0 ? enabledCourts : [1, 2, 3];
    const courtCount = validEnabledCourts.length;
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
    for (let i = 0; i < validEnabledCourts.length; i++) {
      const courtId = validEnabledCourts[i];
      const four = courtGroups[i] || [];

      if (four.length === 4) {
        const match = getBestDoubleMatch(four, history);
        if (match) {
          predictedCourts.push({
            id: courtId,
            name: `${courtId}번 코트`,
            team1: match.team1,
            team2: match.team2,
            scoreDiff: match.scoreDiff,
          });
        }
      }
    }

    return predictedCourts;
  } catch (err) {
    console.error('predictNextRound error:', err);
    return [];
  }
}
