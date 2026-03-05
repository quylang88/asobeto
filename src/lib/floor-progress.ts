import { useLiveQuery } from "dexie-react-hooks";
import type { Floor, Tower } from "@/data/game-config";
import type { JsonValue } from "@/db/database";
import {
  getAppState,
  getLessonProgress,
  listProgressByPrefix,
  setAppState,
  upsertProgress,
} from "@/services/dbService";

const DEFAULT_FLOOR_MAX_STARS = 3;
const WORLD1_ID = 1;
const DEFAULT_WORLD1_BOOK_PAGE = 1;
const MAX_WORLD1_BOOK_PAGE = 99;

const FLOOR_PROGRESS_PREFIX = "floor";
const FLOOR_LESSON_PROGRESS_PREFIX = "floor-lesson";
const FLOOR_LESSON_PASSES_PREFIX = "floor-lesson-passes";

export interface StoredFloorProgress {
  stars: number;
  completed: boolean;
  lessonStars: Record<string, number>;
  passCount?: number;
  lessonPasses?: Record<string, boolean>;
}

export interface FloorProgressLocation {
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

function toIntegerInRange(value: unknown, min: number, max: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return min;
  const rounded = Math.round(numeric);
  return Math.min(max, Math.max(min, rounded));
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

function getFloorStorageKey({
  worldId,
  world1BookPage,
  towerId,
  floorId,
}: FloorProgressLocation): string {
  const resolvedPage = resolveWorld1BookPage(worldId, world1BookPage);
  return `${worldId}:p${resolvedPage}:${towerId}:${floorId}`;
}

function getFloorProgressLessonId(location: FloorProgressLocation): string {
  return `${FLOOR_PROGRESS_PREFIX}:${getFloorStorageKey(location)}`;
}

function getFloorLessonProgressPrefix(location: FloorProgressLocation): string {
  return `${FLOOR_LESSON_PROGRESS_PREFIX}:${getFloorStorageKey(location)}:`;
}

function getFloorLessonProgressLessonId(
  location: FloorProgressLocation,
  lessonId: string,
): string {
  return `${getFloorLessonProgressPrefix(location)}${lessonId}`;
}

function getFloorLessonPassesKey(location: FloorProgressLocation): string {
  return `${FLOOR_LESSON_PASSES_PREFIX}:${getFloorStorageKey(location)}`;
}

function extractLessonIdFromProgressKey(
  progressKey: string,
  lessonPrefix: string,
): string | null {
  if (!progressKey.startsWith(lessonPrefix)) return null;
  const lessonId = progressKey.slice(lessonPrefix.length);
  return lessonId.length > 0 ? lessonId : null;
}

function normalizeLessonPasses(value: JsonValue | null): Record<string, boolean> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const source = value as Record<string, unknown>;
  const lessonPasses: Record<string, boolean> = {};

  for (const [lessonId, passed] of Object.entries(source)) {
    if (passed) {
      lessonPasses[lessonId] = true;
    }
  }

  return lessonPasses;
}

function normalizeStoredFloorProgress(
  input: Partial<StoredFloorProgress>,
  maxStars: number,
): StoredFloorProgress {
  const lessonStars: Record<string, number> = {};
  for (const [lessonId, stars] of Object.entries(input.lessonStars ?? {})) {
    lessonStars[lessonId] = toIntegerInRange(stars, 0, DEFAULT_FLOOR_MAX_STARS);
  }

  const lessonPasses: Record<string, boolean> = {};
  for (const [lessonId, passed] of Object.entries(input.lessonPasses ?? {})) {
    if (passed) {
      lessonPasses[lessonId] = true;
    }
  }

  const normalized: StoredFloorProgress = {
    stars: toIntegerInRange(input.stars, 0, maxStars),
    completed: Boolean(input.completed),
    lessonStars,
    passCount:
      typeof input.passCount === "number"
        ? toIntegerInRange(input.passCount, 0, maxStars)
        : undefined,
    lessonPasses: Object.keys(lessonPasses).length > 0 ? lessonPasses : undefined,
  };

  return normalized;
}

function shouldDisplayPassCountAsFloorStars(floor: Floor): boolean {
  const activeLessons = (floor.content ?? []).filter(
    (lesson) => lesson.type === "active",
  );
  if (activeLessons.length === 0) return false;

  return activeLessons.every(
    (lesson) => (lesson.scoring?.progressMode ?? "stars") === "pass_count",
  );
}

export async function getStoredFloorProgress(
  location: FloorProgressLocation,
  maxStars: number = DEFAULT_FLOOR_MAX_STARS,
): Promise<StoredFloorProgress | null> {
  const floorProgressId = getFloorProgressLessonId(location);
  const lessonPrefix = getFloorLessonProgressPrefix(location);
  const lessonPassesKey = getFloorLessonPassesKey(location);

  const [floorProgress, lessonProgressList, lessonPassesValue] = await Promise.all([
    getLessonProgress(floorProgressId),
    listProgressByPrefix(lessonPrefix),
    getAppState<JsonValue>(lessonPassesKey),
  ]);

  if (!floorProgress) {
    return null;
  }

  const lessonStars: Record<string, number> = {};
  for (const lessonProgress of lessonProgressList) {
    const lessonId = extractLessonIdFromProgressKey(
      lessonProgress.lessonId,
      lessonPrefix,
    );
    if (!lessonId) continue;
    lessonStars[lessonId] = toIntegerInRange(
      lessonProgress.stars,
      0,
      DEFAULT_FLOOR_MAX_STARS,
    );
  }

  return normalizeStoredFloorProgress(
    {
      stars: floorProgress.stars,
      completed: floorProgress.completed,
      lessonStars,
      passCount: floorProgress.passCount,
      lessonPasses: normalizeLessonPasses(lessonPassesValue),
    },
    maxStars,
  );
}

export async function getStoredLessonStars(
  location: FloorProgressLocation & { lessonId: string },
): Promise<number> {
  const lessonProgress = await getLessonProgress(
    getFloorLessonProgressLessonId(location, location.lessonId),
  );
  return toIntegerInRange(lessonProgress?.stars ?? 0, 0, DEFAULT_FLOOR_MAX_STARS);
}

export async function getStoredFloorPassCount(
  location: FloorProgressLocation,
  maxStars: number = DEFAULT_FLOOR_MAX_STARS,
): Promise<number> {
  const floorProgress = await getStoredFloorProgress(location, maxStars);
  if (!floorProgress) return 0;
  return toIntegerInRange(floorProgress.passCount ?? 0, 0, maxStars);
}

export async function saveFloorProgress({
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
}: SaveFloorProgressInput): Promise<StoredFloorProgress> {
  const location: FloorProgressLocation = {
    worldId,
    world1BookPage,
    towerId,
    floorId,
  };

  const current =
    (await getStoredFloorProgress(location, maxStars)) ??
    ({
      stars: 0,
      completed: false,
      lessonStars: {},
    } satisfies StoredFloorProgress);

  const mergedLessonStars: Record<string, number> = { ...current.lessonStars };
  for (const [lessonId, stars] of Object.entries(lessonStars)) {
    const normalizedStars = toIntegerInRange(stars, 0, DEFAULT_FLOOR_MAX_STARS);
    mergedLessonStars[lessonId] = Math.max(mergedLessonStars[lessonId] ?? 0, normalizedStars);
  }

  const mergedLessonPasses: Record<string, boolean> = {
    ...(current.lessonPasses ?? {}),
  };
  for (const [lessonId, passed] of Object.entries(lessonPasses ?? {})) {
    if (passed) {
      mergedLessonPasses[lessonId] = true;
    }
  }

  const mergedPassCountFromLessonPasses = Object.values(mergedLessonPasses).filter(Boolean)
    .length;

  // Ưu tiên dữ liệu passCount lớn nhất để không mất thành tích khi user chơi lại nhiều lần.
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
      Object.keys(mergedLessonPasses).length > 0 ? mergedLessonPasses : undefined,
  };

