import type { LessonContent } from "@/data/game-config";
import type { WordBuildSlotPlacement, WordBuildToken } from "./types";

const DEFAULT_FLOOR_MAX_STARS = 3;

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

export function getSpeedLabel(speed: string): string {
  if (speed === "slow") return "Chậm";
  if (speed === "fast") return "Nhanh";
  return "Thường";
}

function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

export function getWordBuildTokenDisplayText(token: WordBuildToken): string {
  if (token.kind !== "tone") return token.text;

  const normalizedTokenId = token.id.toLocaleLowerCase("vi-VN");
  if (normalizedTokenId.includes("sac")) return "´";
  if (normalizedTokenId.includes("huyen")) return "`";
  if (normalizedTokenId.includes("nga")) return "~";
  if (normalizedTokenId.includes("hoi")) return "?";
  if (normalizedTokenId.includes("nang")) return "•";

  return token.text;
}

export function getWordBuildSlotPlacements(tokens: WordBuildToken[]): {
  placements: WordBuildSlotPlacement[];
  columnCount: number;
} {
  let columnCount = 0;
  let lastLetterColumn = 0;
  const placements: WordBuildSlotPlacement[] = [];

  tokens.forEach((token, slotIndex) => {
    if (token.kind === "letter") {
      columnCount += 1;
      lastLetterColumn = columnCount;
      placements.push({
        slotIndex,
        column: columnCount,
        row: 1,
      });
      return;
    }

    const normalizedTokenId = token.id.toLocaleLowerCase("vi-VN");
    const normalizedTokenText = token.text.toLocaleLowerCase("vi-VN");
    const isDotBelowTone =
      normalizedTokenId.includes("nang") || normalizedTokenText.includes("nặng");
    const anchorColumn = lastLetterColumn || Math.max(1, columnCount);

    placements.push({
      slotIndex,
      column: anchorColumn,
      row: isDotBelowTone ? 2 : 0,
    });
  });

  return {
    placements,
    columnCount: Math.max(1, columnCount),
  };
}

export function getPreviewTextSizeClass(value: string): string {
  const charCount = [...value].length;
  if (charCount <= 1) return "text-[10rem] md:text-[11rem]";
  if (charCount === 2) return "text-[8.5rem] md:text-[9.5rem]";
  return "text-7xl md:text-8xl";
}

export function getLessonMaxStars(lesson: LessonContent): number {
  if (lesson.type !== "active") return 0;
  return lesson.scoring?.maxStars ?? 0;
}

export function getAttemptFloorStars(
  lessons: LessonContent[],
  lessonStars: Record<string, number>,
  floorMaxStars: number = DEFAULT_FLOOR_MAX_STARS,
): number {
  const totalPossibleStars = lessons.reduce(
    (sum, lesson) => sum + getLessonMaxStars(lesson),
    0,
  );
  const earnedStars = lessons.reduce((sum, lesson) => {
    if (lesson.type !== "active") return sum;
    return sum + (lessonStars[lesson.id] ?? 0);
  }, 0);

  if (totalPossibleStars <= 0) {
    return floorMaxStars;
  }

  return Math.max(0, Math.min(floorMaxStars, Math.round(earnedStars)));
}

export function getWordBuildStateForLesson(
  lesson: LessonContent | undefined,
): {
  tokenOrder: string[];
  slotTokenIds: Array<string | null>;
} {
  if (!lesson || lesson.lessonKind !== "vocab_word_build") {
    return {
      tokenOrder: [],
      slotTokenIds: [],
    };
  }

  const expectedTokens = lesson.targetTokens ?? [];
  const sourceTokens = lesson.instruction
    ? (lesson.tokenPool ?? expectedTokens)
    : expectedTokens;

  return {
    tokenOrder: shuffleArray(sourceTokens.map((token) => token.id)),
    slotTokenIds: Array.from({ length: expectedTokens.length }, () => null),
  };
}

export function getTracePracticeLessonIdFromDemoLessonId(
  demoLessonId: string | undefined,
): string | null {
  if (!demoLessonId) return null;
  const pairedLessonId = demoLessonId.replace(/-l3$/, "-l4");
  return pairedLessonId === demoLessonId ? null : pairedLessonId;
}
