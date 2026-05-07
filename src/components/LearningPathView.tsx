import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { LearningPath, Module, UserProgress } from '../lib/types';
import {
  BookOpen, ChevronLeft, CheckCircle2, Lock, Play,
  Clock, Zap, ArrowRight
} from 'lucide-react';

interface Props {
  pathId: string;
  onBack: () => void;
  onModuleSelect: (moduleId: string, subjectId?: string) => void;
}

export default function LearningPathView({ pathId, onBack, onModuleSelect }: Props) {
  const { profile } = useAuth();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [modules, setModules] = useState<(Module & { progress?: UserProgress })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      const [pathRes, modulesRes] = await Promise.all([
        supabase
          .from('learning_paths')
          .select('*, subject:subjects(*)')
          .eq('id', pathId)
          .maybeSingle(),
        supabase
          .from('modules')
          .select('*')
          .eq('learning_path_id', pathId)
          .order('module_order', { ascending: true }),
      ]);

      setPath(pathRes.data);

      if (modulesRes.data) {
        const moduleIds = modulesRes.data.map((m: Module) => m.id);
        const { data: progress } = await supabase
          .from('user_progress')
          .select('*')
          .eq('user_id', profile.id)
          .in('module_id', moduleIds);

        const progressMap = new Map((progress ?? []).map((p: UserProgress) => [p.module_id, p]));

        const modulesWithProgress = modulesRes.data.map((m: Module) => ({
          ...m,
          progress: progressMap.get(m.id),
        }));

        if (modulesWithProgress.length > 0 && !modulesWithProgress.some(m => m.progress?.status === 'in_progress')) {
          const firstLocked = modulesWithProgress.find(m => !m.progress || m.progress.status === 'locked');
          if (firstLocked) {
            await supabase
              .from('user_progress')
              .upsert({
                user_id: profile.id,
                module_id: firstLocked.id,
                status: 'in_progress',
              }, { onConflict: 'user_id,module_id' });
            firstLocked.progress = { ...firstLocked.progress, status: 'in_progress' } as UserProgress;
          }
        }

        setModules(modulesWithProgress);
      }
      setLoading(false);
    };
    fetch();
  }, [pathId, profile]);

  if (loading || !path) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const completedCount = modules.filter(m => m.progress?.status === 'completed').length;
  const progressPercent = modules.length > 0 ? (completedCount / modules.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">{path.title}</h1>
              <p className="text-slate-400">{path.description}</p>
            </div>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-emerald-500/10 text-emerald-400">
              {path.difficulty}
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-400 mb-4">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              {modules.length} modules
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {path.estimated_hours}h estimated
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              {modules.reduce((s, m) => s + m.xp_reward, 0)} XP total
            </span>
          </div>

          <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-slate-400 mt-2">{completedCount} of {modules.length} modules completed</p>
        </div>

        {/* Module List */}
        <div className="space-y-3">
          {modules.map((mod, index) => {
            const status = mod.progress?.status ?? 'locked';
            const isCurrent = status === 'in_progress';
            const isCompleted = status === 'completed';
            const isLocked = status === 'locked';

            return (
              <button
                key={mod.id}
                onClick={() => !isLocked ? onModuleSelect(mod.id, path.subject_id) : undefined}
                disabled={isLocked}
                className={`w-full text-left bg-slate-800/50 border rounded-2xl p-5 transition-all duration-200 group ${
                  isCurrent
                    ? 'border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                    : isCompleted
                    ? 'border-slate-700/50 hover:border-slate-600/50'
                    : 'border-slate-700/30 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    isCurrent
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isCompleted
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-slate-700/50 text-slate-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : isCurrent ? (
                      <Play className="w-6 h-6" />
                    ) : (
                      <Lock className="w-5 h-5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-500">Module {index + 1}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        mod.content_type === 'quiz' ? 'bg-amber-500/10 text-amber-400' :
                        mod.content_type === 'project' ? 'bg-rose-500/10 text-rose-400' :
                        mod.content_type === 'practice' ? 'bg-cyan-500/10 text-cyan-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {mod.content_type}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white truncate">{mod.title}</h3>
                    <p className="text-sm text-slate-400 truncate">{mod.description}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <div className="text-sm text-slate-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        {mod.xp_reward} XP
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {mod.estimated_minutes}m
                      </div>
                    </div>
                    {!isLocked && (
                      <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
