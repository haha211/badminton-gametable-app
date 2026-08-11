import React from 'react';
import { BarChart3, Trophy, UserCheck, Shield, AlertCircle, Sparkles, Scale, RefreshCw } from 'lucide-react';

export default function StatsView({ players = [], history = [], onResetStats }) {
  const safePlayers = Array.isArray(players) ? players.filter((p) => p && p.isPresent !== false) : [];

  if (safePlayers.length === 0) {
    return (
      <div className="tds-card p-12 text-center border border-[#e5e8eb] space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-[#f2f4f6] text-[#8b95a1] flex items-center justify-center mx-auto">
          <BarChart3 className="w-7 h-7" />
        </div>
        <h4 className="font-bold text-[#191f28] text-base">출전 통계 데이터가 없습니다</h4>
        <p className="text-xs text-[#8b95a1]">참가자를 등록하고 코트 대진을 시작하면 출전 공평도와 횟수가 기록됩니다.</p>
      </div>
    );
  }

  // 통계 정밀 계산
  const gamesList = safePlayers.map((p) => p.gamesPlayed || 0);
  const maxGames = Math.max(...gamesList, 0);
  const minGames = Math.min(...gamesList, 0);
  const totalGamesSum = gamesList.reduce((a, b) => a + b, 0);
  const avgGamesNum = totalGamesSum / (safePlayers.length || 1);
  const avgGames = avgGamesNum.toFixed(1);

  const diff = maxGames - minGames;

  // 공평도 계산식 (격차 및 표준 편차 완화)
  let equitabilityPercent = 100;
  if (totalGamesSum > 0) {
    if (diff === 0) {
      equitabilityPercent = 100;
    } else if (diff === 1) {
      equitabilityPercent = 98;
    } else if (diff === 2) {
      equitabilityPercent = 92;
    } else {
      const penalty = Math.min(60, diff * 8);
      equitabilityPercent = Math.max(40, 100 - penalty);
    }
  }

  const topPlayer = safePlayers.find((p) => (p.gamesPlayed || 0) === maxGames);
  const mostRestPlayer = [...safePlayers].sort((a, b) => {
    const rA = (a.totalRestCount || 0) + (a.consecutiveRest || 0);
    const rB = (b.totalRestCount || 0) + (b.consecutiveRest || 0);
    return rB - rA;
  })[0];

  return (
    <div className="space-y-8">
      {/* SECTION 1: EQUITABILITY BANNER */}
      <div className="tds-card p-6 border border-[#e5e8eb] bg-gradient-to-br from-white to-[#f9fafb] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e8f3ff] text-[#3182f6] flex items-center justify-center flex-shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-[#191f28] whitespace-nowrap">참가자 출전 공평도 지수</h2>
              <p className="text-xs text-[#8b95a1]">참석자들이 얼마나 공평하게 경기에 참여하고 있는지 분석합니다.</p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-2xl font-black text-[#3182f6]">{equitabilityPercent}%</span>
            <div className="text-[11px] font-bold text-[#4e5968] whitespace-nowrap">
              {diff <= 1 ? '✨ 완벽하게 공평함' : diff <= 2 ? '👍 매우 잘 조율됨' : '⚖️ 순차적 출전 조율 중'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3 bg-[#e5e8eb] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#3182f6] to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${equitabilityPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[#8b95a1] font-semibold whitespace-nowrap">
            <span>최소 {minGames}경기</span>
            <span>평균 {avgGames}경기</span>
            <span>최다 {maxGames}경기</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: HIGHLIGHT CHAMPIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {topPlayer && (
          <div className="tds-card p-4 border border-[#e5e8eb] bg-blue-50/50 flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-[#3182f6] text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20 flex-shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-[#1b64da] uppercase whitespace-nowrap">🔥 최다 출전 챔피언</div>
              <div className="font-bold text-base text-[#191f28] truncate">{topPlayer.name} ({topPlayer.gender === 'F' ? '여' : '남'}, {topPlayer.tier}급)</div>
              <div className="text-xs text-[#4e5968] font-semibold mt-0.5 whitespace-nowrap">총 <strong className="text-[#3182f6]">{topPlayer.gamesPlayed || 0}경기</strong> 출전 완료</div>
            </div>
          </div>
        )}

        {mostRestPlayer && (
          <div className="tds-card p-4 border border-[#e5e8eb] bg-amber-50/50 flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/20 flex-shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold text-amber-800 uppercase whitespace-nowrap">💤 최장 휴식 대기자</div>
              <div className="font-bold text-base text-[#191f28] truncate">{mostRestPlayer.name} ({mostRestPlayer.gender === 'F' ? '여' : '남'}, {mostRestPlayer.tier}급)</div>
              <div className="text-xs text-[#4e5968] font-semibold mt-0.5 whitespace-nowrap">총 <strong className="text-amber-600">{mostRestPlayer.totalRestCount || mostRestPlayer.consecutiveRest || 0}회</strong> 휴식 중</div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: PLAYER STATS LIST */}
      <div className="tds-card border border-[#e5e8eb] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#e5e8eb] flex items-center justify-between bg-white flex-wrap gap-2">
          <h3 className="font-bold text-base text-[#191f28] whitespace-nowrap">선수별 상세 경기 출전 이력</h3>
          <span className="text-xs text-[#8b95a1] font-semibold whitespace-nowrap">총 {safePlayers.length}명 참여 중</span>
        </div>

        {/* Mobile / Tablet Responsive Card List View */}
        <div className="block md:hidden divide-y divide-[#e5e8eb] bg-white">
          {safePlayers.map((player) => {
            const games = player.gamesPlayed || 0;
            const rest = player.totalRestCount || player.consecutiveRest || 0;
            const isMax = games === maxGames && games > 0;
            const isMin = games === minGames;

            return (
              <div key={player.id || Math.random()} className="p-4 flex items-center justify-between gap-3 hover:bg-[#f9fafb]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#f2f4f6] border border-[#e5e8eb] flex items-center justify-center font-bold text-xs text-[#191f28] flex-shrink-0">
                    {player.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-[#191f28] flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{player.name}</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] whitespace-nowrap ${
                        player.tier === 'A' ? 'bg-[#e8f3ff] text-[#1b64da]' : player.tier === 'B' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {player.gender === 'F' ? '여' : '남'}·{player.tier}급
                      </span>
                    </div>
                    <div className="text-xs text-[#8b95a1] font-medium mt-0.5 whitespace-nowrap">
                      {games > avgGamesNum ? '평균 이상 출전' : games < avgGamesNum ? '우선 출전 대상' : '평균 출전 달성'}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 space-y-1">
                  <div className="text-xs font-extrabold text-[#3182f6] bg-[#e8f3ff] px-2.5 py-1 rounded-xl whitespace-nowrap">
                    🎮 {games}경기 뜀
                  </div>
                  <div className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl whitespace-nowrap">
                    💤 총 {rest}회 쉼
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Large Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#f9fafb] border-b border-[#e5e8eb] text-[#4e5968] font-bold">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">선수명</th>
                <th className="px-6 py-4 whitespace-nowrap">성별 / 실력</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">총 경기 수 (🎮)</th>
                <th className="px-6 py-4 text-center whitespace-nowrap">총 휴식 횟수 (💤)</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">출전 밸런스 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e8eb] bg-white">
              {safePlayers.map((player) => {
                const games = player.gamesPlayed || 0;
                const rest = player.totalRestCount || player.consecutiveRest || 0;
                const isMax = games === maxGames && games > 0;
                const isMin = games === minGames;

                return (
                  <tr key={player.id || Math.random()} className="hover:bg-[#f9fafb] transition">
                    <td className="px-6 py-4 font-bold text-[#191f28] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{player.name}</span>
                        {isMax && <span className="px-2 py-0.5 rounded text-[10px] bg-[#e8f3ff] text-[#1b64da] font-bold whitespace-nowrap">최다</span>}
                        {isMin && <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold whitespace-nowrap">우선출전</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap ${
                        player.tier === 'A' ? 'bg-[#e8f3ff] text-[#1b64da]' : player.tier === 'B' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {player.gender === 'F' ? '여 ♀️' : '남 ♂️'} · {player.tier} 등급
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-extrabold text-[#3182f6] text-sm whitespace-nowrap">
                      {games}회
                    </td>
                    <td className="px-6 py-4 text-center font-extrabold text-amber-600 text-sm whitespace-nowrap">
                      {rest}회
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <span className={`font-bold whitespace-nowrap ${isMax ? 'text-[#3182f6]' : isMin ? 'text-amber-600' : 'text-[#4e5968]'}`}>
                        {games > avgGamesNum ? '평균 이상 출전' : games < avgGamesNum ? '우선 출전 대상' : '평균 출전 달성'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
