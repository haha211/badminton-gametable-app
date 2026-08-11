import React, { useState } from 'react';
import { UserPlus, Trash2, CheckCircle, XCircle, Shield, Users, Image as ImageIcon, Sparkles, Plus, Minus } from 'lucide-react';

export default function PlayerManager({
  players = [],
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onDeleteAllPlayers,
  onTogglePresent,
  onOpenOCR
}) {
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState('M'); // 기본 남성
  const [newTier, setNewTier] = useState('B');

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    if (players.length >= 16) {
      alert('참석 인원은 최대 16명까지 등록 가능합니다.');
      return;
    }

    if (onAddPlayer) onAddPlayer(newName.trim(), newTier, newGender);
    setNewName('');
  };

  const handleTierCycle = (player) => {
    const nextTierMap = { A: 'B', B: 'C', C: 'A' };
    const nextTier = nextTierMap[player.tier] || 'B';
    if (onUpdatePlayer) onUpdatePlayer(player.id, { tier: nextTier });
  };

  const handleGenderToggle = (player) => {
    const nextGender = player.gender === 'F' ? 'M' : 'F';
    if (onUpdatePlayer) onUpdatePlayer(player.id, { gender: nextGender });
  };

  const handleAvatarUpload = (player, e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (onUpdatePlayer) onUpdatePlayer(player.id, { avatar: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAdjustGamesPlayed = (player, delta) => {
    const current = player.gamesPlayed || 0;
    const nextVal = Math.max(0, current + delta);
    if (onUpdatePlayer) onUpdatePlayer(player.id, { gamesPlayed: nextVal });
  };

  const handleAdjustRestCount = (player, delta) => {
    const current = player.consecutiveRest || 0;
    const nextVal = Math.max(0, current + delta);
    if (onUpdatePlayer) onUpdatePlayer(player.id, { consecutiveRest: nextVal });
  };

  const handleDeleteAll = () => {
    if (players.length === 0) {
      alert('삭제할 참가자가 없습니다.');
      return;
    }

    if (confirm(`🚨 등록된 전체 참가자(${players.length}명)를 모두 삭제하시겠습니까?\n(삭제 후 새로운 명단을 작성할 수 있습니다)`)) {
      if (onDeleteAllPlayers) onDeleteAllPlayers();
    }
  };

  const safePlayers = Array.isArray(players) ? players : [];
  const activeCount = safePlayers.filter((p) => p && p.isPresent !== false).length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="tds-card p-6 flex flex-col md:flex-row items-center justify-between gap-6 border border-[#e5e8eb]">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Users className="w-6 h-6 text-[#3182f6] flex-shrink-0" />
            <h2 className="font-extrabold text-xl text-[#191f28] whitespace-nowrap">참석자 명단 및 성별/실력 관리</h2>
          </div>
          <p className="text-xs text-[#8b95a1] max-w-lg font-medium">
            성별(남 ♂️ / 여 ♀️) 및 A·B·C 등급을 지정하여 극강의 밸런스 대진을 구성합니다. (남성 +0.5pt 실력 보정 가산)
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap justify-center sm:justify-end">
          <div className="px-5 py-2.5 bg-[#f2f4f6] rounded-2xl border border-[#e5e8eb] text-center whitespace-nowrap">
            <div className="text-[10px] text-[#4e5968] font-bold uppercase whitespace-nowrap">현재 참석 인원</div>
            <div className="text-xl font-extrabold text-[#3182f6] whitespace-nowrap">{activeCount} / {safePlayers.length}명</div>
          </div>

          <button
            onClick={onOpenOCR}
            className="px-4 py-3 rounded-2xl text-xs font-bold bg-[#e8f3ff] text-[#1b64da] hover:bg-blue-100 transition flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-[#3182f6] flex-shrink-0" />
            <span className="whitespace-nowrap">이미지 명단 자동 등록</span>
          </button>

          <button
            onClick={handleDeleteAll}
            disabled={safePlayers.length === 0}
            className="px-4 py-3 rounded-2xl text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 disabled:opacity-40 transition flex items-center justify-center gap-1.5 whitespace-nowrap"
            title="등록된 모든 참가자를 삭제합니다"
          >
            <Trash2 className="w-4 h-4 flex-shrink-0" />
            <span className="whitespace-nowrap">전체 삭제</span>
          </button>
        </div>
      </div>

      {/* Input Bar (성별 선택 추가) */}
      <form onSubmit={handleAdd} className="tds-card p-4 flex flex-col sm:flex-row items-center gap-3 border border-[#e5e8eb]">
        <input
          type="text"
          placeholder="새 참가자 이름 입력 (예: 홍길동)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="w-full sm:flex-1 px-4 py-3 bg-[#f2f4f6] border border-[#e5e8eb] rounded-xl text-sm text-[#191f28] placeholder-[#8b95a1] outline-none focus:border-[#3182f6] transition font-semibold"
        />

        {/* Gender Selector */}
        <div className="flex items-center gap-1 bg-[#f2f4f6] p-1.5 rounded-xl border border-[#e5e8eb] w-full sm:w-auto justify-center whitespace-nowrap">
          <button
            type="button"
            onClick={() => setNewGender('M')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              newGender === 'M'
                ? 'bg-[#3182f6] text-white shadow-sm'
                : 'text-[#4e5968] hover:text-[#191f28]'
            }`}
          >
            남 ♂️
          </button>
          <button
            type="button"
            onClick={() => setNewGender('F')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              newGender === 'F'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-[#4e5968] hover:text-[#191f28]'
            }`}
          >
            여 ♀️
          </button>
        </div>

        {/* Tier Selector */}
        <div className="flex items-center gap-1 bg-[#f2f4f6] p-1.5 rounded-xl border border-[#e5e8eb] w-full sm:w-auto justify-center whitespace-nowrap">
          {['A', 'B', 'C'].map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setNewTier(tier)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                newTier === tier
                  ? 'bg-[#3182f6] text-white shadow-sm'
                  : 'text-[#4e5968] hover:text-[#191f28]'
              }`}
            >
              {tier}급
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!newName.trim() || safePlayers.length >= 16}
          className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-xs bg-[#3182f6] text-white hover:bg-[#2272eb] disabled:opacity-40 transition shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5] flex-shrink-0" />
          <span className="whitespace-nowrap">선수 추가</span>
        </button>
      </form>

      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="font-bold text-base text-[#191f28] whitespace-nowrap">
          참가자 리스트 ({safePlayers.length}명)
        </h3>
      </div>

      {/* Player Cards Grid */}
      {safePlayers.length === 0 ? (
        <div className="tds-card p-12 text-center border border-dashed border-[#e5e8eb] space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#f2f4f6] text-[#8b95a1] flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-[#191f28] text-base whitespace-nowrap">등록된 참가자가 없습니다</h4>
          <p className="text-xs text-[#8b95a1] max-w-sm mx-auto">
            상단 입력란에서 직접 참가자를 추가하시거나, <strong>"이미지 명단 자동 등록"</strong>을 이용해 보세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {safePlayers.map((player) => {
            if (!player) return null;
            const isPresent = player.isPresent !== false;
            const name = player.name || '무명';
            const tier = player.tier || 'B';
            const gender = player.gender || 'M';
            const gamesPlayed = player.gamesPlayed || 0;
            const consecutiveRest = player.consecutiveRest || 0;

            const badgeBg = tier === 'A' ? 'bg-[#e8f3ff] text-[#1b64da]' : tier === 'B' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700';

            return (
              <div
                key={player.id || Math.random()}
                className={`tds-card p-4 transition-all relative flex flex-col justify-between border ${
                  isPresent
                    ? 'border-[#e5e8eb] bg-white hover:shadow-md'
                    : 'border-[#e5e8eb] bg-[#f9fafb] opacity-40'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => onTogglePresent && onTogglePresent(player.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      isPresent
                        ? 'bg-[#e8f3ff] text-[#1b64da]'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                    title="참석/불참 토글"
                  >
                    {isPresent ? <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> : <XCircle className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span className="whitespace-nowrap">{isPresent ? '참석' : '불참'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {/* Gender Toggle Badge */}
                    <button
                      onClick={() => handleGenderToggle(player)}
                      className={`px-2 py-1 rounded-xl font-bold text-xs flex items-center gap-0.5 transition ${
                        gender === 'F' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-800'
                      }`}
                      title="클릭하여 성별 전환 (남<->여)"
                    >
                      <span>{gender === 'F' ? '여 ♀️' : '남 ♂️'}</span>
                    </button>

                    {/* Tier Badge */}
                    <button
                      onClick={() => handleTierCycle(player)}
                      className={`px-2.5 py-1 rounded-xl font-bold text-xs flex items-center gap-1 ${badgeBg} hover:scale-105 transition whitespace-nowrap`}
                      title="클릭하여 등급 변경 (A->B->C)"
                    >
                      <Shield className="w-3 h-3 flex-shrink-0" />
                      <span className="whitespace-nowrap">{tier}급</span>
                    </button>
                  </div>
                </div>

                {/* Player Profile Info */}
                <div className="flex items-center gap-3 my-1 min-w-0">
                  <label className="relative cursor-pointer group flex-shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-[#f2f4f6] border border-[#e5e8eb] overflow-hidden flex items-center justify-center text-[#191f28] font-bold text-sm shadow-inner">
                      {player.avatar ? (
                        <img src={player.avatar} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{name.slice(0, 2)}</span>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                      <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleAvatarUpload(player, e)}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base text-[#191f28] truncate flex items-center gap-1">
                      <span>{name}</span>
                      <span className="text-xs font-semibold text-[#8b95a1]">
                        ({gender === 'F' ? '여' : '남'})
                      </span>
                    </h3>
                  </div>
                </div>

                {/* EDITABLE GAMES PLAYED & REST COUNT CONTROLLERS */}
                <div className="space-y-2 my-2 p-2.5 rounded-2xl bg-[#f9fafb] border border-[#e5e8eb] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#3182f6] whitespace-nowrap">🎮 경기 수</span>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleAdjustGamesPlayed(player, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-[#e5e8eb] text-[#191f28] hover:bg-gray-100 flex items-center justify-center font-bold flex-shrink-0"
                        title="경기 수 1 감수"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={gamesPlayed}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) onUpdatePlayer(player.id, { gamesPlayed: Math.max(0, val) });
                        }}
                        className="w-8 text-center font-extrabold text-[#3182f6] bg-transparent outline-none whitespace-nowrap"
                      />
                      <button
                        onClick={() => handleAdjustGamesPlayed(player, 1)}
                        className="w-6 h-6 rounded-lg bg-[#3182f6] text-white hover:bg-[#2272eb] flex items-center justify-center font-bold flex-shrink-0"
                        title="경기 수 1 증가"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-600 whitespace-nowrap">💤 휴식 수</span>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <button
                        onClick={() => handleAdjustRestCount(player, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-[#e5e8eb] text-[#191f28] hover:bg-[#f2f4f6] flex items-center justify-center font-bold flex-shrink-0"
                        title="휴식 횟수 1 감수"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={consecutiveRest}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) onUpdatePlayer(player.id, { consecutiveRest: Math.max(0, val) });
                        }}
                        className="w-8 text-center font-extrabold text-amber-600 bg-transparent outline-none whitespace-nowrap"
                      />
                      <button
                        onClick={() => handleAdjustRestCount(player, 1)}
                        className="w-6 h-6 rounded-lg bg-amber-500 text-white hover:bg-amber-600 flex items-center justify-center font-bold flex-shrink-0"
                        title="휴식 횟수 1 증가"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Footer Delete Button */}
                <div className="mt-2 pt-2 border-t border-[#e5e8eb] flex items-center justify-end">
                  <button
                    onClick={() => onDeletePlayer && onDeletePlayer(player.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition whitespace-nowrap"
                    title="선수 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
