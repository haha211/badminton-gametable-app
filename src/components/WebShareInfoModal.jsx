import React from 'react';
import { X, Smartphone, Globe, Cloud, CheckCircle2 } from 'lucide-react';

export default function WebShareInfoModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="tds-card w-full max-w-xl border border-[#e5e8eb] shadow-2xl overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e8eb] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#e8f3ff] text-[#1b64da] flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#191f28]">언제든 PC & 모바일 무료 접속 안내</h2>
              <p className="text-xs text-[#8b95a1]">핸드폰과 컴퓨터에서 제약 없이 24시간 접속할 수 있습니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b95a1] hover:text-[#191f28] hover:bg-[#f2f4f6] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-[#4e5968] leading-relaxed overflow-y-auto max-h-[75vh]">
          {/* Mobile App Like Add */}
          <div className="p-4 rounded-2xl bg-[#e8f3ff] border border-blue-100 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-[#1b64da]">
              <Smartphone className="w-4 h-4" />
              <span>1. 스마트폰(iPhone / Android) 앱처럼 추가하기</span>
            </div>
            <p className="text-[#191f28]">
              스마트폰 브라우저(Safari / Chrome) 접속 후 <strong>'홈 화면에 추가'</strong>를 누르시면 전용 앱으로 언제든 1초 만에 실행할 수 있습니다.
            </p>
          </div>

          {/* Cloud Deploy */}
          <div className="p-4 rounded-2xl bg-[#f9fafb] border border-[#e5e8eb] space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-[#191f28]">
              <Cloud className="w-4 h-4 text-[#3182f6]" />
              <span>2. 100% 평생 무료 웹 배포 방법 (Vercel / Netlify)</span>
            </div>
            <p className="text-[#4e5968]">
              표준 Vite + React 웹 서비스로 작성되어 원하는 도메인 주소로 즉시 무료 배포가 가능합니다:
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-[#191f28]">
              <li>
                <strong className="text-[#3182f6]">Vercel 배포:</strong> <code>npx vercel</code> 명령어 입력 한 번으로 전용 URL 생성!
              </li>
              <li>
                <strong className="text-[#3182f6]">Netlify / GitHub Pages:</strong> <code>npm run build</code> 후 dist 폴더 무료 업로드.
              </li>
            </ul>
          </div>

          {/* Key Features */}
          <div className="p-4 rounded-2xl bg-[#f2f4f6] border border-[#e5e8eb] space-y-2">
            <div className="font-bold text-[#191f28] text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#3182f6]" />
              <span>주요 제공 기능</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[#4e5968]">
              <div>• 개별 코트 선택 ON/OFF 토글</div>
              <div>• F5 새로고침 100% 자동 보존</div>
              <div>• 자정(24시간) 지남 시 자동 리셋</div>
              <div>• A/B/C 실력 밸런스 매처</div>
              <div>• 이미지/텍스트 명단 자동 OCR</div>
              <div>• 단톡방 대진표 복사 공유</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f9fafb] border-t border-[#e5e8eb] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#3182f6] text-white hover:bg-[#2272eb] transition shadow"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
