import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { CivicAiFloatingButton } from './components/ai/CivicAiFloatingButton';
import { CivicAiAssistantModal } from './components/ai/CivicAiAssistantModal';
import { ReportDetailModal } from './components/dashboard/ReportDetailModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { reportService } from './services/reportService';
import { DashboardReport } from './types';

// Route-level code-splitting: Lazy load auxiliary and protected application modules
const CitizenDashboardPage = lazy(() =>
  import('./pages/CitizenDashboardPage').then((m) => ({ default: m.CitizenDashboardPage }))
);
const ReportIssuePage = lazy(() =>
  import('./pages/ReportIssuePage').then((m) => ({ default: m.ReportIssuePage }))
);
const ExploreMapPage = lazy(() =>
  import('./pages/ExploreMapPage').then((m) => ({ default: m.ExploreMapPage }))
);
const CommunityNetworkPage = lazy(() =>
  import('./pages/CommunityNetworkPage').then((m) => ({ default: m.CommunityNetworkPage }))
);
const CivicInsightsPage = lazy(() =>
  import('./pages/CivicInsightsPage').then((m) => ({ default: m.CivicInsightsPage }))
);
const AuthPortalPage = lazy(() =>
  import('./pages/AuthPortalPage').then((m) => ({ default: m.AuthPortalPage }))
);
const AuthorityDashboardPage = lazy(() =>
  import('./pages/AuthorityDashboardPage').then((m) => ({ default: m.AuthorityDashboardPage }))
);
const DataPrivacyPage = lazy(() =>
  import('./pages/DataPrivacyPage').then((m) => ({ default: m.DataPrivacyPage }))
);
const PublicTransparencyPage = lazy(() =>
  import('./pages/PublicTransparencyPage').then((m) => ({ default: m.PublicTransparencyPage }))
);
const DigitalTwinPage = lazy(() =>
  import('./pages/DigitalTwinPage').then((m) => ({ default: m.DigitalTwinPage }))
);
const HowItWorksPage = lazy(() =>
  import('./pages/HowItWorksPage').then((m) => ({ default: m.HowItWorksPage }))
);

const PageLoadingFallback: React.FC = () => (
  <div className="flex-grow flex items-center justify-center min-h-[50vh] bg-[#F5F5F2]" role="status" aria-label="Loading page">
    <div className="w-8 h-8 border-2 border-[#1E3A2F]/20 border-t-[#1E3A2F] rounded-full animate-spin" />
  </div>
);

const AppContent: React.FC = () => {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [citedReport, setCitedReport] = useState<DashboardReport | null>(null);
  const location = useLocation();

  const handleSelectReportId = async (reportId: string) => {
    const r = await reportService.getReportById(reportId);
    if (r) {
      setCitedReport(r);
    }
  };

  const isLandingPage = location.pathname === '/';

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F5F2] text-[#171918] overflow-x-hidden w-full max-w-full">
      <Navbar />

      <div className="flex-grow flex flex-col overflow-x-hidden min-w-0 w-full">
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            {/* Public Entrance Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/signin" element={<AuthPortalPage />} />
            <Route path="/signup" element={<AuthPortalPage />} />
            <Route path="/privacy" element={<DataPrivacyPage />} />
            <Route path="/data-privacy" element={<Navigate to="/privacy" replace />} />

            {/* Protected Application Routes (Section 16 D — Real authenticated session required) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <CitizenDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <ReportIssuePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <ExploreMapPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community"
              element={
                <ProtectedRoute>
                  <CommunityNetworkPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/insights"
              element={
                <ProtectedRoute>
                  <CivicInsightsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/digital-twin"
              element={
                <ProtectedRoute>
                  <DigitalTwinPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transparency"
              element={
                <ProtectedRoute>
                  <PublicTransparencyPage />
                </ProtectedRoute>
              }
            />

            {/* Protected Municipal Authority / Admin Console Routes (Role-gated) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['authority', 'admin']}>
                  <AuthorityDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operations"
              element={
                <ProtectedRoute allowedRoles={['authority', 'admin']}>
                  <AuthorityDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>

      {/* Global Floating Civic AI Launcher (Only shown on application pages, hidden on landing page) */}
      {!isLandingPage && (
        <CivicAiFloatingButton onClick={() => setIsAiOpen(true)} isOpen={isAiOpen} />
      )}

      {/* Grounded Civic AI Assistant Dialog */}
      <CivicAiAssistantModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onSelectReportId={handleSelectReportId}
      />

      {/* Cited Report Detail Modal */}
      {citedReport && (
        <ReportDetailModal
          report={citedReport}
          onClose={() => setCitedReport(null)}
        />
      )}

      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
