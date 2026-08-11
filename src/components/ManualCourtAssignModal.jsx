import React, { useState, useEffect } from 'react';
import { X, Check, Users, ShieldAlert } from 'lucide-react';

export default function ManualCourtAssignModal({
  isOpen,
  onClose,
  court,
  players = [],
  activeCourts = [],
  onConfirmManualAssign
}) {
  const [team1, setTeam1] = useState([]);
  const [team2, setTeam2] = useState([]);

  useEffect(() => {
    if (court) {
      setTeam1(court.team1 ? court.team1.map((p) => p.id) : []);
      setTeam2(court.team2 ? court.team2.map((p) => p.id) : []);
    }
  }, [court]);

  if (!isOpen || !court) return null;

  const safePlayers = Array.isArray(players) ? players.filter((p) => p && p.isPresent !== false) : [];

  const otherCourtsPlayingMap = {};
  if (Array.isArray(activeCourts)) {
    activeCourts.forEach((c) => {
      if (c && c.id !== court.id) {
        const team1List = Array.isArray(c.team1) ? c.team1 : [];
        const team2List = Array.isArray(c.team2) ? c.team2 : [];

        [...team1List, ...team2List].forEach((p) => {
          if (p && p.id) {
            otherCourtsPlayingMap[p.id] = c.name || `${c.id}번 코트`;
          }
        });
      }
    });
  }

  const handleSelectPlayer = (playerId) => {
    if (otherCourtsPlayingMap[playerId]) {
      alert(`⚠️ ${otherCourtsPlayingMap[playerId]}에서 현재 경기를 뛰고 있는 선수입니다.`);
      return;
    }

    if (team1.includes(playerId)) {
      setTeam1(team1.filter((id) => id !== playerId));
      return;
    }
    if (team2.includes(playerId)) {
      setTeam2(team2.filter((id) => id !== playerId));
      return;
    }

    if (team1.length < 2) {
      setTeam1([...team1, playerId]);
    } else if (team2.length < 2) {
      setTeam2([...team2, playerId]);
    } else {
      alert('코트 하나에는 4명(Team A 2명, Team B 2명)까지만 선택 가능합니다.');
    }
  };

  const handleSave = () => {
    if (team1.length !== 2 || team2.length !== 2) {
      alert('Team A에 2명, Team B에 2명 총 4명의 선수를 선택해 주세요.');
      return;
    }

    const pTeam1 = team1.map((id) => safePlayers.find((p) => p.id === id)).filter(Boolean);
    const pTeam2 = team2.map((id) => safePlayers.find((p) => p.id === id)).filter(Boolean);

    if (onConfirmManualAssign) {
      onConfirmManualAssign(court.id, pTeam1, pTeam2);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="tds-card w-full max-w-xl border border-[#e5e8eb] shadow-2xl overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e8eb] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#e8f3ff] text-[#1b64da] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#191f28]">{court.name} 수동 인원 지정/교체</h2>
              <p className="text-xs text-[#8b95a1]">선수별 총 경기 수(🎮)와 휴식 수(💤)를 확인하고 지정하세요.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b95a1] hover:text-[#191f28] hover:bg-[#f2f4f6] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Slots */}
        <div className="p-6 space-y-5 bg-[#f9fafb] border-b border-[#e5e8eb]">
          <div className="grid grid-cols-2 gap-4">
            {/* Team A Slots */}
            <div className="p-4 rounded-2xl bg-white border border-[#e5e8eb] space-y-2">
              <div className="font-bold text-xs text-[#3182f6]">Team A ({team1.length}/2명)</div>
              <div className="space-y-1.5 min-h-[70px]">
                {team1.map((id) => {
                  const p = safePlayers.find((item) => item.id === id);
                  return (
                    <div key={id} className="flex items-center justify-between p-2 rounded-xl bg-[#e8f3ff] text-[#1b64da] text-xs font-bold">
                      <span>{p ? `${p.name} (${p.tier}급) · 🎮${p.gamesPlayed || 0}회` : '선수'}</span>
                      <button onClick={() => handleSelectPlayer(id)} className="text-red-500 hover:text-red-700">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                {team1.length < 2 && (
                  <div className="p-2 rounded-xl border border-dashed border-[#e5e8eb] text-center text-xs text-[#8b95a1]">
                    아래 명단에서 클릭
                  </div>
                )}
              </div>
            </div>

            {/* Team B Slots */}
            <div className="p-4 rounded-2xl bg-white border border-[#e5e8eb] space-y-2">
              <div className="font-bold text-xs text-amber-600">Team B ({team2.length}/2명)</div>
              <div className="space-y-1.5 min-h-[70px]">
                {team2.map((id) => {
                  const p = safePlayers.find((item) => item.id === id);
                  return (
                    <div key={id} className="flex items-center justify-between p-2 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold">
                      <span>{p ? `${p.name} (${p.tier}급) · 🎮${p.gamesPlayed || 0}회` : '선수'}</span>
                      <button onClick={() => handleSelectPlayer(id)} className="text-red-500 hover:text-red-700">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
                {team2.length < 2 && (
                  <div className="p-2 rounded-xl border border-dashed border-[#e5e8eb] text-center text-xs text-[#8b95a1]">
                    아래 명단에서 클릭
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Player Selection List */}
        <div className="p-6 overflow-y-auto max-h-[300px] space-y-3 bg-white">
          <div className="font-bold text-xs text-[#191f28]">선수 선택 (다른 코트 경기 중인 선수는 차단됩니다)</div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {safePlayers.map((p) => {
              const isT1 = team1.includes(p.id);
              const isT2 = team2.includes(p.id);
              const isSelected = isT1 || isT2;
              const isPlayingOtherCourt = Boolean(otherCourtsPlayingMap[p.id]);

              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPlayer(p.id)}
                  disabled={isPlayingOtherCourt}
                  className={`p-2.5 rounded-xl border text-left text-xs transition flex items-center justify-between ${
                    isPlayingOtherCourt
                      ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                      : isT1
                      ? 'bg-[#e8f3ff] border-[#3182f6] text-[#1b64da] font-bold'
                      : isT2
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                      : 'bg-white border-[#e5e8eb] text-[#191f28] hover:bg-[#f2f4f6]'
                  }`}
                >
                  <div>
                    <div className="font-bold flex items-center gap-1">
                      <span>{p.name}</span>
                      {isPlayingOtherCourt && (
                        <ShieldAlert className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                    <div className="text-[10px] text-[#4e5968] font-bold mt-0.5">
                      {isPlayingOtherCourt ? (
                        <span className="text-red-500">{otherCourtsPlayingMap[p.id]} 경기 중</span>
                      ) : (
                        <span>🎮 {p.gamesPlayed || 0}게임 · 💤 {p.consecutiveRest || 0}게임</span>
                      )}
                    </div>
                  </div>

                  {isSelected && !isPlayingOtherCourt && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${isT1 ? 'bg-[#3182f6] text-white' : 'bg-amber-500 text-white'}`}>
                      {isT1 ? 'A' : 'B'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f9fafb] border-t border-[#e5e8eb] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8b95a1] hover:text-[#191f28] transition"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={team1.length !== 2 || team2.length !== 2}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#3182f6] text-white hover:bg-[#2272eb] disabled:opacity-40 transition shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>수동 배치 완료</span>
          </button>
        </div>
      </div>
    </div>
  );
}
