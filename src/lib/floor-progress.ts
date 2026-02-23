import type { Floor, Tower } from "@/data/game-config";

const FLOOR_PROGRESS_STORAGE_KEY = "asobeto-floor-progress-v1";
const DEFAULT_FLOOR_MAX_STARS = 3;
const MAX_FLOOR_STARS_STORAGE_CAP = 99;
const WORLD1_ID = 1;
const DEFAULT_WORLD1_BOOK_PAGE = 1;
const MAX_WORLD1_BOOK_PAGE = 99;

export interface StoredFloorProgress {
  stars: number;
  completed: boolean;
  lessonStars: Record<string, number>;
  passCount?: number;
  lessonPasses?: Record<string, boolean>;
}

interface StoredProgressData {
  floors: Record<string, StoredFloorProgress>;
}

interface FloorProgressLocation {
  worldId: number;
  world1BookPage?: number;
  towerId: number;
  floorId: number;
}

interface SaveFloorProgressInput extends FloorProgressLocation {
  floorStars: number;
  lessonStars: Record<string, number>;
  passCount?: number;
  lessonPasses?: Record<string, boolean>;
  completed?: boolean;
  maxStars?: number;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function toIntegerInRange(
  value: unknown,
  min: number,
  max: number,
): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return min;
  const rounded = Math.round(numeric);
  return Math.min(max, Math.max(min, rounded));
}

function getFloorStorageKey({
  worldId,
  world1BookPage,
  towerId,
  floorId,
}: FloorProgressLocation): string {
  const resolvedPage = resolveWorld1BookPage(worldId, world1BookPage);
  return `${worldId}:p${resolvedPage}:${towerId}:${floorId}`;
}

function getLegacyFloorStorageKey({
  worldId,
  towerId,
  floorId,
}: FloorProgressLocation): string {
  return `${worldId}:${towerId}:${floorId}`;
}

function resolveWorld1BookPage(
  worldId: number,
  world1BookPage: number | undefined,
): number {
  if (worldId !== WORLD1_ID) return DEFAULT_WORLD1_BOOK_PAGE;
  const rawPage =
    typeof world1BookPage === "number" ? world1BookPage : DEFAULT_WORLD1_BOOK_PAGE;
  return toIntegerInRange(rawPage, DEFAULT_WORLD1_BOOK_PAGE, MAX_WORLD1_BOOK_PAGE);
}

function shouldReadLegacyWorld1Page(location: FloorProgressLocation): boolean {
  return (
    location.worldId === WORLD1_ID &&
    resolveWorld1BookPage(location.worldId, location.world1BookPage) ===
      DEFAULT_WORLD1_BOOK_PAGE
  );
}

function resolveStoredFloorProgress(
  floors: Record<string, StoredFloorProgress>,
  location: FloorProgressLocation,
  maxStars: number,
): {
  key: string;
  progress: StoredFloorProgress | null;
} {
  const currentKey = getFloorStorageKey(location);
  const currentProgress = normalizeFloorProgress(floors[currentKey], maxStars);
  if (currentProgress) {
    return { key: currentKey, progress: currentProgress };
  }

  if (!shouldReadLegacyWorld1Page(location)) {
    return { key: currentKey, progress: null };
  }

  const legacyKey = getLegacyFloorStorageKey(location);
  const legacyProgress = normalizeFloorProgress(floors[legacyKey], maxStars);
  return { key: currentKey, progress: legacyProgress };
}

