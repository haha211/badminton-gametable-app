import { createWorker } from 'tesseract.js';

/**
 * 텍스트에서 이름, 성별(M/F), 실력 등급(A/B/C)을 정교하게 추출하는 파서
 */
export function parsePlayerListFromText(text) {
  if (!text) return [];

  const lines = text.split(/[\n\r]+/);
  const detectedPlayers = [];
  const nameSet = new Set();

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line || line.length < 2) continue;

    // 1. 불필요한 번호 제거
    line = line.replace(/^[\d\.\)\-\[\]\s]+/, '').trim();
    if (!line) continue;

    let name = '';
    let tier = 'B';
    let gender = 'M'; // 기본값 남성
    let rawTierStr = '';

    // 성별 명시 감지 (남, 여, 남성, 여성, M, F)
    if (/(여|여성|여자|양|F)/i.test(line)) {
      gender = 'F';
    } else if (/(남|남성|남자|M)/i.test(line)) {
      gender = 'M';
    }

    // 2. 슬래시(/) 구분자 분리 패턴 분석
    const slashParts = line.split(/[\/\|,\t]+/);

    if (slashParts.length >= 2) {
      const firstPart = slashParts[0].trim();
      const cleanNameMatch = firstPart.match(/([가-힣a-zA-Z0-9]{2,8})/);
      if (cleanNameMatch) {
        name = cleanNameMatch[1];
      }

      for (let i = 1; i < slashParts.length; i++) {
        const part = slashParts[i].trim();
        // 파트별 성별 감지
        if (/^(여|여성|여자|F)$/i.test(part)) {
          gender = 'F';
        } else if (/^(남|남성|남자|M)$/i.test(part)) {
          gender = 'M';
        }

        const parsedTier = parseTierFromWord(part);
        if (parsedTier) {
          tier = parsedTier;
          rawTierStr = part;
        }
      }
    } else {
      const matchCombo = line.match(/([가-힣a-zA-Z0-9]{2,6})[^\w\n]*?([가-힣]*[a-cA-C][급]?|초심[a-cA-C]?|초[a-cA-C]?|준[a-cA-C]?)/i);
      if (matchCombo) {
        name = matchCombo[1];
        const parsedTier = parseTierFromWord(matchCombo[2]);
        if (parsedTier) tier = parsedTier;
      }
    }

    // 3. 예외적인 등급 재검증
    if (line) {
      const explicitTierMatch = line.match(/(초심|초|준)?\s*([a-cA-C])(?![a-zA-Z])/i);
      if (explicitTierMatch) {
        const letter = explicitTierMatch[2].toUpperCase();
        if (['A', 'B', 'C'].includes(letter)) {
          tier = letter;
        }
      }
    }

    // 금지어 필터링
    const stopWords = ['참석자', '명단', '배드민턴', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일', '참석', '불참', '코트', '게임', '회원', '인원', '부평', '강남', '인천', '서울', '경기', '동호회', '계양', '부천', '간석', '남동', '중동'];

    if (name && name.length >= 2 && !nameSet.has(name) && !stopWords.includes(name)) {
      nameSet.add(name);
      detectedPlayers.push({
        name,
        gender,
        tier: ['A', 'B', 'C'].includes(tier) ? tier : 'B',
        rawTier: rawTierStr || tier,
      });
    }
  }

  return detectedPlayers;
}

function parseTierFromWord(word) {
  if (!word) return null;
  const str = word.trim();

  const matchLetter = str.match(/([a-cA-C])/);
  if (matchLetter) {
    return matchLetter[1].toUpperCase();
  }

  if (/초심|입문|하급/i.test(str)) {
    return 'C';
  }

  return null;
}

export async function extractPlayersFromImage(imageFile, onProgress) {
  try {
    if (onProgress) onProgress(10, '이미지 스마트 분석 준비 중...');

    const processedCanvas = await preprocessSmartCanvas(imageFile);

    if (onProgress) onProgress(25, 'Tesseract OCR 엔진 가동 중...');

    const worker = await createWorker('kor+eng');

    if (onProgress) onProgress(50, '글자 및 초심A/B/C 등급 정밀 분석 중...');

    const { data: { text } } = await worker.recognize(processedCanvas || imageFile);

    if (onProgress) onProgress(85, '이름, 성별 및 실력 등급 추출 중...');

    await worker.terminate();

    const parsed = parsePlayerListFromText(text);

    if (onProgress) onProgress(100, '분석 완료!');

    return parsed;
  } catch (error) {
    console.error('OCR Extraction error:', error);
    throw error;
  }
}

function preprocessSmartCanvas(imageFile) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let totalBrightness = 0;
      const pixelCount = data.length / 4;

      for (let i = 0; i < data.length; i += 4) {
        totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }

      const avgBrightness = totalBrightness / pixelCount;
      const isDarkMode = avgBrightness < 120;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];

        if (isDarkMode) {
          r = 255 - r;
          g = 255 - g;
          b = 255 - b;
        }

        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        const contrastVal = gray > 150 ? 255 : (gray < 70 ? 0 : gray);

        data[i] = contrastVal;
        data[i + 1] = contrastVal;
        data[i + 2] = contrastVal;
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas);
    };

    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(imageFile);
  });
}
