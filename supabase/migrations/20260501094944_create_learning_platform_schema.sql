/*
  # Smart Learning Path Generator - Database Schema

  1. New Tables
    - `profiles` - User profiles with learning preferences and assessment data
      - `id` (uuid, PK, references auth.users)
      - `full_name` (text)
      - `avatar_url` (text)
      - `learning_style` (text) - visual/auditory/kinesthetic/reading
      - `knowledge_level` (text) - beginner/intermediate/advanced
      - `goals` (text array)
      - `onboarding_complete` (boolean, default false)
      - `streak_days` (integer, default 0)
      - `total_xp` (integer, default 0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `subjects` - Available learning subjects
      - `id` (uuid, PK)
      - `name` (text)
      - `description` (text)
      - `icon` (text)
      - `color` (text)
      - `category` (text)
      - `difficulty_levels` (text array)
      - `created_at` (timestamptz)

    - `learning_paths` - Personalized learning paths for users
      - `id` (uuid, PK)
      - `user_id` (uuid, FK to profiles)
      - `subject_id` (uuid, FK to subjects)
      - `title` (text)
      - `description` (text)
      - `current_module_index` (integer, default 0)
      - `status` (text, default 'active')
      - `difficulty` (text)
      - `estimated_hours` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `modules` - Individual modules within a learning path
      - `id` (uuid, PK)
      - `learning_path_id` (uuid, FK to learning_paths)
      - `title` (text)
      - `description` (text)
      - `module_order` (integer)
      - `content_type` (text) - lesson/quiz/project/practice
      - `content` (jsonb) - flexible content storage
      - `xp_reward` (integer, default 10)
      - `estimated_minutes` (integer)
      - `created_at` (timestamptz)

    - `user_progress` - Track user progress through modules
      - `id` (uuid, PK)
      - `user_id` (uuid, FK to profiles)
      - `module_id` (uuid, FK to modules)
      - `status` (text, default 'locked') - locked/in_progress/completed
      - `score` (integer)
      - `max_score` (integer)
      - `time_spent_minutes` (integer, default 0)
      - `attempts` (integer, default 0)
      - `completed_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `assessments` - Quiz and assessment data
      - `id` (uuid, PK)
      - `module_id` (uuid, FK to modules)
      - `title` (text)
      - `description` (text)
      - `questions` (jsonb) - array of questions with options and correct answers
      - `passing_score` (integer, default 70)
      - `time_limit_minutes` (integer)
      - `created_at` (timestamptz)

    - `assessment_results` - User assessment results
      - `id` (uuid, PK)
      - `user_id` (uuid, FK to profiles)
      - `assessment_id` (uuid, FK to assessments)
      - `answers` (jsonb)
      - `score` (integer)
      - `passed` (boolean)
      - `time_spent_seconds` (integer)
      - `created_at` (timestamptz)

    - `chat_messages` - Tutoring chat messages
      - `id` (uuid, PK)
      - `user_id` (uuid, FK to profiles)
      - `learning_path_id` (uuid, FK to learning_paths, nullable)
      - `role` (text) - user/assistant
      - `content` (text)
      - `created_at` (timestamptz)

    - `daily_activity` - Track daily learning activity for streaks and analytics
      - `id` (uuid, PK)
      - `user_id` (uuid, FK to profiles)
      - `date` (date)
      - `modules_completed` (integer, default 0)
      - `time_spent_minutes` (integer, default 0)
      - `xp_earned` (integer, default 0)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Users can only read/write their own data
    - Subjects table is readable by all authenticated users
    - Modules readable by users who own the learning path
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text DEFAULT '',
  avatar_url text DEFAULT '',
  learning_style text DEFAULT 'visual',
  knowledge_level text DEFAULT 'beginner',
  goals text[] DEFAULT '{}',
  onboarding_complete boolean DEFAULT false,
  streak_days integer DEFAULT 0,
  total_xp integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  icon text DEFAULT 'book',
  color text DEFAULT '#3B82F6',
  category text DEFAULT 'general',
  difficulty_levels text[] DEFAULT '{"beginner","intermediate","advanced"}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

-- Learning paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  current_module_index integer DEFAULT 0,
  status text DEFAULT 'active',
  difficulty text DEFAULT 'beginner',
  estimated_hours integer DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning paths"
  ON learning_paths FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning paths"
  ON learning_paths FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning paths"
  ON learning_paths FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own learning paths"
  ON learning_paths FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  module_order integer NOT NULL DEFAULT 0,
  content_type text NOT NULL DEFAULT 'lesson',
  content jsonb DEFAULT '{}',
  xp_reward integer DEFAULT 10,
  estimated_minutes integer DEFAULT 15,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view modules in own paths"
  ON modules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM learning_paths
      WHERE learning_paths.id = modules.learning_path_id
      AND learning_paths.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert modules in own paths"
  ON modules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM learning_paths
      WHERE learning_paths.id = modules.learning_path_id
      AND learning_paths.user_id = auth.uid()
    )
  );

-- User progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  status text DEFAULT 'locked',
  score integer DEFAULT 0,
  max_score integer DEFAULT 100,
  time_spent_minutes integer DEFAULT 0,
  attempts integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_id)
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
  ON user_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
  ON user_progress FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  questions jsonb NOT NULL DEFAULT '[]',
  passing_score integer DEFAULT 70,
  time_limit_minutes integer DEFAULT 30,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assessments in own paths"
  ON assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM modules m
      JOIN learning_paths lp ON lp.id = m.learning_path_id
      WHERE m.id = assessments.module_id
      AND lp.user_id = auth.uid()
    )
  );

-- Assessment results table
CREATE TABLE IF NOT EXISTS assessment_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '[]',
  score integer NOT NULL DEFAULT 0,
  passed boolean DEFAULT false,
  time_spent_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessment results"
  ON assessment_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment results"
  ON assessment_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  learning_path_id uuid REFERENCES learning_paths(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Daily activity table
CREATE TABLE IF NOT EXISTS daily_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  modules_completed integer DEFAULT 0,
  time_spent_minutes integer DEFAULT 0,
  xp_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily activity"
  ON daily_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily activity"
  ON daily_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily activity"
  ON daily_activity FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default subjects
INSERT INTO subjects (name, description, icon, color, category) VALUES
  ('JavaScript', 'Learn JavaScript from fundamentals to advanced patterns', 'code-2', '#F7DF1E', 'programming'),
  ('Python', 'Master Python programming and data science', 'terminal', '#3776AB', 'programming'),
  ('Mathematics', 'Build strong mathematical foundations', 'calculator', '#10B981', 'science'),
  ('Data Science', 'Explore data analysis, visualization, and ML', 'bar-chart-3', '#8B5CF6', 'technology'),
  ('Web Development', 'Full-stack web development with modern frameworks', 'globe', '#F97316', 'programming'),
  ('Machine Learning', 'Understand ML algorithms and applications', 'brain', '#EC4899', 'technology'),
  ('Physics', 'Classical and modern physics concepts', 'atom', '#06B6D4', 'science'),
  ('English Writing', 'Improve writing skills and grammar', 'pen-tool', '#EF4444', 'language');
