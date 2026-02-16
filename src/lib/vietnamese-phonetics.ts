
/**
 * Thư viện Ngữ âm Tiếng Việt
 * Cung cấp các tiện ích để phân tích âm tiết và tính toán độ tương đồng ngữ âm
 * hỗ trợ chấm điểm phát âm.
 */

export type VietnameseTone = "level" | "huyen" | "sac" | "hoi" | "nga" | "nang";

export interface VietnameseSyllable {
  onset: string;   // Phụ âm đầu (ví dụ: 'ng' trong 'ngang')
  nucleus: string; // Nguyên âm chính (ví dụ: 'a' trong 'ngang')
  coda: string;    // Phụ âm cuối (ví dụ: 'ng' trong 'ngang')
  tone: VietnameseTone; // Thanh điệu
}

// ============================================================================
// HẰNG SỐ & BẢNG ÁNH XẠ (CONSTANTS & MAPPINGS)
// ============================================================================

const VOWEL_CHARS = new Set([
  "a", "á", "à", "ả", "ã", "ạ",
  "ă", "ắ", "ằ", "ẳ", "ẵ", "ặ",
  "â", "ấ", "ầ", "ẩ", "ẫ", "ậ",
  "e", "é", "è", "ẻ", "ẽ", "ẹ",
  "ê", "ế", "ề", "ể", "ễ", "ệ",
  "i", "í", "ì", "ỉ", "ĩ", "ị",
  "o", "ó", "ò", "ỏ", "õ", "ọ",
  "ô", "ố", "ồ", "ổ", "ỗ", "ộ",
  "ơ", "ớ", "ờ", "ở", "ỡ", "ợ",
  "u", "ú", "ù", "ủ", "ũ", "ụ",
  "ư", "ứ", "ừ", "ử", "ữ", "ự",
  "y", "ý", "ỳ", "ỷ", "ỹ", "ỵ",
]);

// Ánh xạ nguyên âm có dấu về nguyên âm gốc (nucleus base) và thanh điệu
const VOWEL_DECOMPOSITION: Record<string, { base: string; tone: VietnameseTone }> = {
  // A
  a: { base: "a", tone: "level" }, á: { base: "a", tone: "sac" }, à: { base: "a", tone: "huyen" }, ả: { base: "a", tone: "hoi" }, ã: { base: "a", tone: "nga" }, ạ: { base: "a", tone: "nang" },
  // Ă
  ă: { base: "ă", tone: "level" }, ắ: { base: "ă", tone: "sac" }, ằ: { base: "ă", tone: "huyen" }, ẳ: { base: "ă", tone: "hoi" }, ẵ: { base: "ă", tone: "nga" }, ặ: { base: "ă", tone: "nang" },
  // Â
  â: { base: "â", tone: "level" }, ấ: { base: "â", tone: "sac" }, ầ: { base: "â", tone: "huyen" }, ẩ: { base: "â", tone: "hoi" }, ẫ: { base: "â", tone: "nga" }, ậ: { base: "â", tone: "nang" },
  // E
  e: { base: "e", tone: "level" }, é: { base: "e", tone: "sac" }, è: { base: "e", tone: "huyen" }, ẻ: { base: "e", tone: "hoi" }, ẽ: { base: "e", tone: "nga" }, ẹ: { base: "e", tone: "nang" },
  // Ê
  ê: { base: "ê", tone: "level" }, ế: { base: "ê", tone: "sac" }, ề: { base: "ê", tone: "huyen" }, ể: { base: "ê", tone: "hoi" }, ễ: { base: "ê", tone: "nga" }, ệ: { base: "ê", tone: "nang" },
  // I
  i: { base: "i", tone: "level" }, í: { base: "i", tone: "sac" }, ì: { base: "i", tone: "huyen" }, ỉ: { base: "i", tone: "hoi" }, ĩ: { base: "i", tone: "nga" }, ị: { base: "i", tone: "nang" },
  // O
  o: { base: "o", tone: "level" }, ó: { base: "o", tone: "sac" }, ò: { base: "o", tone: "huyen" }, ỏ: { base: "o", tone: "hoi" }, õ: { base: "o", tone: "nga" }, ọ: { base: "o", tone: "nang" },
  // Ô
  ô: { base: "ô", tone: "level" }, ố: { base: "ô", tone: "sac" }, ồ: { base: "ô", tone: "huyen" }, ổ: { base: "ô", tone: "hoi" }, ỗ: { base: "ô", tone: "nga" }, ộ: { base: "ô", tone: "nang" },
  // Ơ
  ơ: { base: "ơ", tone: "level" }, ớ: { base: "ơ", tone: "sac" }, ờ: { base: "ơ", tone: "huyen" }, ở: { base: "ơ", tone: "hoi" }, ỡ: { base: "ơ", tone: "nga" }, ợ: { base: "ơ", tone: "nang" },
  // U
  u: { base: "u", tone: "level" }, ú: { base: "u", tone: "sac" }, ù: { base: "u", tone: "huyen" }, ủ: { base: "u", tone: "hoi" }, ũ: { base: "u", tone: "nga" }, ụ: { base: "u", tone: "nang" },
  // Ư
  ư: { base: "ư", tone: "level" }, ứ: { base: "ư", tone: "sac" }, ừ: { base: "ư", tone: "huyen" }, ử: { base: "ư", tone: "hoi" }, ữ: { base: "ư", tone: "nga" }, ự: { base: "ư", tone: "nang" },
  // Y
  y: { base: "y", tone: "level" }, ý: { base: "y", tone: "sac" }, ỳ: { base: "y", tone: "huyen" }, ỷ: { base: "y", tone: "hoi" }, ỹ: { base: "y", tone: "nga" }, ỵ: { base: "y", tone: "nang" },
};

