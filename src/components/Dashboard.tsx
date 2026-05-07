import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { LearningPath, DailyActivity, Profile, Subject, InstructorSubject } from '../lib/types';
import {
  BookOpen, Flame, Zap, TrendingUp, Clock,
  ChevronRight, Plus, X, Loader2, Users
} from 'lucide-react';

interface Props {
  onPathSelect?: (pathId: string) => void;
}

export default function Dashboard({ onPathSelect }: Props) {
  const { profile, signOut } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activity, setActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCatalog, setShowCatalog] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [instructorMap, setInstructorMap] = useState<Map<string, InstructorSubject[]>>(new Map());

  const enrolledSubjectIds = new Set(paths.map(p => p.subject_id));

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      const [pathsRes, activityRes] = await Promise.all([
        supabase
          .from('learning_paths')
          .select('*, subject:subjects(*)')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('daily_activity')
          .select('*')
          .eq('user_id', profile.id)
          .order('date', { ascending: false })
          .limit(7),
      ]);
      setPaths(pathsRes.data ?? []);
      setActivity(activityRes.data ?? []);
      setLoading(false);
    };
    fetch();
  }, [profile]);

  const openCatalog = async () => {
    if (subjects.length === 0) {
      const [subjectsRes, instructorsRes] = await Promise.all([
        supabase.from('subjects').select('*').order('name'),
        supabase
          .from('instructor_subjects')
          .select('*, instructor:profiles!instructor_subjects_instructor_id_fkey(id, full_name), subject:subjects(*)')
          .eq('is_active', true),
      ]);
      if (subjectsRes.data) setSubjects(subjectsRes.data);

      const map = new Map<string, InstructorSubject[]>();
      (instructorsRes.data ?? []).forEach((is: InstructorSubject) => {
        const arr = map.get(is.subject_id) ?? [];
        arr.push(is);
        map.set(is.subject_id, arr);
      });
      setInstructorMap(map);
    }
    setShowCatalog(true);
  };

  const handleEnroll = async (subject: Subject) => {
    if (!profile) return;
    setEnrolling(subject.id);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-path`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: profile.id,
          subject_id: subject.id,
          subject_name: subject.name,
          knowledge_level: profile.knowledge_level,
          learning_style: profile.learning_style,
          goals: profile.goals,
        }),
      });

      if (res.ok) {
        const { data: newPaths } = await supabase
          .from('learning_paths')
          .select('*, subject:subjects(*)')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: false });
        if (newPaths) setPaths(newPaths);
      }
    } catch {
      await supabase.from('learning_paths').insert({
        user_id: profile.id,
        subject_id: subject.id,
        title: `${subject.name} Learning Path`,
        description: `Personalized ${subject.name} curriculum tailored to your ${profile.learning_style} learning style`,
        difficulty: profile.knowledge_level,
        estimated_hours: profile.knowledge_level === 'beginner' ? 40 : profile.knowledge_level === 'intermediate' ? 25 : 15,
      });
      const { data: newPaths } = await supabase
        .from('learning_paths')
        .select('*, subject:subjects(*)')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      if (newPaths) setPaths(newPaths);
    } finally {
      setEnrolling(null);
    }
  };

  const todayActivity = activity.find(a => a.date === new Date().toISOString().split('T')[0]);
  const weekXp = activity.reduce((sum, a) => sum + a.xp_earned, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {(profile as Profile)?.full_name || 'Learner'}
            </h1>
            <p className="text-slate-400 mt-1">Continue your learning journey</p>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-all"
          >
            Sign Out
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Zap className="w-5 h-5" />}
            label="Total XP"
            value={(profile as Profile)?.total_xp?.toLocaleString() ?? '0'}
            color="emerald"
          />
          <StatCard
            icon={<Flame className="w-5 h-5" />}
            label="Day Streak"
            value={`${(profile as Profile)?.streak_days ?? 0}`}
            color="orange"
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            label="Active Paths"
            value={`${paths.filter(p => p.status === 'active').length}`}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="This Week XP"
            value={weekXp.toLocaleString()}
            color="teal"
          />
        </div>

        {/* Today's Activity */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Today's Progress</h2>
            <span className="text-sm text-slate-400">
              <Clock className="w-4 h-4 inline mr-1" />
              {todayActivity?.time_spent_minutes ?? 0} min today
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{todayActivity?.modules_completed ?? 0}</div>
              <div className="text-sm text-slate-400">Modules Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-400">{todayActivity?.xp_earned ?? 0}</div>
              <div className="text-sm text-slate-400">XP Earned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{todayActivity?.time_spent_minutes ?? 0}</div>
              <div className="text-sm text-slate-400">Minutes</div>
            </div>
          </div>
        </div>

        {/* Learning Paths */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Your Learning Paths</h2>
            <button
              onClick={openCatalog}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Path
            </button>
          </div>

          {paths.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No learning paths yet</h3>
              <p className="text-slate-400 mb-4">Browse subjects to start your learning journey</p>
              <button
                onClick={openCatalog}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/25"
              >
                Browse Subjects
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {paths.map(path => (
                <div
                  key={path.id}
                  onClick={() => onPathSelect?.(path.id)}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 hover:border-slate-600/50 transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: ((path.subject as { color?: string })?.color ?? '#3B82F6') + '20' }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: (path.subject as { color?: string })?.color ?? '#3B82F6' }}

                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{path.title}</h3>
                        <p className="text-sm text-slate-400">{path.difficulty} level</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      path.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : path.status === 'completed'
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'bg-slate-500/10 text-slate-400'
                    }`}>
                      {path.status}
                    </span>
                  </div>

                  <p className="text-sm text-slate-400 mb-4 line-clamp-2">{path.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {path.estimated_hours}h
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        Module {path.current_module_index + 1}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subject Catalog Modal */}
        {showCatalog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCatalog(false)} />
            <div className="relative w-full max-w-2xl bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <div>
                  <h2 className="text-xl font-bold text-white">Browse Subjects</h2>
                  <p className="text-sm text-slate-400 mt-1">Enroll in additional learning paths</p>
                </div>
                <button
                  onClick={() => setShowCatalog(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid gap-3 sm:grid-cols-2">
                  {subjects.map(subject => {
                    const isEnrolled = enrolledSubjectIds.has(subject.id);
                    const isEnrolling = enrolling === subject.id;
                    const instructors = instructorMap.get(subject.id) ?? [];
                    return (
                      <div
                        key={subject.id}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          isEnrolled
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-slate-600/50 bg-slate-700/30 hover:border-slate-500'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: (subject.color || '#3B82F6') + '20' }}
                          >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color || '#3B82F6' }} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white text-sm truncate">{subject.name}</h3>
                            <p className="text-xs text-slate-500">{subject.category}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mb-3 line-clamp-2">{subject.description}</p>

                        {instructors.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center gap-1.5 text-xs text-teal-400 mb-1.5">
                              <Users className="w-3 h-3" />
                              {instructors.length} instructor{instructors.length !== 1 ? 's' : ''} available
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {instructors.slice(0, 3).map(ins => (
                                <span
                                  key={ins.id}
                                  className="px-2 py-0.5 bg-teal-500/10 text-teal-300 rounded text-xs"
                                  title={ins.bio || undefined}
                                >
                                  {(ins.instructor as Profile)?.full_name ?? 'Instructor'}
                                </span>
                              ))}
                              {instructors.length > 3 && (
                                <span className="px-2 py-0.5 bg-slate-600/50 text-slate-400 rounded text-xs">
                                  +{instructors.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {isEnrolled ? (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                            <BookOpen className="w-3.5 h-3.5" />
                            Enrolled
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEnroll(subject)}
                            disabled={isEnrolling}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50"
                          >
                            {isEnrolling ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            {isEnrolling ? 'Enrolling...' : 'Enroll'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Weekly Activity Chart */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Weekly Activity</h2>
          <div className="flex items-end gap-2 h-32">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
              const act = activity[i];
              const height = act ? Math.max(8, (act.xp_earned / Math.max(1, weekXp)) * 100) : 4;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-500/60 to-teal-500/60 rounded-t-md transition-all duration-500"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-xs text-slate-500">{day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    orange: 'from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20',
    teal: 'from-teal-500/20 to-teal-500/5 text-teal-400 border-teal-500/20',
  };
  const classes = colorMap[color] ?? colorMap.emerald;

  return (
    <div className={`bg-gradient-to-br ${classes} border rounded-2xl p-4`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">{icon}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}
