import Dexie, { type Table } from "dexie";

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue =
  | JsonPrimitive
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface ProgressRow {
  lessonId: string;
  stars: number;
  passCount: number;
  completed: boolean;
  lastPlayed: number;
}

export interface BadgeRow {
  badgeId: string;
  unlockedAt: number;
  hasSeenCelebration: boolean;
}

export interface AppStateRow<TValue extends JsonValue = JsonValue> {
  key: string;
  value: TValue;
}

export class AsobetoDB extends Dexie {
  progress!: Table<ProgressRow, string>;
  badges!: Table<BadgeRow, string>;
  appState!: Table<AppStateRow, string>;

  constructor() {
    super("asobeto-db");

    this.version(1).stores({
      progress: "&lessonId, completed, lastPlayed",
      badges: "&badgeId, unlockedAt, hasSeenCelebration",
      appState: "&key",
    });
  }
}

export const db = new AsobetoDB();
