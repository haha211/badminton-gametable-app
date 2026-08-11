/**
 * Web Audio API를 활용해 외부 파일 다운로드 없이
 * 체육관 느낌의 경쾌한 호루라기(Whistle) 사운드를 직접 파형 합성합니다.
 */
export function playWhistleSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // 2500Hz ~ 2800Hz의 주파수 바이브레이션으로 호루라기 소리 구현
    osc.frequency.setValueAtTime(2600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2850, ctx.currentTime + 0.1);
    osc.frequency.exponentialRampToValueAtTime(2550, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    console.log('Audio Context not available:', e);
  }
}

/**
 * Web Speech Synthesis API (TTS)를 통해
 * "1번 코트 홍길동, 김철수 님 들어가세요!" 안내 음성을 재생합니다.
 */
export function speakMatchAnnouncement(courtName, team1 = [], team2 = []) {
  try {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // 이전 음성 취소

    const t1Names = team1.map((p) => p.name).join(', ');
    const t2Names = team2.map((p) => p.name).join(', ');

    const text = `${courtName}, ${t1Names} 대 ${t2Names} 님 경기 준비하세요.`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.05; // 약간 빠르고 경쾌한 속도
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.log('TTS not supported:', e);
  }
}
