import {
  AnimalFeedGameConfig,
  AnimalFeedLevelConfig,
  AnimalFeedLevelId,
  AnimalFeedProgressSegment,
} from "../world-1-alphabet/map-structure";

export const ANIMAL_FEED_GAME_TITLE = "Bò ăn cỏ";
export const ANIMAL_FEED_GAME_INSTRUCTION =
  "Chạm đúng bụi cỏ để cho bò ăn từng miếng.";
export const ANIMAL_FEED_GAME_RULES = [
  "Mỗi lượt có 2 bụi cỏ: 1 bụi đúng là cỏ, 1 bụi gây nhiễu.",
  "Chạm đúng cỏ để bò ăn và tăng tiến độ câu bò ăn cỏ.",
  "Chạm sai hoặc hết giờ sẽ mất 1 tim.",
];

const DEFAULT_SENTENCE_TOKENS = ["bò", "ăn", "cỏ"] as const;
const DEFAULT_DISTRACTOR_WORDS = ["co", "cò", "có"] as const;

const LEVEL_PRESETS: Record<AnimalFeedLevelId, AnimalFeedLevelConfig> = {
  easy: {
    id: "easy",
    label: "Dễ",
    starsReward: 1,
    roundDurationSeconds: 5,
    startLives: 4,
    easyHintSecondsLeft: 3,
    progressSegments: buildProgressSegments(DEFAULT_SENTENCE_TOKENS, 2),
  },
  normal: {
    id: "normal",
    label: "Vừa",
    starsReward: 2,
    roundDurationSeconds: 4,
    startLives: 4,
    progressSegments: buildProgressSegments(DEFAULT_SENTENCE_TOKENS, 2),
  },
  hard: {
    id: "hard",
    label: "Khó",
    starsReward: 3,
    roundDurationSeconds: 3,
    startLives: 3,
    progressSegments: buildProgressSegments(DEFAULT_SENTENCE_TOKENS, 3),
  },
};

export interface AnimalFeedGameDataInput {
  title?: string;
  headerTitle?: string;
  instruction?: string;
  rules?: string[];
  animalIconId?: string;
  foodVisualId?: string;
  progressSentence?: string;
  sentenceTokens?: string[];
  correctWord?: string;
  distractorWords?: [string, string, string];
  antiRepeatMaxDistractorStreak?: number;
  antiRepeatMaxCorrectSideStreak?: number;
  timeoutRevealMs?: number;
  correctResolveMs?: number;
  wrongResolveMs?: number;
  timeoutResolveMs?: number;
  sentenceCelebrateMs?: number;
  animalChewMs?: number;
  animalSadMs?: number;
  tutorialDurationMs?: number;
  tutorialReplayAfterFailCount?: number;
  levelOverrides?: Partial<
    Record<AnimalFeedLevelId, Partial<AnimalFeedLevelConfig>>
  >;
}

export function createAnimalFeedLevelConfigs({
  sentenceTokens,
  levelOverrides,
}: Pick<AnimalFeedGameDataInput, "sentenceTokens" | "levelOverrides">): AnimalFeedLevelConfig[] {
  const normalizedTokens = normalizeSentenceTokens(sentenceTokens);
  const levelIds: AnimalFeedLevelId[] = ["easy", "normal", "hard"];

  return levelIds.map((levelId) => {
    const preset = LEVEL_PRESETS[levelId];
    const override = levelOverrides?.[levelId];
    const fallbackRequiredHits = levelId === "hard" ? 3 : 2;
    const fallbackSegments = buildProgressSegments(
      normalizedTokens,
      fallbackRequiredHits,
    );
    const merged = {
      ...preset,
      ...(override ?? {}),
      progressSegments: normalizeProgressSegments(
        override?.progressSegments ?? preset.progressSegments,
        fallbackSegments,
      ),
      easyHintSecondsLeft:
        levelId === "easy"
          ? clampHintSeconds(
              override?.easyHintSecondsLeft ?? preset.easyHintSecondsLeft,
            )
          : undefined,
      roundDurationSeconds: clampInteger(
        override?.roundDurationSeconds ?? preset.roundDurationSeconds,
        2,
        12,
      ),
      startLives: clampInteger(override?.startLives ?? preset.startLives, 1, 8),
    } satisfies AnimalFeedLevelConfig;

    return merged;
  });
}

