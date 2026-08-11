import React, { useState } from 'react';
import { X, Copy, Check, Share2 } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, courts = [], restingPlayers = [] }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const safeCourts = Array.isArray(courts) ? courts : [];
  const safeResting = Array.isArray(restingPlayers) ? restingPlayers : [];

  let textContent = `🏸 [오늘의 배드민턴 코트 대진표] 🏸\n`;
  textContent += `---------------------------------\n`;

  if (safeCourts.length === 0) {
    textContent += `아직 대진표가 구성되지 않았습니다.\n`;
  } else {
    safeCourts.forEach((c) => {
      if (!c) return;
      const team1 = Array.isArray(c.team1) ? c.team1 : [];
      const team2 = Array.isArray(c.team2) ? c.team2 : [];

      const t1Names = team1.map((p) => `${p.name || '선수'}(${p.tier || 'B'})`).join(', ');
      const t2Names = team2.map((p) => `${p.name || '선수'}(${p.tier || 'B'})`).join(', ');
      textContent += `📌 [${c.name || '코트'}] : ${t1Names}  VS  ${t2Names}\n`;
    });
  }

  textContent += `---------------------------------\n`;
  if (safeResting.length > 0) {
    const restNames = safeResting.map((p) => `${p.name || '선수'}(${p.tier || 'B'})`).join(', ');
    textContent += `⏳ 휴식 / 다음 대기: ${restNames}\n`;
  } else {
    textContent += `⏳ 휴식: 없음 (전원 출전 중)\n`;
  }
  textContent += `---------------------------------\n`;
  textContent += `배드민턴 게임판 프로그램으로 자동 생성됨`;

  const handleCopy = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="tds-card w-full max-w-lg border border-[#e5e8eb] shadow-2xl overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e8eb] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#3182f6]" />
            <h2 className="font-bold text-base text-[#191f28]">단톡방 / 카카오톡 공유 텍스트</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b95a1] hover:text-[#191f28] hover:bg-[#f2f4f6] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Text Area */}
        <div className="p-6 space-y-4">
          <textarea
            readOnly
            rows={10}
            value={textContent}
            className="w-full p-3.5 bg-[#f2f4f6] border border-[#e5e8eb] rounded-2xl text-xs text-[#191f28] font-mono leading-relaxed outline-none"
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f9fafb] border-t border-[#e5e8eb] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8b95a1] hover:text-[#191f28] transition"
          >
            닫기
          </button>
          <button
            onClick={handleCopy}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#3182f6] text-white hover:bg-[#2272eb] transition shadow-md flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '복사 완료!' : '카톡 공유용 텍스트 복사'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
