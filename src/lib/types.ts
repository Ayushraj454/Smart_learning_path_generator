export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading';
export type KnowledgeLevel = 'beginner' | 'intermediate' | 'advanced';
export type ModuleStatus = 'locked' | 'in_progress' | 'completed';
export type ContentType = 'lesson' | 'quiz' | 'project' | 'practice';
export type PathStatus = 'active' | 'completed' | 'paused';
export type UserRole = 'student' | 'instructor' | 'parent';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string;
  learning_style: LearningStyle;
  knowledge_level: KnowledgeLevel;
  goals: string[];
  onboarding_complete: boolean;
  streak_days: number;
  total_xp: number;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  difficulty_levels: string[];
  created_at: string;
}

export interface LearningPath {
  id: string;
  user_id: string;
  subject_id: string;
  title: string;
  description: string;
  current_module_index: number;
  status: PathStatus;
  difficulty: KnowledgeLevel;
  estimated_hours: number;
  created_at: string;
  updated_at: string;
  subject?: Subject;
  modules?: Module[];
}

export interface Module {
  id: string;
  learning_path_id: string;
  title: string;
  description: string;
  module_order: number;
  content_type: ContentType;
  content: Record<string, unknown>;
  xp_reward: number;
  estimated_minutes: number;
  created_at: string;
  progress?: UserProgress;
  assessment?: Assessment;
}

export interface UserProgress {
  id: string;
  user_id: string;
  module_id: string;
  status: ModuleStatus;
  score: number;
  max_score: number;
  time_spent_minutes: number;
  attempts: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  module_id: string;
  title: string;
  description: string;
  questions: Question[];
  passing_score: number;
  time_limit_minutes: number;
  created_at: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface AssessmentResult {
  id: string;
  user_id: string;
  assessment_id: string;
  answers: number[];
  score: number;
  passed: boolean;
  time_spent_seconds: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  learning_path_id: string | null;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface DailyActivity {
  id: string;
  user_id: string;
  date: string;
  modules_completed: number;
  time_spent_minutes: number;
  xp_earned: number;
  created_at: string;
}

export interface LearningOutcome {
  id: string;
  user_id: string;
  module_id: string;
  skill_name: string;
  pre_score: number;
  post_score: number;
  improvement_rate: number;
  measured_at: string;
}

export interface ContentRating {
  id: string;
  user_id: string;
  module_id: string;
  quality_score: number;
  relevance_score: number;
  feedback: string;
  created_at: string;
}

export interface AdaptiveQuiz {
  id: string;
  user_id: string;
  module_id: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  questions: QuestionBankItem[];
  total_questions: number;
  correct_answers: number;
  score: number;
  completed: boolean;
  started_at: string;
  completed_at: string | null;
  next_difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuestionBankItem {
  id: string;
  subject_id: string;
  skill_area: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question_text: string;
  options: string[];
  correct_index: number;
  explanation: string;
  discrimination_index: number;
  times_used: number;
  times_correct: number;
}

export interface ProgressShare {
  id: string;
  sharer_id: string;
  viewer_id: string | null;
  share_token: string;
  scope: 'full' | 'summary';
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
  viewer?: Profile;
}

export interface ParentalControl {
  id: string;
  student_id: string;
  parent_id: string;
  daily_time_limit_minutes: number;
  allowed_subjects: string[];
  quiz_time_limit_minutes: number;
  restrict_chat: boolean;
  require_approval: boolean;
  notifications_enabled: boolean;
  status: 'active' | 'revoked';
  created_at: string;
  updated_at: string;
  student?: Profile;
}

export interface InstructorSubject {
  id: string;
  instructor_id: string;
  subject_id: string;
  bio: string;
  is_active: boolean;
  created_at: string;
  instructor?: Profile;
  subject?: Subject;
}
