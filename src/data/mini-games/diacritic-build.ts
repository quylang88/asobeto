import {
  ChallengePassStarRule,
  DiacriticBuildGameConfig,
  DiacriticBuildLevelConfig,
  DiacriticBuildLevelId,
} from "../world-1-alphabet/map-structure";

export const DIACRITIC_BUILD_GAME_TITLE = "Dấu kỳ diệu";
export const DIACRITIC_BUILD_GAME_INSTRUCTION =
  "Chạm đúng dấu để ghép chữ mục tiêu.";
export const DIACRITIC_BUILD_GAME_RULES = [
  "Chạm đúng dấu để ghép chữ cái mục tiêu.",
  "Chạm rác sẽ bị trừ tim, để dấu rơi lọt không bị trừ tim.",
];

const DIACRITIC_PASS_STAR_RULES_BY_LEVEL: Record<
  Exclude<DiacriticBuildLevelId, "easy">,
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

const DIACRITIC_LEVEL_PRESETS: Record<
  DiacriticBuildLevelId,
  DiacriticBuildLevelConfig
> = {
  easy: {
    id: "easy",
    label: "Dễ",
    starsReward: 1,
    durationSeconds: 35,
    targetCompletions: 10,
    startLives: 4,
    correctSpawnRatioRange: {
      min: 0.55,
      max: 0.6,
    },
    spawnIntervalMs: {
      min: 760,
      max: 940,
    },
    fallDurationSeconds: {
      min: 3.7,
      max: 4.3,
    },
    objectSize: {
      min: 58,
      max: 66,
    },
    maxConsecutiveDebris: 3,
    slotFlightMs: {
      min: 250,
      max: 350,
    },
    morphResetDelayMs: {
      min: 400,
      max: 600,
    },
  },
  normal: {
    id: "normal",
    label: "Vừa",
    starsReward: 2,
    passStarRules: DIACRITIC_PASS_STAR_RULES_BY_LEVEL.normal,
    durationSeconds: 35,
    targetCompletions: 15,
    startLives: 3,
    correctSpawnRatioRange: {
      min: 0.45,
      max: 0.5,
    },
    spawnIntervalMs: {
      min: 520,
      max: 720,
    },
    fallDurationSeconds: {
      min: 2.6,
      max: 3.0,
    },
    objectSize: {
      min: 56,
      max: 64,
    },
    maxConsecutiveDebris: 3,
    slotFlightMs: {
      min: 250,
      max: 350,
    },
    morphResetDelayMs: {
      min: 400,
      max: 600,
    },
  },
  hard: {
    id: "hard",
    label: "Khó",
    starsReward: 3,
    passStarRules: DIACRITIC_PASS_STAR_RULES_BY_LEVEL.hard,
    durationSeconds: 35,
    targetCompletions: 20,
    startLives: 2,
    correctSpawnRatioRange: {
      min: 0.3,
      max: 0.4,
    },
    spawnIntervalMs: {
      min: 420,
      max: 620,
    },
    fallDurationSeconds: {
      min: 2.0,
      max: 2.4,
    },
    objectSize: {
      min: 54,
      max: 62,
    },
    maxConsecutiveDebris: 3,
    slotFlightMs: {
      min: 250,
      max: 350,
    },
    morphResetDelayMs: {
      min: 400,
      max: 600,
    },
  },
};

export interface DiacriticBuildGameDataInput {
  targetLetter: string;
  baseLetter: string;
  markerSymbol: string;
  debrisSymbols: string[];
  title?: string;
  headerTitle?: string;
  instruction?: string;
  rules?: string[];
  countdownHintText?: string;
  levelOverrides?: Partial<
    Record<DiacriticBuildLevelId, Partial<DiacriticBuildLevelConfig>>
  >;
}

export function createDiacriticBuildLevelConfigs({
  levelOverrides,
}: Pick<DiacriticBuildGameDataInput, "levelOverrides">): DiacriticBuildLevelConfig[] {
  const levelIds: DiacriticBuildLevelId[] = ["easy", "normal", "hard"];

  return levelIds.map((levelId) => {
    const preset = DIACRITIC_LEVEL_PRESETS[levelId];
    const override = levelOverrides?.[levelId];

    const merged = {
      ...preset,
      ...(override ?? {}),
      correctSpawnRatioRange: {
        ...preset.correctSpawnRatioRange,
        ...(override?.correctSpawnRatioRange ?? {}),
      },
      spawnIntervalMs: {
        ...preset.spawnIntervalMs,
        ...(override?.spawnIntervalMs ?? {}),
      },
      fallDurationSeconds: {
        ...preset.fallDurationSeconds,
        ...(override?.fallDurationSeconds ?? {}),
      },
      objectSize: {
        ...preset.objectSize,
        ...(override?.objectSize ?? {}),
      },
      slotFlightMs: {
        ...preset.slotFlightMs,
        ...(override?.slotFlightMs ?? {}),
      },
      morphResetDelayMs: {
        ...preset.morphResetDelayMs,
        ...(override?.morphResetDelayMs ?? {}),
      },
      passStarRules:
        override?.passStarRules ?? preset.passStarRules
          ? [...(override?.passStarRules ?? preset.passStarRules ?? [])]
          : undefined,
    } satisfies DiacriticBuildLevelConfig;

    return merged;
  });
}

export function createDiacriticBuildGameConfig({
  targetLetter,
  baseLetter,
  markerSymbol,
  debrisSymbols,
  title,
  headerTitle,
  instruction,
  rules,
  countdownHintText,
  levelOverrides,
}: DiacriticBuildGameDataInput): DiacriticBuildGameConfig {
  const normalizedTargetLetter = targetLetter.trim().toLocaleLowerCase("vi-VN");
  const normalizedBaseLetter = baseLetter.trim().toLocaleLowerCase("vi-VN");
  const normalizedMarker = markerSymbol.trim();
  const normalizedDebris = debrisSymbols
    .map((symbol) => symbol.trim())
    .filter((symbol) => symbol.length > 0);
  const resolvedRules = rules ?? DIACRITIC_BUILD_GAME_RULES;

  return {
    title: title ?? "Chọn mức độ",
    headerTitle: headerTitle ?? DIACRITIC_BUILD_GAME_TITLE,
    instruction: instruction ?? DIACRITIC_BUILD_GAME_INSTRUCTION,
    rules: resolvedRules,
    rulesAudioText: resolvedRules.join(" "),
    countdownHintText:
      countdownHintText?.trim() || normalizedTargetLetter.toLocaleUpperCase("vi-VN"),
    targetLetter: normalizedTargetLetter,
    baseLetter: normalizedBaseLetter,
    markerSymbol: normalizedMarker,
    debrisSymbols:
      normalizedDebris.length > 0 ? normalizedDebris : ["★", "✦", "⬢"],
    laneCount: 3,
    playfieldFooterRatio: 0.24,
    playfieldHeightVh: 62,
    hitboxScale: 1.15,
    tutorial: {
      enabledLevelId: "easy",
      durationMs: 5000,
      replayAfterFailCount: 2,
    },
    levels: createDiacriticBuildLevelConfigs({ levelOverrides }),
  };
}
