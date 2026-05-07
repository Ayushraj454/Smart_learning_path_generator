import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Profile, Subject, InstructorSubject, LearningPath, UserProgress } from '../lib/types';
import {
  BookOpen, Users, Plus, X, Check, Trash2,
  Loader2, ChevronRight, Clock, Zap, Eye
} from 'lucide-react';

interface Props {
  onPathSelect?: (pathId: string) => void;
}

export default function InstructorDashboard({ onPathSelect }: Props) {
  const { profile, signOut } = useAuth();
  const [teachingSubjects, setTeachingSubjects] = useState<InstructorSubject[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [sharedStudents, setSharedStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [addingSubject, setAddingSubject] = useState<string | null>(null);
  const [bioText, setBioText] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      const [teachingRes, subjectsRes, sharesRes] = await Promise.all([
        supabase
          .from('instructor_subjects')
          .select('*, subject:subjects(*)')
          .eq('instructor_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase.from('subjects').select('*').order('name'),
        supabase
          .from('progress_shares')
          .select('*, viewer:profiles!progress_shares_viewer_id_fkey(id, full_name, email)')
          .eq('sharer_id', profile.id)
          .eq('revoked', false),
      ]);

      setTeachingSubjects(teachingRes.data ?? []);
      setAllSubjects(subjectsRes.data ?? []);

      // Get student progress data from shares
      const shares = sharesRes.data ?? [];
      const viewerIds = shares.map(s => s.viewer_id).filter((v): v is string => v !== null);

      if (viewerIds.length > 0) {
        const [pathsRes, progressRes, profilesRes] = await Promise.all([
          supabase
            .from('learning_paths')
            .select('*, subject:subjects(*)')
            .in('user_id', viewerIds),
          supabase
            .from('user_progress')
            .select('*')
            .in('user_id', viewerIds),
          supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', viewerIds),
        ]);

        const profileMap = new Map((profilesRes.data ?? []).map((p: Profile) => [p.id, p.full_name]));
        const progressMap = new Map<string, UserProgress[]>();
        (progressRes.data ?? []).forEach((p: UserProgress) => {
          const arr = progressMap.get(p.user_id) ?? [];
          arr.push(p);
          progressMap.set(p.user_id, arr);
        });

        const studentMap = new Map<string, StudentSummary>();
        (pathsRes.data ?? []).forEach((path: LearningPath & { subject?: Subject }) => {
          const existing = studentMap.get(path.user_id);
          const progress = progressMap.get(path.user_id) ?? [];
          const completed = progress.filter(p => p.status === 'completed').length;
          const totalXp = progress.reduce((s, p) => s + (p.score || 0), 0);

          if (existing) {
            existing.paths.push(path);
            existing.completedModules += completed;
            existing.totalXp += totalXp;
          } else {
            studentMap.set(path.user_id, {
              userId: path.user_id,
              name: profileMap.get(path.user_id) ?? 'Student',
              paths: [path],
              completedModules: completed,
              totalXp,
            });
          }
        });

        setSharedStudents(Array.from(studentMap.values()));
      }

      setLoading(false);
    };
    fetch();
  }, [profile]);

  const handleAddSubject = async (subjectId: string) => {
    if (!profile) return;
    setAddingSubject(subjectId);
    const { data } = await supabase
      .from('instructor_subjects')
      .insert({
        instructor_id: profile.id,
        subject_id: subjectId,
        bio: bioText,
      })
      .select('*, subject:subjects(*)')
      .maybeSingle();
    if (data) {
      setTeachingSubjects(prev => [data, ...prev]);
    }
    setBioText('');
    setAddingSubject(null);
    setShowAddSubject(false);
  };

  const handleRemoveSubject = async (id: string) => {
    await supabase.from('instructor_subjects').delete().eq('id', id);
    setTeachingSubjects(prev => prev.filter(s => s.id !== id));
  };

  const handleToggleActive = async (item: InstructorSubject) => {
    await supabase
      .from('instructor_subjects')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);
    setTeachingSubjects(prev =>
      prev.map(s => s.id === item.id ? { ...s, is_active: !s.is_active } : s)
    );
  };

  const teachingSubjectIds = new Set(teachingSubjects.map(s => s.subject_id));

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
              Instructor Dashboard
            </h1>
            <p className="text-slate-400 mt-1">Manage your teaching subjects and monitor students</p>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-all"
          >
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<BookOpen className="w-5 h-5" />} label="Teaching Subjects" value={`${teachingSubjects.filter(s => s.is_active).length}`} color="teal" />
          <StatCard icon={<Users className="w-5 h-5" />} label="Shared Students" value={`${sharedStudents.length}`} color="blue" />
          <StatCard icon={<Zap className="w-5 h-5" />} label="Student XP Total" value={`${sharedStudents.reduce((s, st) => s + st.totalXp, 0).toLocaleString()}`} color="emerald" />
          <StatCard icon={<Check className="w-5 h-5" />} label="Modules Completed" value={`${sharedStudents.reduce((s, st) => s + st.completedModules, 0)}`} color="orange" />
        </div>

        {/* Teaching Subjects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Your Teaching Subjects</h2>
            <button
              onClick={() => setShowAddSubject(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-lg hover:bg-teal-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Subject
            </button>
          </div>

          {teachingSubjects.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No teaching subjects yet</h3>
              <p className="text-slate-400 mb-4">Add subjects you teach so students can find you</p>
              <button
                onClick={() => setShowAddSubject(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-medium rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all shadow-lg shadow-teal-500/25"
              >
                Add Teaching Subject
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {teachingSubjects.map(item => {
                const subject = item.subject as Subject | undefined;
                return (
                  <div
                    key={item.id}
                    className={`bg-slate-800/50 border rounded-2xl p-6 transition-all duration-200 ${
                      item.is_active
                        ? 'border-teal-500/30'
                        : 'border-slate-700/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: (subject?.color ?? '#3B82F6') + '20' }}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: subject?.color ?? '#3B82F6' }}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{subject?.name ?? 'Subject'}</h3>
                          <span className={`text-xs font-medium ${item.is_active ? 'text-teal-400' : 'text-slate-500'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleActive(item)}
                          className={`p-1.5 rounded-lg transition-all ${
                            item.is_active
                              ? 'text-teal-400 hover:bg-teal-500/10'
                              : 'text-slate-500 hover:bg-slate-700/50'
                          }`}
                          title={item.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveSubject(item.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {item.bio && (
                      <p className="text-sm text-slate-400 line-clamp-2">{item.bio}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Shared Students */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Students Sharing Progress</h2>
          {sharedStudents.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
              <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No students are sharing their progress with you yet</p>
              <p className="text-slate-500 text-xs mt-1">Students can share progress from their Settings page</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sharedStudents.map(student => (
                <div
                  key={student.userId}
                  onClick={() => setSelectedStudent(selectedStudent?.userId === student.userId ? null : student)}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5 cursor-pointer hover:border-slate-600/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 font-medium">
                        {student.name[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">{student.name}</h3>
                        <p className="text-sm text-slate-400">{student.paths.length} learning path{student.paths.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        {student.totalXp} XP
                      </span>
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        {student.completedModules} done
                      </span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${selectedStudent?.userId === student.userId ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {selectedStudent?.userId === student.userId && (
                    <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-2">
                      {student.paths.map(path => {
                        const subject = path.subject as Subject | undefined;
                        return (
                          <div
                            key={path.id}
                            onClick={(e) => { e.stopPropagation(); onPathSelect?.(path.id); }}
                            className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 cursor-pointer transition-all"
                          >
                            <div
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: (subject?.color ?? '#3B82F6') + '20' }}
                            >
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: subject?.color ?? '#3B82F6' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-white truncate">{path.title}</div>
                              <div className="text-xs text-slate-400 flex items-center gap-2">
                                <span>{path.difficulty}</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {path.estimated_hours}h
                                </span>
                              </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              path.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
                              path.status === 'completed' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-slate-500/10 text-slate-400'
                            }`}>
                              {path.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Subject Modal */}
        {showAddSubject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddSubject(false)} />
            <div className="relative w-full max-w-lg bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <div>
                  <h2 className="text-xl font-bold text-white">Add Teaching Subject</h2>
                  <p className="text-sm text-slate-400 mt-1">Choose subjects you teach</p>
                </div>
                <button
                  onClick={() => setShowAddSubject(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Teaching Bio (optional)</label>
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    placeholder="Brief description of your teaching approach for this subject..."
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all resize-none"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {allSubjects
                    .filter(s => !teachingSubjectIds.has(s.id))
                    .map(subject => (
                      <button
                        key={subject.id}
                        onClick={() => handleAddSubject(subject.id)}
                        disabled={addingSubject === subject.id}
                        className="p-4 rounded-xl border-2 border-slate-600/50 bg-slate-700/30 hover:border-teal-500/50 text-left transition-all duration-200 disabled:opacity-50"
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
                        {addingSubject === subject.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-teal-400 mx-auto" />
                        ) : (
                          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-teal-400">
                            <Plus className="w-3.5 h-3.5" />
                            Add
                          </div>
                        )}
                      </button>
                    ))}
                </div>
                {allSubjects.filter(s => !teachingSubjectIds.has(s.id)).length === 0 && (
                  <p className="text-center text-slate-400 text-sm py-4">You've added all available subjects</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface StudentSummary {
  userId: string;
  name: string;
  paths: LearningPath[];
  completedModules: number;
  totalXp: number;
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
