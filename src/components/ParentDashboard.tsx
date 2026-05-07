import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Profile, ParentalControl, DailyActivity, LearningPath, UserProgress, Subject } from '../lib/types';
import {
  Shield, Users, Zap, BookOpen, Clock, TrendingUp,
  Flame, ChevronDown, ChevronUp, Settings, BarChart3,
  ArrowUpRight, ArrowDownRight, Minus, Eye, AlertCircle
} from 'lucide-react';

interface Props {
  onOpenSettings: () => void;
}

interface ChildData {
  control: ParentalControl;
  profile: Profile;
  paths: (LearningPath & { subject?: Subject })[];
  progress: UserProgress[];
  activity: DailyActivity[];
  streak: number;
  totalXp: number;
}

export default function ParentDashboard({ onOpenSettings }: Props) {
  const { profile, signOut } = useAuth();
  const [children, setChildren] = useState<ChildData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChild, setExpandedChild] = useState<string | null>(null);

  const fetchChildData = useCallback(async () => {
    if (!profile) return;
    const { data: controls } = await supabase
      .from('parental_controls')
      .select('*, student:profiles!parental_controls_student_id_fkey(*)')
      .eq('parent_id', profile.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!controls || controls.length === 0) {
      setLoading(false);
      return;
    }

    const childIds = controls.map(c => c.student_id);

    const [pathsRes, progressRes, activityRes] = await Promise.all([
      supabase
        .from('learning_paths')
        .select('*, subject:subjects(*)')
        .in('user_id', childIds)
        .order('created_at', { ascending: false }),
      supabase
        .from('user_progress')
        .select('*')
        .in('user_id', childIds),
      supabase
        .from('daily_activity')
        .select('*')
        .in('user_id', childIds)
        .order('date', { ascending: false })
        .limit(90),
    ]);

    const childData: ChildData[] = controls.map(control => {
      const studentProfile = control.student as Profile;
      const childPaths = (pathsRes.data ?? []).filter(p => p.user_id === control.student_id);
      const childProgress = (progressRes.data ?? []).filter(p => p.user_id === control.student_id);
      const childActivity = (activityRes.data ?? []).filter(a => a.user_id === control.student_id);

      return {
        control,
        profile: studentProfile,
        paths: childPaths,
        progress: childProgress,
        activity: childActivity,
        streak: studentProfile?.streak_days ?? 0,
        totalXp: studentProfile?.total_xp ?? 0,
      };
    });

    setChildren(childData);
    setLoading(false);
  }, [profile]);

  useEffect(() => {
    fetchChildData();
  }, [fetchChildData]);

  // Real-time subscriptions for child progress updates
  useEffect(() => {
    if (!profile || children.length === 0) return;

    const childIds = children.map(c => profile.id === c.control.parent_id ? c.control.student_id : null).filter(Boolean) as string[];
    if (childIds.length === 0) return;

    const progressChannel = supabase
      .channel('parent-progress-updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'user_progress', filter: `user_id=in.(${childIds.join(',')})` },
        () => { fetchChildData(); }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'daily_activity', filter: `user_id=in.(${childIds.join(',')})` },
        () => { fetchChildData(); }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'learning_paths', filter: `user_id=in.(${childIds.join(',')})` },
        () => { fetchChildData(); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(progressChannel);
    };
  }, [profile, children.length, fetchChildData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const totalChildrenXp = children.reduce((s, c) => s + c.totalXp, 0);
  const totalModulesCompleted = children.reduce((s, c) => s + c.progress.filter(p => p.status === 'completed').length, 0);
  const totalActivePaths = children.reduce((s, c) => s + c.paths.filter(p => p.status === 'active').length, 0);
  const bestStreak = Math.max(0, ...children.map(c => c.streak));

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Parent Dashboard</h1>
            <p className="text-slate-400 mt-1">Monitor your children's learning progress</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg hover:bg-amber-500/20 transition-all"
            >
              <Settings className="w-4 h-4" />
              Controls
            </button>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Users className="w-5 h-5" />} label="Children" value={`${children.length}`} color="amber" />
          <StatCard icon={<Zap className="w-5 h-5" />} label="Combined XP" value={totalChildrenXp.toLocaleString()} color="emerald" />
          <StatCard icon={<BookOpen className="w-5 h-5" />} label="Active Paths" value={`${totalActivePaths}`} color="blue" />
          <StatCard icon={<Flame className="w-5 h-5" />} label="Best Streak" value={`${bestStreak}`} color="orange" />
        </div>

        {/* Children List */}
        {children.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No children linked yet</h3>
            <p className="text-slate-400 mb-4">Add your children in Settings to monitor their progress</p>
            <button
              onClick={onOpenSettings}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/25"
            >
              Add Child
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {children.map(child => (
              <ChildCard
                key={child.control.id}
                child={child}
                isExpanded={expandedChild === child.control.student_id}
                onToggle={() => setExpandedChild(
                  expandedChild === child.control.student_id ? null : child.control.student_id
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChildCard({ child, isExpanded, onToggle }: {
  child: ChildData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const completedModules = child.progress.filter(p => p.status === 'completed').length;
  const totalModules = child.progress.length;
  const avgScore = completedModules > 0
    ? Math.round(child.progress.filter(p => p.status === 'completed').reduce((s, p) => s + p.score, 0) / completedModules)
    : 0;
  const totalTime = child.activity.reduce((s, a) => s + a.time_spent_minutes, 0);

  // Last 7 days activity
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const activityByDay = last7Days.map(date => {
    const act = child.activity.find(a => a.date === date);
    return { date, xp: act?.xp_earned ?? 0, modules: act?.modules_completed ?? 0, time: act?.time_spent_minutes ?? 0 };
  });

  const maxXp = Math.max(...activityByDay.map(d => d.xp), 1);
  const weekXp = activityByDay.reduce((s, d) => s + d.xp, 0);
  const weekTime = activityByDay.reduce((s, d) => s + d.time, 0);

  // Today's activity
  const today = new Date().toISOString().split('T')[0];
  const todayActivity = child.activity.find(a => a.date === today);

  // Path progress
  const pathProgressMap = new Map<string, UserProgress[]>();
  child.progress.forEach(p => {
    const arr = pathProgressMap.get(p.module_id) ?? [];
    arr.push(p);
    pathProgressMap.set(p.module_id, arr);
  });

  // Score trend (compare last 5 vs previous 5 completed modules)
  const completedProgress = child.progress
    .filter(p => p.status === 'completed')
    .sort((a, b) => new Date(b.completed_at ?? b.updated_at).getTime() - new Date(a.completed_at ?? a.updated_at).getTime());
  const recentScores = completedProgress.slice(0, 5).map(p => p.score);
  const olderScores = completedProgress.slice(5, 10).map(p => p.score);
  const recentAvg = recentScores.length > 0 ? recentScores.reduce((s, v) => s + v, 0) / recentScores.length : 0;
  const olderAvg = olderScores.length > 0 ? olderScores.reduce((s, v) => s + v, 0) / olderScores.length : 0;
  const scoreTrend = recentAvg - olderAvg;
  const TrendIcon = scoreTrend > 2 ? ArrowUpRight : scoreTrend < -2 ? ArrowDownRight : Minus;
  const trendColor = scoreTrend > 2 ? 'text-emerald-400' : scoreTrend < -2 ? 'text-red-400' : 'text-slate-400';

  const control = child.control;

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden transition-all duration-200">
      {/* Header row */}
      <div
        onClick={onToggle}
        className="p-5 cursor-pointer hover:bg-slate-700/20 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
              {child.profile?.full_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{child.profile?.full_name ?? 'Child'}</h3>
              <div className="flex items-center gap-3 text-sm text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  {child.totalXp.toLocaleString()} XP
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  {child.streak} day streak
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  {child.paths.filter(p => p.status === 'active').length} active
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className={trendColor}>
                {scoreTrend > 2 ? '+' : ''}{Math.round(scoreTrend)}% trend
              </span>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-5 pb-6 space-y-6 border-t border-slate-700/50 pt-5">
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniStat label="Today's XP" value={`${todayActivity?.xp_earned ?? 0}`} color="emerald" />
            <MiniStat label="Today's Time" value={`${todayActivity?.time_spent_minutes ?? 0}m`} color="teal" />
            <MiniStat label="Avg Score" value={`${avgScore}%`} color="blue" />
            <MiniStat label="Total Time" value={`${Math.round(totalTime / 60)}h`} color="orange" />
          </div>

          {/* Weekly Activity Chart */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                Last 7 Days
              </h4>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span>{weekXp} XP</span>
                <span>{weekTime}m</span>
              </div>
            </div>
            <div className="flex items-end gap-2 h-24">
              {activityByDay.map(day => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-slate-500">{day.xp || ''}</div>
                  <div className="w-full relative" style={{ height: '60px' }}>
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

          {/* Learning Paths Progress */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              Learning Paths
            </h4>
            {child.paths.length === 0 ? (
              <p className="text-sm text-slate-500">No learning paths yet</p>
            ) : (
              <div className="space-y-3">
                {child.paths.map(path => {
                  const subject = path.subject as Subject | undefined;
                  const pathProgress = child.progress.filter(p => {
                    // Match progress to modules in this path
                    return true; // simplified - show all progress
                  });
                  const pathCompleted = child.progress.filter(p => p.status === 'completed').length;
                  const pathTotal = Math.max(1, child.progress.length);
                  const pct = (pathCompleted / pathTotal) * 100;

                  return (
                    <div key={path.id} className="bg-slate-700/30 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: (subject?.color ?? '#3B82F6') + '20' }}
                        >
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: subject?.color ?? '#3B82F6' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-white truncate">{path.title}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              path.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                              path.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-slate-500/10 text-slate-400'
                            }`}>
                              {path.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span>{path.difficulty}</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {path.estimated_hours}h
                            </span>
                            <span>Module {path.current_module_index + 1}</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-600/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Score Trend */}
          {completedProgress.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                Score Trend
              </h4>
              <div className="bg-slate-700/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-slate-300">Recent avg vs. previous</span>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                    <span className={`text-sm font-medium ${trendColor}`}>
                      {scoreTrend > 0 ? '+' : ''}{Math.round(scoreTrend)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-end gap-1 h-16">
                  {completedProgress.slice(0, 10).reverse().map((p, i) => (
                    <div key={p.id} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t transition-all duration-300"
                        style={{
                          height: `${Math.max(4, p.score)}%`,
                          backgroundColor: p.score >= 70 ? '#10b981' : p.score >= 50 ? '#f59e0b' : '#ef4444',
                          opacity: 0.6 + (i / 10) * 0.4,
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span>Older</span>
                  <span>Recent</span>
                </div>
              </div>
            </div>
          )}

          {/* Parental Controls Summary */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400" />
              Active Controls
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <ControlPill icon={<Clock className="w-3 h-3" />} label="Daily limit" value={`${control.daily_time_limit_minutes}m`} />
              <ControlPill icon={<Clock className="w-3 h-3" />} label="Quiz limit" value={`${control.quiz_time_limit_minutes}m`} />
              <ControlPill
                icon={<Eye className="w-3 h-3" />}
                label="AI Chat"
                value={control.restrict_chat ? 'Restricted' : 'Allowed'}
                warn={control.restrict_chat}
              />
              <ControlPill
                icon={<AlertCircle className="w-3 h-3" />}
                label="Path approval"
                value={control.require_approval ? 'Required' : 'Not required'}
                warn={control.require_approval}
              />
              <ControlPill
                icon={<AlertCircle className="w-3 h-3" />}
                label="Notifications"
                value={control.notifications_enabled ? 'On' : 'Off'}
              />
              {control.allowed_subjects && control.allowed_subjects.length > 0 && (
                <ControlPill
                  icon={<BookOpen className="w-3 h-3" />}
                  label="Subjects"
                  value={`${control.allowed_subjects.length} allowed`}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: string; color: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    orange: 'from-orange-500/20 to-orange-500/5 text-orange-400 border-orange-500/20',
    blue: 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20',
    teal: 'from-teal-500/20 to-teal-500/5 text-teal-400 border-teal-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
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

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400',
    teal: 'text-teal-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
  };
  return (
    <div className="bg-slate-700/30 rounded-xl p-3 text-center">
      <div className={`text-lg font-bold ${colorMap[color] ?? 'text-white'}`}>{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}

function ControlPill({ icon, label, value, warn }: {
  icon: React.ReactNode; label: string; value: string; warn?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
      warn ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-700/30'
    }`}>
      <span className={warn ? 'text-amber-400' : 'text-slate-400'}>{icon}</span>
      <div>
        <div className="text-slate-400">{label}</div>
        <div className={`font-medium ${warn ? 'text-amber-300' : 'text-white'}`}>{value}</div>
      </div>
    </div>
  );
}