  const floorProgressId = getFloorProgressLessonId(location);
  const floorLessonPassesKey = getFloorLessonPassesKey(location);
  const now = Date.now();

  await upsertProgress({
    lessonId: floorProgressId,
    stars: updated.stars,
    completed: updated.completed,
    passCountOverride: updated.passCount,
    lastPlayed: now,
  });

  await Promise.all(
    Object.entries(updated.lessonStars).map(([lessonId, stars]) =>
      upsertProgress({
        lessonId: getFloorLessonProgressLessonId(location, lessonId),
        stars,
        completed: stars > 0,
        lastPlayed: now,
      }),
    ),
  );

  await setAppState(
    floorLessonPassesKey,
    (updated.lessonPasses ?? {}) as Record<string, JsonValue>,
  );

  return updated;
}

export async function hydrateFloorsWithStoredProgress({
  worldId,
  world1BookPage,
  towerId,
  floors,
}: {
  worldId: number;
  world1BookPage?: number;
  towerId: number;
  floors: Floor[];
}): Promise<Floor[]> {
  const hydratedFloors = await Promise.all(
    floors.map(async (floor) => {
      const stored = await getStoredFloorProgress(
        {
          worldId,
          world1BookPage,
          towerId,
          floorId: floor.id,
        },
        floor.maxStars ?? DEFAULT_FLOOR_MAX_STARS,
      );

      if (!stored) return floor;

      const resolvedFloorStars = shouldDisplayPassCountAsFloorStars(floor)
        ? (stored.passCount ?? stored.stars)
        : stored.stars;

      return {
        ...floor,
        stars: resolvedFloorStars,
        completed: floor.completed || stored.completed,
      };
    }),
  );

  return hydratedFloors;
}

