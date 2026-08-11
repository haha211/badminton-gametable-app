import React, { useState } from 'react';
import { TIER_COLORS } from '../utils/matchmaker';
import { Trophy, CheckCircle2, Award, Sparkles, UserCheck, Flame, FastForward, Clock, Power, Edit3, RefreshCw, Shuffle, ArrowLeftRight, X } from 'lucide-react';
import ManualCourtAssignModal from './ManualCourtAssignModal';

export default function CourtBoard({
  courts = [],
  nextCourts = [],
  restingPlayers = [],
  players = [],
  enabledCourts = [1, 2, 3],
  onToggleCourt,
  onGenerateMatches,
  onRotateSingleCourt,
  onConfirmManualAssign,
  onSwapActivePlayers,
  onOpenOCR
}) {
  const [selectedCourtForManual, setSelectedCourtForManual] = useState(null);
  const [swapSourcePlayer, setSwapSourcePlayer] = useState(null);

  const safeCourts = Array.isArray(courts) ? courts : [];
  const safeNextCourts = Array.isArray(nextCourts) ? nextCourts : [];
  const safeResting = Array.isArray(restingPlayers) ? restingPlayers : [];

  const allActivePlayingPlayers = safeCourts.flatMap((c) => {
    const t1 = Array.isArray(c.team1) ? c.team1 : [];
    const t2 = Array.isArray(c.team2) ? c.team2 : [];
    return [...t1, ...t2].map((p) => ({ ...p, courtId: c.id, courtName: c.name || `${c.id}번 코트` }));
  });

  const handleSelectSwapTarget = (targetPlayer) => {
    if (!swapSourcePlayer || !targetPlayer) return;
    if (swapSourcePlayer.id === targetPlayer.id) {
      alert('같은 선수는 교체할 수 없습니다.');
      return;
    }

    if (onSwapActivePlayers) {
      onSwapActivePlayers(swapSourcePlayer.id, targetPlayer.id);
    }
    setSwapSourcePlayer(null);
  };

  return (
    <div className="space-y-6 md:space-y-8">
      {/* SECTION 1: MAIN ACTION BAR FOR ROTATION */}
      <div className="tds-card p-4 sm:p-5 border border-[#e5e8eb] bg-gradient-to-r from-blue-600 via-[#3182f6] to-indigo-600 text-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg rounded-2xl">
        <div className="space-y-1 text-left min-w-0">
          <div className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-yellow-300 animate-bounce flex-shrink-0" />
            <h2 className="font-extrabold text-base sm:text-lg tracking-tight whitespace-nowrap">
              다음 라운드 자동 대진표 섞기
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-blue-100 font-medium leading-tight">
            1게임이 끝난 후 누르면 <strong>안 뛴 사람(휴식자) 우선 투입 & 뛴 사람 교체</strong>로 대진을 섞어줍니다!
          </p>
        </div>

        <button
          onClick={onGenerateMatches}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white text-[#3182f6] hover:bg-blue-50 transition font-black text-xs sm:text-sm shadow flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
        >
          <RefreshCw className="w-4 h-4 text-[#3182f6] stroke-[2.5]" />
          <span>🔄 다음 라운드 대진 섞기</span>
        </button>
      </div>

      {/* SECTION 2: COURTS STATUS GRID */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-3 h-3 rounded-full bg-[#3182f6] animate-ping flex-shrink-0" />
            <h2 className="text-lg sm:text-xl font-bold text-[#191f28] tracking-tight whitespace-nowrap">
              코트별 대진 현황
            </h2>
            <span className="text-[11px] sm:text-xs font-bold text-[#8b95a1] ml-1 whitespace-nowrap truncate">
              ({enabledCourts.length}개 코트 가동)
            </span>
          </div>
        </div>

        {/* 3 Courts Visual Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {[1, 2, 3].map((courtId) => {
            const isEnabled = enabledCourts.includes(courtId);
            const court = safeCourts.find((c) => c && c.id === courtId);

            if (!isEnabled) {
              return (
                <div
                  key={courtId}
                  className="tds-card p-6 flex flex-col items-center justify-center min-h-[320px] text-center space-y-4 opacity-50 bg-[#f9fafb]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#e5e8eb] text-[#8b95a1] flex items-center justify-center">
                    <Power className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#191f28] whitespace-nowrap">{courtId}번 코트 휴무</h3>
                    <p className="text-xs text-[#8b95a1] mt-1 whitespace-nowrap">현재 사용하지 않는 코트입니다.</p>
                  </div>
                  <button
                    onClick={() => onToggleCourt && onToggleCourt(courtId)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#e8f3ff] text-[#1b64da] hover:bg-blue-100 transition whitespace-nowrap"
                  >
                    {courtId}번 코트 켜기
                  </button>
                </div>
              );
            }

            if (!court) {
              return (
                <div
                  key={courtId}
                  className="tds-card p-6 flex flex-col items-center justify-center min-h-[320px] text-center space-y-4"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#e8f3ff] text-[#3182f6] flex items-center justify-center">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#191f28] whitespace-nowrap">{courtId}번 코트 대기 중</h3>
                    <p className="text-xs text-[#8b95a1] mt-1 whitespace-nowrap">대진표 섞기를 누르면 자동으로 배치됩니다.</p>
                  </div>
                  <button
                    onClick={onGenerateMatches}
                    className="px-4 py-2.5 rounded-xl font-bold text-xs bg-[#3182f6] text-white hover:bg-[#2272eb] transition shadow whitespace-nowrap flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>대진표 섞어서 시작하기</span>
                  </button>
                </div>
              );
            }

            const team1 = Array.isArray(court.team1) ? court.team1 : [];
            const team2 = Array.isArray(court.team2) ? court.team2 : [];

            return (
              <div
                key={court.id}
                className="tds-card overflow-hidden shadow-md flex flex-col transition-all hover:shadow-lg border border-[#e5e8eb]"
              >
                {/* Court Header */}
                <div className="px-3.5 py-2.5 bg-white border-b border-[#e5e8eb] flex items-center justify-between min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-[#3182f6] text-white font-bold text-xs flex items-center justify-center shadow-sm flex-shrink-0">
                      {court.id}
                    </span>
                    <span className="font-bold text-[#191f28] text-xs sm:text-sm truncate">{court.name}</span>
                  </div>

                  <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-[#e8f3ff] text-[#1b64da] whitespace-nowrap flex-shrink-0 ml-1">
                    {court.scoreDiff === 0 ? '황금 밸런스 ⚖️' : `차이 ${court.scoreDiff || 0}pt`}
                  </span>
                </div>

                {/* BADMINTON COURT VISUAL AREA */}
                <div
                  className="relative p-3.5 min-h-[320px] flex flex-col justify-between bg-cover bg-center border-y border-[#e5e8eb]"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(10, 30, 22, 0.85), rgba(8, 15, 25, 0.9)), url('/court_bg.jpg')`,
                  }}
                >
                  {/* Net Line */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/40 z-0 flex items-center justify-center">
                    <span className="bg-[#191f28] text-emerald-400 font-extrabold text-[9px] px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow tracking-widest whitespace-nowrap">
                      NET COURT {court.id}
                    </span>
                  </div>

                  {/* Team 1 */}
                  <div className="relative z-10 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="px-2.5 py-0.5 rounded-lg bg-black/60 text-teal-300 border border-teal-500/40 backdrop-blur whitespace-nowrap">
                        TEAM A (합계 {court.t1Score || 0}pt)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {team1.map((player) => (
                        <TossCourtPlayerChip
                          key={player.id || Math.random()}
                          player={player}
                          onTriggerSwap={() => setSwapSourcePlayer({ ...player, courtName: court.name })}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className="relative z-10 space-y-1.5 mt-4">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="px-2.5 py-0.5 rounded-lg bg-black/60 text-cyan-300 border border-cyan-500/40 backdrop-blur whitespace-nowrap">
                        TEAM B (합계 {court.t2Score || 0}pt)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {team2.map((player) => (
                        <TossCourtPlayerChip
                          key={player.id || Math.random()}
                          player={player}
                          onTriggerSwap={() => setSwapSourcePlayer({ ...player, courtName: court.name })}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="p-2.5 bg-white border-t border-[#e5e8eb] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedCourtForManual(court)}
                    className="flex-1 py-2 px-2 rounded-xl text-xs font-bold bg-[#f2f4f6] text-[#191f28] hover:bg-[#e5e8eb] transition flex items-center justify-center gap-1 border border-[#e5e8eb] whitespace-nowrap overflow-hidden"
                    title="선수가 바뀔 때 자유롭게 4명을 지정"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#3182f6] flex-shrink-0" />
                    <span className="truncate">수동 지정/교체</span>
                  </button>

                  <button
                    onClick={() => onRotateSingleCourt && onRotateSingleCourt(court.id)}
                    className="flex-1 py-2 px-2 rounded-xl text-xs font-bold bg-[#e8f3ff] text-[#1b64da] hover:bg-blue-100 transition flex items-center justify-center gap-1 whitespace-nowrap overflow-hidden"
                    title="이 코트만 경기가 끝났을 때 안 뛴 다음 대기 인원으로 교체"
                  >
                    <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">단일코트 교체</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: NEXT ROUND PREVIEW QUEUE */}
      {safeNextCourts.length > 0 && (
        <div className="tds-card p-3.5 sm:p-5 border border-[#e5e8eb] space-y-3 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#e5e8eb]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#e8f3ff] text-[#1b64da] flex items-center justify-center flex-shrink-0">
                <FastForward className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-[#191f28] text-sm sm:text-base truncate">
                  🔮 다음 2라운드 미리 지정 대진표 (예상)
                </h3>
                <p className="text-[11px] text-[#8b95a1] truncate">
                  현재 경기 종료 후 다음 타석에 들어갈 순번 선수들입니다.
                </p>
              </div>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-[#e8f3ff] text-[#1b64da] whitespace-nowrap self-start sm:self-auto flex-shrink-0">
              다음 대기열
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {safeNextCourts.map((nc) => {
              if (!nc) return null;
              const t1 = Array.isArray(nc.team1) ? nc.team1 : [];
              const t2 = Array.isArray(nc.team2) ? nc.team2 : [];

              return (
                <div
                  key={nc.id || Math.random()}
                  className="bg-[#f9fafb] border border-[#e5e8eb] p-3 rounded-xl space-y-2 min-w-0"
                >
                  <div className="flex items-center justify-between border-b border-[#e5e8eb] pb-1.5">
                    <span className="font-bold text-xs text-[#191f28] flex items-center gap-1 whitespace-nowrap truncate">
                      <Clock className="w-3.5 h-3.5 text-[#3182f6] flex-shrink-0" /> {nc.name || '코트'} 다음 순번
                    </span>
                    <span className="text-[10px] text-[#8b95a1] font-semibold whitespace-nowrap flex-shrink-0 ml-1">차이 {nc.scoreDiff || 0}pt</span>
                  </div>

                  <div className="text-xs space-y-1.5">
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-[#e5e8eb] min-w-0">
                      <span className="font-bold text-[#3182f6] whitespace-nowrap flex-shrink-0 mr-1 text-[11px]">Team A</span>
                      <span className="text-[#191f28] font-semibold truncate text-right text-[11px]">
                        {t1.map((p) => `${p.name || '선수'}(${p.gender === 'F' ? '여' : '남'}${p.tier || 'B'})`).join(' + ')}
                      </span>
                    </div>
                    <div className="text-center text-[10px] font-bold text-[#8b95a1] whitespace-nowrap">VS</div>
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-white border border-[#e5e8eb] min-w-0">
                      <span className="font-bold text-[#3182f6] whitespace-nowrap flex-shrink-0 mr-1 text-[11px]">Team B</span>
                      <span className="text-[#191f28] font-semibold truncate text-right text-[11px]">
                        {t2.map((p) => `${p.name || '선수'}(${p.gender === 'F' ? '여' : '남'}${p.tier || 'B'})`).join(' + ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 4: RESTING PLAYERS (누적 총 휴식 횟수 표기) */}
      {safeResting.length > 0 && (
        <div className="tds-card p-3.5 sm:p-5 border border-[#e5e8eb] overflow-hidden">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <UserCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <h3 className="font-bold text-[#191f28] text-xs sm:text-sm whitespace-nowrap truncate">
                현재 휴식 중인 인원 ({safeResting.length}명)
              </h3>
            </div>
            <span className="text-[11px] text-[#8b95a1] whitespace-nowrap flex-shrink-0 ml-1">다음 라운드 대진 섞기 시 우선 출전</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {safeResting.map((p) => {
              if (!p) return null;
              const totalRest = p.totalRestCount || p.consecutiveRest || 0;

              return (
                <div key={p.id || Math.random()} className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#f2f4f6] border border-[#e5e8eb] text-xs whitespace-nowrap">
                  <span className={`w-3.5 h-3.5 rounded font-bold text-[8px] flex items-center justify-center text-white flex-shrink-0 ${p.gender === 'F' ? 'bg-rose-500' : 'bg-[#3182f6]'}`}>
                    {p.gender === 'F' ? '여' : '남'}
                  </span>
                  <span className="font-bold text-[#191f28]">{p.name || '무명'} ({p.tier || 'B'})</span>
                  <span className="text-[10px] font-bold text-[#3182f6]">🎮{p.gamesPlayed || 0}게임</span>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md">
                    💤 총 {totalRest}회 쉼
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* PLAYER SWAP MODAL */}
      {swapSourcePlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="tds-card w-full max-w-md border border-[#e5e8eb] shadow-2xl overflow-hidden flex flex-col bg-white">
            <div className="px-5 py-4 border-b border-[#e5e8eb] flex items-center justify-between bg-[#f8fafc]">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-[#3182f6]" />
                <h3 className="font-bold text-base text-[#191f28]">코트 선수 위치 맞교체</h3>
              </div>
              <button
                onClick={() => setSwapSourcePlayer(null)}
                className="p-1 rounded-lg text-[#8b95a1] hover:text-[#191f28]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-[#e8f3ff] rounded-xl border border-blue-200 text-xs text-[#1b64da] font-bold">
                선택된 선수: <strong>{swapSourcePlayer.name} ({swapSourcePlayer.courtName})</strong>
                <p className="text-[11px] font-normal text-[#4e5968] mt-0.5">교체할 상대 선수를 아래에서 누르면 두 사람의 코트 위치가 서로 바뀝니다.</p>
              </div>

              <div className="space-y-2 max-h-[260px] overflow-y-auto">
                <div className="text-xs font-bold text-[#4e5968]">현재 경기 중인 다른 선수 선택:</div>
                {allActivePlayingPlayers
                  .filter((p) => p.id !== swapSourcePlayer.id)
                  .map((target) => (
                    <button
                      key={target.id}
                      onClick={() => handleSelectSwapTarget(target)}
                      className="w-full p-3 rounded-xl border border-[#e5e8eb] hover:border-[#3182f6] hover:bg-blue-50 text-left transition flex items-center justify-between text-xs"
                    >
                      <div className="font-bold text-[#191f28]">
                        {target.name} ({target.gender === 'F' ? '여' : '남'}, {target.tier}급)
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-[#f2f4f6] text-[#3182f6] font-extrabold text-[11px]">
                        {target.courtName} ↔️ 맞교체
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            <div className="p-4 bg-[#f9fafb] border-t border-[#e5e8eb] text-right">
              <button
                onClick={() => setSwapSourcePlayer(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#f2f4f6] text-[#4e5968] hover:bg-gray-200"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL ASSIGN MODAL */}
      <ManualCourtAssignModal
        isOpen={Boolean(selectedCourtForManual)}
        onClose={() => setSelectedCourtForManual(null)}
        court={selectedCourtForManual}
        players={players}
        activeCourts={safeCourts}
        onConfirmManualAssign={onConfirmManualAssign}
      />
    </div>
  );
}

// TOSS COURT PLAYER CHIP
function TossCourtPlayerChip({ player, onTriggerSwap }) {
  if (!player) return null;
  const name = player.name || '무명';
  const tier = player.tier || 'B';
  const gender = player.gender || 'M';
  const gamesPlayed = player.gamesPlayed || 0;
  const totalRest = player.totalRestCount || player.consecutiveRest || 0;

  const badgeBg = tier === 'A' ? 'bg-[#e8f3ff] text-[#1b64da]' : tier === 'B' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700';

  return (
    <div className="bg-white/95 backdrop-blur border border-white/40 rounded-xl p-1.5 flex items-center gap-1.5 shadow min-w-0 overflow-hidden relative group">
      <div className="relative flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[#f2f4f6] border border-[#e5e8eb] overflow-hidden flex items-center justify-center font-bold text-[11px] text-[#191f28]">
          {player.avatar ? (
            <img src={player.avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span>{name.slice(0, 2)}</span>
          )}
        </div>
        <div className={`absolute -bottom-1 -right-1 px-1 rounded font-bold text-[7px] ${badgeBg}`}>
          {tier}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-bold text-xs text-[#191f28] truncate flex items-center gap-0.5 justify-between">
          <div className="flex items-center gap-0.5 min-w-0 truncate">
            <span className="truncate">{name}</span>
            <span className={`text-[9px] font-bold ${gender === 'F' ? 'text-rose-500' : 'text-blue-600'}`}>
              {gender === 'F' ? '♀' : '♂'}
            </span>
          </div>

          <button
            onClick={onTriggerSwap}
            className="p-1 rounded bg-[#e8f3ff] text-[#1b64da] hover:bg-blue-200 transition flex-shrink-0 ml-1"
            title="다른 코트 경기 출전 선수와 코트 위치 맞교체"
          >
            <ArrowLeftRight className="w-3 h-3" />
          </button>
        </div>
        <div className="text-[9px] text-[#4e5968] font-bold mt-0.5 flex items-center gap-1 whitespace-nowrap overflow-hidden">
          <span className="text-[#3182f6] whitespace-nowrap">🎮{gamesPlayed}</span>
          <span className="text-[#8b95a1]">·</span>
          <span className="text-amber-600 whitespace-nowrap">💤{totalRest}</span>
        </div>
      </div>
    </div>
  );
}
