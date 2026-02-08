import type { Floor, Tower } from "@/data/game-config";

const FLOOR_PROGRESS_STORAGE_KEY = "asobeto-floor-progress-v1";
const DEFAULT_FLOOR_MAX_STARS = 3;

export interface StoredFloorProgress {
  stars: number;
  completed: boolean;
  lessonStars: Record<string, number>;
}

interface StoredProgressData {
  floors: Record<string, StoredFloorProgress>;
}

interface FloorProgressLocation {
  worldId: number;
  towerId: number;
  floorId: number;
}

interface SaveFloorProgressInput extends FloorProgressLocation {
  floorStars: number;
  lessonStars: Record<string, number>;
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
  towerId,
  floorId,
}: FloorProgressLocation): string {
  return `${worldId}:${towerId}:${floorId}`;
}

function normalizeFloorProgress(
  value: unknown,
  maxStars: number = DEFAULT_FLOOR_MAX_STARS,
): StoredFloorProgress | null {
  if (!value || typeof value !== "object") return null;
  const source = value as {
    stars?: unknown;
    completed?: unknown;
    lessonStars?: unknown;
  };
  const lessonStars: Record<string, number> = {};
  const rawLessonStars =
    source.lessonStars && typeof source.lessonStars === "object"
      ? (source.lessonStars as Record<string, unknown>)
      : {};

  for (const [lessonId, stars] of Object.entries(rawLessonStars)) {
    lessonStars[lessonId] = toIntegerInRange(stars, 0, DEFAULT_FLOOR_MAX_STARS);
  }

  return {
    stars: toIntegerInRange(source.stars, 0, maxStars),
    completed: Boolean(source.completed),
    lessonStars,
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
  const floorKey = getFloorStorageKey(location);
  return normalizeFloorProgress(progressData.floors[floorKey], maxStars);
}

export function getStoredLessonStars(
  location: FloorProgressLocation & { lessonId: string },
): number {
  const floorProgress = getStoredFloorProgress(location);
  if (!floorProgress) return 0;
  return floorProgress.lessonStars[location.lessonId] ?? 0;
}

export function saveFloorProgress({
  worldId,
  towerId,
  floorId,
  floorStars,
  lessonStars,
  completed = true,
  maxStars = DEFAULT_FLOOR_MAX_STARS,
}: SaveFloorProgressInput): StoredFloorProgress {
  const progressData = readProgressData();
  const floorKey = getFloorStorageKey({ worldId, towerId, floorId });
  const current =
    progressData.floors[floorKey] ??
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

  const updated: StoredFloorProgress = {
    stars: Math.max(current.stars, toIntegerInRange(floorStars, 0, maxStars)),
    completed: current.completed || completed,
    lessonStars: mergedLessonStars,
  };

  progressData.floors[floorKey] = updated;
  writeProgressData(progressData);
  return updated;
}

export function hydrateFloorsWithStoredProgress({
  worldId,
  towerId,
  floors,
}: {
  worldId: number;
  towerId: number;
  floors: Floor[];
}): Floor[] {
  const progressData = readProgressData();

  return floors.map((floor) => {
    const floorKey = getFloorStorageKey({ worldId, towerId, floorId: floor.id });
    const stored = normalizeFloorProgress(
      progressData.floors[floorKey],
      floor.maxStars ?? DEFAULT_FLOOR_MAX_STARS,
    );

    if (!stored) return floor;

    return {
      ...floor,
      stars: stored.stars,
      completed: floor.completed || stored.completed,
    };
  });
}

export function hydrateTowersWithStoredProgress({
  worldId,
  towers,
}: {
  worldId: number;
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
      const floorKey = getFloorStorageKey({
        worldId,
        towerId: tower.id,
        floorId: floor.id,
      });
      const stored = normalizeFloorProgress(
        progressData.floors[floorKey],
        floorMaxStars,
      );
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
