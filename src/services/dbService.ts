import { db, type AppStateRow, type BadgeRow, type JsonValue, type ProgressRow } from "@/db/database";

export interface UpsertProgressInput {
  lessonId: string;
  stars: number;
  completed?: boolean;
  passCountOverride?: number;
  incrementPassCount?: boolean;
  lastPlayed?: number;
}

function canUseIndexedDb(): boolean {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function clampNonNegativeInteger(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function normalizeLessonId(lessonId: string): string {
  return lessonId.trim();
}

function buildFallbackProgress(
  lessonId: string,
  inputStars: number,
  passCount: number,
  completed: boolean,
  lastPlayed: number,
): ProgressRow {
  return {
    lessonId,
    stars: clampNonNegativeInteger(inputStars),
    passCount: clampNonNegativeInteger(passCount),
    completed,
    lastPlayed,
  };
}

export async function saveLessonProgress(
  lessonId: string,
  stars: number,
): Promise<ProgressRow> {
  return upsertProgress({
    lessonId,
    stars,
    completed: stars > 0,
    incrementPassCount: true,
  });
}

export async function getLessonProgress(
  lessonId: string,
): Promise<ProgressRow | null> {
  const normalizedLessonId = normalizeLessonId(lessonId);
  if (!normalizedLessonId || !canUseIndexedDb()) return null;

  try {
    const row = await db.progress.get(normalizedLessonId);
    return row ?? null;
  } catch {
    return null;
  }
}

export async function setAppState<T>(
  key: string,
  value: T,
): Promise<void> {
  const normalizedKey = key.trim();
  if (!normalizedKey || !canUseIndexedDb()) return;

  try {
    await db.appState.put({
      key: normalizedKey,
      value: value as JsonValue,
    } satisfies AppStateRow);
  } catch {
    // Không làm gián đoạn gameplay khi IndexedDB gặp lỗi.
  }
}

export async function getAppState<T>(
  key: string,
): Promise<T | null> {
  const normalizedKey = key.trim();
  if (!normalizedKey || !canUseIndexedDb()) return null;

  try {
    const row = await db.appState.get(normalizedKey);
    return (row?.value as T | undefined) ?? null;
  } catch {
    return null;
  }
}

export async function upsertProgress(
  input: UpsertProgressInput,
): Promise<ProgressRow> {
  const normalizedLessonId = normalizeLessonId(input.lessonId);
  const normalizedStars = clampNonNegativeInteger(input.stars);
  const resolvedLastPlayed = clampNonNegativeInteger(input.lastPlayed ?? Date.now());

  if (!normalizedLessonId || !canUseIndexedDb()) {
    return buildFallbackProgress(
      normalizedLessonId,
      normalizedStars,
      input.passCountOverride ?? (input.incrementPassCount ? 1 : 0),
      Boolean(input.completed ?? normalizedStars > 0),
      resolvedLastPlayed,
    );
  }

  try {
    const existing = await db.progress.get(normalizedLessonId);
    const existingStars = existing?.stars ?? 0;
    const existingPassCount = existing?.passCount ?? 0;

    // Giữ sao cao nhất đã đạt để tránh bị ghi đè thấp hơn sau một lần chơi kém hơn.
    const nextStars = Math.max(existingStars, normalizedStars);

    let nextPassCount: number;
    if (typeof input.passCountOverride === "number") {
      nextPassCount = clampNonNegativeInteger(input.passCountOverride);
    } else if (input.incrementPassCount) {
      nextPassCount = existingPassCount + 1;
    } else {
      nextPassCount = existingPassCount;
    }

    const nextCompleted =
      Boolean(existing?.completed) || Boolean(input.completed ?? normalizedStars > 0);

    const row: ProgressRow = {
      lessonId: normalizedLessonId,
      stars: nextStars,
      passCount: nextPassCount,
      completed: nextCompleted,
      lastPlayed: resolvedLastPlayed,
    };

    await db.progress.put(row);
    return row;
  } catch {
    return buildFallbackProgress(
      normalizedLessonId,
      normalizedStars,
      input.passCountOverride ?? (input.incrementPassCount ? 1 : 0),
      Boolean(input.completed ?? normalizedStars > 0),
      resolvedLastPlayed,
    );
  }
}

export async function unlockBadge(
  badgeId: string,
): Promise<{ newlyUnlocked: boolean; row: BadgeRow }> {
  const normalizedBadgeId = badgeId.trim();
  const fallbackRow: BadgeRow = {
    badgeId: normalizedBadgeId,
    unlockedAt: Date.now(),
    hasSeenCelebration: false,
  };

  if (!normalizedBadgeId || !canUseIndexedDb()) {
    return {
      newlyUnlocked: false,
      row: fallbackRow,
    };
  }

  try {
    const existing = await db.badges.get(normalizedBadgeId);

    // Unlock badge theo kiểu idempotent: gọi lại nhiều lần vẫn giữ nguyên trạng thái cũ.
    if (existing) {
      return {
        newlyUnlocked: false,
        row: existing,
      };
    }

    const row: BadgeRow = {
      badgeId: normalizedBadgeId,
      unlockedAt: Date.now(),
      hasSeenCelebration: false,
    };
    await db.badges.put(row);

    return {
      newlyUnlocked: true,
      row,
    };
  } catch {
    return {
      newlyUnlocked: false,
      row: fallbackRow,
    };
  }
}

export async function getBadge(badgeId: string): Promise<BadgeRow | null> {
  const normalizedBadgeId = badgeId.trim();
  if (!normalizedBadgeId || !canUseIndexedDb()) return null;

  try {
    const row = await db.badges.get(normalizedBadgeId);
    return row ?? null;
  } catch {
    return null;
  }
}

export async function listBadges(): Promise<BadgeRow[]> {
  if (!canUseIndexedDb()) return [];

  try {
    return await db.badges.toArray();
  } catch {
    return [];
  }
}

export async function listProgressByPrefix(prefix: string): Promise<ProgressRow[]> {
  const normalizedPrefix = prefix.trim();
  if (!normalizedPrefix || !canUseIndexedDb()) return [];

  try {
    return await db.progress.where("lessonId").startsWith(normalizedPrefix).toArray();
  } catch {
    return [];
  }
}

export async function listAllProgress(): Promise<ProgressRow[]> {
  if (!canUseIndexedDb()) return [];

  try {
    return await db.progress.toArray();
  } catch {
    return [];
  }
}
