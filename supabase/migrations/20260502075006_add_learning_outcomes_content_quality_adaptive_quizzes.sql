/*
  # Add learning outcomes, content quality, and adaptive quiz system

  1. New Tables
    - `learning_outcomes` - tracks skill improvement rates per module
    - `content_ratings` - user quality/relevance ratings for modules
    - `adaptive_quizzes` - dynamically adjusted quiz sessions
    - `question_bank` - pool of questions with difficulty levels and discrimination indices

  2. Security
    - Enable RLS on all new tables
    - Users can only access their own data
    - question_bank is readable by all authenticated users
*/

-- Learning outcomes table
CREATE TABLE IF NOT EXISTS learning_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  pre_score integer NOT NULL DEFAULT 0 CHECK (pre_score >= 0 AND pre_score <= 100),
  post_score integer NOT NULL DEFAULT 0 CHECK (post_score >= 0 AND post_score <= 100),
  improvement_rate real NOT NULL DEFAULT 0,
  measured_at timestamptz DEFAULT now()
);

ALTER TABLE learning_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own learning outcomes"
  ON learning_outcomes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning outcomes"
  ON learning_outcomes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning outcomes"
  ON learning_outcomes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_learning_outcomes_user ON learning_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_outcomes_module ON learning_outcomes(module_id);

-- Content ratings table
CREATE TABLE IF NOT EXISTS content_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  quality_score integer NOT NULL CHECK (quality_score >= 1 AND quality_score <= 5),
  relevance_score integer NOT NULL CHECK (relevance_score >= 1 AND relevance_score <= 5),
  feedback text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module_id)
);

ALTER TABLE content_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content ratings"
  ON content_ratings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content ratings"
  ON content_ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content ratings"
  ON content_ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_content_ratings_user ON content_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_content_ratings_module ON content_ratings(module_id);

-- Adaptive quizzes table
CREATE TABLE IF NOT EXISTS adaptive_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  difficulty_level text NOT NULL DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  questions jsonb NOT NULL DEFAULT '[]',
  total_questions integer NOT NULL DEFAULT 0,
  correct_answers integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  next_difficulty text DEFAULT 'medium' CHECK (next_difficulty IN ('easy', 'medium', 'hard'))
);

ALTER TABLE adaptive_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own adaptive quizzes"
  ON adaptive_quizzes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own adaptive quizzes"
  ON adaptive_quizzes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own adaptive quizzes"
  ON adaptive_quizzes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_adaptive_quizzes_user ON adaptive_quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_quizzes_module ON adaptive_quizzes(module_id);

-- Question bank table
CREATE TABLE IF NOT EXISTS question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  skill_area text NOT NULL,
  difficulty text NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  explanation text DEFAULT '',
  discrimination_index real DEFAULT 0,
  times_used integer DEFAULT 0,
  times_correct integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view question bank"
  ON question_bank FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role can insert question bank"
  ON question_bank FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_question_bank_subject ON question_bank(subject_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON question_bank(difficulty);
CREATE INDEX IF NOT EXISTS idx_question_bank_skill ON question_bank(skill_area);
