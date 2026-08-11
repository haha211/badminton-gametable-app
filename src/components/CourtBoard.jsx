import React, { useState } from 'react';
import { TIER_COLORS } from '../utils/matchmaker';
import { Trophy, CheckCircle2, Award, Sparkles, UserCheck, Flame, FastForward, Clock, Power, Edit3, RefreshCw, Shuffle } from 'lucide-react';
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
  onOpenOCR
}) {
  const [selectedCourtForManual, setSelectedCourtForManual] = useState(null);

  const safeCourts = Array.isArray(courts) ? courts : [];
  const safeNextCourts = Array.isArray(nextCourts) ? nextCourts : [];
  const safeResting = Array.isArray(restingPlayers) ? restingPlayers : [];

  return (
    <div className="space-y-8">
      {/* SECTION 1: MAIN ACTION BAR FOR ROTATION */}
      <div className="tds-card p-5 border border-[#e5e8eb] bg-gradient-to-r from-blue-600 via-[#3182f6] to-indigo-600 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1 text-center sm:text-left min-w-0">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Shuffle className="w-6 h-6 text-yellow-300 animate-bounce flex-shrink-0" />
            <h2 className="font-black text-lg tracking-tight whitespace-nowrap">
              다음 라운드 자동 대진표 섞기
            </h2>
          </div>
          <p className="text-xs text-blue-100 font-medium truncate">
            1게임이 끝난 후 누르면 <strong>안 뛴 사람(휴식자) 우선 투입 & 뛴 사람 교체</strong>로 공평하게 대진을 섞어줍니다!
          </p>
        </div>

        <button
          onClick={onGenerateMatches}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white text-[#3182f6] hover:bg-blue-50 transition font-black text-sm shadow-lg flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0"
        >
          <RefreshCw className="w-5 h-5 text-[#3182f6] stroke-[2.5]" />
          <span>🔄 다음 라운드 대진 섞기</span>
        </button>
      </div>

      {/* SECTION 2: COURTS STATUS GRID */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-3.5 h-3.5 rounded-full bg-[#3182f6] animate-ping flex-shrink-0" />
          <h2 className="text-xl font-bold text-[#191f28] tracking-tight whitespace-nowrap">
            코트별 대진 현황
          </h2>
          <span className="text-xs font-bold text-[#8b95a1] ml-1 whitespace-nowrap">
            ({enabledCourts.length}개 코트 가동 중 · 남성 +0.5pt 가중치 반영)
          </span>
        </div>

        {/* 3 Courts Visual Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((courtId) => {
            const isEnabled = enabledCourts.includes(courtId);
            const court = safeCourts.find((c) => c && c.id === courtId);

            if (!isEnabled) {
              return (
                <div
                  key={courtId}
                  className="tds-card p-6 flex flex-col items-center justify-center min-h-[360px] text-center space-y-4 opacity-50 bg-[#f9fafb]"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#e5e8eb] text-[#8b95a1] flex items-center justify-center">
                    <Power className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#191f28] whitespace-nowrap">{courtId}번 코트 휴무</h3>
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
                  className="tds-card p-6 flex flex-col items-center justify-center min-h-[360px] text-center space-y-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#e8f3ff] text-[#3182f6] flex items-center justify-center">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#191f28] whitespace-nowrap">{courtId}번 코트 대기 중</h3>
                    <p className="text-xs text-[#8b95a1] mt-1 whitespace-nowrap">대진표 섞기를 누르면 자동으로 배치됩니다.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={onGenerateMatches}
                      className="px-5 py-3 rounded-2xl font-bold text-xs bg-[#3182f6] text-white hover:bg-[#2272eb] transition shadow whitespace-nowrap flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>대진표 섞어서 시작하기</span>
                    </button>
                  </div>
                </div>
              );
            }

            const team1 = Array.isArray(court.team1) ? court.team1 : [];
            const team2 = Array.isArray(court.team2) ? court.team2 : [];

            return (
              <div
                key={court.id}
                className="tds-card overflow-hidden shadow-lg flex flex-col transition-all hover:shadow-xl border border-[#e5e8eb]"
              >
                {/* Court Header */}
                <div className="px-4 py-3 bg-white border-b border-[#e5e8eb] flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-[#3182f6] text-white font-bold text-xs flex items-center justify-center shadow-sm flex-shrink-0">
                      {court.id}
                    </span>
                    <span className="font-bold text-[#191f28] text-sm truncate">{court.name}</span>
                  </div>

                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-[#e8f3ff] text-[#1b64da] whitespace-nowrap flex-shrink-0 ml-2">
                    {court.scoreDiff === 0 ? '황금 밸런스 ⚖️' : `실력차 ${court.scoreDiff || 0}pt`}
                  </span>
                </div>

                {/* BADMINTON COURT VISUAL AREA */}
                <div
                  className="relative p-4 min-h-[340px] flex flex-col justify-between bg-cover bg-center border-y border-[#e5e8eb]"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(10, 30, 22, 0.85), rgba(8, 15, 25, 0.9)), url('/court_bg.jpg')`,
                  }}
                >
                  {/* Net Line */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t-2 border-dashed border-white/40 z-0 flex items-center justify-center">
                    <span className="bg-[#191f28] text-emerald-400 font-extrabold text-[10px] px-3 py-0.5 rounded-full border border-emerald-500/30 shadow tracking-widest whitespace-nowrap">
                      NET COURT {court.id}
                    </span>
                  </div>

                  {/* Team 1 */}
                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="px-3 py-0.5 rounded-lg bg-black/60 text-teal-300 border border-teal-500/40 backdrop-blur whitespace-nowrap">
                        TEAM A (합계 {court.t1Score || 0}pt)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {team1.map((player) => (
                        <TossCourtPlayerChip key={player.id || Math.random()} player={player} />
                      ))}
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className="relative z-10 space-y-2 mt-6">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="px-3 py-0.5 rounded-lg bg-black/60 text-cyan-300 border border-cyan-500/40 backdrop-blur whitespace-nowrap">
                        TEAM B (합계 {court.t2Score || 0}pt)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {team2.map((player) => (
                        <TossCourtPlayerChip key={player.id || Math.random()} player={player} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="p-3 bg-white border-t border-[#e5e8eb] flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedCourtForManual(court)}
                    className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold bg-[#f2f4f6] text-[#191f28] hover:bg-[#e5e8eb] transition flex items-center justify-center gap-1 border border-[#e5e8eb] whitespace-nowrap overflow-hidden"
                    title="선수가 바뀔 때 자유롭게 4명을 지정"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#3182f6] flex-shrink-0" />
                    <span className="truncate">수동 지정/교체</span>
                  </button>

                  <button
                    onClick={() => onRotateSingleCourt && onRotateSingleCourt(court.id)}
                    className="flex-1 py-2 px-2.5 rounded-xl text-xs font-bold bg-[#e8f3ff] text-[#1b64da] hover:bg-blue-100 transition flex items-center justify-center gap-1 whitespace-nowrap overflow-hidden"
                    title="이 코트만 경기가 끝났을 때 안 뛴 다음 대기 인원으로 교체"
                  >
                    <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">단일코트 다음 팀 교체</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: NEXT ROUND PREVIEW QUEUE */}
      {safeNextCourts.length > 0 && (
        <div className="tds-card p-4 sm:p-6 border border-[#e5e8eb] space-y-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#e5e8eb]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-2xl bg-[#e8f3ff] text-[#1b64da] flex items-center justify-center flex-shrink-0">
                <FastForward className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-[#191f28] text-base truncate">
                  🔮 다음 2라운드 미리 지정 대진표 (예상)
                </h3>
                <p className="text-xs text-[#8b95a1] truncate">
                  현재 경기 종료 후 다음 타석에 들어갈 순번 선수들입니다.
                </p>
              </div>
            </div>
            <span className="text-xs px-3 py-1 rounded-full font-bold bg-[#e8f3ff] text-[#1b64da] whitespace-nowrap self-start sm:self-auto flex-shrink-0">
              다음 대기열
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeNextCourts.map((nc) => {
              if (!nc) return null;
              const t1 = Array.isArray(nc.team1) ? nc.team1 : [];
              const t2 = Array.isArray(nc.team2) ? nc.team2 : [];

              return (
                <div
                  key={nc.id || Math.random()}
                  className="bg-[#f9fafb] border border-[#e5e8eb] p-3.5 rounded-2xl space-y-2.5 min-w-0"
                >
                  <div className="flex items-center justify-between border-b border-[#e5e8eb] pb-2">
                    <span className="font-bold text-xs text-[#191f28] flex items-center gap-1.5 whitespace-nowrap truncate">
                      <Clock className="w-3.5 h-3.5 text-[#3182f6] flex-shrink-0" /> {nc.name || '코트'} 다음 순번
                    </span>
                    <span className="text-[10px] text-[#8b95a1] font-semibold whitespace-nowrap flex-shrink-0 ml-1">밸런스 {nc.scoreDiff || 0}pt</span>
                  </div>

                  <div className="text-xs space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#e5e8eb] min-w-0">
                      <span className="font-bold text-[#3182f6] whitespace-nowrap flex-shrink-0 mr-1.5">Team A</span>
                      <span className="text-[#191f28] font-semibold truncate text-right">
                        {t1.map((p) => `${p.name || '선수'}(${p.gender === 'F' ? '여' : '남'}${p.tier || 'B'})`).join(' + ')}
                      </span>
                    </div>
                    <div className="text-center text-[10px] font-bold text-[#8b95a1] whitespace-nowrap">VS</div>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#e5e8eb] min-w-0">
                      <span className="font-bold text-[#3182f6] whitespace-nowrap flex-shrink-0 mr-1.5">Team B</span>
                      <span className="text-[#191f28] font-semibold truncate text-right">
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

      {/* SECTION 4: RESTING PLAYERS */}
      {safeResting.length > 0 && (
        <div className="tds-card p-4 sm:p-5 border border-[#e5e8eb] overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <UserCheck className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <h3 className="font-bold text-[#191f28] text-sm whitespace-nowrap truncate">
                현재 휴식 중인 인원 ({safeResting.length}명)
              </h3>
            </div>
            <span className="text-xs text-[#8b95a1] whitespace-nowrap flex-shrink-0 ml-2">다음 라운드 대진 섞기 시 우선 출전</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {safeResting.map((p) => {
              if (!p) return null;
              return (
                <div key={p.id || Math.random()} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#f2f4f6] border border-[#e5e8eb] text-xs whitespace-nowrap">
                  <span className={`w-4 h-4 rounded font-bold text-[9px] flex items-center justify-center text-white flex-shrink-0 ${p.gender === 'F' ? 'bg-rose-500' : 'bg-[#3182f6]'}`}>
                    {p.gender === 'F' ? '여' : '남'}
                  </span>
                  <span className="font-bold text-[#191f28]">{p.name || '무명'} ({p.tier || 'B'})</span>
                  <span className="text-[10px] font-bold text-[#3182f6]">🎮{p.gamesPlayed || 0}</span>
                  <span className="text-[10px] font-bold text-amber-600">💤{p.consecutiveRest || 0}</span>
                </div>
              );
            })}
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
function TossCourtPlayerChip({ player }) {
  if (!player) return null;
  const name = player.name || '무명';
  const tier = player.tier || 'B';
  const gender = player.gender || 'M';
  const gamesPlayed = player.gamesPlayed || 0;
  const consecutiveRest = player.consecutiveRest || 0;

  const badgeBg = tier === 'A' ? 'bg-[#e8f3ff] text-[#1b64da]' : tier === 'B' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700';

  return (
    <div className="bg-white/95 backdrop-blur border border-white/40 rounded-xl p-2 flex items-center gap-1.5 shadow-md min-w-0 overflow-hidden">
      <div className="relative flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-[#f2f4f6] border border-[#e5e8eb] overflow-hidden flex items-center justify-center font-bold text-xs text-[#191f28]">
          {player.avatar ? (
            <img src={player.avatar} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span>{name.slice(0, 2)}</span>
          )}
        </div>
        <div className={`absolute -bottom-1 -right-1 px-1 rounded font-bold text-[8px] ${badgeBg}`}>
          {tier}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="font-bold text-xs text-[#191f28] truncate flex items-center gap-0.5">
          <span className="truncate">{name}</span>
          <span className={`text-[10px] font-bold ${gender === 'F' ? 'text-rose-500' : 'text-blue-600'}`}>
            {gender === 'F' ? '♀' : '♂'}
          </span>
          {player.consecutivePlayed > 1 && (
            <Flame className="w-3 h-3 text-red-500 animate-pulse flex-shrink-0" title="연속 출전 중" />
          )}
        </div>
        <div className="text-[9px] text-[#4e5968] font-bold mt-0.5 flex items-center gap-1 whitespace-nowrap overflow-hidden">
          <span className="text-[#3182f6] whitespace-nowrap">🎮{gamesPlayed}</span>
          <span className="text-[#8b95a1]">·</span>
          <span className="text-amber-600 whitespace-nowrap">💤{consecutiveRest}</span>
        </div>
      </div>
    </div>
  );
}
