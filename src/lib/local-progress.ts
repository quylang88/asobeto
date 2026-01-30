export interface FloorProgress {
  floor_id: number;
  stars: number;
  unlocked: boolean;
  completed: boolean;
}

const STORAGE_KEY_PREFIX = "floor_progress_";

export function getFloorProgress(towerId: number): FloorProgress[] {
  if (typeof window === "undefined") return [];
  const key = `${STORAGE_KEY_PREFIX}${towerId}`;
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

export function saveFloorProgress(towerId: number, progress: FloorProgress[]) {
  if (typeof window === "undefined") return;
  const key = `${STORAGE_KEY_PREFIX}${towerId}`;
  localStorage.setItem(key, JSON.stringify(progress));
}

export function updateFloorProgress(
  towerId: number,
  floorId: number,
  updates: Partial<FloorProgress>
): void {
  const currentProgress = getFloorProgress(towerId);
  const existingIndex = currentProgress.findIndex((p) => p.floor_id === floorId);

  if (existingIndex !== -1) {
    currentProgress[existingIndex] = {
      ...currentProgress[existingIndex],
      ...updates,
    };
  } else {
    // If it doesn't exist (shouldn't happen if initialized properly, but safe to handle)
    currentProgress.push({
      floor_id: floorId,
      stars: 0,
      unlocked: false,
      completed: false,
      ...updates,
    });
  }

  saveFloorProgress(towerId, currentProgress);
}

export function initializeFloorProgress(towerId: number, initialData: {id: number, defaultLocked: boolean}[]): void {
  const current = getFloorProgress(towerId);
  if (current.length > 0) return; // Already initialized

  const newProgress: FloorProgress[] = initialData.map(floor => ({
    floor_id: floor.id,
    stars: 0,
    unlocked: !floor.defaultLocked,
    completed: false
  }));

  saveFloorProgress(towerId, newProgress);
}
