import type { LessonContent } from "@/data/game-config";
import type { WordBuildSlotPlacement, WordBuildToken } from "./types";

const DEFAULT_FLOOR_MAX_STARS = 3;

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
  // Chỉ dùng dấu hỏi thanh (không kèm vòng tròn nền).
  if (normalizedTokenId.includes("hoi")) return "̉";
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