function normalizeFloorProgress(
  value: unknown,
  maxStars: number = MAX_FLOOR_STARS_STORAGE_CAP,
): StoredFloorProgress | null {
  if (!value || typeof value !== "object") return null;
  const source = value as {
    stars?: unknown;
    completed?: unknown;
    lessonStars?: unknown;
    passCount?: unknown;
    lessonPasses?: unknown;
  };
  const lessonStars: Record<string, number> = {};
  const lessonPasses: Record<string, boolean> = {};
  const rawLessonStars =
    source.lessonStars && typeof source.lessonStars === "object"
      ? (source.lessonStars as Record<string, unknown>)
      : {};
  const rawLessonPasses =
    source.lessonPasses && typeof source.lessonPasses === "object"
      ? (source.lessonPasses as Record<string, unknown>)
      : {};

  for (const [lessonId, stars] of Object.entries(rawLessonStars)) {
    lessonStars[lessonId] = toIntegerInRange(stars, 0, DEFAULT_FLOOR_MAX_STARS);
  }
  for (const [lessonId, passed] of Object.entries(rawLessonPasses)) {
    if (passed) {
      lessonPasses[lessonId] = true;
    }
  }

  const hasExplicitPassCount =
    typeof source.passCount === "number" ||
    (typeof source.passCount === "string" && source.passCount.trim().length > 0);
  const derivedPassCount = Object.values(lessonPasses).filter(Boolean).length;
  const passCount = hasExplicitPassCount
    ? toIntegerInRange(source.passCount, 0, maxStars)
    : derivedPassCount > 0
      ? toIntegerInRange(derivedPassCount, 0, maxStars)
      : undefined;

  return {
    stars: toIntegerInRange(source.stars, 0, maxStars),
    completed: Boolean(source.completed),
    lessonStars,
    passCount,
    lessonPasses:
      Object.keys(lessonPasses).length > 0 ? lessonPasses : undefined,
  };
}

function readProgressData(): StoredProgressData {
  if (!canUseStorage()) {
    return { floors: {} };
  }

  try {
    const raw = window.localStorage.getItem(FLOOR_PROGRESS_STORAGE_KEY);
    if (!raw) return { floors: {} };

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { floors: {} };

    const floorsSource =
      "floors" in parsed && parsed.floors && typeof parsed.floors === "object"
        ? (parsed.floors as Record<string, unknown>)
        : {};

    const floors: Record<string, StoredFloorProgress> = {};
    for (const [floorKey, floorValue] of Object.entries(floorsSource)) {
      const normalized = normalizeFloorProgress(floorValue);
      if (normalized) {
        floors[floorKey] = normalized;
      }
    }

    return { floors };
  } catch {
    return { floors: {} };
  }
}

function writeProgressData(progressData: StoredProgressData): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(
      FLOOR_PROGRESS_STORAGE_KEY,
      JSON.stringify(progressData),
    );
  } catch {
    // Bỏ qua lỗi quota/storage để tránh làm gián đoạn trải nghiệm học
  }
}

export function getStoredFloorProgress(
  location: FloorProgressLocation,
  maxStars: number = DEFAULT_FLOOR_MAX_STARS,
): StoredFloorProgress | null {
  const progressData = readProgressData();
  return resolveStoredFloorProgress(progressData.floors, location, maxStars).progress;
}

export function getStoredLessonStars(
  location: FloorProgressLocation & { lessonId: string },
): number {
  const floorProgress = getStoredFloorProgress(location);
  if (!floorProgress) return 0;
  return floorProgress.lessonStars[location.lessonId] ?? 0;
}

export function getStoredFloorPassCount(
  location: FloorProgressLocation,
  maxStars: number = DEFAULT_FLOOR_MAX_STARS,
): number {
  const floorProgress = getStoredFloorProgress(location, maxStars);
  if (!floorProgress) return 0;
  return floorProgress.passCount ?? 0;
}

