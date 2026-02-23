import { useLiveQuery } from "dexie-react-hooks";
import type { Tower } from "@/data/game-config";
import { getBadge, listBadges, unlockBadge } from "@/services/dbService";

const FORCE_UNLOCK_ALL_BADGES_FOR_TESTING = true;
const LETTER_BADGE_CODES = [
  "A",
  "AW",
  "AA",
  "B",
  "C",
  "D",
  "DD",
  "E",
  "EE",
  "G",
  "H",
  "I",
  "K",
  "L",
  "M",
  "N",
  "O",
  "OO",
  "OW",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "UW",
  "V",
  "X",
  "Y",
] as const;

const LETTER_BADGE_IMAGE_BY_CODE: Partial<
  Record<(typeof LETTER_BADGE_CODES)[number], string>
> = {
  A: "/assets/images/badges/anpanman.webp",
  AW: "/assets/images/badges/sailor-moon-v2.webp",
  AA: "/assets/images/badges/rapunzel.webp",
  B: "/assets/images/badges/baymax.webp",
  C: "/assets/images/badges/chopper.webp",
  D: "/assets/images/badges/doraemon.webp",
  DD: "/assets/images/badges/team-rocket.webp",
  E: "/assets/images/badges/eevee.webp",
};

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

function toIsoTime(unlockedAt: number | null): string | null {
  if (typeof unlockedAt !== "number" || !Number.isFinite(unlockedAt)) return null;
  return new Date(unlockedAt).toISOString();
}

export function getTowerBadgeKey({ worldId, towerId }: TowerBadgeLocation): string {
  return `${worldId}:${towerId}`;
}

export async function getTowerBadgeUnlockTime(
  location: TowerBadgeLocation,
): Promise<string | null> {
  const badge = await getBadge(getTowerBadgeKey(location));
  return toIsoTime(badge?.unlockedAt ?? null);
}

export async function hasTowerBadge(location: TowerBadgeLocation): Promise<boolean> {
  const unlockedAt = await getTowerBadgeUnlockTime(location);
  return unlockedAt !== null;
}

export async function unlockTowerBadge(
  location: TowerBadgeLocation,
): Promise<{ newlyUnlocked: boolean; unlockedAt: string }> {
  const result = await unlockBadge(getTowerBadgeKey(location));

  // Luôn trả về thời điểm unlock ổn định để UI hiển thị consistent giữa các lần gọi.
  const unlockedAt = toIsoTime(result.row.unlockedAt) ?? new Date().toISOString();

  return {
    newlyUnlocked: result.newlyUnlocked,
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

  const badgeImageSrc = tower.id === 1 ? "/assets/images/badges/anpanman.webp" : null;

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

export async function getTowerBadgeCollection({
  worldId,
  towers,
}: {
  worldId: number;
  towers: Tower[];
}): Promise<TowerBadgeRecord[]> {
  const badges = await listBadges();
  const badgeById = new Map(badges.map((badge) => [badge.badgeId, badge]));

  return towers
    .filter((tower) => !tower.isBoss)
    .map((tower) => {
      const badgeKey = getTowerBadgeKey({ worldId, towerId: tower.id });
      const unlockedAt = toIsoTime(badgeById.get(badgeKey)?.unlockedAt ?? null);
      return createTowerBadgeRecord({
        worldId,
        tower,
        unlockedAt,
      });
    });
}

export async function getLetterBadgeCollection(): Promise<TowerBadgeRecord[]> {
  const badges = await listBadges();
  const unlockedCount = FORCE_UNLOCK_ALL_BADGES_FOR_TESTING
    ? LETTER_BADGE_CODES.length
    : Math.min(LETTER_BADGE_CODES.length, badges.length);

  return LETTER_BADGE_CODES.map((badgeCode, index) => {
    const unlocked = index < unlockedCount;
    return {
      key: `letter:${badgeCode}`,
      worldId: 1,
      towerId: index + 1,
      towerName: badgeCode,
      towerLetters: badgeCode,
      paletteIndex: index,
      badgeImageSrc: LETTER_BADGE_IMAGE_BY_CODE[badgeCode] ?? null,
      unlockedAt: unlocked ? `letter-unlocked-${badgeCode}` : null,
      unlocked,
    };
  });
}

export function useTowerBadgeCollection({
  worldId,
  towers,
}: {
  worldId: number;
  towers: Tower[];
}): TowerBadgeRecord[] {
  const towerSignature = towers
    .map((tower) => `${tower.id}:${tower.name}:${tower.letters}:${tower.isBoss ? 1 : 0}`)
    .join("|");

  const badges = useLiveQuery(
    () =>
      getTowerBadgeCollection({
        worldId,
        towers,
      }),
    [worldId, towerSignature],
  );

  // Fallback mặc định để tránh null-check lặp lại trong UI.
  return badges ?? [];
}

export function useLetterBadgeCollection(): TowerBadgeRecord[] {
  const badges = useLiveQuery(() => getLetterBadgeCollection(), []);

  // Fallback mặc định để tránh null-check lặp lại trong UI.
  return badges ?? [];
}
