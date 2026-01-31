import { Floor } from "../map-structure";
import { floor1Lessons } from "./floor-1";
import { floor2Lessons } from "./floor-2";
import { floor3Lessons } from "./floor-3";
import { bossFloorLessons } from "./boss-floor";

export const tower1Floors: Floor[] = [
  {
    id: 1,
    nameUnlocked: "Chữ a",
    descriptionUnlocked: "Khởi đầu hành trình",
    letter: "A",
    color: "text-blue-soft",
    bgColor: "bg-blue-soft",
    borderColor: "border-blue-soft",
    completed: true,
    unlocked: true,
    stars: 3,
    content: floor1Lessons,
  },
  {
    id: 2,
    nameUnlocked: "Chữ ă",
    nameLocked: "Điều Bí Ẩn",
    descriptionUnlocked: "Chữ a trăng khuyết trên đầu",
    descriptionLocked: "Chờ bạn tới khám phá!",
    letter: "Ă",
    color: "text-green-bright",
    bgColor: "bg-green-bright",
    borderColor: "border-green-bright",
    completed: true,
    unlocked: true,
    stars: 2,
    content: floor2Lessons,
  },
  {
    id: 3,
    nameUnlocked: "Chữ â",
    nameLocked: "Điều Bí Ẩn",
    descriptionUnlocked: "Chữ a đội mũ trên đầu",
    descriptionLocked: "Chờ bạn tới khám phá!",
    letter: "Â",
    color: "text-orange-bright",
    bgColor: "bg-orange-bright",
    borderColor: "border-orange-bright",
    completed: false,
    unlocked: true,
    stars: 0,
    content: floor3Lessons,
  },
  {
    id: 4,
    nameUnlocked: "BOSS!!!!",
    nameLocked: "Thử Thách",
    descriptionUnlocked: "Thử thách trí nhớ siêu phàm",
    descriptionLocked: "Vượt qua các tầng để mở khóa!",
    letter: "?",
    completed: false,
    unlocked: true,
    stars: 0,
    content: bossFloorLessons,
  },
];