// MA TRẬN TƯƠNG ĐỒNG (SIMILARITY MATRICES)
// Điểm số: 1.0 (Chính xác), 0.9 (Phương ngữ/Cao), 0.7 (Trung bình), 0.4 (Thấp/Một phần), 0.0 (Sai)

// Các phụ âm tương đương (0.9 - 1.0)
const CONSONANT_EQUIVALENTS: Record<string, string[]> = {
  "c": ["k", "q"], "k": ["c", "q"], "q": ["c", "k"], // Nhóm /k/
  "g": ["gh"], "gh": ["g"], // Nhóm /ɣ/
  "ng": ["ngh"], "ngh": ["ng"], // Nhóm /ŋ/
  "d": ["gi", "r"], "gi": ["d", "r"], "r": ["d", "gi"], // Nhóm /z/ vs /j/ vs /r/ (Phương ngữ Nam/Bắc)
  "s": ["x"], "x": ["s"], // /s/ vs /ʂ/ (Phương ngữ)
  "ch": ["tr"], "tr": ["ch"], // /c/ vs /ʈ/ (Phương ngữ)
  "l": ["n"], "n": ["l"], // Lỗi ngọng L/N phổ biến (chấp nhận được nhưng bị trừ điểm nhẹ)
};

// Tương đồng nguyên âm
// Cao (0.8-0.9): a/ă (ngắn/dài), i/y
// Trung bình (0.5): a/â, o/ô, u/ư (khác chất lượng âm nhưng cùng gốc chữ)
const VOWEL_SIMILARITY: Record<string, Partial<Record<string, number>>> = {
  "a": { "ă": 0.9, "â": 0.4 },
  "ă": { "a": 0.9, "â": 0.4 },
  "â": { "a": 0.4, "ă": 0.4 },
  "e": { "ê": 0.5 }, "ê": { "e": 0.5 },
  "i": { "y": 1.0 }, "y": { "i": 1.0 },
  "o": { "ô": 0.5, "ơ": 0.4 },
  "ô": { "o": 0.5, "ơ": 0.5 },
  "ơ": { "o": 0.4, "ô": 0.5 },
  "u": { "ư": 0.5 }, "ư": { "u": 0.5 },
};

// Tương đồng thanh điệu
const TONE_SIMILARITY: Partial<Record<VietnameseTone, Partial<Record<VietnameseTone, number>>>> = {
  "level": {},
  "huyen": {},
  "sac": {},
  "hoi": { "nga": 0.9 }, // Phương ngữ: Hỏi/Ngã thường nhập làm một ở miền Nam/Trung
  "nga": { "hoi": 0.9 },
  "nang": {},
};

// ============================================================================
// LOGIC PHÂN TÍCH (PARSING LOGIC)
// ============================================================================

export function parseVietnameseSyllable(text: string): VietnameseSyllable {
  const normalized = text.toLowerCase().trim();
  const chars = [...normalized];

  let onset = "";
  let nucleusRaw = "";
  let coda = "";

  // Tìm vị trí nguyên âm đầu tiên
  const firstVowelIndex = chars.findIndex(c => VOWEL_CHARS.has(c));

  if (firstVowelIndex === -1) {
    // Không tìm thấy nguyên âm (ví dụ: viết tắt hoặc nhiễu)
    return { onset: normalized, nucleus: "", coda: "", tone: "level" };
  }

  // Phụ âm đầu là tất cả ký tự trước nguyên âm đầu tiên
  onset = chars.slice(0, firstVowelIndex).join("");

  // Tìm vị trí nguyên âm cuối cùng (cho trường hợp nguyên âm đôi/ba)
  let lastVowelIndex = firstVowelIndex;
  for (let i = firstVowelIndex; i < chars.length; i++) {
    if (VOWEL_CHARS.has(chars[i])) {
      lastVowelIndex = i;
    } else {
      break; // Dừng lại ở ký tự không phải nguyên âm đầu tiên sau khối nguyên âm
    }
  }

  nucleusRaw = chars.slice(firstVowelIndex, lastVowelIndex + 1).join("");
  coda = chars.slice(lastVowelIndex + 1).join("");

  // Tách thanh điệu từ nguyên âm và chuẩn hóa ký tự nguyên âm về dạng không dấu
  let tone: VietnameseTone = "level";
  let nucleusBase = "";

  for (const char of nucleusRaw) {
    const info = VOWEL_DECOMPOSITION[char];
    if (info) {
      if (info.tone !== "level") {
        tone = info.tone;
      }
      nucleusBase += info.base;
    } else {
      nucleusBase += char;
    }
  }

  return {
    onset,
    nucleus: nucleusBase,
    coda,
    tone,
  };
}

