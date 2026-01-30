import { Floor } from "../map-structure";

export const tower1Floors: Floor[] = [
  {
    id: 1,
    type: "letter",
    label: "A",
    subLabel: "Con Cá",
    maxStars: 4,
    defaultLocked: false,
  },
  {
    id: 2,
    type: "letter",
    label: "Ă",
    subLabel: "Mặt Trăng",
    maxStars: 4,
    defaultLocked: true,
  },
  {
    id: 3,
    type: "letter",
    label: "Â",
    subLabel: "Cái Cân",
    maxStars: 4,
    defaultLocked: true,
  },
  {
    id: 4,
    type: "boss",
    label: "BOSS",
    subLabel: "Tổng hợp A-Ă-Â",
    maxStars: 4,
    defaultLocked: true,
  },
];
