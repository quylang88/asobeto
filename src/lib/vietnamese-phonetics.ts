
/**
 * Vietnamese Phonetics Library
 * Provides utilities for parsing syllables and calculating phonetic similarity
 * to support pronunciation scoring.
 */

export type VietnameseTone = "level" | "huyen" | "sac" | "hoi" | "nga" | "nang";

export interface VietnameseSyllable {
  onset: string; // Phụ âm đầu (e.g., 'ng' in 'ngang')
  nucleus: string; // Nguyên âm chính (e.g., 'a' in 'ngang')
  coda: string; // Phụ âm cuối (e.g., 'ng' in 'ngang')
  tone: VietnameseTone; // Thanh điệu
}

// ============================================================================
// CONSTANTS & MAPPINGS
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

// Map accented vowels to their base nucleus char and tone
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

// SIMILARITY MATRICES
// Scores: 1.0 (Exact), 0.9 (Dialect/High), 0.7 (Medium), 0.4 (Low/Partial), 0.0 (Fail)

// Consonant equivalents (0.9 - 1.0)
const CONSONANT_EQUIVALENTS: Record<string, string[]> = {
  "c": ["k", "q"], "k": ["c", "q"], "q": ["c", "k"], // /k/
  "g": ["gh"], "gh": ["g"], // /ɣ/
  "ng": ["ngh"], "ngh": ["ng"], // /ŋ/
  "d": ["gi", "r"], "gi": ["d", "r"], "r": ["d", "gi"], // /z/ vs /j/ vs /r/ (Dialect)
  "s": ["x"], "x": ["s"], // /s/ vs /ʂ/ (Dialect)
  "ch": ["tr"], "tr": ["ch"], // /c/ vs /ʈ/ (Dialect)
  "l": ["n"], "n": ["l"], // Common confusion in some VN dialects (acceptable but penalized slightly)
};

// Vowel similarities
// High (0.8-0.9): a/ă (short/long), i/y
// Medium (0.5): a/â, o/ô, u/ư (different quality but related base)
const VOWEL_SIMILARITY: Record<string, Record<string, number>> = {
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

// Tone similarities
const TONE_SIMILARITY: Record<VietnameseTone, Record<VietnameseTone, number>> = {
  "level": {},
  "huyen": {},
  "sac": {},
  "hoi": { "nga": 0.9 }, // Dialect: Hoi/Nga often merged in South/Central
  "nga": { "hoi": 0.9 },
  "nang": {},
};

// ============================================================================
// PARSING LOGIC
// ============================================================================

export function parseVietnameseSyllable(text: string): VietnameseSyllable {
  const normalized = text.toLowerCase().trim();
  const chars = [...normalized];

  let onset = "";
  let nucleusRaw = "";
  let coda = "";

  // Find the first vowel index
  const firstVowelIndex = chars.findIndex(c => VOWEL_CHARS.has(c));

  if (firstVowelIndex === -1) {
    // No vowel found (e.g. abbreviations or noise)
    return { onset: normalized, nucleus: "", coda: "", tone: "level" };
  }

  // Onset is everything before the first vowel
  onset = chars.slice(0, firstVowelIndex).join("");

  // Find the last vowel index (for diphthongs/triphthongs)
  let lastVowelIndex = firstVowelIndex;
  for (let i = firstVowelIndex; i < chars.length; i++) {
    if (VOWEL_CHARS.has(chars[i])) {
      lastVowelIndex = i;
    } else {
      break; // Stop at first non-vowel after the vowel block
    }
  }

  nucleusRaw = chars.slice(firstVowelIndex, lastVowelIndex + 1).join("");
  coda = chars.slice(lastVowelIndex + 1).join("");

  // Extract tone from nucleus and normalize nucleus chars
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
// SIMILARITY LOGIC
// ============================================================================

function getConsonantSimilarity(c1: string, c2: string): number {
  if (c1 === c2) return 1.0;
  if (!c1 || !c2) return 0.0; // One has consonant, other doesn't

  // Check equivalents
  if (CONSONANT_EQUIVALENTS[c1]?.includes(c2)) {
    // Specific penalty for l/n confusion (dialectal error but common)
    if ((c1 === 'l' && c2 === 'n') || (c1 === 'n' && c2 === 'l')) return 0.8;
    return 1.0; // k/c/q, g/gh, etc. are treated as identical
  }

  // Similarity between 'ph' and 'f'? (ASR might output 'f')
  if ((c1 === 'ph' && c2 === 'f') || (c1 === 'f' && c2 === 'ph')) return 0.95;

  return 0.0;
}

function getNucleusSimilarity(n1: string, n2: string): number {
  if (n1 === n2) return 1.0;
  if (!n1 || !n2) return 0.0;

  // Check explicit similarity map
  if (VOWEL_SIMILARITY[n1]?.[n2]) return VOWEL_SIMILARITY[n1][n2];
  if (VOWEL_SIMILARITY[n2]?.[n1]) return VOWEL_SIMILARITY[n2][n1];

  return 0.0;
}

function getToneSimilarity(t1: VietnameseTone, t2: VietnameseTone): number {
  if (t1 === t2) return 1.0;
  if (TONE_SIMILARITY[t1]?.[t2]) return TONE_SIMILARITY[t1][t2];
  if (TONE_SIMILARITY[t2]?.[t1]) return TONE_SIMILARITY[t2][t1];
  return 0.0;
}

export function getPhoneticSimilarity(spoken: string, target: string): number {
  const s = parseVietnameseSyllable(spoken);
  const t = parseVietnameseSyllable(target);

  // 1. COMPONENT SCORES
  const onsetScore = getConsonantSimilarity(s.onset, t.onset);
  const nucleusScore = getNucleusSimilarity(s.nucleus, t.nucleus);
  const codaScore = getConsonantSimilarity(s.coda, t.coda);
  const toneScore = getToneSimilarity(s.tone, t.tone);

  // 2. WEIGHTS
  // Standard weights: Nucleus (40%), Tone (30%), Onset (20%), Coda (10%)
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

  // 3. CRITICAL PENALTIES (Gatekeeping)

  // Critical Tone Mismatch (e.g. "cá" vs "ca")
  if (toneScore < 0.5) {
    totalScore = Math.min(totalScore, 0.45);
  }

  // Critical Nucleus Mismatch (e.g. "ăn" vs "ân")
  if (nucleusScore < 0.7) {
     totalScore = Math.min(totalScore, 0.65);
  }

  // Critical Onset Mismatch (e.g. "cá" vs "khá")
  if (onsetScore < 0.5) {
      totalScore = Math.min(totalScore, 0.55);
  }

  // Critical Coda Mismatch (e.g. "ăn" vs "anh")
  // Only apply if target has a coda (don't penalize empty coda as strictly if it's just missing sound vs wrong sound?
  // No, missing coda is also wrong. "ăn" vs "ă".)
  // If one has coda and other doesn't, codaScore is 0.0.
  // If both have distinct codas, codaScore is 0.0.
  if (codaScore < 0.5) {
      // Allow slight leniency if it's the only error?
      // If Onset, Nucleus, Tone are perfect, score would be 0.85.
      // We want to fail "ăn" vs "anh".
      totalScore = Math.min(totalScore, 0.65);
  }

  return totalScore;
}
