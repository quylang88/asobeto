// Cấu hình trò chơi trung tâm và quản lý dữ liệu
import * as World1 from "./world-1-alphabet";
import {
  world1Page2Towers,
  world1Page3Towers,
  world1PageTowerConnections,
} from "./world-1-alphabet/map-structure-pages";

// Export lại các kiểu và hàm hỗ trợ từ triển khai world chính
// để đảm bảo tính nhất quán trên toàn ứng dụng
export type {
  Tower,
  TowerConnection,
  TowerPosition,
  Floor,
  FloorType,
  LessonContent,
  LessonScoring,
  LessonScoringProgressMode,
  ScoringMetric,
  LessonAnswer,
  ChallengePassStarRule,
  AnimalFeedLevelId,
  AnimalFeedRoundSide,
  AnimalFeedProgressSegment,
  AnimalFeedLevelConfig,
  AnimalFeedTutorialConfig,
  AnimalFeedGameConfig,
  BubblePopLevelId,
  BubblePassStarRule,
  BubblePopLevelConfig,
  BubblePopGameConfig,
  DiacriticBuildLevelId,
  DiacriticBuildLevelConfig,
  DiacriticBuildInteractionMode,
  DiacriticBuildGameConfig,
  DiacriticBuildTutorialConfig,
  MemoryFlipLevelId,
  MemoryFlipMoveStarRule,
  MemoryFlipCardTokenKind,
  MemoryFlipCardToken,
  MemoryFlipCardBackIcon,
  MemoryFlipCardBackOption,
  MemoryFlipLevelConfig,
  MemoryFlipTutorialConfig,
  MemoryFlipGameConfig,
} from "./world-1-alphabet";
export {
  getTotalStars,
  getMaxStars,
  canUnlockBoss,
  shouldTowerBeUnlocked,
  createBossFloor1Lessons,
} from "./world-1-alphabet";
export {
  createLessonScoring,
  evaluateLessonScore,
  getBossReviewRequiredPassCount,
  resolveLessonScoring,
} from "./scoring-config";
export type {
  LessonScoreEvaluation,
  ResolvedLessonScoring,
} from "./scoring-config";
export { AUDIO, AUDIO_CATALOG_METADATA } from "./audio";

export interface TowerMapTheme {
  backgroundClass: string;
  starCounterClass: string;
  connectionUnlocked: string;
  connectionLocked: string;
  connectionGlow: string;
  regularTowerShadow: string;
  regularTowerBody: string;
  regularTowerFloor: string;
  regularTowerRoof: string;
  regularTowerWindow: string;
  regularTowerDoor: string;
  bossAura: string;
  bossBody: string;
  bossSide: string;
  bossRoof: string;
  bossTop: string;
  bossDoor: string;
  bossDoorLine: string;
  bossOrb: string;
}

export interface FloorMapTheme {
  backgroundClass: string;
  vinePrimary: string;
  vineLeaf: string;
  ladderRail: string;
  ladderRung: string;
  groundOuter: string;
  groundInner: string;
  flowerColors: [string, string, string];
}

export interface WorldUiTheme {
  towerMap: TowerMapTheme;
  floorMap: FloorMapTheme;
}

export type World1BookPage = 1 | 2 | 3;

