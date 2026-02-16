import type { LessonContent } from "@/data/game-config";
import { getPhoneticSimilarity } from "@/lib/vietnamese-phonetics";

const DEFAULT_ONE_STAR_THRESHOLD = 0.5;
const DEFAULT_TWO_STAR_THRESHOLD = 0.8;
const DEFAULT_MAX_STARS = 2;
const DEFAULT_PASS_THRESHOLD = 0.7;

const TONE_STRICT_SINGLE_LETTER_TARGETS = new Set([
  "a",
  "ă",
  "â",
  "e",
  "ê",
  "i",
  "y",
  "o",
  "ô",
  "ơ",
  "u",
  "ư",
]);

const LETTER_PRONUNCIATION_ALIASES: Record<string, string[]> = {
  a: ["a"],
  // Giữ chặt dấu: ă và â là 2 chữ cái khác hẳn a.
  ă: ["ă"],
  â: ["â"],
  b: ["bê", "bờ"],
  c: ["cờ", "xê"],
  d: ["dê", "dờ"],
  đ: ["đê", "đờ"],
  e: ["e"],
  ê: ["ê"],
  g: ["gờ"],
  h: ["hờ", "hát"],
  i: ["i", "y"],
  k: ["ca", "kờ"],
  l: ["lờ"],
  m: ["mờ"],
  n: ["nờ"],
  o: ["o"],
  ô: ["ô"],
  ơ: ["ơ"],
  p: ["pê", "pờ"],
  q: ["quờ", "quy"],
  r: ["rờ"],
  s: ["sờ"],
  t: ["tê", "tờ"],
  u: ["u"],
  ư: ["ư"],
  v: ["vê", "vờ"],
  x: ["xờ"],
  y: ["y", "i"],
};

export interface PronunciationScoringThresholds {
  passThreshold: number;
  oneStarThreshold: number;
  twoStarThreshold: number;
  maxStars: number;
}

export interface PronunciationScoringResult {
  similarity: number;
  earnedStars: number;
  isPassed: boolean;
}

