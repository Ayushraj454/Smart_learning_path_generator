/*
  # Add Role Management, Progress Sharing, and Parental Controls

  1. New Tables
    - `progress_shares`
      - `id` (uuid, primary key)
      - `sharer_id` (uuid, references profiles) - user sharing their progress
      - `viewer_id` (uuid, references profiles) - user receiving the share
      - `share_token` (text, unique) - token for link-based sharing
      - `scope` (text) - 'full' or 'summary' level of detail
      - `expires_at` (timestamptz, nullable) - when the share expires
      - `revoked` (boolean, default false) - whether share is revoked
      - `created_at` (timestamptz)
    - `parental_controls`
      - `id` (uuid, primary key)
      - `student_id` (uuid, references profiles) - the child/ward
      - `parent_id` (uuid, references profiles) - the parent/guardian
      - `daily_time_limit_minutes` (integer, default 120) - max daily usage
      - `allowed_subjects` (text array, default all) - restricted subjects
      - `quiz_time_limit_minutes` (integer, default 60) - per-quiz time cap
      - `restrict_chat` (boolean, default false) - disable AI tutor chat
      - `require_approval` (boolean, default false) - require approval for new paths
      - `notifications_enabled` (boolean, default true) - email notifications
      - `status` (text, default 'active') - 'active' or 'revoked'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Modified Tables
    - `profiles` - add `role` column (text, default 'student')
      - Values: 'student', 'instructor', 'parent'

  3. Security
    - Enable RLS on `progress_shares` and `parental_controls`
    - Users can only share their own progress
    - Users can only view shares where they are sharer or viewer
    - Parents can only manage controls where they are the parent
    - Students can view their own parental controls
*/

-- Add role column to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text NOT NULL DEFAULT 'student';
  END IF;
END $$;

-- Progress shares table
CREATE TABLE IF NOT EXISTS progress_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sharer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  share_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(12), 'base64'),
  scope text NOT NULL DEFAULT 'summary' CHECK (scope IN ('full', 'summary')),
  expires_at timestamptz,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE progress_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can share own progress"
  ON progress_shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sharer_id);

CREATE POLICY "Users can view own shares"
  ON progress_shares FOR SELECT
  TO authenticated
  USING (auth.uid() = sharer_id OR auth.uid() = viewer_id);

CREATE POLICY "Users can update own shares"
  ON progress_shares FOR UPDATE
  TO authenticated
  USING (auth.uid() = sharer_id)
  WITH CHECK (auth.uid() = sharer_id);

CREATE POLICY "Users can delete own shares"
  ON progress_shares FOR DELETE
  TO authenticated
  USING (auth.uid() = sharer_id);

-- Parental controls table
CREATE TABLE IF NOT EXISTS parental_controls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  daily_time_limit_minutes integer NOT NULL DEFAULT 120,
  allowed_subjects text[] NOT NULL DEFAULT '{}',
  quiz_time_limit_minutes integer NOT NULL DEFAULT 60,
  restrict_chat boolean NOT NULL DEFAULT false,
  require_approval boolean NOT NULL DEFAULT false,
  notifications_enabled boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, parent_id)
);

ALTER TABLE parental_controls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can insert controls for their wards"
  ON parental_controls FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents and students can view controls"
  ON parental_controls FOR SELECT
  TO authenticated
  USING (auth.uid() = parent_id OR auth.uid() = student_id);

CREATE POLICY "Parents can update their controls"
  ON parental_controls FOR UPDATE
  TO authenticated
  USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their controls"
  ON parental_controls FOR DELETE
  TO authenticated
  USING (auth.uid() = parent_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_shares_sharer ON progress_shares(sharer_id);
CREATE INDEX IF NOT EXISTS idx_progress_shares_viewer ON progress_shares(viewer_id);
CREATE INDEX IF NOT EXISTS idx_progress_shares_token ON progress_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_parental_controls_student ON parental_controls(student_id);
CREATE INDEX IF NOT EXISTS idx_parental_controls_parent ON parental_controls(parent_id);
