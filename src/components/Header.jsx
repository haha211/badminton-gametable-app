import React, { useState, useEffect } from 'react';
import { Trophy, Users, RefreshCw, Upload, Share2, Sparkles, Smartphone, Power, RotateCcw, Menu, X, Wifi, Shuffle } from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  onGenerateMatches,
  onOpenOCR,
  onOpenShare,
  onOpenWebInfo,
  enabledCourts = [1, 2, 3],
  onToggleCourt,
  onResetAllData,
  activePlayersCount,
  totalPlayersCount,
  isSupabaseConfigured = false
}) {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY <= 20) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsHeaderVisible(false);
        setIsMenuOpen(false);
      } else if (currentScrollY < lastScrollY) {
        setIsHeaderVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 bg-white border-b border-[#e5e8eb] shadow-md transition-transform duration-300 ease-in-out ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Logo & Title */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#3182f6] flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
              <Trophy className="w-4 h-4 text-white stroke-[2.5]" />
            </div>
            <div className="whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-base tracking-tight text-[#191f28] whitespace-nowrap">
                  배드민턴 게임판
                </h1>
                {isSupabaseConfigured ? (
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded-full whitespace-nowrap flex items-center gap-1">
                    <Wifi className="w-2.5 h-2.5 animate-pulse" /> 1초 실시간 동기화
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-[#e8f3ff] text-[#1b64da] rounded-full whitespace-nowrap">
                    PRO
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Controls (PC View) */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Court Switches */}
            <div className="flex items-center bg-[#f2f4f6] p-1 rounded-xl border border-[#e5e8eb] text-xs gap-1 whitespace-nowrap">
              <span className="px-1.5 text-[#4e5968] font-bold text-[11px] flex items-center gap-1 whitespace-nowrap">
                <Power className="w-3.5 h-3.5 text-[#3182f6]" /> 코트:
              </span>
              {[1, 2, 3].map((courtId) => {
                const isEnabled = enabledCourts.includes(courtId);
                return (
                  <button
                    key={courtId}
                    onClick={() => onToggleCourt && onToggleCourt(courtId)}
                    className={`px-2 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1 whitespace-nowrap ${
                      isEnabled
                        ? 'bg-[#3182f6] text-white shadow-sm'
                        : 'bg-white text-[#8b95a1] border border-[#e5e8eb] line-through'
                    }`}
                  >
                    <span>{courtId}코트</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={onOpenOCR}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-[#e8f3ff] text-[#1b64da] hover:bg-blue-100 transition whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>이미지 인식</span>
            </button>

            <button
              onClick={onGenerateMatches}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-xl bg-[#3182f6] text-white hover:bg-[#2272eb] transition shadow-md shadow-blue-500/20 whitespace-nowrap"
              title="안 뛴 사람(휴식자) 우선 투입 & 뛴 사람 교체로 다음 라운드 섞기"
            >
              <Shuffle className="w-4 h-4 stroke-[2.5]" />
              <span>🔄 다음 라운드 대진 섞기</span>
            </button>

            <button
              onClick={onOpenShare}
              className="p-2 rounded-xl bg-[#f2f4f6] hover:bg-gray-200 text-[#191f28] border border-[#e5e8eb] transition whitespace-nowrap"
              title="대진표 공유"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onResetAllData}
              className="p-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition border border-red-100 whitespace-nowrap"
              title="전체 리셋"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Right Bar */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              onClick={onGenerateMatches}
              className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-black rounded-xl bg-[#3182f6] text-white hover:bg-[#2272eb] transition shadow-sm whitespace-nowrap"
            >
              <Shuffle className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>다음 대진 섞기</span>
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl bg-[#f2f4f6] text-[#191f28] hover:bg-gray-200 transition border border-[#e5e8eb]"
              aria-label="메뉴 열기"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 pb-2 border-t border-[#e5e8eb] flex items-center justify-between text-xs pt-1.5">
          <div className="flex items-center gap-1 p-0.5 bg-[#f2f4f6] rounded-xl whitespace-nowrap overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('courts')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition whitespace-nowrap flex-1 sm:flex-none justify-center ${
                activeTab === 'courts'
                  ? 'bg-white text-[#3182f6] shadow-sm'
                  : 'text-[#4e5968] hover:text-[#191f28]'
              }`}
            >
              <Trophy className="w-3 h-3" />
              <span>대진판 ({enabledCourts.length}개)</span>
            </button>

            <button
              onClick={() => setActiveTab('players')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition whitespace-nowrap flex-1 sm:flex-none justify-center ${
                activeTab === 'players'
                  ? 'bg-white text-[#3182f6] shadow-sm'
                  : 'text-[#4e5968] hover:text-[#191f28]'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>참가자 ({activePlayersCount}/{totalPlayersCount}명)</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1 transition whitespace-nowrap flex-1 sm:flex-none justify-center ${
                activeTab === 'stats'
                  ? 'bg-white text-[#3182f6] shadow-sm'
                  : 'text-[#4e5968] hover:text-[#191f28]'
              }`}
            >
              <RefreshCw className="w-3 h-3" />
              <span>통계</span>
            </button>
          </div>

          <div className="text-[11px] text-[#8b95a1] hidden sm:block font-medium whitespace-nowrap ml-4">
            {isSupabaseConfigured ? '⚡ 1초 실시간 동기화 가동' : '🔒 새로고침 보존'}
          </div>
        </div>

        {/* MOBILE HAMBURGER DRAWER */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-[#e5e8eb] bg-[#f9fafb] p-4 space-y-4 animate-fadeIn">
            <div className="space-y-1.5">
              <div className="text-xs font-bold text-[#4e5968] flex items-center gap-1">
                <Power className="w-3.5 h-3.5 text-[#3182f6]" /> 코트 가동 상태 설정:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((courtId) => {
                  const isEnabled = enabledCourts.includes(courtId);
                  return (
                    <button
                      key={courtId}
                      onClick={() => onToggleCourt && onToggleCourt(courtId)}
                      className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                        isEnabled
                          ? 'bg-[#3182f6] text-white shadow-sm'
                          : 'bg-white text-[#8b95a1] border border-[#e5e8eb] line-through'
                      }`}
                    >
                      <span>{courtId}번 코트 {isEnabled ? 'ON' : 'OFF'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e5e8eb]">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenOCR();
                }}
                className="p-2.5 rounded-xl bg-white border border-[#e5e8eb] text-xs font-bold text-[#1b64da] flex items-center justify-center gap-1.5"
              >
                <Upload className="w-4 h-4 text-[#3182f6]" />
                <span>이미지 명단 인식</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenShare();
                }}
                className="p-2.5 rounded-xl bg-white border border-[#e5e8eb] text-xs font-bold text-[#191f28] flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4 text-[#3182f6]" />
                <span>대진표 카톡 공유</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenWebInfo();
                }}
                className="p-2.5 rounded-xl bg-white border border-[#e5e8eb] text-xs font-bold text-[#3182f6] flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-4 h-4" />
                <span>모바일 앱 접속 안내</span>
              </button>

              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onResetAllData();
                }}
                className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-xs font-bold text-red-600 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>전체 데이터 리셋</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="h-[96px] sm:h-[90px]" />
    </>
  );
}
