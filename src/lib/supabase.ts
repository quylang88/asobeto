import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface FloorProgress {
  id: string;
  tower_id: number;
  floor_id: number;
  stars: number;
  max_stars: number;
  completed: boolean;
  unlocked: boolean;
  created_at: string;
  updated_at: string;
}

export async function getFloorProgress(
  towerId: number
): Promise<FloorProgress[]> {
  const { data, error } = await supabase
    .from("floor_progress")
    .select("*")
    .eq("tower_id", towerId);

  if (error) {
    console.error("Error fetching floor progress:", error);
    return [];
  }

  return data || [];
}

export async function updateFloorProgress(
  towerId: number,
  floorId: number,
  updates: Partial<FloorProgress>
): Promise<FloorProgress | null> {
  const { data, error } = await supabase
    .from("floor_progress")
    .upsert(
      {
        tower_id: towerId,
        floor_id: floorId,
        ...updates,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tower_id,floor_id" }
    )
    .select()
    .maybeSingle();

  if (error) {
    console.error("Error updating floor progress:", error);
    return null;
  }

  return data;
}

export async function initializeFloorProgress(towerId: number): Promise<void> {
  const floorConfigs = [
    { floor_id: 1, label: "A", unlocked: true },
    { floor_id: 2, label: "Ă", unlocked: false },
    { floor_id: 3, label: "Â", unlocked: false },
    { floor_id: 4, label: "Boss", unlocked: false },
  ];

  for (const config of floorConfigs) {
    await updateFloorProgress(towerId, config.floor_id, {
      stars: 0,
      max_stars: 4,
      completed: false,
      unlocked: config.unlocked,
    });
  }
}
