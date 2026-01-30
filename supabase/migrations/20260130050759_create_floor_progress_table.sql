/*
  # Create Floor Progress Tracking Table

  1. New Tables
    - `floor_progress`
      - `id` (uuid, primary key)
      - `tower_id` (integer) - References which tower
      - `floor_id` (integer) - References which floor within tower
      - `stars` (integer) - Current stars earned (0-4)
      - `max_stars` (integer) - Maximum stars for this floor (4)
      - `completed` (boolean) - Whether floor is completed
      - `unlocked` (boolean) - Whether floor is unlocked
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `floor_progress` table
    - Public read access for demo/testing purposes (can be restricted later)
*/

CREATE TABLE IF NOT EXISTS floor_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tower_id integer NOT NULL,
  floor_id integer NOT NULL,
  stars integer DEFAULT 0 CHECK (stars >= 0 AND stars <= 4),
  max_stars integer DEFAULT 4,
  completed boolean DEFAULT false,
  unlocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(tower_id, floor_id)
);

ALTER TABLE floor_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON floor_progress
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert"
  ON floor_progress
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update"
  ON floor_progress
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
