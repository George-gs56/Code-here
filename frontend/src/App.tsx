import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

import { DashboardPage } from './pages/DashboardPage';
import { ExplorePage } from './pages/ExplorePage';
import { LanguageDetailPage } from './pages/LanguageDetailPage';
import { LessonPage } from './pages/LessonPage';
import { PracticePage } from './pages/PracticePage';
import { AssessmentListPage } from './pages/AssessmentListPage';
import { AssessmentPage } from './pages/AssessmentPage';
import { AssessmentResultPage } from './pages/AssessmentResultPage';
import { AssessmentHistoryPage } from './pages/AssessmentHistoryPage';
import { AchievementsPage } from './pages/AchievementsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { RegisterPage } from './pages/RegisterPage';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

function MainContent() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [pageParams, setPageParams] = useState<any>({});

  const handleNavigate = (page: string, params: any = {}) => {
    setActivePage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-red-400">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
          <span className="text-sm font-semibold">Initializing CodeSphere Portal...</span>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to login for protected pages
  if (!user && activePage !== 'register' && activePage !== 'login' && activePage !== 'explore') {
    return <LoginPage onNavigate={handleNavigate} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header onNavigate={handleNavigate} activePage={activePage} />

      <div className="flex flex-1">
        {user && activePage !== 'register' && activePage !== 'login' && activePage !== 'onboarding' && (
          <Sidebar activePage={activePage} onNavigate={handleNavigate} />
        )}

        <main className="flex-1 overflow-x-hidden pb-12">
          {activePage === 'dashboard' && <DashboardPage onNavigate={handleNavigate} />}
          {activePage === 'explore' && <ExplorePage onNavigate={handleNavigate} />}
          {activePage === 'language-detail' && <LanguageDetailPage slug={pageParams.slug} onNavigate={handleNavigate} />}
          {activePage === 'lesson' && <LessonPage lessonId={pageParams.id} onNavigate={handleNavigate} />}
          {activePage === 'my-learning' && <ExplorePage onNavigate={handleNavigate} />}
          {activePage === 'practice' && <PracticePage onNavigate={handleNavigate} />}
          {activePage === 'assessments' && <AssessmentListPage onNavigate={handleNavigate} />}
          {activePage === 'assessment-session' && <AssessmentPage assessmentId={pageParams.assessmentId} onNavigate={handleNavigate} />}
          {activePage === 'assessment-result' && <AssessmentResultPage attemptId={pageParams.attemptId} resultData={pageParams.resultData} onNavigate={handleNavigate} />}
          {activePage === 'results' && <AssessmentHistoryPage onNavigate={handleNavigate} />}
          {activePage === 'achievements' && <AchievementsPage />}
          {activePage === 'leaderboard' && <LeaderboardPage />}
          {activePage === 'profile' && <ProfilePage />}
          {activePage === 'settings' && <ProfilePage />}
          {activePage === 'admin' && <AdminPage />}
          {activePage === 'register' && <RegisterPage onNavigate={handleNavigate} />}
          {activePage === 'login' && <LoginPage onNavigate={handleNavigate} />}
          {activePage === 'onboarding' && <OnboardingPage onNavigate={handleNavigate} />}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster position="top-right" theme="dark" richColors />
        <MainContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
