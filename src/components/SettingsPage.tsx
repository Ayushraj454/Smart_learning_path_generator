import { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole, ProgressShare, ParentalControl } from '../lib/types';
import {
  ChevronLeft, GraduationCap, Users, Shield, Share2,
  Copy, Check, Trash2, Clock, MessageSquare, Bell,
  AlertCircle, Link2, Eye, Loader2, Plus, X, Search
} from 'lucide-react';

interface Props {
  onBack: () => void;
}

type Tab = 'role' | 'sharing' | 'parental';

export default function SettingsPage({ onBack }: Props) {
  const { profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>('role');

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'role', label: 'Role', icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'sharing', label: 'Progress Sharing', icon: <Share2 className="w-4 h-4" /> },
    { id: 'parental', label: 'Parental Controls', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.id
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:text-white hover:border-slate-600'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'role' && <RoleSettings profile={profile} onRefresh={refreshProfile} />}
        {tab === 'sharing' && <SharingSettings profile={profile} />}
        {tab === 'parental' && <ParentalSettings profile={profile} onRefresh={refreshProfile} />}
      </div>
    </div>
  );
}

function RoleSettings({ profile, onRefresh }: { profile: Profile | null; onRefresh: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const roles: { value: UserRole; label: string; desc: string; icon: React.ReactNode }[] = [
    { value: 'student', label: 'Student', desc: 'Learn and track your progress', icon: <GraduationCap className="w-6 h-6" /> },
    { value: 'instructor', label: 'Instructor', desc: 'Create content and monitor students', icon: <Users className="w-6 h-6" /> },
    { value: 'parent', label: 'Parent / Guardian', desc: 'Monitor and set controls for your child', icon: <Shield className="w-6 h-6" /> },
  ];

  const handleRoleChange = async (newRole: UserRole) => {
    if (!profile || profile.role === newRole) return;
    setSaving(true);
    setSaved(false);
    await supabase.from('profiles').update({ role: newRole }).eq('id', profile.id);
    await onRefresh();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Your Role</h2>
        <p className="text-sm text-slate-400">Choose how you use the platform</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {roles.map(r => {
          const isActive = profile?.role === r.value;
          return (
            <button
              key={r.value}
              onClick={() => handleRoleChange(r.value)}
              disabled={saving}
              className={`p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                isActive
                  ? 'border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
                  : 'border-slate-600/50 bg-slate-800/50 hover:border-slate-500'
              }`}
            >
              <div className={`mb-3 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                {r.icon}
              </div>
              <div className="font-semibold text-white mb-1">{r.label}</div>
              <div className="text-xs text-slate-400">{r.desc}</div>
              {isActive && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Active
                </div>
              )}
            </button>
          );
        })}
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </div>
      )}
      {saved && (
        <div className="flex items-center gap-2 text-sm text-emerald-400">
          <Check className="w-4 h-4" />
          Role updated
        </div>
      )}

      {profile?.role === 'instructor' && <InstructorInfo />}
      {profile?.role === 'parent' && <ParentInfo />}
    </div>
  );
}

function InstructorInfo() {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mt-4">
      <div className="flex items-center gap-3 mb-3">
        <Users className="w-5 h-5 text-teal-400" />
        <h3 className="font-semibold text-white">Instructor Features</h3>
      </div>
      <ul className="space-y-2 text-sm text-slate-400">
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
          View shared student progress reports
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
          Access analytics across shared learners
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
          Receive progress share links from students
        </li>
      </ul>
    </div>
  );
}

function ParentInfo() {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mt-4">
      <div className="flex items-center gap-3 mb-3">
        <Shield className="w-5 h-5 text-amber-400" />
        <h3 className="font-semibold text-white">Parent Features</h3>
      </div>
      <ul className="space-y-2 text-sm text-slate-400">
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          Set daily time limits for your child
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          Restrict specific subjects
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          Control AI tutor chat access
        </li>
        <li className="flex items-start gap-2">
          <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          Require approval for new learning paths
        </li>
      </ul>
    </div>
  );
}

function SharingSettings({ profile }: { profile: Profile | null }) {
  const [shares, setShares] = useState<ProgressShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [searching, setSearching] = useState(false);
  const [scope, setScope] = useState<'full' | 'summary'>('summary');

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('progress_shares')
        .select('*, viewer:profiles!progress_shares_viewer_id_fkey(id, full_name, email)')
        .eq('sharer_id', profile.id)
        .order('created_at', { ascending: false });
      setShares(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [profile]);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .ilike('email', searchEmail.trim())
      .limit(1)
      .maybeSingle();
    setSearchResult(data);
    setSearching(false);
  };

  const handleShareToUser = async () => {
    if (!profile || !searchResult) return;
    setCreating(true);
    const { data } = await supabase
      .from('progress_shares')
      .insert({
        sharer_id: profile.id,
        viewer_id: searchResult.id,
        scope,
      })
      .select('*, viewer:profiles!progress_shares_viewer_id_fkey(id, full_name, email)')
      .maybeSingle();
    if (data) {
      setShares(prev => [data, ...prev]);
    }
    setSearchEmail('');
    setSearchResult(null);
    setCreating(false);
  };

  const handleCreateLink = async () => {
    if (!profile) return;
    setCreating(true);
    const { data } = await supabase
      .from('progress_shares')
      .insert({
        sharer_id: profile.id,
        viewer_id: null,
        scope,
      })
      .select('*, viewer:profiles!progress_shares_viewer_id_fkey(id, full_name, email)')
      .maybeSingle();
    if (data) {
      setShares(prev => [data, ...prev]);
    }
    setCreating(false);
  };

  const handleRevoke = async (shareId: string) => {
    await supabase.from('progress_shares').update({ revoked: true }).eq('id', shareId);
    setShares(prev => prev.map(s => s.id === shareId ? { ...s, revoked: true } : s));
  };

  const handleDelete = async (shareId: string) => {
    await supabase.from('progress_shares').delete().eq('id', shareId);
    setShares(prev => prev.filter(s => s.id !== shareId));
  };

  const copyLink = (token: string) => {
    const url = `${window.location.origin}?share=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Progress Sharing</h2>
        <p className="text-sm text-slate-400">Share your learning progress with instructors or parents</p>
      </div>

      {/* Create new share */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6">
        <h3 className="font-medium text-white mb-4">Share with someone</h3>

        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-slate-400">Scope:</span>
          <button
            onClick={() => setScope('summary')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              scope === 'summary'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setScope('full')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              scope === 'full'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
            }`}
          >
            Full Details
          </button>
        </div>

        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              placeholder="Search by email address"
              value={searchEmail}
              onChange={(e) => { setSearchEmail(e.target.value); setSearchResult(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2.5 bg-slate-700 text-slate-300 rounded-xl text-sm hover:bg-slate-600 transition-all disabled:opacity-50"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
          </button>
        </div>

        {searchResult && (
          <div className="flex items-center justify-between bg-slate-700/30 border border-slate-600/50 rounded-xl p-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-sm font-medium">
                {(searchResult as Profile & { email?: string }).full_name?.[0] ?? '?'}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{(searchResult as Profile & { email?: string }).full_name}</div>
                <div className="text-xs text-slate-400">{searchEmail}</div>
              </div>
            </div>
            <button
              onClick={handleShareToUser}
              disabled={creating}
              className="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Share'}
            </button>
          </div>
        )}

        <div className="border-t border-slate-700/50 pt-4">
          <p className="text-xs text-slate-400 mb-3">Or create a shareable link:</p>
          <button
            onClick={handleCreateLink}
            disabled={creating}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Link2 className="w-4 h-4" />
            Generate Share Link
          </button>
        </div>
      </div>

      {/* Existing shares */}
      <div>
        <h3 className="font-medium text-white mb-3">Active Shares</h3>
        {shares.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
            <Share2 className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No active shares yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {shares.map(share => (
              <div
                key={share.id}
                className={`bg-slate-800/50 border rounded-xl p-4 flex items-center justify-between ${
                  share.revoked ? 'border-slate-700/30 opacity-50' : 'border-slate-700/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    share.viewer_id ? 'bg-teal-500/20 text-teal-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {share.viewer_id ? <Eye className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {share.viewer
                        ? (share.viewer as Profile & { email?: string }).full_name ?? 'User'
                        : 'Share Link'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        share.scope === 'full' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-600/50 text-slate-400'
                      }`}>
                        {share.scope}
                      </span>
                      {share.revoked && (
                        <span className="text-red-400">Revoked</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!share.viewer_id && !share.revoked && (
                    <button
                      onClick={() => copyLink(share.share_token)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
                      title="Copy link"
                    >
                      {copiedToken === share.share_token ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  {!share.revoked && (
                    <button
                      onClick={() => handleRevoke(share.id)}
                      className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 rounded-lg transition-all"
                      title="Revoke"
                    >
                      <AlertCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(share.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ParentalSettings({ profile, onRefresh }: { profile: Profile | null; onRefresh: () => Promise<void> }) {
  const [controls, setControls] = useState<ParentalControl[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<Profile | null>(null);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    daily_time_limit_minutes: 120,
    quiz_time_limit_minutes: 60,
    restrict_chat: false,
    require_approval: false,
    notifications_enabled: true,
    allowed_subjects: [] as string[],
  });

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('parental_controls')
        .select('*, student:profiles!parental_controls_student_id_fkey(id, full_name, email)')
        .eq('parent_id', profile.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      setControls(data ?? []);
      setLoading(false);
    };
    fetch();
  }, [profile]);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .ilike('email', searchEmail.trim())
      .limit(1)
      .maybeSingle();
    setSearchResult(data);
    setSearching(false);
  };

  const handleAddControl = async () => {
    if (!profile || !searchResult) return;
    setAdding(true);
    const { data } = await supabase
      .from('parental_controls')
      .insert({
        parent_id: profile.id,
        student_id: searchResult.id,
        daily_time_limit_minutes: editForm.daily_time_limit_minutes,
        quiz_time_limit_minutes: editForm.quiz_time_limit_minutes,
        restrict_chat: editForm.restrict_chat,
        require_approval: editForm.require_approval,
        notifications_enabled: editForm.notifications_enabled,
        allowed_subjects: editForm.allowed_subjects,
      })
      .select('*, student:profiles!parental_controls_student_id_fkey(id, full_name, email)')
      .maybeSingle();
    if (data) {
      setControls(prev => [data, ...prev]);
    }
    setShowAdd(false);
    setSearchEmail('');
    setSearchResult(null);
    setAdding(false);
  };

  const handleUpdate = async (controlId: string) => {
    await supabase
      .from('parental_controls')
      .update({
        daily_time_limit_minutes: editForm.daily_time_limit_minutes,
        quiz_time_limit_minutes: editForm.quiz_time_limit_minutes,
        restrict_chat: editForm.restrict_chat,
        require_approval: editForm.require_approval,
        notifications_enabled: editForm.notifications_enabled,
        allowed_subjects: editForm.allowed_subjects,
        updated_at: new Date().toISOString(),
      })
      .eq('id', controlId);
    setControls(prev =>
      prev.map(c => c.id === controlId ? { ...c, ...editForm } : c)
    );
    setEditingId(null);
  };

  const handleRevoke = async (controlId: string) => {
    await supabase
      .from('parental_controls')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('id', controlId);
    setControls(prev => prev.filter(c => c.id !== controlId));
  };

  const startEdit = (control: ParentalControl) => {
    setEditForm({
      daily_time_limit_minutes: control.daily_time_limit_minutes,
      quiz_time_limit_minutes: control.quiz_time_limit_minutes,
      restrict_chat: control.restrict_chat,
      require_approval: control.require_approval,
      notifications_enabled: control.notifications_enabled,
      allowed_subjects: control.allowed_subjects ?? [],
    });
    setEditingId(control.id);
  };

  // Student view: show controls applied to them
  const [studentControls, setStudentControls] = useState<ParentalControl[]>([]);

  useEffect(() => {
    if (!profile || profile.role !== 'student') return;
    const fetch = async () => {
      const { data } = await supabase
        .from('parental_controls')
        .select('*, parent:profiles!parental_controls_parent_id_fkey(id, full_name)')
        .eq('student_id', profile.id)
        .eq('status', 'active');
      setStudentControls(data ?? []);
    };
    fetch();
  }, [profile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Student view
  if (profile?.role === 'student') {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-white mb-1">Parental Controls</h2>
          <p className="text-sm text-slate-400">Controls set by your parent or guardian</p>
        </div>

        {studentControls.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
            <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No parental controls are active on your account</p>
          </div>
        ) : (
          <div className="space-y-3">
            {studentControls.map(c => (
              <div key={c.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="font-medium text-white">Controls by {(c as ParentalControl & { parent?: Profile }).parent?.full_name ?? 'Parent'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ControlBadge icon={<Clock className="w-3.5 h-3.5" />} label="Daily limit" value={`${c.daily_time_limit_minutes} min`} />
                  <ControlBadge icon={<Clock className="w-3.5 h-3.5" />} label="Quiz limit" value={`${c.quiz_time_limit_minutes} min`} />
                  <ControlBadge icon={<MessageSquare className="w-3.5 h-3.5" />} label="AI Chat" value={c.restrict_chat ? 'Restricted' : 'Allowed'} active={!c.restrict_chat} />
                  <ControlBadge icon={<Bell className="w-3.5 h-3.5" />} label="Notifications" value={c.notifications_enabled ? 'On' : 'Off'} active={c.notifications_enabled} />
                </div>
                {c.require_approval && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    New learning paths require parent approval
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Parent view
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white mb-1">Parental Controls</h2>
        <p className="text-sm text-slate-400">Manage controls for your children</p>
      </div>

      <button
        onClick={() => {
          setEditForm({
            daily_time_limit_minutes: 120,
            quiz_time_limit_minutes: 60,
            restrict_chat: false,
            require_approval: false,
            notifications_enabled: true,
            allowed_subjects: [],
          });
          setShowAdd(true);
        }}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all"
      >
        <Plus className="w-4 h-4" />
        Add Child
      </button>

      {/* Add child modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)} />
          <div className="relative w-full max-w-lg bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h3 className="text-lg font-bold text-white">Add Child</h3>
              <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Search by email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="child@email.com"
                    value={searchEmail}
                    onChange={(e) => { setSearchEmail(e.target.value); setSearchResult(null); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                  />
                  <button onClick={handleSearch} disabled={searching} className="px-4 py-2.5 bg-slate-700 text-slate-300 rounded-xl text-sm hover:bg-slate-600 transition-all disabled:opacity-50">
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                  </button>
                </div>
              </div>

              {searchResult && searchResult.role !== 'student' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-400 text-sm">
                  This user is not a student account. They can change their role in Settings.
                </div>
              )}

              {searchResult && searchResult.role === 'student' && (
                <div className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-3">
                  <div className="text-sm font-medium text-white">{(searchResult as Profile & { email?: string }).full_name}</div>
                  <div className="text-xs text-slate-400">{searchEmail}</div>
                </div>
              )}

              <ControlForm form={editForm} setForm={setEditForm} />

              <button
                onClick={handleAddControl}
                disabled={adding || !searchResult || searchResult.role !== 'student'}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50"
              >
                {adding ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Set Controls'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingId(null)} />
          <div className="relative w-full max-w-lg bg-slate-800 border border-slate-700/50 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h3 className="text-lg font-bold text-white">Edit Controls</h3>
              <button onClick={() => setEditingId(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <ControlForm form={editForm} setForm={setEditForm} />
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 py-2.5 bg-slate-700 text-slate-300 font-medium rounded-xl hover:bg-slate-600 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdate(editingId)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Controls list */}
      {controls.length === 0 ? (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 text-center">
          <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No children added yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {controls.map(c => (
            <div key={c.id} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 font-medium">
                    {(c as ParentalControl & { student?: Profile }).student?.full_name?.[0] ?? '?'}
                  </div>
                  <div>
                    <div className="font-medium text-white">{(c as ParentalControl & { student?: Profile }).student?.full_name ?? 'Student'}</div>
                    <div className="text-xs text-slate-400">Active controls</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(c)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-700/50 rounded-lg hover:bg-slate-600/50 transition-all"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleRevoke(c.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-all"
                  >
                    Revoke
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <ControlBadge icon={<Clock className="w-3.5 h-3.5" />} label="Daily limit" value={`${c.daily_time_limit_minutes} min`} />
                <ControlBadge icon={<Clock className="w-3.5 h-3.5" />} label="Quiz limit" value={`${c.quiz_time_limit_minutes} min`} />
                <ControlBadge icon={<MessageSquare className="w-3.5 h-3.5" />} label="AI Chat" value={c.restrict_chat ? 'Restricted' : 'Allowed'} active={!c.restrict_chat} />
                <ControlBadge icon={<Bell className="w-3.5 h-3.5" />} label="Notifications" value={c.notifications_enabled ? 'On' : 'Off'} active={c.notifications_enabled} />
              </div>
              {c.require_approval && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  New learning paths require approval
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ControlForm({ form, setForm }: {
  form: {
    daily_time_limit_minutes: number;
    quiz_time_limit_minutes: number;
    restrict_chat: boolean;
    require_approval: boolean;
    notifications_enabled: boolean;
    allowed_subjects: string[];
  };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
}) {
  const toggle = (key: 'restrict_chat' | 'require_approval' | 'notifications_enabled') => {
    setForm(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Daily Time Limit (minutes)</label>
        <input
          type="number"
          value={form.daily_time_limit_minutes}
          onChange={(e) => setForm(prev => ({ ...prev, daily_time_limit_minutes: parseInt(e.target.value) || 0 }))}
          min={15}
          max={480}
          className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Quiz Time Limit (minutes)</label>
        <input
          type="number"
          value={form.quiz_time_limit_minutes}
          onChange={(e) => setForm(prev => ({ ...prev, quiz_time_limit_minutes: parseInt(e.target.value) || 0 }))}
          min={10}
          max={180}
          className="w-full px-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
        />
      </div>

      <div className="space-y-3">
        <ToggleRow
          label="Restrict AI Tutor Chat"
          desc="Disable the AI tutor chat feature"
          active={form.restrict_chat}
          onClick={() => toggle('restrict_chat')}
          activeColor="red"
        />
        <ToggleRow
          label="Require Path Approval"
          desc="New learning paths need your approval"
          active={form.require_approval}
          onClick={() => toggle('require_approval')}
          activeColor="amber"
        />
        <ToggleRow
          label="Email Notifications"
          desc="Get notified about your child's progress"
          active={form.notifications_enabled}
          onClick={() => toggle('notifications_enabled')}
          activeColor="emerald"
        />
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, active, onClick, activeColor }: {
  label: string;
  desc: string;
  active: boolean;
  onClick: () => void;
  activeColor: string;
}) {
  const colorMap: Record<string, { on: string; off: string }> = {
    red: { on: 'bg-red-500', off: 'bg-slate-600' },
    amber: { on: 'bg-amber-500', off: 'bg-slate-600' },
    emerald: { on: 'bg-emerald-500', off: 'bg-slate-600' },
  };
  const colors = colorMap[activeColor] ?? colorMap.emerald;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-all"
    >
      <div className="text-left">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="text-xs text-slate-400">{desc}</div>
      </div>
      <div className={`w-10 h-6 rounded-full transition-all duration-200 flex items-center ${active ? colors.on : colors.off}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${active ? 'ml-5' : 'ml-1'}`} />
      </div>
    </button>
  );
}

function ControlBadge({ icon, label, value, active }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="bg-slate-700/30 rounded-lg p-2.5">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-sm font-medium ${active === false ? 'text-red-400' : active === true ? 'text-emerald-400' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
}
