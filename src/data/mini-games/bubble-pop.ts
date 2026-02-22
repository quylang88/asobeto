import type {
  BubblePopGameConfig,
  BubblePopLevelConfig,
  BubblePopLevelId,
  ChallengePassStarRule,
} from "../world-1-alphabet";
import { AUDIO } from "../audio";

export const BUBBLE_GAME_TITLE = "Bóng bay chữ";
export const BUBBLE_GAME_INSTRUCTION =
  "Chạm đúng bóng bay chữ theo yêu cầu để săn sao.";
export const BUBBLE_GAME_RULES_TEXT =
  "Bé hãy chạm vào bóng bay chữ theo yêu cầu.";

const BUBBLE_PASS_STAR_RULES_BY_LEVEL: Record<
  Exclude<BubblePopLevelId, "easy">,
  ChallengePassStarRule[]
> = {
  normal: [
    {
      stars: 2,
      maxLivesLost: 0,
    },
    {
      stars: 1,
      minLivesLost: 1,
    },
  ],
  hard: [
    {
      stars: 3,
      maxLivesLost: 0,
      minTimeLeftExclusive: 9,
    },
    {
      stars: 2,
      maxLivesLost: 0,
      maxTimeLeftInclusive: 9,
    },
    {
      stars: 1,
      minLivesLost: 1,
    },
  ],
};

const BUBBLE_LEVEL_PRESETS: Record<BubblePopLevelId, BubblePopLevelConfig> = {
  easy: {
    id: "easy",
    label: "Dễ",
    starsReward: 1,
    durationSeconds: 35,
    targetScore: 10,
    minLivesToPass: 3,
    targetBubbleRatio: 0.8,
    emptyBubbleRatio: 0.1,
    bubbleSize: 112,
    spawnIntervalMs: {
      min: 860,
      max: 1040,
    },
    speedRange: {
      min: 62,
      max: 88,
    },
  },
  normal: {
    id: "normal",
    label: "Vừa",
    starsReward: 2,
    passStarRules: BUBBLE_PASS_STAR_RULES_BY_LEVEL.normal,
    durationSeconds: 35,
    targetScore: 15,
    minLivesToPass: 2,
    targetBubbleRatio: 0.6,
    emptyBubbleRatio: 0.12,
    bubbleSize: 96,
    spawnIntervalMs: {
      min: 720,
      max: 900,
    },
    speedRange: {
      min: 90,
      max: 126,
    },
  },
  hard: {
    id: "hard",
    label: "Khó",
    starsReward: 3,
    passStarRules: BUBBLE_PASS_STAR_RULES_BY_LEVEL.hard,
    durationSeconds: 30,
    targetScore: 20,
    minLivesToPass: 2,
    targetBubbleRatio: 0.5,
    emptyBubbleRatio: 0.1,
    bubbleSize: 82,
    spawnIntervalMs: {
      min: 600,
      max: 760,
    },
    speedRange: {
      min: 126,
      max: 182,
    },
    allowPairSpawn: true,
    pairSpawnChance: 0.25,
  },
};

export interface BubblePopGameDataInput {
  targetLetters: [string, string];
  targetAudioByLetter?: Record<string, string>;
  title?: string;
  headerTitle?: string;
  instruction?: string;
  rulesText?: string;
  audio?: Partial<BubblePopGameConfig["audio"]>;
  levelOverrides?: Partial<
    Record<BubblePopLevelId, Partial<BubblePopLevelConfig>>
  >;
}

export function createBubblePopLevelConfigs({
  levelOverrides,
}: Pick<BubblePopGameDataInput, "levelOverrides">): BubblePopLevelConfig[] {
  const levelIds: BubblePopLevelId[] = ["easy", "normal", "hard"];

  return levelIds.map((levelId) => {
    const preset = BUBBLE_LEVEL_PRESETS[levelId];
    const override = levelOverrides?.[levelId];
    const merged = {
      ...preset,
      ...(override ?? {}),
      spawnIntervalMs: {
        ...preset.spawnIntervalMs,
        ...(override?.spawnIntervalMs ?? {}),
      },
      speedRange: {
        ...preset.speedRange,
        ...(override?.speedRange ?? {}),
      },
      passStarRules:
        override?.passStarRules ?? preset.passStarRules
          ? [...(override?.passStarRules ?? preset.passStarRules ?? [])]
          : undefined,
    } satisfies BubblePopLevelConfig;

    return merged;
  });
}

export function createBubblePopGameConfig({
  targetLetters,
  targetAudioByLetter,
  title,
  headerTitle,
  instruction,
  rulesText,
  audio,
  levelOverrides,
}: BubblePopGameDataInput): BubblePopGameConfig {
  const resolvedRulesText = rulesText ?? BUBBLE_GAME_RULES_TEXT;
  const resolvedAudio = {
    targetBubbleHit: AUDIO.GAME.COMMON.POP,
    wrongBubbleHit: AUDIO.FEEDBACK.WRONG_ANSWER,
    ...(audio ?? {}),
  } satisfies BubblePopGameConfig["audio"];

  return {
    title: title ?? "Chọn mức độ",
    headerTitle: headerTitle ?? "Bóng bay chữ",
    instruction: instruction ?? BUBBLE_GAME_RULES_TEXT,
    rules: [resolvedRulesText],
    rulesAudioText: resolvedRulesText,
    introAudio: AUDIO.GAME.BUBBLE_POP.INTRO,
    audio: resolvedAudio,
    targetAudioByLetter,
    startLives: 3,
    targetLetters,
    laneCount: 5,
    minSpawnVerticalGap: 94,
    levels: createBubblePopLevelConfigs({ levelOverrides }),
  };
}
