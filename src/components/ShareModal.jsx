import React, { useState } from 'react';
import { Share2, Copy, Check, X, Trophy, UserCheck } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, courts = [], restingPlayers = [] }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const safeCourts = Array.isArray(courts) ? courts : [];
  const safeResting = Array.isArray(restingPlayers) ? restingPlayers : [];

  const formatShareText = () => {
    let text = `🏸 [배드민턴 모임 실시간 대진표]\n`;
    text += `───────────────\n`;

    safeCourts.forEach((c) => {
      if (!c) return;
      const t1 = Array.isArray(c.team1)
        ? c.team1.map((p) => `${p.name}(${p.gender === 'F' ? '여' : '남'}${p.tier})`).join('+')
        : '대기';
      const t2 = Array.isArray(c.team2)
        ? c.team2.map((p) => `${p.name}(${p.gender === 'F' ? '여' : '남'}${p.tier})`).join('+')
        : '대기';

      text += `📍 ${c.name || `${c.id}번 코트`}\n`;
      text += `   ${t1}  VS  ${t2}\n\n`;
    });

    if (safeResting.length > 0) {
      text += `💤 [현재 휴식 및 대기자 명단 (${safeResting.length}명)]\n`;
      const restingNames = safeResting
        .map((p) => `${p.name}(${p.gender === 'F' ? '여' : '남'})`)
        .join(', ');
      text += `   ${restingNames}\n`;
    }

    text += `───────────────\n`;
    text += `📱 실시간 대진판 확인: ${window.location.href}`;
    return text;
  };

  const shareText = formatShareText();

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="tds-card w-full max-w-md border border-[#e5e8eb] shadow-2xl overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e5e8eb] flex items-center justify-between bg-[#f8fafc]">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#3182f6]" />
            <h3 className="font-bold text-base text-[#191f28]">카카오톡 대진표 공유</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8b95a1] hover:text-[#191f28] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-[#4e5968] font-medium">
            아래 텍스트를 복사하여 동호회 카카오톡 단톡방에 바로 공유하실 수 있습니다.
          </p>

          <textarea
            readOnly
            value={shareText}
            rows={10}
            className="w-full p-3 bg-[#f2f4f6] border border-[#e5e8eb] rounded-xl text-xs text-[#191f28] font-mono outline-none resize-none"
          />
        </div>

        {/* Actions */}
        <div className="p-4 bg-[#f9fafb] border-t border-[#e5e8eb] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#f2f4f6] text-[#4e5968] hover:bg-gray-200 transition"
          >
            닫기
          </button>
          <button
            onClick={handleCopy}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#3182f6] text-white hover:bg-[#2272eb] transition shadow flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>카톡 텍스트 복사</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