function clamp01(value: number): number {
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

function normalizeSpeechText(value: string, removeDiacritics: boolean): string {
  let normalized = value.toLocaleLowerCase("vi-VN");
  if (removeDiacritics) {
    normalized = normalized
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d");
  }
  return normalized
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeNormalizedText(value: string): string[] {
  return value.split(" ").filter(Boolean);
}

function buildCandidatePhrases(
  normalizedSpokenOriginal: string,
  targetTokenCount: number,
): string[] {
  const spokenTokens = tokenizeNormalizedText(normalizedSpokenOriginal);
  if (!spokenTokens.length) return [];

  const candidates = new Set<string>();
  const expectedTokenCount = Math.max(1, targetTokenCount);

  if (spokenTokens.length >= expectedTokenCount) {
    for (
      let startIndex = 0;
      startIndex <= spokenTokens.length - expectedTokenCount;
      startIndex += 1
    ) {
      candidates.add(
        spokenTokens
          .slice(startIndex, startIndex + expectedTokenCount)
          .join(" "),
      );
    }
  } else {
    candidates.add(spokenTokens.join(" "));
  }

  // Giữ cả transcript đầy đủ để không bỏ sót trường hợp engine ghép từ bất thường.
  candidates.add(spokenTokens.join(" "));
  return [...candidates];
}

interface PronunciationTargetVariants {
  variants: string[];
  isSingleLetterTarget: boolean;
  isToneStrictSingleLetterTarget: boolean;
}

function getTargetPronunciationVariants(
  targetText: string,
): PronunciationTargetVariants {
  const normalizedTarget = normalizeSpeechText(targetText, false);
  if (!normalizedTarget) {
    return {
      variants: [],
      isSingleLetterTarget: false,
      isToneStrictSingleLetterTarget: false,
    };
  }

  const variants = new Set<string>([normalizedTarget]);
  const targetTokens = tokenizeNormalizedText(normalizedTarget);
  const isSingleLetterTarget =
    targetTokens.length === 1 && [...targetTokens[0]].length === 1;

  if (!isSingleLetterTarget) {
    return {
      variants: [...variants],
      isSingleLetterTarget: false,
      isToneStrictSingleLetterTarget: false,
    };
  }

  const targetToken = targetTokens[0];
  const isToneStrictSingleLetterTarget =
    TONE_STRICT_SINGLE_LETTER_TARGETS.has(targetToken);
  const aliases = LETTER_PRONUNCIATION_ALIASES[targetToken] ?? [];
  for (const alias of aliases) {
    const normalizedAlias = normalizeSpeechText(alias, false);
    if (normalizedAlias) {
      variants.add(normalizedAlias);
    }
  }

  return {
    variants: [...variants],
    isSingleLetterTarget: true,
    isToneStrictSingleLetterTarget,
  };
}

function hasSingleLetterAliasTokenMatch(
  normalizedSpokenOriginal: string,
  targetVariants: string[],
  allowNoDiacriticsFallback: boolean,
): boolean {
  const spokenTokens = tokenizeNormalizedText(normalizedSpokenOriginal);
  if (spokenTokens.length === 0) return false;

  const targetVariantsSet = new Set(targetVariants);

  if (spokenTokens.some((token) => targetVariantsSet.has(token))) {
    return true;
  }
  if (!allowNoDiacriticsFallback) {
    return false;
  }

  const spokenTokensNoDiacritics = spokenTokens.map((token) =>
    normalizeSpeechText(token, true),
  );
  const targetVariantsNoDiacriticsSet = new Set(
    targetVariants.map((variant) => normalizeSpeechText(variant, true)),
  );

  return spokenTokensNoDiacritics.some((token) =>
    targetVariantsNoDiacriticsSet.has(token),
  );
}

function scorePronunciationCandidate(
  normalizedSpokenCandidateOriginal: string,
  normalizedTargetVariantOriginal: string,
): number {
  const spokenTokens = tokenizeNormalizedText(normalizedSpokenCandidateOriginal);
  const targetTokens = tokenizeNormalizedText(normalizedTargetVariantOriginal);

  if (!spokenTokens.length || !targetTokens.length) return 0;

  const count = Math.min(spokenTokens.length, targetTokens.length);
  let totalScore = 0;

  for (let i = 0; i < count; i++) {
    totalScore += getPhoneticSimilarity(spokenTokens[i], targetTokens[i]);
  }

  // Hình phạt độ dài nếu số lượng từ khác biệt đáng kể
  // (ví dụ: mục tiêu "con cá", nói "con")
  const maxLen = Math.max(spokenTokens.length, targetTokens.length);
  const lengthPenalty = count / maxLen;

  return (totalScore / count) * lengthPenalty;
}

export function getSpeechSimilarity(
  spokenText: string,
  targetText: string,
): number {
  const normalizedSpokenOriginal = normalizeSpeechText(spokenText, false);
  if (!normalizedSpokenOriginal) return 0;

  const {
    variants: targetVariants,
    isSingleLetterTarget,
    isToneStrictSingleLetterTarget,
  } = getTargetPronunciationVariants(targetText);
  if (targetVariants.length === 0) return 0;

  // Khớp Alias lạc quan (giữ logic cũ để pass đơn giản)
  // Nếu tìm thấy một token khớp chính xác với mục tiêu chữ cái đơn, pass ngay lập tức.
  if (
    isSingleLetterTarget &&
    hasSingleLetterAliasTokenMatch(
      normalizedSpokenOriginal,
      targetVariants,
      !isToneStrictSingleLetterTarget, // Chỉ cho phép khớp lỏng nếu không yêu cầu chặt về dấu
    )
  ) {
    // Kiểm tra khớp dấu chặt chẽ nếu được yêu cầu
    if (isToneStrictSingleLetterTarget) {
      // Kiểm tra xem có token nào khớp chính xác cả dấu không
       const spokenTokens = tokenizeNormalizedText(normalizedSpokenOriginal);
       const targetSet = new Set(targetVariants);
       if (spokenTokens.some(t => targetSet.has(t))) {
         return 1;
       }
       // Nếu khớp lỏng nhưng không khớp chặt, chuyển sang chấm điểm ngữ âm
    } else {
       return 1;
    }
  }

  let bestScore = 0;
  for (const targetVariant of targetVariants) {
    const targetTokenCount = tokenizeNormalizedText(targetVariant).length;
    const spokenCandidates = buildCandidatePhrases(
      normalizedSpokenOriginal,
      targetTokenCount,
    );
    for (const spokenCandidate of spokenCandidates) {
      bestScore = Math.max(
        bestScore,
        scorePronunciationCandidate(spokenCandidate, targetVariant),
      );
    }
  }

  return clamp01(bestScore);
}

export function getPronunciationScoringThresholds(
  lesson: LessonContent | undefined,
): PronunciationScoringThresholds {
  if (!lesson || lesson.type !== "active") {
    return {
      passThreshold: DEFAULT_PASS_THRESHOLD,
      oneStarThreshold: DEFAULT_ONE_STAR_THRESHOLD,
      twoStarThreshold: DEFAULT_TWO_STAR_THRESHOLD,
      maxStars: DEFAULT_MAX_STARS,
    };
  }

  const oneStarThreshold = clamp01(
    lesson.scoring?.starThresholds?.oneStar ?? DEFAULT_ONE_STAR_THRESHOLD,
  );
  const twoStarThreshold = clamp01(
    lesson.scoring?.starThresholds?.twoStars ?? DEFAULT_TWO_STAR_THRESHOLD,
  );
  const passThreshold = clamp01(
    lesson.scoring?.passThreshold ?? oneStarThreshold,
  );
  const maxStars = Math.max(0, lesson.scoring?.maxStars ?? DEFAULT_MAX_STARS);

  return {
    passThreshold,
    oneStarThreshold,
    twoStarThreshold,
    maxStars,
  };
}

export function evaluatePronunciationAttempt(
  spokenText: string,
  targetText: string,
  thresholds: PronunciationScoringThresholds,
): PronunciationScoringResult {
  const transcript = spokenText.trim();
  if (!transcript) {
    return {
      similarity: 0,
      earnedStars: 0,
      isPassed: false,
    };
  }

  const similarity = getSpeechSimilarity(transcript, targetText);
  let earnedStars = 0;

  if (similarity >= thresholds.twoStarThreshold) {
    earnedStars = 2;
  } else if (similarity >= thresholds.oneStarThreshold) {
    earnedStars = 1;
  }

  earnedStars = Math.min(thresholds.maxStars, earnedStars);

  return {
    similarity,
    earnedStars,
    isPassed: similarity >= thresholds.passThreshold,
  };
}
