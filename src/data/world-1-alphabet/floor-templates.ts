import type {
  Floor,
  FloorSelectionIcon,
  FloorType,
  LessonContent,
} from "./types";

const DEFAULT_LOCKED_NAME = "Điều Bí Ẩn";
const DEFAULT_LOCKED_DESCRIPTION = "Chờ bé tới khám phá!";

interface FloorVisualStyle {
  color: string;
  bgColor: string;
  borderColor: string;
}

const FLOOR_VISUALS = {
  letterPrimary: {
    color: "text-blue-soft",
    bgColor: "bg-blue-soft",
    borderColor: "border-blue-soft",
  },
  letterSecondary: {
    color: "text-green-bright",
    bgColor: "bg-green-bright",
    borderColor: "border-green-bright",
  },
  vocabulary: {
    color: "text-orange-bright",
    bgColor: "bg-orange-bright",
    borderColor: "border-orange-bright",
  },
  vocabularyGreen: {
    color: "text-green-bright",
    bgColor: "bg-green-bright",
    borderColor: "border-green-bright",
  },
  game: {
    color: "text-yellow-bright",
    bgColor: "bg-yellow-bright",
    borderColor: "border-yellow-bright",
  },
} as const satisfies Record<string, FloorVisualStyle>;

const VOCABULARY_FLOOR_TITLE = "Từ vựng";
const VOCABULARY_FLOOR_DESCRIPTION = "Ghép từ, luyện nói và viết";
const VOCABULARY_FLOOR_MAX_STARS = 5;

interface SharedFloorConfig {
  id: number;
  nameUnlocked: string;
  descriptionUnlocked: string;
  letter: string;
  content: LessonContent[];
  maxStars: number;
  nameLocked?: string;
  descriptionLocked?: string;
  selectionIcon?: FloorSelectionIcon;
  unlocked?: boolean;
}

function createFloor({
  floorType,
  style,
  id,
  nameUnlocked,
  descriptionUnlocked,
  letter,
  content,
  maxStars,
  nameLocked,
  descriptionLocked,
  selectionIcon,
  unlocked = true,
}: SharedFloorConfig & {
  floorType: FloorType;
  style: FloorVisualStyle;
}): Floor {
  return {
    id,
    floorType,
    nameUnlocked,
    nameLocked: nameLocked ?? DEFAULT_LOCKED_NAME,
    descriptionUnlocked,
    descriptionLocked: descriptionLocked ?? DEFAULT_LOCKED_DESCRIPTION,
    letter,
    selectionIcon,
    color: style.color,
    bgColor: style.bgColor,
    borderColor: style.borderColor,
    completed: false,
    unlocked,
    stars: 0,
    maxStars,
    content,
  };
}

export function createLetterLearningFloor({
  variant,
  ...config
}: SharedFloorConfig & { variant: "primary" | "secondary" }): Floor {
  return createFloor({
    ...config,
    floorType: "letter_learning",
    style:
      variant === "primary"
        ? FLOOR_VISUALS.letterPrimary
        : FLOOR_VISUALS.letterSecondary,
  });
}

export function createVocabularyLearningFloor(
  config: SharedFloorConfig & { colorVariant?: "orange" | "green" },
): Floor {
  const { colorVariant = "orange", ...restConfig } = config;

  return createFloor({
    ...restConfig,
    maxStars: VOCABULARY_FLOOR_MAX_STARS,
    nameUnlocked: VOCABULARY_FLOOR_TITLE,
    descriptionUnlocked: VOCABULARY_FLOOR_DESCRIPTION,
    floorType: "vocabulary_learning",
    style:
      colorVariant === "green"
        ? FLOOR_VISUALS.vocabularyGreen
        : FLOOR_VISUALS.vocabulary,
  });
}

export function createGameFloor(config: SharedFloorConfig): Floor {
  return createFloor({
    ...config,
    floorType: "game",
    style: FLOOR_VISUALS.game,
  });
}
