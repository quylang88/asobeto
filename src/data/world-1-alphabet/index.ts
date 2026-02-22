import type { Tower } from "./types";

export * from "./types";
export { towers, towerConnections } from "./map-structure";
export { createBossFloor1Lessons } from "./tower-boss/floor-1";

// Tính tổng số sao đạt được
export function getTotalStars(towerList: Tower[]): number {
  return towerList.reduce((sum, tower) => sum + tower.stars, 0);
}

// Tính tổng số sao tối đa
export function getMaxStars(towerList: Tower[]): number {
  return towerList.reduce((sum, tower) => sum + tower.maxStars, 0);
}

// Kiểm tra xem tháp boss có thể mở khóa không
export function canUnlockBoss(
  towerList: Tower[],
  requiredStars: number = 15,
): boolean {
  const regularTowers = towerList.filter((tower) => !tower.isBoss);
  const allUnlocked = regularTowers.every((tower) => tower.unlocked);
  if (allUnlocked) {
    return true;
  }
  const allCompleted = regularTowers.every((tower) => tower.completed);
  const totalStars = getTotalStars(regularTowers);
  return allCompleted && totalStars >= requiredStars;
}

// Kiểm tra xem một tháp có nên được mở khóa dựa trên việc hoàn thành tháp cha
export function shouldTowerBeUnlocked(
  tower: Tower,
  allTowers: Tower[],
): boolean {
  if (tower.parentIds.length === 0) return true; // Tháp gốc luôn mở

  if (tower.isBoss) {
    // Boss yêu cầu TẤT CẢ các tháp cha phải hoàn thành
    return tower.parentIds.every((parentId) => {
      const parent = allTowers.find((candidate) => candidate.id === parentId);
      return parent?.completed;
    });
  }

  // Tháp thường mở khi BẤT KỲ tháp cha nào hoàn thành
  return tower.parentIds.some((parentId) => {
    const parent = allTowers.find((candidate) => candidate.id === parentId);
    return parent?.completed;
  });
}
