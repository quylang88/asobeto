// Dữ liệu nội dung game với vị trí tháp cho bản đồ dạng cây phân nhánh

export interface TowerPosition {
  x: number; // tỷ lệ phần trăm 0-100
  y: number; // tỷ lệ phần trăm 0-100
}

export interface Floor {
  id: number;
  nameUnlocked: string;
  nameLocked?: string;
  descriptionUnlocked: string;
  descriptionLocked?: string;
  letter?: string;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  completed: boolean;
  unlocked: boolean;
  stars: number;
}

export interface Tower {
  id: number;
  name: string;
  letters: string;
  stars: number;
  maxStars: number;
  completed: boolean;
  unlocked: boolean;
  position: TowerPosition;
  parentIds: number[]; // ID của các tháp mở khóa tháp này
  isBoss?: boolean;
  floors?: Floor[];
}

import { tower1Floors } from "./towers/tower-1";

export interface TowerConnection {
  from: number;
  to: number;
}

// Cấu trúc cây tháp:
//          T1 (gốc)
//         /  \
//       T2    T3
//       |      |
//      T4     T5
//        \   /
//       Tháp Boss

export const towers: Tower[] = [
  {
    id: 1,
    name: "A-D",
    letters: "A, B, C, D",
    stars: 3,
    maxStars: 3,
    completed: true,
    unlocked: true,
    position: { x: 50, y: 12 },
    parentIds: [],
    floors: tower1Floors,
  },
  {
    id: 2,
    name: "E-H",
    letters: "E, F, G, H",
    stars: 2,
    maxStars: 3,
    completed: true,
    unlocked: true,
    position: { x: 25, y: 36 },
    parentIds: [1],
  },
  {
    id: 3,
    name: "I-L",
    letters: "I, K, L",
    stars: 3,
    maxStars: 3,
    completed: true,
    unlocked: true,
    position: { x: 75, y: 36 },
    parentIds: [1],
  },
  {
    id: 4,
    name: "M-P",
    letters: "M, N, O, P",
    stars: 0,
    maxStars: 3,
    completed: false,
    unlocked: true,
    position: { x: 20, y: 60 },
    parentIds: [2],
  },
  {
    id: 5,
    name: "Q-T",
    letters: "Q, R, S, T",
    stars: 0,
    maxStars: 3,
    completed: false,
    unlocked: false,
    position: { x: 80, y: 60 },
    parentIds: [3],
  },
  {
    id: 6,
    name: "BOSS!!!!",
    letters: "Thử Thách",
    stars: 0,
    maxStars: 5,
    completed: false,
    unlocked: false,
    position: { x: 50, y: 90 },
    parentIds: [4, 5],
    isBoss: true,
  },
];

// Định nghĩa các kết nối giữa các tháp
export const towerConnections: TowerConnection[] = [
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 4 },
  { from: 3, to: 5 },
  { from: 4, to: 6 },
  { from: 5, to: 6 },
];

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
  const regularTowers = towerList.filter((t) => !t.isBoss);
  const allCompleted = regularTowers.every((t) => t.completed);
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
      const parent = allTowers.find((t) => t.id === parentId);
      return parent?.completed;
    });
  }

  // Tháp thường mở khi BẤT KỲ tháp cha nào hoàn thành
  return tower.parentIds.some((parentId) => {
    const parent = allTowers.find((t) => t.id === parentId);
    return parent?.completed;
  });
}
