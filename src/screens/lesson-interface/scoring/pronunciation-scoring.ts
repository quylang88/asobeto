import type { LessonContent } from "@/data/game-config";

const DEFAULT_ONE_STAR_THRESHOLD = 0.5;
const DEFAULT_TWO_STAR_THRESHOLD = 0.75;
const DEFAULT_MAX_STARS = 2;

export interface PronunciationScoringThresholds {
  oneStarThreshold: number;
  twoStarThreshold: number;
  maxStars: number;
}

export interface PronunciationScoringResult {
  similarity: number;
  earnedStars: number;
  isPassed: boolean;
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
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

export function getSpeechSimilarity(spokenText: string, targetText: string): number {
  const spokenOriginal = normalizeSpeechText(spokenText, false);
  const targetOriginal = normalizeSpeechText(targetText, false);
  const spokenNoDiacritics = normalizeSpeechText(spokenText, true);
  const targetNoDiacritics = normalizeSpeechText(targetText, true);

  const directScore = getNormalizedSimilarity(spokenOriginal, targetOriginal);
  const noDiacriticsScore = getNormalizedSimilarity(
    spokenNoDiacritics,
    targetNoDiacritics,
  );

  return Math.max(directScore, noDiacriticsScore);
}

export function getPronunciationScoringThresholds(
  lesson: LessonContent | undefined,
): PronunciationScoringThresholds {
  if (!lesson || lesson.type !== "active") {
    return {
      oneStarThreshold: DEFAULT_ONE_STAR_THRESHOLD,
      twoStarThreshold: DEFAULT_TWO_STAR_THRESHOLD,
      maxStars: DEFAULT_MAX_STARS,
    };
  }

  return {
    oneStarThreshold:
      lesson.scoring?.starThresholds?.oneStar ?? DEFAULT_ONE_STAR_THRESHOLD,
    twoStarThreshold:
      lesson.scoring?.starThresholds?.twoStars ?? DEFAULT_TWO_STAR_THRESHOLD,
    maxStars: lesson.scoring?.maxStars ?? DEFAULT_MAX_STARS,
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
    isPassed: similarity >= thresholds.oneStarThreshold,
  };
}
