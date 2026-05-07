import { useState } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import AuthPage from './components/AuthPage';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import InstructorDashboard from './components/InstructorDashboard';
import ParentDashboard from './components/ParentDashboard';
import LearningPathView from './components/LearningPathView';
import ModuleView from './components/ModuleView';
import AnalyticsPage from './components/AnalyticsPage';
import TutorChat from './components/TutorChat';
import SettingsPage from './components/SettingsPage';
import { BarChart3, MessageCircle, Settings } from 'lucide-react';

type View = 'dashboard' | 'path' | 'module' | 'analytics' | 'tutor' | 'settings';

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  if (loading || (session && !profile)) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <AuthPage />;
  if (!profile) return <AuthPage />;
  if (!profile.onboarding_complete) return <OnboardingFlow />;

  const goToPath = (pathId: string) => {
    setSelectedPathId(pathId);
    setView('path');
  };

  const goToModule = (moduleId: string, subjectId?: string) => {
    setSelectedModuleId(moduleId);
    if (subjectId) setSelectedSubjectId(subjectId);
    setView('module');
  };

  const goToDashboard = () => {
    setView('dashboard');
    setSelectedPathId(null);
    setSelectedModuleId(null);
  };

  switch (view) {
    case 'path':
      return selectedPathId ? (
        <LearningPathView
          pathId={selectedPathId}
          onBack={goToDashboard}
          onModuleSelect={goToModule}
        />
      ) : null;
    case 'module':
      return selectedModuleId ? (
        <ModuleView
          moduleId={selectedModuleId}
          subjectId={selectedSubjectId ?? undefined}
          onBack={() => selectedPathId ? setView('path') : goToDashboard()}
          onComplete={() => selectedPathId ? setView('path') : goToDashboard()}
        />
      ) : null;
    case 'analytics':
      return <AnalyticsPage onBack={goToDashboard} />;
    case 'tutor':
      return <TutorChat onBack={goToDashboard} />;
    case 'settings':
      return <SettingsPage onBack={goToDashboard} />;
    default:
      return (
        <div className="relative">
          {profile?.role === 'instructor' ? (
            <InstructorDashboard onPathSelect={goToPath} />
          ) : profile?.role === 'parent' ? (
            <ParentDashboard onOpenSettings={() => setView('settings')} />
          ) : (
            <Dashboard onPathSelect={goToPath} />
          )}
          <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
            {profile?.role === 'student' && (
              <>
                <button
                  onClick={() => setView('analytics')}
                  className="w-12 h-12 bg-blue-500/90 backdrop-blur text-white rounded-full shadow-lg shadow-blue-500/25 flex items-center justify-center hover:bg-blue-600 transition-all hover:scale-110"
                  title="Analytics"
                >
                  <BarChart3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setView('tutor')}
                  className="w-12 h-12 bg-emerald-500/90 backdrop-blur text-white rounded-full shadow-lg shadow-emerald-500/25 flex items-center justify-center hover:bg-emerald-600 transition-all hover:scale-110"
                  title="AI Tutor"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={() => setView('settings')}
              className="w-12 h-12 bg-slate-600/90 backdrop-blur text-white rounded-full shadow-lg shadow-slate-500/25 flex items-center justify-center hover:bg-slate-500 transition-all hover:scale-110"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      );
  }
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
