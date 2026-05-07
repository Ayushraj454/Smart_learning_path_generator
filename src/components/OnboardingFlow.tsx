import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { LearningStyle, KnowledgeLevel, UserRole } from '../lib/types';
import {
  Eye, Ear, Hand, BookOpen, Sparkles, Target,
  ChevronRight, ChevronLeft, Check, Rocket,
  Users, Shield, GraduationCap
} from 'lucide-react';

const learningStyles: { value: LearningStyle; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'visual', label: 'Visual', desc: 'Diagrams, charts, and videos', icon: <Eye className="w-6 h-6" /> },
  { value: 'auditory', label: 'Auditory', desc: 'Lectures and discussions', icon: <Ear className="w-6 h-6" /> },
  { value: 'kinesthetic', label: 'Kinesthetic', desc: 'Hands-on practice and projects', icon: <Hand className="w-6 h-6" /> },
  { value: 'reading', label: 'Reading/Writing', desc: 'Textbooks and notes', icon: <BookOpen className="w-6 h-6" /> },
];

const knowledgeLevels: { value: KnowledgeLevel; label: string; desc: string }[] = [
  { value: 'beginner', label: 'Beginner', desc: 'Starting from scratch' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Some experience, want to go deeper' },
  { value: 'advanced', label: 'Advanced', desc: 'Experienced, looking for mastery' },
];

const goalOptions = [
  'Career change', 'Skill upgrade', 'Academic success',
  'Personal growth', 'Certification prep', 'Build a project',
  'Interview prep', 'Freelancing',
];

const subjectOptions = [
  { name: 'JavaScript', icon: 'code-2', color: '#F7DF1E' },
  { name: 'Python', icon: 'terminal', color: '#3776AB' },
  { name: 'Mathematics', icon: 'calculator', color: '#10B981' },
  { name: 'Data Science', icon: 'bar-chart-3', color: '#8B5CF6' },
  { name: 'Web Development', icon: 'globe', color: '#F97316' },
  { name: 'Machine Learning', icon: 'brain', color: '#EC4899' },
  { name: 'Physics', icon: 'atom', color: '#06B6D4' },
  { name: 'English Writing', icon: 'pen-tool', color: '#EF4444' },
];

const roleOptions: { value: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'student', label: 'Student', desc: 'Learn and track your progress', icon: <GraduationCap className="w-6 h-6" /> },
  { value: 'instructor', label: 'Instructor', desc: 'Create content and monitor students', icon: <Users className="w-6 h-6" /> },
  { value: 'parent', label: 'Parent / Guardian', desc: 'Monitor and set controls for your child', icon: <Shield className="w-6 h-6" /> },
];