export function createAnimalFeedGameConfig(
  input: AnimalFeedGameDataInput = {},
): AnimalFeedGameConfig {
  const sentenceTokens = normalizeSentenceTokens(input.sentenceTokens);
  const distractorWords = normalizeDistractorWords(input.distractorWords);
  const correctWord =
    input.correctWord?.trim().toLocaleLowerCase("vi-VN") || "cỏ";
  const rules = input.rules?.length ? input.rules : ANIMAL_FEED_GAME_RULES;

  return {
    title: input.title ?? "Chọn mức độ",
    headerTitle: input.headerTitle ?? ANIMAL_FEED_GAME_TITLE,
    instruction: input.instruction ?? ANIMAL_FEED_GAME_INSTRUCTION,
    rules,
    animalIconId: input.animalIconId?.trim() || "bof",
    foodVisualId: input.foodVisualId?.trim() || "grass-bush",
    progressSentence:
      input.progressSentence?.trim() ||
      sentenceTokens.map((token) => token.trim()).join(" "),
    sentenceTokens,
    correctWord,
    distractorWords,
    antiRepeatMaxDistractorStreak: clampInteger(
      input.antiRepeatMaxDistractorStreak ?? 2,
      1,
      4,
    ),
    antiRepeatMaxCorrectSideStreak: clampInteger(
      input.antiRepeatMaxCorrectSideStreak ?? 2,
      1,
      4,
    ),
    timeoutRevealMs: clampInteger(input.timeoutRevealMs ?? 300, 120, 1200),
    correctResolveMs: clampInteger(input.correctResolveMs ?? 1600, 240, 2000),
    wrongResolveMs: clampInteger(input.wrongResolveMs ?? 2500, 220, 3000),
    timeoutResolveMs: clampInteger(input.timeoutResolveMs ?? 2500, 320, 3000),
    sentenceCelebrateMs: clampInteger(
      input.sentenceCelebrateMs ?? 1800,
      400,
      3000,
    ),
    animalChewMs: clampInteger(input.animalChewMs ?? 1200, 200, 2000),
    animalSadMs: clampInteger(input.animalSadMs ?? 1000, 180, 1600),
    tutorial: {
      enabledLevelId: "easy",
      durationMs: clampInteger(input.tutorialDurationMs ?? 6800, 4000, 10000),
      replayAfterFailCount: clampInteger(
        input.tutorialReplayAfterFailCount ?? 2,
        1,
        8,
      ),
    },
    levels: createAnimalFeedLevelConfigs({
      sentenceTokens,
      levelOverrides: input.levelOverrides,
    }),
  };
}

function buildProgressSegments(
  tokens: readonly string[],
  requiredHits: number,
): AnimalFeedProgressSegment[] {
  return tokens.map((token, index) => ({
    id: `token-${index + 1}`,
    label: token,
    requiredHits,
  }));
}

function normalizeSentenceTokens(tokens?: string[]): string[] {
  const source = tokens?.length ? tokens : [...DEFAULT_SENTENCE_TOKENS];
  const normalized = source
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
  if (!normalized.length) return [...DEFAULT_SENTENCE_TOKENS];
  return normalized.slice(0, 5);
}

function normalizeDistractorWords(
  distractors?: [string, string, string],
): [string, string, string] {
  if (!distractors) {
    return [...DEFAULT_DISTRACTOR_WORDS];
  }
  const normalized = distractors
    .map((word) => word.trim().toLocaleLowerCase("vi-VN"))
    .filter((word) => word.length > 0);
  while (normalized.length < 3) {
    normalized.push(DEFAULT_DISTRACTOR_WORDS[normalized.length]);
  }
  return [normalized[0], normalized[1], normalized[2]];
}

function normalizeProgressSegments(
  provided: AnimalFeedProgressSegment[] | undefined,
  fallback: AnimalFeedProgressSegment[],
): AnimalFeedProgressSegment[] {
  if (!provided?.length) return fallback;

  const normalized = provided
    .map((segment, index) => {
      const label = segment.label?.trim();
      if (!label) return null;
      return {
        id: segment.id?.trim() || `token-${index + 1}`,
        label,
        requiredHits: clampInteger(segment.requiredHits, 1, 4),
      } satisfies AnimalFeedProgressSegment;
    })
    .filter(
      (segment): segment is AnimalFeedProgressSegment => segment !== null,
    );

  if (!normalized.length) return fallback;
  return normalized;
}

function clampHintSeconds(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 3;
  return Math.max(1, Math.min(5, Math.round(value)));
}

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}
