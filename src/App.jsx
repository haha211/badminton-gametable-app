import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CourtBoard from './components/CourtBoard';
import PlayerManager from './components/PlayerManager';
import StatsView from './components/StatsView';
import ImageOCRModal from './components/ImageOCRModal';
import ShareModal from './components/ShareModal';
import WebShareInfoModal from './components/WebShareInfoModal';

import { loadFullSession, saveFullSession, clearAllSessionData } from './utils/storage';
import { generateMatches, predictNextRound, getBestDoubleMatch } from './utils/matchmaker';
import {
  isSupabaseConfigured,
  fetchBadmintonSession,
  updateBadmintonSession,
  subscribeToBadmintonSession,
  lastDbStatus,
  lastErrorMessage,
} from './utils/supabaseClient';

export default function App() {
  const [session, setSession] = useState(() => loadFullSession());

  const [players, setPlayers] = useState(session.players || []);
  const [activeCourts, setActiveCourts] = useState(session.activeCourts || []);
  const [nextCourts, setNextCourts] = useState(session.nextCourts || []);
  const [restingPlayers, setRestingPlayers] = useState(session.restingPlayers || []);
  const [history, setHistory] = useState(session.history || []);

  const [enabledCourts, setEnabledCourts] = useState(
    session.settings?.enabledCourts || [1, 2, 3]
  );

  const [activeTab, setActiveTab] = useState('courts');
  const [isOCRModalOpen, setIsOCRModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isWebInfoModalOpen, setIsWebInfoModalOpen] = useState(false);

  const [dbStatusState, setDbStatusState] = useState(lastDbStatus);
  const [dbErrorMsgState, setDbErrorMsgState] = useState(lastErrorMessage);

  useEffect(() => {
    if (isSupabaseConfigured) {
      const currentSessionObj = {
        players,
        activeCourts,
        nextCourts,
        restingPlayers,
        history,
        settings: { enabledCourts },
      };

      const syncRemoteData = () => {
        fetchBadmintonSession(currentSessionObj).then((remoteData) => {
          setDbStatusState(lastDbStatus);
          setDbErrorMsgState(lastErrorMessage);
          if (remoteData) {
            applyRemoteSession(remoteData);
          }
        });
      };

      syncRemoteData();

      const unsubscribe = subscribeToBadmintonSession((remoteData) => {
        if (remoteData) {
          applyRemoteSession(remoteData);
        }
      });

      const pollInterval = setInterval(syncRemoteData, 3000);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          syncRemoteData();
        }
      };

      window.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', syncRemoteData);

      return () => {
        unsubscribe();
        clearInterval(pollInterval);
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', syncRemoteData);
      };
    }
  }, []);

  const applyRemoteSession = (data) => {
    if (!data) return;
    setPlayers(Array.isArray(data.players) ? data.players : []);
    setActiveCourts(Array.isArray(data.activeCourts) ? data.activeCourts : []);
    setNextCourts(Array.isArray(data.nextCourts) ? data.nextCourts : []);
    setRestingPlayers(Array.isArray(data.restingPlayers) ? data.restingPlayers : []);
    setHistory(Array.isArray(data.history) ? data.history : []);
    if (data.settings && Array.isArray(data.settings.enabledCourts)) {
      setEnabledCourts(data.settings.enabledCourts);
    }
  };

  const syncSession = (newPlayers, newActive, newNext, newResting, newHistory, newEnabled) => {
    const p = newPlayers !== undefined ? newPlayers : players;
    const ac = newActive !== undefined ? newActive : activeCourts;
    const nc = newNext !== undefined ? newNext : nextCourts;
    const rp = newResting !== undefined ? newResting : restingPlayers;
    const h = newHistory !== undefined ? newHistory : history;
    const ec = newEnabled !== undefined ? newEnabled : enabledCourts;

    const sessionObj = {
      players: p,
      activeCourts: ac,
      nextCourts: nc,
      restingPlayers: rp,
      history: h,
      settings: { enabledCourts: ec },
    };

    saveFullSession(sessionObj);

    if (isSupabaseConfigured) {
      updateBadmintonSession(sessionObj).then(() => {
        setDbStatusState(lastDbStatus);
        setDbErrorMsgState(lastErrorMessage);
      });
    }
  };

  const handleToggleCourt = (courtId) => {
    let nextEnabled;
    if (enabledCourts.includes(courtId)) {
      if (enabledCourts.length <= 1) {
        alert('최소 1개 이상의 코트는 켜져 있어야 합니다.');
        return;
      }
      nextEnabled = enabledCourts.filter((c) => c !== courtId);
    } else {
      nextEnabled = [...enabledCourts, courtId].sort((a, b) => a - b);
    }

    setEnabledCourts(nextEnabled);
    const filteredActive = activeCourts.filter((c) => nextEnabled.includes(c.id));
    setActiveCourts(filteredActive);

    const predicted = predictNextRound(players, filteredActive, nextEnabled, history);
    setNextCourts(predicted);

    syncSession(players, filteredActive, predicted, restingPlayers, history, nextEnabled);
  };

  const handleGenerateMatches = (overrideCourts = enabledCourts) => {
    try {
      const activeList = players.filter((p) => p && p.isPresent !== false && p.isWantRest !== true);
      if (activeList.length < 4) {
        alert('경기를 진행하려면 최소 4명의 출전 가능 참가자가 필요합니다. (휴식 요청/불참자 확인)');
        return;
      }

      const result = generateMatches(players, overrideCourts, history);
      if (!result.success) {
        alert(result.message);
        return;
      }

      const playingPlayerIds = new Set(
        (result.courts || []).flatMap((c) =>
          [...(c?.team1 || []), ...(c?.team2 || [])].map((p) => p?.id).filter(Boolean)
        )
      );

      const updatedPlayers = players.map((p) => {
        if (!p || p.isPresent === false) return p;

        if (playingPlayerIds.has(p.id)) {
          return {
            ...p,
            gamesPlayed: (p.gamesPlayed || 0) + 1,
            consecutivePlayed: (p.consecutivePlayed || 0) + 1,
            consecutiveRest: 0,
          };
        } else {
          if (p.isWantRest === true) {
            return {
              ...p,
              consecutivePlayed: 0,
            };
          }
          return {
            ...p,
            totalRestCount: (p.totalRestCount || 0) + 1,
            consecutiveRest: (p.consecutiveRest || 0) + 1,
            consecutivePlayed: 0,
          };
        }
      });

      const updatedRestingPlayers = updatedPlayers.filter(
        (p) => p && p.isPresent !== false && (!playingPlayerIds.has(p.id) || p.isWantRest === true)
      );

      const updatedHistory = [...history, ...(result.courts || [])];

      const predicted = predictNextRound(updatedPlayers, result.courts, overrideCourts, updatedHistory);

      setPlayers(updatedPlayers);
      setActiveCourts(result.courts || []);
      setRestingPlayers(updatedRestingPlayers);
      setNextCourts(predicted);
      setHistory(updatedHistory);
      setActiveTab('courts');

      syncSession(updatedPlayers, result.courts || [], predicted, updatedRestingPlayers, updatedHistory, overrideCourts);
    } catch (err) {
      console.error('handleGenerateMatches Exception:', err);
      alert('대진표를 생성하는 중 오류가 발생하였습니다: ' + err.message);
    }
  };

  const handleRotateSingleCourt = (courtId) => {
    try {
      const activeList = players.filter((p) => p && p.isPresent !== false && p.isWantRest !== true);
      if (activeList.length < 4) return;

      const playingOtherCourtPlayerIds = new Set(
        activeCourts
          .filter((c) => c && c.id !== courtId)
          .flatMap((c) => [...(c?.team1 || []), ...(c?.team2 || [])].map((p) => p?.id).filter(Boolean))
      );

      const availableForThisCourt = activeList.filter((p) => !playingOtherCourtPlayerIds.has(p.id));

      if (availableForThisCourt.length < 4) {
        alert('대기 중인 인원이 부족합니다. (최소 4명 필요)');
        return;
      }

      const sorted = [...availableForThisCourt].sort((a, b) => {
        const pDiff = (a.gamesPlayed || 0) - (b.gamesPlayed || 0);
        if (pDiff !== 0) return pDiff;
        const restA = (a.totalRestCount || 0) + (a.consecutiveRest || 0);
        const restB = (b.totalRestCount || 0) + (b.consecutiveRest || 0);
        if (restB !== restA) return restB - restA;
        return (a.createdAt || 0) - (b.createdAt || 0);
      });

      const fourPlayers = sorted.slice(0, 4);
      const match = getBestDoubleMatch(fourPlayers, history);

      if (!match) return;

      const newCourtData = {
        id: courtId,
        name: `${courtId}번 코트`,
        status: 'playing',
        team1: match.team1,
        team2: match.team2,
        t1Score: match.t1Score,
        t2Score: match.t2Score,
        scoreDiff: match.scoreDiff,
      };

      const updatedCourts = activeCourts.map((c) => (c.id === courtId ? newCourtData : c));
      if (!activeCourts.some((c) => c.id === courtId)) {
        updatedCourts.push(newCourtData);
      }

      const allPlayingPlayerIds = new Set(
        updatedCourts.flatMap((c) => [...(c?.team1 || []), ...(c?.team2 || [])].map((p) => p?.id).filter(Boolean))
      );

      const updatedPlayers = players.map((p) => {
        if (!p || p.isPresent === false) return p;

        if (allPlayingPlayerIds.has(p.id)) {
          return {
            ...p,
            gamesPlayed: (p.gamesPlayed || 0) + 1,
            consecutivePlayed: (p.consecutivePlayed || 0) + 1,
            consecutiveRest: 0,
          };
        } else {
          if (p.isWantRest === true) return p;
          return {
            ...p,
            totalRestCount: (p.totalRestCount || 0) + 1,
            consecutiveRest: (p.consecutiveRest || 0) + 1,
            consecutivePlayed: 0,
          };
        }
      });

      const updatedRestingPlayers = updatedPlayers.filter(
        (p) => p && p.isPresent !== false && (!allPlayingPlayerIds.has(p.id) || p.isWantRest === true)
      );

      const updatedHistory = [...history, newCourtData];
      const predicted = predictNextRound(updatedPlayers, updatedCourts, enabledCourts, updatedHistory);

      setPlayers(updatedPlayers);
      setActiveCourts(updatedCourts);
      setRestingPlayers(updatedRestingPlayers);
      setNextCourts(predicted);
      setHistory(updatedHistory);

      syncSession(updatedPlayers, updatedCourts, predicted, updatedRestingPlayers, updatedHistory, enabledCourts);
    } catch (err) {
      console.error('handleRotateSingleCourt Exception:', err);
    }
  };

  const handleConfirmManualAssign = (courtId, team1, team2) => {
    const match = getBestDoubleMatch([...team1, ...team2], history);

    const newCourtData = {
      id: courtId,
      name: `${courtId}번 코트`,
      status: 'playing',
      team1: team1,
      team2: team2,
      t1Score: match ? match.t1Score : 0,
      t2Score: match ? match.t2Score : 0,
      scoreDiff: match ? match.scoreDiff : 0,
    };

    const updatedCourts = activeCourts.map((c) => (c.id === courtId ? newCourtData : c));
    if (!activeCourts.some((c) => c.id === courtId)) {
      updatedCourts.push(newCourtData);
    }

    const assignedIds = new Set([...team1, ...team2].map((p) => p.id));
    const updatedPlayers = players.map((p) => {
      if (assignedIds.has(p.id)) {
        return {
          ...p,
          gamesPlayed: (p.gamesPlayed || 0) + 1,
          consecutivePlayed: (p.consecutivePlayed || 0) + 1,
          consecutiveRest: 0,
        };
      }
      return p;
    });

    const updatedHistory = [...history, newCourtData];
    const predicted = predictNextRound(updatedPlayers, updatedCourts, enabledCourts, updatedHistory);

    setPlayers(updatedPlayers);
    setActiveCourts(updatedCourts);
    setNextCourts(predicted);
    setHistory(updatedHistory);

    syncSession(updatedPlayers, updatedCourts, predicted, restingPlayers, updatedHistory, enabledCourts);
  };

  const handleSwapActivePlayers = (p1Id, p2Id) => {
    let p1Obj = null;
    let p2Obj = null;

    activeCourts.forEach((c) => {
      [...(c.team1 || []), ...(c.team2 || [])].forEach((p) => {
        if (p.id === p1Id) p1Obj = p;
        if (p.id === p2Id) p2Obj = p;
      });
    });

    if (!p1Obj || !p2Obj) return;

    const updatedCourts = activeCourts.map((c) => {
      const t1 = (c.team1 || []).map((p) => (p.id === p1Id ? p2Obj : p.id === p2Id ? p1Obj : p));
      const t2 = (c.team2 || []).map((p) => (p.id === p1Id ? p2Obj : p.id === p2Id ? p1Obj : p));
      const match = getBestDoubleMatch([...t1, ...t2], history);

      return {
        ...c,
        team1: t1,
        team2: t2,
        t1Score: match ? match.t1Score : c.t1Score,
        t2Score: match ? match.t2Score : c.t2Score,
        scoreDiff: match ? match.scoreDiff : c.scoreDiff,
      };
    });

    const predicted = predictNextRound(players, updatedCourts, enabledCourts, history);

    setActiveCourts(updatedCourts);
    setNextCourts(predicted);
    syncSession(players, updatedCourts, predicted, restingPlayers, history, enabledCourts);
  };

  const handleAddPlayer = (name, tier = 'B', gender = 'M') => {
    if (players.length >= 16) {
      alert('최대 인원은 16명까지입니다.');
      return;
    }

    const existingGames = players.map((p) => p.gamesPlayed || 0);
    const maxGames = Math.max(...existingGames, 0);

    const isLatecomer = maxGames > 0;
    const initialRest = isLatecomer ? maxGames : 0;

    const newPlayer = {
      id: `p_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name,
      gender,
      tier,
      isPresent: true,
      isWantRest: false,
      isLate: isLatecomer,
      gamesPlayed: 0,
      consecutivePlayed: 0,
      consecutiveRest: initialRest,
      totalRestCount: initialRest,
      createdAt: Date.now(),
      wins: 0,
      losses: 0,
      partnerHistory: {},
      opponentHistory: {},
    };

    const updated = [...players, newPlayer];
    setPlayers(updated);
    syncSession(updated);
  };

  const handleUpdatePlayer = (id, updates) => {
    const updated = players.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setPlayers(updated);
    syncSession(updated);
  };

  const handleDeletePlayer = (id) => {
    if (confirm('이 참가자를 명단에서 삭제하시겠습니까?')) {
      const updated = players.filter((p) => p.id !== id);
      setPlayers(updated);
      syncSession(updated);
    }
  };

  const handleDeleteAllPlayers = () => {
    setPlayers([]);
    setActiveCourts([]);
    setNextCourts([]);
    setRestingPlayers([]);
    syncSession([], [], [], [], history, enabledCourts);
  };

  const handleTogglePresent = (id) => {
    const updated = players.map((p) => {
      if (p.id === id) {
        const nextPresent = p.isPresent === false;
        if (nextPresent && (p.gamesPlayed || 0) === 0) {
          const maxGames = Math.max(...players.map((pl) => pl.gamesPlayed || 0), 0);
          return {
            ...p,
            isPresent: true,
            isLate: maxGames > 0,
            totalRestCount: maxGames > 0 ? maxGames : p.totalRestCount || 0,
            createdAt: Date.now(),
          };
        }
        return { ...p, isPresent: nextPresent };
      }
      return p;
    });
    setPlayers(updated);
    syncSession(updated);
  };

  const handleImportPlayers = (detectedList) => {
    const existingNames = new Set(players.map((p) => p.name));
    const newItems = [];
    const maxGames = Math.max(...players.map((p) => p.gamesPlayed || 0), 0);
    let now = Date.now();

    for (const item of detectedList) {
      if (players.length + newItems.length >= 16) {
        alert('최대 16명 정원이 차서 일부분만 등록되었습니다.');
        break;
      }
      if (!existingNames.has(item.name)) {
        now += 1;
        newItems.push({
          id: `p_${now}_${Math.random().toString(36).substr(2, 4)}`,
          name: item.name,
          gender: item.gender || 'M',
          tier: item.tier || 'B',
          isPresent: true,
          isWantRest: false,
          isLate: maxGames > 0,
          gamesPlayed: 0,
          consecutivePlayed: 0,
          consecutiveRest: maxGames,
          totalRestCount: maxGames,
          createdAt: now,
          wins: 0,
          losses: 0,
          partnerHistory: {},
          opponentHistory: {},
        });
      }
    }

    const updated = [...players, ...newItems];
    setPlayers(updated);
    syncSession(updated);
    alert(`${newItems.length}명의 새 참가자가 성공적으로 명단에 등록되었습니다!`);
  };

  const handleResetAllData = () => {
    if (confirm('🚨 모든 경기 대진 진행 상황을 완전히 초기화하시겠습니까?')) {
      const resetPlayers = clearAllSessionData(players);
      setPlayers(resetPlayers);
      setActiveCourts([]);
      setNextCourts([]);
      setRestingPlayers([]);
      setHistory([]);
      syncSession(resetPlayers, [], [], [], [], enabledCourts);
      alert('데이터가 성공적으로 초기화되었습니다.');
    }
  };

  const activePlayersCount = players.filter((p) => p.isPresent !== false).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f4f6] text-[#191f28] selection:bg-[#3182f6] selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onGenerateMatches={() => handleGenerateMatches()}
        onOpenOCR={() => setIsOCRModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onOpenWebInfo={() => setIsWebInfoModalOpen(true)}
        enabledCourts={enabledCourts}
        onToggleCourt={handleToggleCourt}
        onResetAllData={handleResetAllData}
        activePlayersCount={activePlayersCount}
        totalPlayersCount={players.length}
        isSupabaseConfigured={isSupabaseConfigured}
        dbStatus={dbStatusState}
        dbErrorMessage={dbErrorMsgState}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeTab === 'courts' && (
          <CourtBoard
            courts={activeCourts}
            nextCourts={nextCourts}
            restingPlayers={restingPlayers}
            players={players}
            enabledCourts={enabledCourts}
            onToggleCourt={handleToggleCourt}
            onRotateSingleCourt={handleRotateSingleCourt}
            onConfirmManualAssign={handleConfirmManualAssign}
            onSwapActivePlayers={handleSwapActivePlayers}
            onGenerateMatches={() => handleGenerateMatches()}
            onOpenOCR={() => setIsOCRModalOpen(true)}
          />
        )}

        {activeTab === 'players' && (
          <PlayerManager
            players={players}
            onAddPlayer={handleAddPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
            onDeleteAllPlayers={handleDeleteAllPlayers}
            onTogglePresent={handleTogglePresent}
            onOpenOCR={() => setIsOCRModalOpen(true)}
          />
        )}

        {activeTab === 'stats' && (
          <StatsView players={players} history={history} onResetStats={handleResetAllData} />
        )}
      </main>

      {/* Modals */}
      <ImageOCRModal
        isOpen={isOCRModalOpen}
        onClose={() => setIsOCRModalOpen(false)}
        onImportPlayers={handleImportPlayers}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        courts={activeCourts}
        restingPlayers={restingPlayers}
      />

      <WebShareInfoModal
        isOpen={isWebInfoModalOpen}
        onClose={() => setIsWebInfoModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-[#e5e8eb] py-4 px-6 text-center text-xs text-[#8b95a1] bg-[#191f28]">
        <p className="text-gray-300">
          🏸 배드민턴 게임판 매칭 시스템 ·{' '}
          {isSupabaseConfigured
            ? dbStatusState === 'ok'
              ? '⚡ Supabase 1초 실시간 연동 성공'
              : `⚠️ DB 접속 오류: ${dbErrorMsgState || '확인 필요'}`
            : '🔒 로컬 단독 보존'}
        </p>
      </footer>
    </div>
  );
}
