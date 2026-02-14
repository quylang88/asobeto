import {
  MemoryFlipCardBackOption,
  MemoryFlipCardToken,
  MemoryFlipGameConfig,
  MemoryFlipLevelConfig,
  MemoryFlipLevelId,
  MemoryFlipMoveStarRule,
} from "../world-1-alphabet/map-structure";

export const MEMORY_FLIP_GAME_TITLE = "Trí nhớ";
export const MEMORY_FLIP_GAME_INSTRUCTION =
  "Lật 2 thẻ giống nhau để xóa hết các cặp.";
export const MEMORY_FLIP_GAME_RULES = [
  "Mỗi lượt bé lật 2 thẻ.",
  "Giống nhau thì thẻ biến mất.",
  "Khác nhau thì thẻ tự úp lại.",
];

const NORMAL_PASS_STAR_RULES: MemoryFlipMoveStarRule[] = [
  {
    stars: 2,
    maxMovesInclusive: 18,
  },
  {
    stars: 1,
    minMovesInclusive: 19,
    maxMovesInclusive: 22,
  },
];

const HARD_PASS_STAR_RULES: MemoryFlipMoveStarRule[] = [
  {
    stars: 3,
    maxMovesInclusive: 20,
  },
  {
    stars: 2,
    minMovesInclusive: 21,
    maxMovesInclusive: 25,
  },
  {
    stars: 1,
    minMovesInclusive: 26,
    maxMovesInclusive: 35,
  },
];

const MEMORY_LEVEL_PRESETS: Record<MemoryFlipLevelId, MemoryFlipLevelConfig> = {
  easy: {
    id: "easy",
    label: "Dễ",
    starsReward: 1,
    pairTarget: 6,
    grid: {
      columns: 3,
      rows: 4,
    },
    moveLimit: 25,
    passStarRules: [
      {
        stars: 1,
        maxMovesInclusive: 25,
      },
    ],
  },
  normal: {
    id: "normal",
    label: "Vừa",
    starsReward: 2,
    pairTarget: 6,
    grid: {
      columns: 3,
      rows: 4,
    },
    moveLimit: 22,
    passStarRules: NORMAL_PASS_STAR_RULES,
  },
  hard: {
    id: "hard",
    label: "Khó",
    starsReward: 3,
    pairTarget: 9,
    grid: {
      columns: 3,
      rows: 6,
    },
    moveLimit: 35,
    passStarRules: HARD_PASS_STAR_RULES,
  },
};

const DEFAULT_LEVEL_TOKENS: Record<MemoryFlipLevelId, MemoryFlipCardToken[]> = {
  easy: [
    { id: "m", text: "m", kind: "letter" },
    { id: "e", text: "e", kind: "letter" },
    { id: "b", text: "b", kind: "letter" },
    { id: "o-mu", text: "ô", kind: "letter" },
  ],
  normal: [
    { id: "m", text: "m", kind: "letter" },
    { id: "e", text: "e", kind: "letter" },
    { id: "b", text: "b", kind: "letter" },
    { id: "o-mu", text: "ô", kind: "letter" },
    { id: "c", text: "c", kind: "letter" },
    { id: "a", text: "a", kind: "letter" },
  ],
  hard: [
    { id: "m", text: "m", kind: "letter" },
    { id: "e", text: "e", kind: "letter" },
    { id: "b", text: "b", kind: "letter" },
    { id: "o-mu", text: "ô", kind: "letter" },
    { id: "c", text: "c", kind: "letter" },
    { id: "a", text: "a", kind: "letter" },
    { id: "bo-word", text: "bố", kind: "word" },
    { id: "me-word", text: "mẹ", kind: "word" },
  ],
};

const DEFAULT_CARD_BACK_OPTIONS: MemoryFlipCardBackOption[] = [
  {
    id: "holo-ocean",
    label: "Holo biển",
    icon: "diamond",
    gradientFrom: "#67e8f9",
    gradientTo: "#2563eb",
    stripeColor: "rgba(255, 255, 255, 0.28)",
    iconColor: "#ffffff",
    ringColor: "rgba(255, 255, 255, 0.72)",
  },
  {
    id: "holo-sunrise",
    label: "Holo bình minh",
    icon: "star",
    gradientFrom: "#fbbf24",
    gradientTo: "#f97316",
    stripeColor: "rgba(255, 255, 255, 0.24)",
    iconColor: "#fff7ed",
    ringColor: "rgba(255, 247, 237, 0.8)",
  },
  {
    id: "holo-mint",
    label: "Holo ngọc",
    icon: "sparkle",
    gradientFrom: "#34d399",
    gradientTo: "#14b8a6",
    stripeColor: "rgba(255, 255, 255, 0.24)",
    iconColor: "#ecfeff",
    ringColor: "rgba(236, 254, 255, 0.8)",
  },
];