const world1BookPageThemes: Record<World1BookPage, WorldUiTheme> = {
  1: {
    towerMap: {
      backgroundClass:
        "bg-linear-to-b from-green-bright/20 via-background to-blue-soft/20",
      starCounterClass: "bg-yellow-bright/20",
      connectionUnlocked: "#4ADE80",
      connectionLocked: "#9CA3AF",
      connectionGlow: "rgba(74, 222, 128, 0.5)",
      regularTowerShadow: "rgba(74, 222, 128, 0.3)",
      regularTowerBody: "#4ADE80",
      regularTowerFloor: "#86EFAC",
      regularTowerRoof: "#FB923C",
      regularTowerWindow: "#FEF3C7",
      regularTowerDoor: "#8B5A2B",
      bossAura: "rgba(250, 204, 21, 0.45)",
      bossBody: "#F59E0B",
      bossSide: "#D97706",
      bossRoof: "#FBBF24",
      bossTop: "#FCD34D",
      bossDoor: "#78350F",
      bossDoorLine: "#451A03",
      bossOrb: "#FCD34D",
    },
    floorMap: {
      backgroundClass: "bg-linear-to-b from-sky-100 via-sky-50 to-emerald-50",
      vinePrimary: "#4ADE80",
      vineLeaf: "#86EFAC",
      ladderRail: "#D97706",
      ladderRung: "#F59E0B",
      groundOuter: "#86EFAC",
      groundInner: "#4ADE80",
      flowerColors: ["#F472B6", "#FBBF24", "#60A5FA"],
    },
  },
  2: {
    towerMap: {
      backgroundClass: "bg-linear-to-b from-sky-200/40 via-cyan-50 to-teal-100/45",
      starCounterClass: "bg-cyan-200/60",
      connectionUnlocked: "#2DD4BF",
      connectionLocked: "#94A3B8",
      connectionGlow: "rgba(45, 212, 191, 0.45)",
      regularTowerShadow: "rgba(14, 116, 144, 0.28)",
      regularTowerBody: "#38BDF8",
      regularTowerFloor: "#67E8F9",
      regularTowerRoof: "#FACC15",
      regularTowerWindow: "#ECFEFF",
      regularTowerDoor: "#0E7490",
      bossAura: "rgba(250, 204, 21, 0.4)",
      bossBody: "#14B8A6",
      bossSide: "#0F766E",
      bossRoof: "#06B6D4",
      bossTop: "#67E8F9",
      bossDoor: "#155E75",
      bossDoorLine: "#164E63",
      bossOrb: "#FDE047",
    },
    floorMap: {
      backgroundClass: "bg-linear-to-b from-cyan-100 via-sky-50 to-teal-100",
      vinePrimary: "#2DD4BF",
      vineLeaf: "#99F6E4",
      ladderRail: "#0E7490",
      ladderRung: "#06B6D4",
      groundOuter: "#A5F3FC",
      groundInner: "#2DD4BF",
      flowerColors: ["#FACC15", "#38BDF8", "#22D3EE"],
    },
  },
  3: {
    towerMap: {
      backgroundClass:
        "bg-linear-to-b from-rose-100/45 via-orange-50 to-emerald-100/45",
      starCounterClass: "bg-rose-200/60",
      connectionUnlocked: "#FB7185",
      connectionLocked: "#A8A29E",
      connectionGlow: "rgba(251, 113, 133, 0.45)",
      regularTowerShadow: "rgba(251, 113, 133, 0.26)",
      regularTowerBody: "#FB7185",
      regularTowerFloor: "#FDBA74",
      regularTowerRoof: "#34D399",
      regularTowerWindow: "#FFF7ED",
      regularTowerDoor: "#9A3412",
      bossAura: "rgba(16, 185, 129, 0.35)",
      bossBody: "#F97316",
      bossSide: "#EA580C",
      bossRoof: "#34D399",
      bossTop: "#6EE7B7",
      bossDoor: "#7C2D12",
      bossDoorLine: "#9A3412",
      bossOrb: "#FBBF24",
    },
    floorMap: {
      backgroundClass:
        "bg-linear-to-b from-rose-100 via-orange-50 to-emerald-100",
      vinePrimary: "#FB7185",
      vineLeaf: "#FDBA74",
      ladderRail: "#C2410C",
      ladderRung: "#FB923C",
      groundOuter: "#6EE7B7",
      groundInner: "#34D399",
      flowerColors: ["#FB7185", "#F59E0B", "#34D399"],
    },
  },
};

export const WORLD1_BOOK_TOTAL_PAGES = 3;

export interface World {
  id: number;
  name: string;
  theme: string;
  color: string;
  bgColor: string;
  unlocked: boolean;
  progress: number;
}

export const worlds: World[] = [
  {
    id: 1,
    name: "Đảo Chữ Cái",
    theme: "Rừng Xanh",
    color: "bg-green-bright",
    bgColor: "from-green-400 to-emerald-600",
    unlocked: true,
    progress: 60,
  },
  {
    id: 2,
    name: "Thung Lũng Thanh Điệu",
    theme: "Bầu Trời",
    color: "bg-blue-soft",
    bgColor: "from-blue-400 to-cyan-500",
    unlocked: true,
    progress: 20,
  },
  {
    id: 3,
    name: "Rừng Vần Điệu",
    theme: "Phép Thuật",
    color: "bg-pink-soft",
    bgColor: "from-pink-400 to-purple-500",
    unlocked: false,
    progress: 0,
  },
  {
    id: 4,
    name: "Xứ Sở Từ Vựng",
    theme: "Cổ Tích",
    color: "bg-orange-bright",
    bgColor: "from-orange-400 to-amber-500",
    unlocked: false,
    progress: 0,
  },
];

interface WorldData {
  towers: World1.Tower[];
  towerConnections: World1.TowerConnection[];
}

export interface GetWorldDataOptions {
  world1BookPage?: World1BookPage;
}

const world1BookPageDataMap: Record<World1BookPage, WorldData> = {
  1: {
    towers: World1.towers,
    towerConnections: world1PageTowerConnections,
  },
  2: {
    towers: world1Page2Towers,
    towerConnections: world1PageTowerConnections,
  },
  3: {
    towers: world1Page3Towers,
    towerConnections: world1PageTowerConnections,
  },
};

function normalizeWorld1BookPage(page: number | undefined): World1BookPage {
  if (page === 2 || page === 3) return page;
  return 1;
}

// Map ID của world với các module dữ liệu của chúng (trừ world-1 có phân trang riêng)
const worldDataMap: Record<number, WorldData> = {
  1: world1BookPageDataMap[1],
};

export function getWorldData(
  worldId: number,
  options: GetWorldDataOptions = {},
): WorldData {
  if (worldId === 1) {
    const page = normalizeWorld1BookPage(options.world1BookPage);
    return world1BookPageDataMap[page];
  }
  return worldDataMap[worldId] || worldDataMap[1];
}

export function getWorldTheme(
  worldId: number,
  world1BookPage: World1BookPage = 1,
): WorldUiTheme {
  if (worldId === 1) {
    return world1BookPageThemes[world1BookPage];
  }
  return world1BookPageThemes[1];
}
