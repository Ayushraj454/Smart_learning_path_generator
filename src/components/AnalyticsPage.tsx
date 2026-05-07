import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { DailyActivity, LearningPath, UserProgress, LearningOutcome, ContentRating, AdaptiveQuiz } from '../lib/types';
import {
  TrendingUp, Zap, Clock, BookOpen, Target,
  Flame, Calendar, BarChart3, Brain, Star, ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function AnalyticsPage({ onBack }: Props) {
  const { profile } = useAuth();
  const [activity, setActivity] = useState<DailyActivity[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [allProgress, setAllProgress] = useState<UserProgress[]>([]);
  const [outcomes, setOutcomes] = useState<LearningOutcome[]>([]);
  const [ratings, setRatings] = useState<ContentRating[]>([]);
  const [quizzes, setQuizzes] = useState<AdaptiveQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      const [actRes, pathsRes, outcomesRes, ratingsRes, quizzesRes] = await Promise.all([
        supabase
          .from('daily_activity')
          .select('*')
          .eq('user_id', profile.id)
          .order('date', { ascending: false })
          .limit(30),
        supabase
          .from('learning_paths')
          .select('*, subject:subjects(*)')
          .eq('user_id', profile.id),
        supabase
          .from('learning_outcomes')
          .select('*')
          .eq('user_id', profile.id)
          .order('measured_at', { ascending: false })
          .limit(50),
        supabase
          .from('content_ratings')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('adaptive_quizzes')
          .select('*')
          .eq('user_id', profile.id)
          .eq('completed', true)
          .order('completed_at', { ascending: false })
          .limit(20),
      ]);
      setActivity(actRes.data ?? []);
      setPaths(pathsRes.data ?? []);
      setOutcomes(outcomesRes.data ?? []);
      setRatings(ratingsRes.data ?? []);
      setQuizzes(quizzesRes.data ?? []);

      if (pathsRes.data && pathsRes.data.length > 0) {
        const pathIds = pathsRes.data.map(p => p.id);
        const { data: modules } = await supabase
          .from('modules')
          .select('id')
          .in('learning_path_id', pathIds);
        if (modules && modules.length > 0) {
          const moduleIds = modules.map(m => m.id);
          const { data: progress } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', profile.id)
            .in('module_id', moduleIds);
          setAllProgress(progress ?? []);
        }
      }

      setLoading(false);
    };
    fetch();
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const totalXp = profile?.total_xp ?? 0;
  const totalModules = allProgress.length;
  const completedModules = allProgress.filter(p => p.status === 'completed').length;
  const totalTime = activity.reduce((s, a) => s + a.time_spent_minutes, 0);
  const avgScore = allProgress.filter(p => p.status === 'completed').length > 0
    ? Math.round(allProgress.filter(p => p.status === 'completed').reduce((s, p) => s + p.score, 0) / allProgress.filter(p => p.status === 'completed').length)
    : 0;

  // Learning outcome metrics
  const avgImprovementRate = outcomes.length > 0
    ? Math.round(outcomes.reduce((s, o) => s + o.improvement_rate, 0) / outcomes.length)
    : 0;
  const skillsImproved = outcomes.filter(o => o.improvement_rate > 0).length;
  const totalSkillsMeasured = outcomes.length;

  // Content quality metrics
  const avgQuality = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r.quality_score, 0) / ratings.length).toFixed(1)
    : '--';
  const avgRelevance = ratings.length > 0
    ? (ratings.reduce((s, r) => s + r.relevance_score, 0) / ratings.length).toFixed(1)
    : '--';

  // Adaptive quiz metrics
  const quizCount = quizzes.length;
  const avgQuizScore = quizzes.length > 0
    ? Math.round(quizzes.reduce((s, q) => s + q.score, 0) / quizzes.length)
    : 0;
  const difficultyProgression = quizzes.length >= 2
    ? quizzes[0].difficulty_level !== quizzes[quizzes.length - 1].difficulty_level
    : false;
  const currentDifficulty = quizzes.length > 0
    ? quizzes[0].next_difficulty
    : 'medium';

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const activityByDay = last7Days.map(date => {
    const act = activity.find(a => a.date === date);
    return {
      date,
      xp: act?.xp_earned ?? 0,
      modules: act?.modules_completed ?? 0,
      time: act?.time_spent_minutes ?? 0,
    };
  });

  const maxXp = Math.max(...activityByDay.map(d => d.xp), 1);

  // Group outcomes by skill for the chart
  const skillOutcomes = outcomes.reduce<Record<string, LearningOutcome[]>>((acc, o) => {
    if (!acc[o.skill_name]) acc[o.skill_name] = [];
    acc[o.skill_name].push(o);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-white mb-8">Analytics & Progress</h1>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <Zap className="w-5 h-5 text-emerald-400 mb-2" />
            <div className="text-2xl font-bold text-white">{totalXp.toLocaleString()}</div>
            <div className="text-sm text-slate-400">Total XP</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <BookOpen className="w-5 h-5 text-blue-400 mb-2" />
            <div className="text-2xl font-bold text-white">{completedModules}/{totalModules}</div>
            <div className="text-sm text-slate-400">Modules Done</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <Clock className="w-5 h-5 text-teal-400 mb-2" />
            <div className="text-2xl font-bold text-white">{totalTime}m</div>
            <div className="text-sm text-slate-400">Time Spent</div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
            <Target className="w-5 h-5 text-amber-400 mb-2" />
            <div className="text-2xl font-bold text-white">{avgScore}%</div>
            <div className="text-sm text-slate-400">Avg Score</div>
          </div>
        </div>

        {/* Learning Outcome Improvement Rates */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Learning Outcome Improvement</h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-lg font-bold text-white">{avgImprovementRate > 0 ? '+' : ''}{avgImprovementRate}%</div>
                <div className="text-xs text-slate-400">Avg Improvement</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">{skillsImproved}/{totalSkillsMeasured}</div>
                <div className="text-xs text-slate-400">Skills Improved</div>
              </div>
            </div>
          </div>

          {Object.keys(skillOutcomes).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(skillOutcomes).map(([skill, skillData]) => {
                const latest = skillData[0];
                const trend = skillData.length >= 2
                  ? skillData[0].post_score - skillData[1].post_score
                  : latest.improvement_rate;
                const TrendIcon = trend > 0 ? ArrowUpRight : trend < 0 ? ArrowDownRight : Minus;
                const trendColor = trend > 0 ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-slate-400';

                return (
                  <div key={skill} className="flex items-center gap-4 bg-slate-700/30 rounded-xl p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white capitalize">{skill}</span>
                        <div className="flex items-center gap-1">
                          <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                          <span className={`text-sm font-medium ${trendColor}`}>
                            {trend > 0 ? '+' : ''}{Math.round(trend)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-600/50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${latest.post_score}%`,
                              backgroundColor: latest.post_score >= 70 ? '#10b981' : latest.post_score >= 40 ? '#f59e0b' : '#ef4444',
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 w-8">{latest.post_score}%</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500">Pre: {latest.pre_score}%</span>
                        <span className="text-xs text-slate-600">→</span>
                        <span className="text-xs text-slate-500">Post: {latest.post_score}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Complete an adaptive quiz to see your improvement rates</p>
            </div>
          )}
        </div>

        {/* Content Quality & Adaptive Quiz - side by side */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Content Quality & Relevance */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Content Quality</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">{avgQuality}</div>
                <div className="text-xs text-slate-400">Avg Quality</div>
                <div className="flex items-center justify-center gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i <= Math.round(Number(avgQuality) || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">{avgRelevance}</div>
                <div className="text-xs text-slate-400">Avg Relevance</div>
                <div className="flex items-center justify-center gap-0.5 mt-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i <= Math.round(Number(avgRelevance) || 0) ? 'text-emerald-400 fill-emerald-400' : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {ratings.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider">Recent Ratings</h3>
                {ratings.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-slate-700/20 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i <= r.quality_score ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">Q</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i <= r.relevance_score ? 'text-emerald-400 fill-emerald-400' : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400">R</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center mt-4">Rate modules after completing them to see quality scores</p>
            )}
          </div>

          {/* Adaptive Quiz Performance */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Brain className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Adaptive Quizzes</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">{quizCount}</div>
                <div className="text-xs text-slate-400">Quizzes Taken</div>
              </div>
              <div className="bg-slate-700/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-white mb-1">{avgQuizScore}%</div>
                <div className="text-xs text-slate-400">Avg Score</div>
              </div>
            </div>

            {quizzes.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-700/20 rounded-xl p-3">
                  <span className="text-sm text-slate-300">Current Level</span>
                  <span className={`text-sm font-medium capitalize px-2 py-0.5 rounded-full ${
                    currentDifficulty === 'hard' ? 'bg-red-500/20 text-red-400' :
                    currentDifficulty === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {currentDifficulty}
                  </span>
                </div>

                {difficultyProgression && (
                  <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-300">Difficulty adapting to your performance</span>
                  </div>
                )}

                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mt-2">Recent Quizzes</h3>
                {quizzes.slice(0, 4).map(q => (
                  <div key={q.id} className="flex items-center justify-between bg-slate-700/20 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium capitalize ${
                        q.difficulty_level === 'hard' ? 'bg-red-500/20 text-red-400' :
                        q.difficulty_level === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {q.difficulty_level}
                      </span>
                      <span className="text-xs text-slate-400">
                        {q.correct_answers}/{q.total_questions}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${
                      q.score >= 70 ? 'text-emerald-400' : q.score >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {q.score}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center mt-4">Take adaptive quizzes to track your performance</p>
            )}
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Last 7 Days</h2>
          </div>

          <div className="flex items-end gap-3 h-40 mb-4">
            {activityByDay.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-xs text-slate-400 mb-1">{day.xp}</div>
                <div className="w-full relative" style={{ height: '100px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500/60 to-teal-500/40 rounded-t-md transition-all duration-500"
                    style={{ height: `${Math.max(4, (day.xp / maxXp) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Path Progress */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Path Progress</h2>
          <div className="space-y-4">
            {paths.map(path => {
              const pathModules = allProgress.filter(p =>
                path.modules?.some(m => m.id === p.module_id)
              );
              const completed = pathModules.filter(p => p.status === 'completed').length;
              const total = pathModules.length || 1;
              const pct = (completed / total) * 100;

              return (
                <div key={path.id} className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: ((path.subject as { color?: string })?.color ?? '#3B82F6') + '20' }}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: (path.subject as { color?: string })?.color ?? '#3B82F6' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white truncate">{path.title}</span>
                      <span className="text-xs text-slate-400">{completed}/{total}</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Streak & Goals */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-semibold text-white">Streak</h2>
            </div>
            <div className="text-4xl font-bold text-white mb-1">{profile?.streak_days ?? 0}</div>
            <div className="text-slate-400">consecutive days</div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold text-white">Goals</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(profile?.goals ?? []).map((goal) => (
                <span key={goal} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm">
                  {goal}
                </span>
              ))}
              {(!profile?.goals || profile.goals.length === 0) && (
                <span className="text-slate-500 text-sm">No goals set</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
