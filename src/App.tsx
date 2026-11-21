import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { ExploreMapPage } from './pages/ExploreMapPage';
import { CommunityNetworkPage } from './pages/CommunityNetworkPage';
import { CivicInsightsPage } from './pages/CivicInsightsPage';
import { AuthPortalPage } from './pages/AuthPortalPage';
import { AuthorityDashboardPage } from './pages/AuthorityDashboardPage';
import { DataPrivacyPage } from './pages/DataPrivacyPage';
import { PublicTransparencyPage } from './pages/PublicTransparencyPage';
import { DigitalTwinPage } from './pages/DigitalTwinPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { CivicAiFloatingButton } from './components/ai/CivicAiFloatingButton';
import { CivicAiAssistantModal } from './components/ai/CivicAiAssistantModal';
import { ReportDetailModal } from './components/dashboard/ReportDetailModal';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { reportService } from './services/reportService';
import { DashboardReport } from './types';

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
    <div className="flex flex-col min-h-screen bg-[#F5F5F2] text-[#171918]">
      <Navbar />

      <div className="flex-grow">
        <Routes>
          {/* Public Entrance Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/signin" element={<AuthPortalPage />} />
          <Route path="/signup" element={<AuthPortalPage />} />
          <Route path="/privacy" element={<DataPrivacyPage />} />

          {/* Protected Application Routes (Section 16 D — Must verify real authenticated session) */}
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
