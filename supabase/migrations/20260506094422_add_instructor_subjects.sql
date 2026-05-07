/*
  # Add Instructor-Subject Teaching Relationship

  1. New Tables
    - `instructor_subjects`
      - `id` (uuid, primary key)
      - `instructor_id` (uuid, references profiles) - the instructor
      - `subject_id` (uuid, references subjects) - the subject they teach
      - `bio` (text) - short bio about their teaching for this subject
      - `is_active` (boolean, default true) - whether they're currently accepting students
      - `created_at` (timestamptz)
      - UNIQUE constraint on (instructor_id, subject_id)

  2. Security
    - Enable RLS on `instructor_subjects`
    - Only instructors can add/update/delete their own teaching subjects
    - All authenticated users can read instructor_subjects (students need to see available instructors)
*/

CREATE TABLE IF NOT EXISTS instructor_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  bio text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(instructor_id, subject_id)
);

ALTER TABLE instructor_subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Instructors can add own teaching subjects"
  ON instructor_subjects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'instructor')
    AND instructor_id = auth.uid()
  );

CREATE POLICY "Instructors can update own teaching subjects"
  ON instructor_subjects FOR UPDATE
  TO authenticated
  USING (auth.uid() = instructor_id)
  WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors can delete own teaching subjects"
  ON instructor_subjects FOR DELETE
  TO authenticated
  USING (auth.uid() = instructor_id);

CREATE POLICY "All authenticated users can view instructor subjects"
  ON instructor_subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_instructor_subjects_instructor ON instructor_subjects(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_subjects_subject ON instructor_subjects(subject_id);