// ============================================================================
// LOGIC TƯƠNG ĐỒNG (SIMILARITY LOGIC)
// ============================================================================

function getConsonantSimilarity(c1: string, c2: string): number {
  if (c1 === c2) return 1.0;
  if (!c1 || !c2) return 0.0; // Một bên có phụ âm, bên kia không

  // Kiểm tra các cặp tương đương
  if (CONSONANT_EQUIVALENTS[c1]?.includes(c2)) {
    // Phạt cụ thể cho lỗi nhầm lẫn l/n (lỗi ngọng)
    if ((c1 === 'l' && c2 === 'n') || (c1 === 'n' && c2 === 'l')) return 0.8;
    return 1.0; // k/c/q, g/gh... được coi là giống hệt nhau về âm
  }

  // Tương đồng giữa 'ph' và 'f'? (ASR có thể trả về 'f')
  if ((c1 === 'ph' && c2 === 'f') || (c1 === 'f' && c2 === 'ph')) return 0.95;

  return 0.0;
}

function getNucleusSimilarity(n1: string, n2: string): number {
  if (n1 === n2) return 1.0;
  if (!n1 || !n2) return 0.0;

  // Kiểm tra bảng tương đồng rõ ràng
  if (VOWEL_SIMILARITY[n1]?.[n2]) return VOWEL_SIMILARITY[n1][n2]!;
  if (VOWEL_SIMILARITY[n2]?.[n1]) return VOWEL_SIMILARITY[n2][n1]!;

  return 0.0;
}

function getToneSimilarity(t1: VietnameseTone, t2: VietnameseTone): number {
  if (t1 === t2) return 1.0;
  if (TONE_SIMILARITY[t1]?.[t2]) return TONE_SIMILARITY[t1][t2]!;
  if (TONE_SIMILARITY[t2]?.[t1]) return TONE_SIMILARITY[t2][t1]!;
  return 0.0;
}

export function getPhoneticSimilarity(spoken: string, target: string): number {
  const s = parseVietnameseSyllable(spoken);
  const t = parseVietnameseSyllable(target);

  // 1. ĐIỂM SỐ CÁC THÀNH PHẦN
  const onsetScore = getConsonantSimilarity(s.onset, t.onset);
  const nucleusScore = getNucleusSimilarity(s.nucleus, t.nucleus);
  const codaScore = getConsonantSimilarity(s.coda, t.coda);
  const toneScore = getToneSimilarity(s.tone, t.tone);

  // 2. TRỌNG SỐ (WEIGHTS)
  // Trọng số chuẩn: Nguyên âm (40%), Thanh điệu (20%), Phụ âm đầu (25%), Phụ âm cuối (15%)
  const wOnset = 0.25;
  const wNucleus = 0.40;
  const wCoda = 0.15;
  const wTone = 0.20;

  let totalScore = (
    onsetScore * wOnset +
    nucleusScore * wNucleus +
    codaScore * wCoda +
    toneScore * wTone
  );

  // 3. HÌNH PHẠT NGHIÊM TRỌNG (CRITICAL PENALTIES - GATEKEEPING)

  // Sai lệch Thanh điệu nghiêm trọng (ví dụ: "cá" vs "ca")
  if (toneScore < 0.5) {
    totalScore = Math.min(totalScore, 0.45);
  }

  // Sai lệch Nguyên âm nghiêm trọng (ví dụ: "ăn" vs "ân")
  // NucleusScore thấp nghĩa là sai hẳn nguyên âm (khác cả chữ cái lẫn nhóm tương đồng)
  if (nucleusScore < 0.7) {
     totalScore = Math.min(totalScore, 0.65);
  }

  // Sai lệch Phụ âm đầu nghiêm trọng (ví dụ: "cá" vs "khá")
  if (onsetScore < 0.5) {
      totalScore = Math.min(totalScore, 0.55);
  }

  // Sai lệch Phụ âm cuối nghiêm trọng (ví dụ: "ăn" vs "anh")
  // Chỉ áp dụng nếu có sự sai lệch rõ ràng (score < 0.5)
  if (codaScore < 0.5) {
      // Chúng ta muốn fail trường hợp "ăn" vs "anh" -> Fail.
      totalScore = Math.min(totalScore, 0.65);
  }

  return totalScore;
}
