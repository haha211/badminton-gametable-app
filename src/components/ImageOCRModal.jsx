import React, { useState } from 'react';
import { extractPlayersFromImage, parsePlayerListFromText } from '../utils/ocrParser';
import { X, Upload, FileText, CheckCircle, Sparkles, Loader2, Info } from 'lucide-react';

export default function ImageOCRModal({ isOpen, onClose, onImportPlayers }) {
  const [activeMode, setActiveMode] = useState('image');
  const [loading, setLoading] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [rawText, setRawText] = useState('');
  const [detectedPlayers, setDetectedPlayers] = useState([]);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setProgressPercent(10);
    setProgressStatus('이미지 분석 준비 중...');

    try {
      const results = await extractPlayersFromImage(file, (percent, status) => {
        setProgressPercent(percent);
        setProgressStatus(status);
      });

      setDetectedPlayers(results);
    } catch (err) {
      alert('이미지 분석 중 오류가 발생했습니다. 카톡/텍스트 붙여넣기 탭으로 전환하여 명단을 붙여넣어주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleTextParse = () => {
    if (!rawText.trim()) return;
    const results = parsePlayerListFromText(rawText);
    setDetectedPlayers(results);
  };

  const handleTierChange = (index, newTier) => {
    const updated = [...detectedPlayers];
    updated[index].tier = newTier;
    setDetectedPlayers(updated);
  };

  const handleRemoveItem = (index) => {
    setDetectedPlayers(detectedPlayers.filter((_, i) => i !== index));
  };

  const handleConfirmImport = () => {
    if (detectedPlayers.length === 0) return;
    if (onImportPlayers) onImportPlayers(detectedPlayers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="tds-card w-full max-w-xl border border-[#e5e8eb] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e5e8eb] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#e8f3ff] text-[#1b64da] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#191f28]">스마트 명단 인식 (김양/부평/초심A 지원)</h2>
              <p className="text-xs text-[#8b95a1]">"김양/부평/초심A" 양식에서 이름과 실력을 자동으로 추출합니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8b95a1] hover:text-[#191f28] hover:bg-[#f2f4f6] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 flex border-b border-[#e5e8eb] gap-4 text-xs font-bold bg-[#f9fafb]">
          <button
            onClick={() => setActiveMode('image')}
            className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
              activeMode === 'image'
                ? 'border-[#3182f6] text-[#3182f6]'
                : 'border-transparent text-[#8b95a1] hover:text-[#191f28]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>이미지/사진 업로드</span>
          </button>
          <button
            onClick={() => setActiveMode('text')}
            className={`pb-2 border-b-2 transition flex items-center gap-1.5 ${
              activeMode === 'text'
                ? 'border-[#3182f6] text-[#3182f6]'
                : 'border-transparent text-[#8b95a1] hover:text-[#191f28]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>카톡/텍스트 붙여넣기</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-white">
          {/* Format Guide Note */}
          <div className="p-3.5 rounded-2xl bg-[#e8f3ff] border border-blue-100 flex items-start gap-2.5 text-xs text-[#1b64da]">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">지원하는 명단 양식 예시:</strong>
              <div className="text-[11px] text-[#4e5968] mt-1 space-y-0.5">
                <div>• <code>김양/부평/초심A</code> ➔ 이름: <strong>김양</strong>, 등급: <strong>A급</strong> (지역은 무시됨)</div>
                <div>• <code>홍길동 / 강남 / B급</code> ➔ 이름: <strong>홍길동</strong>, 등급: <strong>B급</strong></div>
                <div>• <code>이영희/초심C</code> ➔ 이름: <strong>이영희</strong>, 등급: <strong>C급</strong></div>
              </div>
            </div>
          </div>

          {activeMode === 'image' ? (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-[#e5e8eb] hover:border-[#3182f6] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-[#f9fafb] transition">
                <Upload className="w-8 h-8 text-[#3182f6] mb-2" />
                <span className="text-sm font-bold text-[#191f28]">명단 캡처/프로필 사진 선택</span>
                <span className="text-xs text-[#8b95a1] mt-1">단톡방 명단 이미지를 올리시면 자동으로 파싱합니다</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>

              {loading && (
                <div className="space-y-2 py-3">
                  <div className="flex items-center justify-between text-xs text-[#1b64da] font-bold">
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-[#3182f6]" />
                      {progressStatus}
                    </span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#e5e8eb] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3182f6] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                rows={6}
                placeholder="카톡이나 단톡방 프로필 명단을 복사해 붙여넣으세요&#10;&#10;예시:&#10;1. 김양/부평/초심A&#10;2. 홍길동/강남/B급&#10;3. 이영희/인천/초심C"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full p-3.5 bg-[#f2f4f6] border border-[#e5e8eb] rounded-xl text-xs text-[#191f28] outline-none focus:border-[#3182f6] font-medium leading-relaxed"
              />
              <button
                onClick={handleTextParse}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#3182f6] text-white hover:bg-[#2272eb] transition shadow"
              >
                명단 분석 파싱하기
              </button>
            </div>
          )}

          {/* Detected Players Preview List */}
          {detectedPlayers.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#e5e8eb] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-[#191f28] flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-[#3182f6]" />
                  <span>추출된 참가자 ({detectedPlayers.length}명)</span>
                </h3>
                <span className="text-[11px] text-[#8b95a1]">이름/등급 확인 후 필요시 변경</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {detectedPlayers.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#f9fafb] border border-[#e5e8eb] text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#191f28]">{p.name}</span>
                      {p.rawTier && (
                        <span className="text-[10px] text-[#8b95a1]">({p.rawTier})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {['A', 'B', 'C'].map((t) => (
                        <button
                          key={t}
                          onClick={() => handleTierChange(idx, t)}
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            p.tier === t
                              ? 'bg-[#3182f6] text-white'
                              : 'bg-[#e5e8eb] text-[#4e5968]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                      <button
                        onClick={() => handleRemoveItem(idx)}
                        className="ml-2 text-[#8b95a1] hover:text-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            onClick={handleConfirmImport}
            disabled={detectedPlayers.length === 0}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#3182f6] text-white hover:bg-[#2272eb] disabled:opacity-40 transition shadow-md shadow-blue-500/20"
          >
            {detectedPlayers.length}명 명단 추가하기
          </button>
        </div>
      </div>
    </div>
  );
}