export function saveFloorProgress({
  worldId,
  world1BookPage,
  towerId,
  floorId,
  floorStars,
  lessonStars,
  passCount,
  lessonPasses,
  completed = true,
  maxStars = DEFAULT_FLOOR_MAX_STARS,
}: SaveFloorProgressInput): StoredFloorProgress {
  const progressData = readProgressData();
  const location: FloorProgressLocation = {
    worldId,
    world1BookPage,
    towerId,
    floorId,
  };
  const { key: floorKey, progress: storedProgress } = resolveStoredFloorProgress(
    progressData.floors,
    location,
    maxStars,
  );
  const current =
    storedProgress ??
    ({
      stars: 0,
      completed: false,
      lessonStars: {},
    } satisfies StoredFloorProgress);

  const mergedLessonStars: Record<string, number> = { ...current.lessonStars };
  for (const [lessonId, stars] of Object.entries(lessonStars)) {
    const normalizedStars = toIntegerInRange(stars, 0, DEFAULT_FLOOR_MAX_STARS);
    mergedLessonStars[lessonId] = Math.max(
      mergedLessonStars[lessonId] ?? 0,
      normalizedStars,
    );
  }
  const mergedLessonPasses: Record<string, boolean> = {
    ...(current.lessonPasses ?? {}),
  };
  for (const [lessonId, passed] of Object.entries(lessonPasses ?? {})) {
    if (passed) {
      mergedLessonPasses[lessonId] = true;
    }
  }
  const mergedPassCountFromLessonPasses = Object.values(mergedLessonPasses).filter(
    Boolean,
  ).length;
  const resolvedPassCount =
    passCount === undefined && mergedPassCountFromLessonPasses === 0
      ? current.passCount
      : Math.max(
          current.passCount ?? 0,
          toIntegerInRange(
            passCount ?? mergedPassCountFromLessonPasses,
            0,
            maxStars,
          ),
          toIntegerInRange(mergedPassCountFromLessonPasses, 0, maxStars),
        );

  const updated: StoredFloorProgress = {
    stars: Math.max(current.stars, toIntegerInRange(floorStars, 0, maxStars)),
    completed: current.completed || completed,
    lessonStars: mergedLessonStars,
    passCount: resolvedPassCount,
    lessonPasses:
      Object.keys(mergedLessonPasses).length > 0
        ? mergedLessonPasses
        : undefined,
  };

  progressData.floors[floorKey] = updated;
  writeProgressData(progressData);
  return updated;
}

export function hydrateFloorsWithStoredProgress({
  worldId,
  world1BookPage,
  towerId,
  floors,
}: {
  worldId: number;
  world1BookPage?: number;
  towerId: number;
  floors: Floor[];
}): Floor[] {
  const progressData = readProgressData();

  return floors.map((floor) => {
    const stored = resolveStoredFloorProgress(
      progressData.floors,
      {
        worldId,
        world1BookPage,
        towerId,
        floorId: floor.id,
      },
      floor.maxStars ?? DEFAULT_FLOOR_MAX_STARS,
    ).progress;

    if (!stored) return floor;

    return {
      ...floor,
      stars:
        typeof stored.passCount === "number"
          ? stored.passCount
          : stored.stars,
      completed: floor.completed || stored.completed,
    };
  });
}

export function hydrateTowersWithStoredProgress({
  worldId,
  world1BookPage,
  towers,
}: {
  worldId: number;
  world1BookPage?: number;
  towers: Tower[];
}): Tower[] {
  const progressData = readProgressData();

  return towers.map((tower) => {
    if (tower.isBoss || !tower.floors?.length) {
      return tower;
    }

    const floorCount = tower.floors.length;
    let completedFloorsAtMaxStars = 0;

    for (const floor of tower.floors) {
      const floorMaxStars = floor.maxStars ?? DEFAULT_FLOOR_MAX_STARS;
      const stored = resolveStoredFloorProgress(
        progressData.floors,
        {
          worldId,
          world1BookPage,
          towerId: tower.id,
          floorId: floor.id,
        },
        floorMaxStars,
      ).progress;
      const floorStars = stored?.stars ?? floor.stars ?? 0;

      if (floorStars >= floorMaxStars) {
        completedFloorsAtMaxStars += 1;
      }
    }

    return {
      ...tower,
      stars: completedFloorsAtMaxStars,
      maxStars: floorCount,
    };
  });
}