export interface MemoryFlipGameDataInput {
  title?: string;
  headerTitle?: string;
  instruction?: string;
  rules?: string[];
  pairTarget?: number;
  levelTokenPools?: Partial<Record<MemoryFlipLevelId, MemoryFlipCardToken[]>>;
  cardBackOptions?: MemoryFlipCardBackOption[];
  levelOverrides?: Partial<
    Record<MemoryFlipLevelId, Partial<MemoryFlipLevelConfig>>
  >;
}

function normalizeCardToken(
  token: MemoryFlipCardToken,
  levelId: MemoryFlipLevelId,
  index: number,
): MemoryFlipCardToken | null {
  const text = token.text.trim();
  if (!text) return null;
  const kind = token.kind === "word" ? "word" : "letter";
  const normalizedText =
    kind === "letter" ? text.toLocaleLowerCase("vi-VN") : text;
  const id = token.id?.trim() || `${levelId}-token-${index + 1}`;
  return {
    id,
    text: normalizedText,
    kind,
  };
}

function resolveTokenPools(
  levelTokenPools?: Partial<Record<MemoryFlipLevelId, MemoryFlipCardToken[]>>,
): Record<MemoryFlipLevelId, MemoryFlipCardToken[]> {
  const levelIds: MemoryFlipLevelId[] = ["easy", "normal", "hard"];
  const resolved: Record<MemoryFlipLevelId, MemoryFlipCardToken[]> = {
    easy: [],
    normal: [],
    hard: [],
  };

  for (const levelId of levelIds) {
    const providedPool = levelTokenPools?.[levelId];
    const sourcePool =
      providedPool && providedPool.length > 0
        ? providedPool
        : DEFAULT_LEVEL_TOKENS[levelId];
    const normalizedPool = sourcePool
      .map((token, index) => normalizeCardToken(token, levelId, index))
      .filter((token): token is MemoryFlipCardToken => token !== null);

    resolved[levelId] =
      normalizedPool.length > 0
        ? normalizedPool
        : [...DEFAULT_LEVEL_TOKENS[levelId]];
  }

  return resolved;
}

function resolveCardBackOptions(
  options?: MemoryFlipCardBackOption[],
): MemoryFlipCardBackOption[] {
  if (!options?.length) return [...DEFAULT_CARD_BACK_OPTIONS];

  const normalized = options.filter(
    (option) =>
      option.id.trim().length > 0 &&
      option.gradientFrom.trim().length > 0 &&
      option.gradientTo.trim().length > 0,
  );
  if (!normalized.length) return [...DEFAULT_CARD_BACK_OPTIONS];
  return normalized;
}

export function createMemoryFlipLevelConfigs({
  levelOverrides,
}: Pick<MemoryFlipGameDataInput, "levelOverrides">): MemoryFlipLevelConfig[] {
  const levelIds: MemoryFlipLevelId[] = ["easy", "normal", "hard"];

  return levelIds.map((levelId) => {
    const preset = MEMORY_LEVEL_PRESETS[levelId];
    const override = levelOverrides?.[levelId];

    const merged = {
      ...preset,
      ...(override ?? {}),
      passStarRules:
        override?.passStarRules ?? preset.passStarRules
          ? [...(override?.passStarRules ?? preset.passStarRules ?? [])]
          : undefined,
    } satisfies MemoryFlipLevelConfig;

    return merged;
  });
}

export function createMemoryFlipGameConfig({
  title,
  headerTitle,
  instruction,
  rules,
  pairTarget,
  levelTokenPools,
  cardBackOptions,
  levelOverrides,
}: MemoryFlipGameDataInput = {}): MemoryFlipGameConfig {
  const pairTargetValue = Math.max(1, Math.min(18, Math.round(pairTarget ?? 8)));

  return {
    title: title ?? "Chọn mức độ",
    headerTitle: headerTitle ?? MEMORY_FLIP_GAME_TITLE,
    instruction: instruction ?? MEMORY_FLIP_GAME_INSTRUCTION,
    rules: rules?.length ? rules : MEMORY_FLIP_GAME_RULES,
    grid: {
      columns: 4,
      rows: 4,
    },
    pairTarget: pairTargetValue,
    tutorial: {
      enabledLevelId: "easy",
      replayAfterFailCount: 2,
      mismatchFlipBackDelayMs: {
        min: 600,
        max: 900,
      },
    },
    levelTokenPools: resolveTokenPools(levelTokenPools),
    levels: createMemoryFlipLevelConfigs({ levelOverrides }),
    cardBackOptions: resolveCardBackOptions(cardBackOptions),
    audio: {
      flip: "/assets/audio/game/memory-flip/whoosh.mp3",
      match: "/assets/audio/game/memory-flip/ding-correct.mp3",
      mismatch: "/assets/audio/game/memory-flip/wrong-bop.mp3",
    },
  };
}
