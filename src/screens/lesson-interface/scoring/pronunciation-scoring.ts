import type { LessonContent } from "@/data/game-config";

const DEFAULT_ONE_STAR_THRESHOLD = 0.5;
const DEFAULT_TWO_STAR_THRESHOLD = 0.8;
const DEFAULT_MAX_STARS = 2;
const DEFAULT_PASS_THRESHOLD = 0.7;

const VOWEL_CHARS = new Set(["a", "e", "i", "o", "u", "y"]);

const LETTER_PRONUNCIATION_ALIASES: Record<string, string[]> = {
  a: ["a"],
  ă: ["ă", "á"],
  â: ["â", "ớ"],
  b: ["bê", "bờ"],
  c: ["cờ", "xê"],
  d: ["dê", "dờ"],
  đ: ["đê", "đờ"],
  e: ["e"],
  ê: ["ê"],
  g: ["giờ", "giê"],
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

type VietnameseTone = "level" | "sac" | "huyen" | "hoi" | "nga" | "nang";

interface ToneComparisonStats {
  averageScore: number;
  pairCount: number;
  mismatchCount: number;
  strongMismatchCount: number;
}

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

function getLevenshteinDistance(a: string, b: string): number {
  if (!a) return b.length;
  if (!b) return a.length;

  const previousRow = new Array(b.length + 1);
  const currentRow = new Array(b.length + 1);

  for (let j = 0; j <= b.length; j += 1) {
    previousRow[j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    currentRow[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      currentRow[j] = Math.min(
        currentRow[j - 1] + 1,
        previousRow[j] + 1,
        previousRow[j - 1] + cost,
      );
    }
    for (let j = 0; j <= b.length; j += 1) {
      previousRow[j] = currentRow[j];
    }
  }

  return previousRow[b.length];
}

function getNormalizedSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const maxLength = Math.max(a.length, b.length);
  if (maxLength <= 0) return 1;
  return Math.max(0, 1 - getLevenshteinDistance(a, b) / maxLength);
}

function detectVietnameseTone(syllable: string): VietnameseTone {
  const decomposed = syllable.normalize("NFD");
  if (decomposed.includes("\u0301")) return "sac";
  if (decomposed.includes("\u0300")) return "huyen";
  if (decomposed.includes("\u0309")) return "hoi";
  if (decomposed.includes("\u0303")) return "nga";
  if (decomposed.includes("\u0323")) return "nang";
  return "level";
}

function splitSyllableShape(syllable: string): {
  onset: string;
  nucleus: string;
  coda: string;
} {
  if (!syllable) {
    return { onset: "", nucleus: "", coda: "" };
  }

  const characters = [...syllable];
  const firstVowelIndex = characters.findIndex((char) => VOWEL_CHARS.has(char));
  if (firstVowelIndex < 0) {
    return {
      onset: syllable,
      nucleus: "",
      coda: "",
    };
  }

  let lastVowelIndex = firstVowelIndex;
  for (
    let index = characters.length - 1;
    index >= firstVowelIndex;
    index -= 1
  ) {
    if (VOWEL_CHARS.has(characters[index])) {
      lastVowelIndex = index;
      break;
    }
  }

  return {
    onset: characters.slice(0, firstVowelIndex).join(""),
    nucleus: characters.slice(firstVowelIndex, lastVowelIndex + 1).join(""),
    coda: characters.slice(lastVowelIndex + 1).join(""),
  };
}

function getSyllableShapeSimilarity(
  spokenNoDiacriticsSyllable: string,
  targetNoDiacriticsSyllable: string,
): number {
  const spokenShape = splitSyllableShape(spokenNoDiacriticsSyllable);
  const targetShape = splitSyllableShape(targetNoDiacriticsSyllable);
  const onsetScore = spokenShape.onset === targetShape.onset ? 1 : 0;
  const nucleusScore =
    !spokenShape.nucleus && !targetShape.nucleus
      ? 1
      : getNormalizedSimilarity(spokenShape.nucleus, targetShape.nucleus);
  const codaScore = spokenShape.coda === targetShape.coda ? 1 : 0;

  return clamp01(onsetScore * 0.3 + nucleusScore * 0.55 + codaScore * 0.15);
}

function getShapeSimilarity(
  spokenNoDiacritics: string,
  targetNoDiacritics: string,
): number {
  const spokenTokens = tokenizeNormalizedText(spokenNoDiacritics);
  const targetTokens = tokenizeNormalizedText(targetNoDiacritics);
  if (!spokenTokens.length || !targetTokens.length) return 0;

  const pairCount = Math.min(spokenTokens.length, targetTokens.length);
  let sum = 0;

  for (let index = 0; index < pairCount; index += 1) {
    sum += getSyllableShapeSimilarity(spokenTokens[index], targetTokens[index]);
  }

  const averageShapeScore = sum / pairCount;
  const lengthPenalty =
    pairCount / Math.max(spokenTokens.length, targetTokens.length);
  return clamp01(averageShapeScore * lengthPenalty);
}

function getToneComparisonStats(
  spokenText: string,
  targetText: string,
): ToneComparisonStats {
  const spokenTokens = tokenizeNormalizedText(spokenText);
  const targetTokens = tokenizeNormalizedText(targetText);
  if (!spokenTokens.length || !targetTokens.length) {
    return {
      averageScore: 0,
      pairCount: 0,
      mismatchCount: 0,
      strongMismatchCount: 0,
    };
  }

  const pairCount = Math.min(spokenTokens.length, targetTokens.length);
  let toneSum = 0;
  let mismatchCount = 0;
  let strongMismatchCount = 0;

  for (let index = 0; index < pairCount; index += 1) {
    const spokenTone = detectVietnameseTone(spokenTokens[index]);
    const targetTone = detectVietnameseTone(targetTokens[index]);

    if (spokenTone === targetTone) {
      toneSum += 1;
      continue;
    }

    mismatchCount += 1;
    if (spokenTone === "level" || targetTone === "level") {
      toneSum += 0.35;
      continue;
    }

    strongMismatchCount += 1;
    toneSum += 0.05;
  }

  const averageToneScore = toneSum / pairCount;
  const lengthPenalty =
    pairCount / Math.max(spokenTokens.length, targetTokens.length);
  return {
    averageScore: clamp01(averageToneScore * lengthPenalty),
    pairCount,
    mismatchCount,
    strongMismatchCount,
  };
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

function getTargetPronunciationVariants(targetText: string): string[] {
  const normalizedTarget = normalizeSpeechText(targetText, false);
  if (!normalizedTarget) return [];

  const variants = new Set<string>([normalizedTarget]);
  const targetTokens = tokenizeNormalizedText(normalizedTarget);
  if (targetTokens.length !== 1) {
    return [...variants];
  }

  const targetToken = targetTokens[0];
  if ([...targetToken].length !== 1) {
    return [...variants];
  }

  const aliases = LETTER_PRONUNCIATION_ALIASES[targetToken] ?? [];
  if (aliases.length > 0) {
    variants.clear();
  }
  for (const alias of aliases) {
    const normalizedAlias = normalizeSpeechText(alias, false);
    if (normalizedAlias) {
      variants.add(normalizedAlias);
    }
  }

  return [...variants];
}

function scorePronunciationCandidate(
  normalizedSpokenCandidateOriginal: string,
  normalizedTargetVariantOriginal: string,
): number {
  const normalizedSpokenCandidateNoDiacritics = normalizeSpeechText(
    normalizedSpokenCandidateOriginal,
    true,
  );
  const normalizedTargetVariantNoDiacritics = normalizeSpeechText(
    normalizedTargetVariantOriginal,
    true,
  );

  const directScore = getNormalizedSimilarity(
    normalizedSpokenCandidateOriginal,
    normalizedTargetVariantOriginal,
  );
  const noDiacriticsScore = getNormalizedSimilarity(
    normalizedSpokenCandidateNoDiacritics,
    normalizedTargetVariantNoDiacritics,
  );
  const shapeScore = getShapeSimilarity(
    normalizedSpokenCandidateNoDiacritics,
    normalizedTargetVariantNoDiacritics,
  );
  const toneStats = getToneComparisonStats(
    normalizedSpokenCandidateOriginal,
    normalizedTargetVariantOriginal,
  );
  const toneScore = toneStats.averageScore;

  const baseScore = clamp01(
    noDiacriticsScore * 0.3 +
      directScore * 0.3 +
      shapeScore * 0.25 +
      toneScore * 0.15,
  );

  const mismatchRatio =
    toneStats.pairCount > 0 ? toneStats.mismatchCount / toneStats.pairCount : 0;
  const strongMismatchRatio =
    toneStats.pairCount > 0
      ? toneStats.strongMismatchCount / toneStats.pairCount
      : 0;

  let toneGate = 1 - mismatchRatio * 0.55 - strongMismatchRatio * 0.3;
  toneGate = Math.max(0.18, toneGate);

  // Nếu phần âm tiết gần như trùng hoàn toàn mà chỉ lệch thanh, khóa điểm lại để không thể pass cao.
  if (
    strongMismatchRatio > 0 &&
    noDiacriticsScore >= 0.95 &&
    shapeScore >= 0.95
  ) {
    toneGate = Math.min(toneGate, 0.35);
  }

  return clamp01(baseScore * toneGate);
}

export function getSpeechSimilarity(
  spokenText: string,
  targetText: string,
): number {
  const normalizedSpokenOriginal = normalizeSpeechText(spokenText, false);
  if (!normalizedSpokenOriginal) return 0;

  const targetVariants = getTargetPronunciationVariants(targetText);
  if (targetVariants.length === 0) return 0;

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