export async function hydrateTowersWithStoredProgress({
  worldId,
  world1BookPage,
  towers,
}: {
  worldId: number;
  world1BookPage?: number;
  towers: Tower[];
}): Promise<Tower[]> {
  const hydratedTowers = await Promise.all(
    towers.map(async (tower) => {
      if (tower.isBoss || !tower.floors?.length) {
        return tower;
      }

      const floorCount = tower.floors.length;
      let completedFloorsAtMaxStars = 0;

      await Promise.all(
        tower.floors.map(async (floor) => {
          const floorMaxStars = floor.maxStars ?? DEFAULT_FLOOR_MAX_STARS;
          const stored = await getStoredFloorProgress(
            {
              worldId,
              world1BookPage,
              towerId: tower.id,
              floorId: floor.id,
            },
            floorMaxStars,
          );
          const floorStars = stored?.stars ?? floor.stars ?? 0;

          if (floorStars >= floorMaxStars) {
            completedFloorsAtMaxStars += 1;
          }
        }),
      );

      return {
        ...tower,
        stars: completedFloorsAtMaxStars,
        maxStars: floorCount,
      };
    }),
  );

  return hydratedTowers;
}

export function useStoredFloorProgress(
  location: FloorProgressLocation,
  maxStars: number = DEFAULT_FLOOR_MAX_STARS,
): StoredFloorProgress | null {
  const storedProgress = useLiveQuery(
    () => getStoredFloorProgress(location, maxStars),
    [
      location.worldId,
      location.world1BookPage,
      location.towerId,
      location.floorId,
      maxStars,
    ],
  );

  return storedProgress ?? null;
}

export function useStoredLessonStars(
  location: FloorProgressLocation & { lessonId: string },
): number {
  const stars = useLiveQuery(
    () => getStoredLessonStars(location),
    [
      location.worldId,
      location.world1BookPage,
      location.towerId,
      location.floorId,
      location.lessonId,
    ],
  );

  return stars ?? 0;
}

export function useHydratedFloorsWithStoredProgress({
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
  const floorSignature = floors
    .map(
      (floor) =>
        `${floor.id}:${floor.maxStars ?? DEFAULT_FLOOR_MAX_STARS}:${floor.stars ?? 0}:${floor.completed ? 1 : 0}`,
    )
    .join("|");

  const hydratedFloors = useLiveQuery(
    () =>
      hydrateFloorsWithStoredProgress({
        worldId,
        world1BookPage,
        towerId,
        floors,
      }),
    [worldId, world1BookPage, towerId, floorSignature],
  );

  // Fallback an toàn khi live query chưa có dữ liệu lần đầu.
  return hydratedFloors ?? floors;
}

export function useHydratedTowersWithStoredProgress({
  worldId,
  world1BookPage,
  towers,
}: {
  worldId: number;
  world1BookPage?: number;
  towers: Tower[];
}): Tower[] {
  const towerSignature = towers
    .map((tower) => {
      const floorSignature = (tower.floors ?? [])
        .map((floor) => `${floor.id}:${floor.maxStars ?? DEFAULT_FLOOR_MAX_STARS}`)
        .join(",");
      return `${tower.id}:${tower.isBoss ? 1 : 0}:${floorSignature}`;
    })
    .join("|");

  const hydratedTowers = useLiveQuery(
    () =>
      hydrateTowersWithStoredProgress({
        worldId,
        world1BookPage,
        towers,
      }),
    [worldId, world1BookPage, towerSignature],
  );

  // Fallback an toàn khi live query chưa hoàn tất.
  return hydratedTowers ?? towers;
}
