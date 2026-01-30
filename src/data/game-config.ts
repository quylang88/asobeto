// Cấu hình trò chơi trung tâm và quản lý dữ liệu
import * as World1 from "./world-1-alphabet";

// Export lại các kiểu và hàm hỗ trợ từ triển khai world chính
// để đảm bảo tính nhất quán trên toàn ứng dụng
export type { Tower, TowerConnection, TowerPosition } from "./world-1-alphabet";
export {
  getTotalStars,
  getMaxStars,
  canUnlockBoss,
  shouldTowerBeUnlocked,
} from "./world-1-alphabet";

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
    name: "Alphabet Island",
    theme: "Forest",
    color: "bg-green-bright",
    bgColor: "from-green-400 to-emerald-600",
    unlocked: true,
    progress: 60,
  },
  {
    id: 2,
    name: "Tone Valley",
    theme: "Sky",
    color: "bg-blue-soft",
    bgColor: "from-blue-400 to-cyan-500",
    unlocked: true,
    progress: 20,
  },
  {
    id: 3,
    name: "Rhyme Forest",
    theme: "Magical",
    color: "bg-pink-soft",
    bgColor: "from-pink-400 to-purple-500",
    unlocked: false,
    progress: 0,
  },
  {
    id: 4,
    name: "Word Wonderland",
    theme: "Fantasy",
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

// Map ID của world với các module dữ liệu của chúng
const worldDataMap: Record<number, WorldData> = {
  1: {
    towers: World1.towers,
    towerConnections: World1.towerConnections,
  },
  // Các world trong tương lai sẽ được thêm vào đây
};

export function getWorldData(worldId: number): WorldData {
  // Mặc định là World 1 nếu world yêu cầu không tìm thấy
  // Điều này đảm bảo ứng dụng không bị crash khi chúng ta đang xây dựng các world khác
  return worldDataMap[worldId] || worldDataMap[1];
}