export default function OnboardingFlow() {
  const { profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<UserRole>(profile?.role ?? 'student');
  const [learningStyle, setLearningStyle] = useState<LearningStyle>(profile?.learning_style ?? 'visual');
  const [knowledgeLevel, setKnowledgeLevel] = useState<KnowledgeLevel>(profile?.knowledge_level ?? 'beginner');
  const [goals, setGoals] = useState<string[]>(profile?.goals ?? []);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const isStudent = role === 'student';

  // Steps depend on role: role selection is first, then student-only steps
  const steps = isStudent
    ? ['role', 'style', 'level', 'goals', 'subjects']
    : ['role'];

  const toggleGoal = (goal: string) => {
    setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  };

  const toggleSubject = (name: string) => {
    setSelectedSubjects(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const handleComplete = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({
          role,
          learning_style: learningStyle,
          knowledge_level: knowledgeLevel,
          goals,
          onboarding_complete: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (isStudent) {
        const { data: subjects } = await supabase
          .from('subjects')
          .select('*')
          .in('name', selectedSubjects);

        if (subjects) {
          const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-path`;
          const headers = {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          };

          for (const subject of subjects) {
            try {
              await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  user_id: profile.id,
                  subject_id: subject.id,
                  subject_name: subject.name,
                  knowledge_level: knowledgeLevel,
                  learning_style: learningStyle,
                  goals,
                }),
              });
            } catch {
              await supabase.from('learning_paths').insert({
                user_id: profile.id,
                subject_id: subject.id,
                title: `${subject.name} Learning Path`,
                description: `Personalized ${subject.name} curriculum tailored to your ${learningStyle} learning style`,
                difficulty: knowledgeLevel,
                estimated_hours: knowledgeLevel === 'beginner' ? 40 : knowledgeLevel === 'intermediate' ? 25 : 15,
              });
            }
          }
        }
      }

      await refreshProfile();
    } finally {
      setSaving(false);
    }
  };

  const stepIndex = steps.indexOf(steps[step]);
  const progress = ((stepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="mb-8">
          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-slate-400 text-sm mt-2">Step {stepIndex + 1} of {steps.length}</p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Step 0: Role Selection */}
          {steps[step] === 'role' && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">How will you use LearnPath?</h2>
              </div>
              <p className="text-slate-400 mb-6">Choose your role to get the right experience</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {roleOptions.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                      role === r.value
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                    }`}
                  >
                    <div className={`${role === r.value ? 'text-emerald-400' : 'text-slate-400'} mb-3`}>
                      {r.icon}
                    </div>
                    <div className="font-medium text-white">{r.label}</div>
                    <div className="text-sm text-slate-400 mt-1">{r.desc}</div>
                    {role === r.value && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                        <Check className="w-3.5 h-3.5" />
                        Selected
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Learning Style (student only) */}
          {steps[step] === 'style' && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">How do you learn best?</h2>
              </div>
              <p className="text-slate-400 mb-6">We'll tailor content to match your learning style</p>
              <div className="grid grid-cols-2 gap-3">
                {learningStyles.map(ls => (
                  <button
                    key={ls.value}
                    onClick={() => setLearningStyle(ls.value)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                      learningStyle === ls.value
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                    }`}
                  >
                    <div className={`${learningStyle === ls.value ? 'text-emerald-400' : 'text-slate-400'} mb-2`}>
                      {ls.icon}
                    </div>
                    <div className="font-medium text-white">{ls.label}</div>
                    <div className="text-sm text-slate-400 mt-1">{ls.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Knowledge Level (student only) */}
          {steps[step] === 'level' && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">What's your experience level?</h2>
              </div>
              <p className="text-slate-400 mb-6">This helps us set the right starting point</p>
              <div className="space-y-3">
                {knowledgeLevels.map(kl => (
                  <button
                    key={kl.value}
                    onClick={() => setKnowledgeLevel(kl.value)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-center gap-4 ${
                      knowledgeLevel === kl.value
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                      knowledgeLevel === kl.value
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-600 text-slate-300'
                    }`}>
                      {knowledgeLevel === kl.value ? <Check className="w-5 h-5" /> : kl.value[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-white">{kl.label}</div>
                      <div className="text-sm text-slate-400">{kl.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Goals (student only) */}
          {steps[step] === 'goals' && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">What are your goals?</h2>
              </div>
              <p className="text-slate-400 mb-6">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {goalOptions.map(goal => (
                  <button
                    key={goal}
                    onClick={() => toggleGoal(goal)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      goals.includes(goal)
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                    }`}
                  >
                    {goals.includes(goal) && <Check className="w-3.5 h-3.5 inline mr-1.5" />}
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Subjects (student only) */}
          {steps[step] === 'subjects' && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Rocket className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">Pick your subjects</h2>
              </div>
              <p className="text-slate-400 mb-6">Choose subjects to start your learning journey</p>
              <div className="grid grid-cols-2 gap-3">
                {subjectOptions.map(s => (
                  <button
                    key={s.name}
                    onClick={() => toggleSubject(s.name)}
                    className={`p-4 rounded-xl border-2 text-left transition-all duration-200 relative ${
                      selectedSubjects.includes(s.name)
                        ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                        : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                      style={{ backgroundColor: s.color + '20' }}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    </div>
                    <div className="font-medium text-white text-sm">{s.name}</div>
                    {selectedSubjects.includes(s.name) && (
                      <Check className="w-4 h-4 text-emerald-400 absolute top-2 right-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving || (isStudent && selectedSubjects.length === 0)}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {isStudent ? 'Start Learning' : 'Get Started'}
                    <Rocket className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
