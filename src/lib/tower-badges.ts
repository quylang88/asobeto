import type { Tower } from "@/data/game-config";

const TOWER_BADGE_STORAGE_KEY = "asobeto-tower-badges-v1";
const FORCE_UNLOCK_ALL_BADGES_FOR_TESTING = true;

interface StoredTowerBadge {
  unlockedAt: string;
}

interface StoredTowerBadgeData {
  badges: Record<string, StoredTowerBadge>;
}

export interface TowerBadgeLocation {
  worldId: number;
  towerId: number;
}

export interface TowerBadgeRecord extends TowerBadgeLocation {
  key: string;
  towerName: string;
  towerLetters: string;
  paletteIndex: number;
  badgeImageSrc: string | null;
  unlockedAt: string | null;
  unlocked: boolean;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getTowerBadgeKey({ worldId, towerId }: TowerBadgeLocation): string {
  return `${worldId}:${towerId}`;
}

function normalizeStoredBadge(value: unknown): StoredTowerBadge | null {
  if (!value || typeof value !== "object") return null;
  const source = value as { unlockedAt?: unknown };
  if (typeof source.unlockedAt !== "string" || source.unlockedAt.length === 0) {
    return null;
  }
  return {
    unlockedAt: source.unlockedAt,
  };
}

function readBadgeData(): StoredTowerBadgeData {
  if (!canUseStorage()) {
    return { badges: {} };
  }

  try {
    const raw = window.localStorage.getItem(TOWER_BADGE_STORAGE_KEY);
    if (!raw) return { badges: {} };

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return { badges: {} };

    const badgesSource =
      "badges" in parsed && parsed.badges && typeof parsed.badges === "object"
        ? (parsed.badges as Record<string, unknown>)
        : {};

    const badges: Record<string, StoredTowerBadge> = {};
    for (const [badgeKey, badgeValue] of Object.entries(badgesSource)) {
      const normalized = normalizeStoredBadge(badgeValue);
      if (normalized) {
        badges[badgeKey] = normalized;
      }
    }

    return { badges };
  } catch {
    return { badges: {} };
  }
}

function writeBadgeData(data: StoredTowerBadgeData): void {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(TOWER_BADGE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Bỏ qua lỗi quota/storage để tránh chặn luồng chơi.
  }
}

export function getTowerBadgeUnlockTime(location: TowerBadgeLocation): string | null {
  const data = readBadgeData();
  const badgeKey = getTowerBadgeKey(location);
  return data.badges[badgeKey]?.unlockedAt ?? null;
}

export function hasTowerBadge(location: TowerBadgeLocation): boolean {
  return getTowerBadgeUnlockTime(location) !== null;
}

export function unlockTowerBadge(
  location: TowerBadgeLocation,
): { newlyUnlocked: boolean; unlockedAt: string } {
  const data = readBadgeData();
  const badgeKey = getTowerBadgeKey(location);
  const existing = normalizeStoredBadge(data.badges[badgeKey]);
  if (existing) {
    return {
      newlyUnlocked: false,
      unlockedAt: existing.unlockedAt,
    };
  }

  const unlockedAt = new Date().toISOString();
  data.badges[badgeKey] = { unlockedAt };
  writeBadgeData(data);

  return {
    newlyUnlocked: true,
    unlockedAt,
  };
}

export function createTowerBadgeRecord({
  worldId,
  tower,
  unlockedAt,
}: {
  worldId: number;
  tower: Tower;
  unlockedAt: string | null;
}): TowerBadgeRecord {
  const isForcedUnlocked = FORCE_UNLOCK_ALL_BADGES_FOR_TESTING && !tower.isBoss;
  const resolvedUnlockedAt = isForcedUnlocked
    ? (unlockedAt ?? "force-unlocked-for-test")
    : unlockedAt;

  const badgeImageSrc =
    tower.id === 1 ? "/assets/images/badges/anpanman.webp" : null;

  return {
    key: getTowerBadgeKey({ worldId, towerId: tower.id }),
    worldId,
    towerId: tower.id,
    towerName: tower.name,
    towerLetters: tower.letters,
    paletteIndex: Math.max(0, tower.id - 1),
    badgeImageSrc,
    unlockedAt: resolvedUnlockedAt,
    unlocked: Boolean(resolvedUnlockedAt),
  };
}

export function getTowerBadgeCollection({
  worldId,
  towers,
}: {
  worldId: number;
  towers: Tower[];
}): TowerBadgeRecord[] {
  const data = readBadgeData();

  return towers
    .filter((tower) => !tower.isBoss)
    .map((tower) => {
      const badgeKey = getTowerBadgeKey({ worldId, towerId: tower.id });
      const unlockedAt = normalizeStoredBadge(data.badges[badgeKey])?.unlockedAt ?? null;
      return createTowerBadgeRecord({
        worldId,
        tower,
        unlockedAt,
      });
    });
}
