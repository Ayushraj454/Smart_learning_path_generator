import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Module, UserProgress, Assessment, Question, ContentRating } from '../lib/types';
import AdaptiveQuiz from './AdaptiveQuiz';
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Zap, Clock, ArrowRight, RotateCcw, Trophy, BookOpen, Star, Brain
} from 'lucide-react';

interface Props {
  moduleId: string;
  subjectId?: string;
  onBack: () => void;
  onComplete: () => void;
}

export default function ModuleView({ moduleId, subjectId, onBack, onComplete }: Props) {
  const { profile } = useAuth();
  const [mod, setMod] = useState<Module | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [showRating, setShowRating] = useState(false);
  const [showAdaptiveQuiz, setShowAdaptiveQuiz] = useState(false);
  const [qualityRating, setQualityRating] = useState(0);
  const [relevanceRating, setRelevanceRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [_existingRating, setExistingRating] = useState<ContentRating | null>(null);

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      const { data: moduleData } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .maybeSingle();
      setMod(moduleData);

      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', profile.id)
        .eq('module_id', moduleId)
        .maybeSingle();
      setProgress(progressData);

      if (moduleData?.content_type === 'quiz') {
        const { data: assessmentData } = await supabase
          .from('assessments')
          .select('*')
          .eq('module_id', moduleId)
          .maybeSingle();
        setAssessment(assessmentData);
      }

      // Check for existing content rating
      const { data: ratingData } = await supabase
        .from('content_ratings')
        .select('*')
        .eq('user_id', profile.id)
        .eq('module_id', moduleId)
        .maybeSingle();
      if (ratingData) {
        setExistingRating(ratingData);
        setQualityRating(ratingData.quality_score);
        setRelevanceRating(ratingData.relevance_score);
        setRatingFeedback(ratingData.feedback);
      }

      setLoading(false);
    };
    fetch();
  }, [moduleId, profile]);

  const content = mod?.content as Record<string, unknown> | undefined;
  const sections = (content?.sections as Array<{ title: string; content: string }>) ?? [];

  const startQuiz = useCallback(() => {
    if (!assessment) return;
    setQuizMode(true);
    setAnswers(new Array(assessment.questions.length).fill(-1));
    setShowResults(false);
  }, [assessment]);

  const submitQuiz = async () => {
    if (!assessment || !profile) return;
    let correct = 0;
    assessment.questions.forEach((q: Question, i: number) => {
      if (answers[i] === q.correct_index) correct++;
    });
    const newScore = Math.round((correct / assessment.questions.length) * 100);
    setScore(newScore);
    setShowResults(true);

    const passed = newScore >= assessment.passing_score;
    await supabase.from('assessment_results').insert({
      user_id: profile.id,
      assessment_id: assessment.id,
      answers,
      score: newScore,
      passed,
    });

    if (passed) {
      await supabase.from('user_progress').upsert({
        user_id: profile.id,
        module_id: moduleId,
        status: 'completed',
        score: newScore,
        max_score: 100,
        attempts: (progress?.attempts ?? 0) + 1,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,module_id' });

      await supabase
        .from('profiles')
        .update({ total_xp: (profile.total_xp ?? 0) + (mod?.xp_reward ?? 10) })
        .eq('id', profile.id);

      const today = new Date().toISOString().split('T')[0];
      const { data: existingActivity } = await supabase
        .from('daily_activity')
        .select('*')
        .eq('user_id', profile.id)
        .eq('date', today)
        .maybeSingle();

      if (existingActivity) {
        await supabase
          .from('daily_activity')
          .update({
            modules_completed: existingActivity.modules_completed + 1,
            xp_earned: existingActivity.xp_earned + (mod?.xp_reward ?? 10),
          })
          .eq('id', existingActivity.id);
      } else {
        await supabase.from('daily_activity').insert({
          user_id: profile.id,
          date: today,
          modules_completed: 1,
          xp_earned: mod?.xp_reward ?? 10,
        });
      }

      setShowRating(true);
    }
  };

  const completeLesson = async () => {
    if (!profile || !mod) return;
    await supabase.from('user_progress').upsert({
      user_id: profile.id,
      module_id: moduleId,
      status: 'completed',
      score: 100,
      max_score: 100,
      attempts: 1,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'user_id,module_id' });

    await supabase
      .from('profiles')
      .update({ total_xp: (profile.total_xp ?? 0) + mod.xp_reward })
      .eq('id', profile.id);

    const today = new Date().toISOString().split('T')[0];
    const { data: existingActivity } = await supabase
      .from('daily_activity')
      .select('*')
      .eq('user_id', profile.id)
      .eq('date', today)
      .maybeSingle();

    if (existingActivity) {
      await supabase
        .from('daily_activity')
        .update({
          modules_completed: existingActivity.modules_completed + 1,
          xp_earned: existingActivity.xp_earned + mod.xp_reward,
        })
        .eq('id', existingActivity.id);
    } else {
      await supabase.from('daily_activity').insert({
        user_id: profile.id,
        date: today,
        modules_completed: 1,
        xp_earned: mod.xp_reward,
      });
    }

    setShowRating(true);
  };

  const submitRating = async () => {
    if (!profile || qualityRating === 0 || relevanceRating === 0) return;

    await supabase.from('content_ratings').upsert({
      user_id: profile.id,
      module_id: moduleId,
      quality_score: qualityRating,
      relevance_score: relevanceRating,
      feedback: ratingFeedback,
    }, { onConflict: 'user_id,module_id' });

    setShowRating(false);
    onComplete();
  };

  const handleAdaptiveQuizComplete = (_quizScore: number) => {
    setShowAdaptiveQuiz(false);
  };

  // Show adaptive quiz if requested
  if (showAdaptiveQuiz && subjectId) {
    return (
      <AdaptiveQuiz
        moduleId={moduleId}
        subjectId={subjectId}
        onBack={() => setShowAdaptiveQuiz(false)}
        onComplete={handleAdaptiveQuizComplete}
      />
    );
  }

  if (loading || !mod) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Content Rating Modal
  const ratingModal = showRating && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold text-white mb-2">Rate This Content</h3>
        <p className="text-sm text-slate-400 mb-6">Your feedback helps improve the learning experience</p>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Content Quality</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  onClick={() => setQualityRating(i)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      i <= qualityRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-2 block">Relevance to Your Goals</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  onClick={() => setRelevanceRating(i)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      i <= relevanceRating ? 'text-emerald-400 fill-emerald-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-2 block">Feedback (optional)</label>
            <textarea
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              placeholder="What could be improved?"
              className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => { setShowRating(false); onComplete(); }}
            className="flex-1 px-4 py-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-all text-sm"
          >
            Skip
          </button>
          <button
            onClick={submitRating}
            disabled={qualityRating === 0 || relevanceRating === 0}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 text-sm font-medium"
          >
            Submit Rating
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900">
      {ratingModal}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Path
        </button>

        {/* Module Header */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              mod.content_type === 'quiz' ? 'bg-amber-500/10 text-amber-400' :
              mod.content_type === 'project' ? 'bg-rose-500/10 text-rose-400' :
              mod.content_type === 'practice' ? 'bg-cyan-500/10 text-cyan-400' :
              'bg-slate-500/10 text-slate-400'
            }`}>
              {mod.content_type}
            </span>
            {progress?.status === 'completed' && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400">
                Completed
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{mod.title}</h1>
          <p className="text-slate-400">{mod.description}</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
            <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" />{mod.xp_reward} XP</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{mod.estimated_minutes} min</span>
          </div>

          {/* Adaptive Quiz Button */}
          {subjectId && progress?.status === 'completed' && (
            <button
              onClick={() => setShowAdaptiveQuiz(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all text-sm"
            >
              <Brain className="w-4 h-4" />
              Take Adaptive Quiz
            </button>
          )}
        </div>

        {/* Lesson Content */}
        {mod.content_type !== 'quiz' && sections.length > 0 && !quizMode && (
          <div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-white mb-4">{sections[currentSection]?.title}</h2>
              <div className="prose prose-invert max-w-none">
                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {sections[currentSection]?.content}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                disabled={currentSection === 0}
                className="flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <span className="text-sm text-slate-500">
                {currentSection + 1} / {sections.length}
              </span>

              {currentSection < sections.length - 1 ? (
                <button
                  onClick={() => setCurrentSection(currentSection + 1)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={completeLesson}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
                >
                  Complete
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quiz Mode */}
        {mod.content_type === 'quiz' && assessment && !quizMode && !showResults && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
            <BookOpen className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">{assessment.title}</h2>
            <p className="text-slate-400 mb-2">{assessment.questions.length} questions</p>
            <p className="text-slate-400 mb-6">Passing score: {assessment.passing_score}%</p>
            <button
              onClick={startQuiz}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/25"
            >
              Start Quiz
            </button>
          </div>
        )}

        {quizMode && assessment && !showResults && (
          <div>
            {assessment.questions.map((q: Question, qi: number) => (
              <div
                key={qi}
                className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-4"
              >
                <h3 className="text-white font-medium mb-4">
                  <span className="text-emerald-400 mr-2">Q{qi + 1}.</span>
                  {q.text}
                </h3>
                <div className="space-y-2">
                  {q.options.map((opt: string, oi: number) => (
                    <button
                      key={oi}
                      onClick={() => {
                        const newAnswers = [...answers];
                        newAnswers[qi] = oi;
                        setAnswers(newAnswers);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                        answers[qi] === oi
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-600/50 bg-slate-700/30 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-slate-500 mr-2">{String.fromCharCode(65 + oi)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={submitQuiz}
              disabled={answers.some(a => a === -1)}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
            >
              Submit Answers
            </button>
          </div>
        )}

        {showResults && assessment && (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
            {score >= assessment.passing_score ? (
              <>
                <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Passed!</h2>
                <p className="text-emerald-400 text-lg mb-4">Score: {score}%</p>
                <p className="text-slate-400 mb-6">You earned {mod.xp_reward} XP</p>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Not Quite</h2>
                <p className="text-red-400 text-lg mb-2">Score: {score}%</p>
                <p className="text-slate-400 mb-6">You need {assessment.passing_score}% to pass</p>
              </>
            )}

            {assessment.questions.map((q: Question, qi: number) => (
              <div key={qi} className="text-left bg-slate-700/30 rounded-xl p-4 mb-3">
                <p className="text-white text-sm mb-2">
                  <span className="text-slate-400">Q{qi + 1}.</span> {q.text}
                </p>
                <p className={`text-sm ${answers[qi] === q.correct_index ? 'text-emerald-400' : 'text-red-400'}`}>
                  Your answer: {q.options[answers[qi]]}
                  {answers[qi] !== q.correct_index && (
                    <span className="text-emerald-400 ml-2">
                      Correct: {q.options[q.correct_index]}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400 mt-1">{q.explanation}</p>
              </div>
            ))}

            <div className="flex gap-3 mt-6 justify-center">
              {score < assessment.passing_score && (
                <button
                  onClick={startQuiz}
                  className="flex items-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry
                </button>
              )}
              <button
                onClick={onComplete}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
